import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { createAuditLog } from "../services/auditService";

const router = Router();

router.get("/", requireAuth, async (_req: Request, res: Response) => {
  const result = await pool.query("SELECT id, name, description, created_at FROM teams ORDER BY created_at DESC");
  res.json(result.rows);
});

router.post("/", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name) { res.status(400).json({ message: "name is required" }); return; }
  const id = uuidv4();
  await pool.query("INSERT INTO teams (id, name, description) VALUES ($1, $2, $3)", [id, name, description || null]);
  await createAuditLog({ action: "team_created", actorUserId: req.user!.userId, targetType: "team", targetId: id, details: `Created team ${name}` });
  res.status(201).json({ id, name, description: description || null });
});

export default router;
