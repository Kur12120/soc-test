import { Router, Request, Response } from "express";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
    [req.user!.userId]
  );
  res.json(result.rows);
});

router.patch("/:id/read", requireAuth, async (req: Request, res: Response) => {
  await pool.query("UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2", [req.params.id, req.user!.userId]);
  res.json({ message: "Marked as read" });
});

router.patch("/read-all", requireAuth, async (req: Request, res: Response) => {
  await pool.query("UPDATE notifications SET read = TRUE WHERE user_id = $1", [req.user!.userId]);
  res.json({ message: "All marked as read" });
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  await pool.query("DELETE FROM notifications WHERE id = $1 AND user_id = $2", [req.params.id, req.user!.userId]);
  res.json({ message: "Deleted" });
});

export default router;