import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { createAuditLog } from "../services/auditService";
import { createNotification } from "../services/notificationService";

const router = Router();

router.get("/", requireAuth, async (_req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT i.*,
      u.full_name AS assigned_user_name,
      c.full_name AS created_by_name
    FROM incidents i
    LEFT JOIN users u ON i.assigned_user_id = u.id
    LEFT JOIN users c ON i.created_by = c.id
    ORDER BY i.created_at DESC
  `);
  res.json(result.rows);
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { title, description, severity, status, assignedUserId } = req.body as {
    title?: string; description?: string;
    severity?: string; status?: string; assignedUserId?: string | null;
  };
  if (!title || !description || !severity || !status) {
    res.status(400).json({ message: "title, description, severity, and status are required" }); return;
  }
  const id = uuidv4();
  await pool.query(
    "INSERT INTO incidents (id, title, description, severity, status, assigned_user_id, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [id, title, description, severity, status, assignedUserId || null, req.user!.userId]
  );
  if (assignedUserId) {
    await createNotification({ userId: assignedUserId, title: "Incident Assigned", message: `You have been assigned to incident: ${title}` });
  }
  await createAuditLog({ action: "incident_created", actorUserId: req.user!.userId, targetType: "incident", targetId: id, details: `Created: ${title}` });
  res.status(201).json({ id, title, description, severity, status, assignedUserId: assignedUserId || null });
});

router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const { title, description, severity, status, assignedUserId } = req.body as {
    title?: string; description?: string; severity?: string; status?: string; assignedUserId?: string | null;
  };
  await pool.query(
    "UPDATE incidents SET title = COALESCE($1, title), description = COALESCE($2, description), severity = COALESCE($3, severity), status = COALESCE($4, status), assigned_user_id = $5, updated_at = NOW() WHERE id = $6",
    [title, description, severity, status, assignedUserId || null, req.params.id]
  );
  await createAuditLog({ action: "incident_updated", actorUserId: req.user!.userId, targetType: "incident", targetId: req.params.id, details: `Updated incident` });
  res.json({ message: "Updated" });
});

router.delete("/:id", requireAuth, requireRole(["admin", "super_admin"]), async (req: Request, res: Response) => {
  await pool.query("DELETE FROM incidents WHERE id = $1", [req.params.id]);
  await createAuditLog({ action: "incident_deleted", actorUserId: req.user!.userId, targetType: "incident", targetId: req.params.id, details: "Deleted" });
  res.json({ message: "Deleted" });
});

export default router;