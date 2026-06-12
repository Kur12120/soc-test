import { Router, Request, Response } from "express";
import { pool } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requireRole(["admin"]), async (_req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT id, action, actor_user_id, target_type, target_id, details, created_at FROM audit_logs ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

export default router;
