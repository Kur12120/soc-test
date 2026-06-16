import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { createAuditLog } from "../services/auditService";

const router = Router();

router.get("/", requireAuth, async (_req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT i.*, u.full_name AS assigned_user_name, c.full_name AS created_by_name
    FROM incidents i
    LEFT JOIN users u ON i.assigned_user_id = u.id
    LEFT JOIN users c ON i.created_by = c.id
    ORDER BY i.created_at DESC
  `);
  res.json(result.rows);
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { title, description, severity, status, assignedUserId } = req.body as {
    title?: string; description?: string; severity?: string; status?: string; assignedUserId?: string | null;
  };
  if (!title || !description) { res.status(400).json({ message: "Title and description required" }); return; }
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO incidents (id, title, description, severity, status, assigned_user_id, created_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
    [id, title, description, severity || "medium", status || "open", assignedUserId || null, ((((req.user!.userId as string) as string) as string) as string)]
  );
  await createAuditLog({ action: "incident_created", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "incident", targetId: id, details: "Created incident" });
  res.status(201).json(result.rows[0]);
});

router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const { title, description, severity, status, assignedUserId } = req.body as {
    title?: string; description?: string; severity?: string; status?: string; assignedUserId?: string | null;
  };
  await pool.query(
    "UPDATE incidents SET title = COALESCE($1, title), description = COALESCE($2, description), severity = COALESCE($3, severity), status = COALESCE($4, status), assigned_user_id = $5 WHERE id = $6",
    [title, description, severity, status, assignedUserId || null, req.params.id]
  );
  await createAuditLog({ action: "incident_updated", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "incident", targetId: req.params.id, details: "Updated incident" });
  res.json({ message: "Updated" });
});

router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, assignedUserId } = req.body as { status?: string; assignedUserId?: string | null };
  const check = await pool.query("SELECT id FROM incidents WHERE id = $1", [req.params.id]);
  if (check.rows.length === 0) { res.status(404).json({ message: "Incident not found" }); return; }
  await pool.query(
    "UPDATE incidents SET status = COALESCE($1, status), assigned_user_id = $2 WHERE id = $3",
    [status || null, assignedUserId !== undefined ? (assignedUserId || null) : null, req.params.id]
  );
  await createAuditLog({ action: "incident_updated", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "incident", targetId: req.params.id, details: "Incident updated" });
  res.json({ message: "Updated" });
});

router.delete("/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  await pool.query("DELETE FROM incidents WHERE id = $1", [req.params.id]);
  await createAuditLog({ action: "incident_deleted", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "incident", targetId: req.params.id, details: "Deleted" });
  res.json({ message: "Deleted" });
});

router.get("/:id/comments", requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT ic.*, u.full_name AS author_name, u.role AS author_role
     FROM incident_comments ic
     LEFT JOIN users u ON ic.user_id = u.id
     WHERE ic.incident_id = $1
     ORDER BY ic.created_at ASC`,
    [req.params.id]
  );
  res.json(result.rows);
});

router.post("/:id/comments", requireAuth, async (req: Request, res: Response) => {
  const { content } = req.body as { content?: string };
  if (!content?.trim()) { res.status(400).json({ message: "Content required" }); return; }
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO incident_comments (id, incident_id, user_id, content, created_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [id, req.params.id, ((((req.user!.userId as string) as string) as string) as string), content.trim()]
  );
  res.status(201).json(result.rows[0]);
});

router.delete("/:id/comments/:commentId", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  await pool.query("DELETE FROM incident_comments WHERE id = $1", [req.params.commentId]);
  res.json({ message: "Deleted" });
});

export default router;



