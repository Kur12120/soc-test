import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { createAuditLog } from "../services/auditService";
import { createNotification } from "../services/notificationService";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT t.*, u.full_name AS assigned_user_name, c.full_name AS created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_user_id = u.id
    LEFT JOIN users c ON t.created_by = c.id
    ORDER BY t.created_at DESC
  `);
  res.json(result.rows);
});

router.post("/", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  const { title, description, priority, assignedUserId, dueDate } = req.body as {
    title?: string; description?: string; priority?: string; assignedUserId?: string | null; dueDate?: string | null;
  };
  if (!title) { res.status(400).json({ message: "Title required" }); return; }
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO tasks (id, title, description, priority, status, assigned_user_id, due_date, created_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
    [id, title, description || null, priority || "medium", "pending", assignedUserId || null, dueDate || null, ((((req.user!.userId as string) as string) as string) as string)]
  );
  await createAuditLog({ action: "task_created", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "task", targetId: id, details: "Created task" });
  if (assignedUserId) {
    await createNotification({ userId: assignedUserId, message: `You have been assigned a new task: ${title}`});
  }
  res.status(201).json(result.rows[0]);
});

router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, assignedUserId } = req.body as { status?: string; assignedUserId?: string | null };
  const check = await pool.query("SELECT id FROM tasks WHERE id = $1", [req.params.id]);
  if (check.rows.length === 0) { res.status(404).json({ message: "Task not found" }); return; }
  await pool.query(
    "UPDATE tasks SET status = COALESCE($1, status), assigned_user_id = $2 WHERE id = $3",
    [status || null, assignedUserId !== undefined ? (assignedUserId || null) : null, req.params.id]
  );
  await createAuditLog({ action: "task_updated", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "task", targetId: req.params.id, details: "Task updated" });
  res.json({ message: "Updated" });
});

router.patch("/:id/status", requireAuth, async (req: Request, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status) { res.status(400).json({ message: "Status required" }); return; }
  await pool.query("UPDATE tasks SET status = $1 WHERE id = $2", [status, req.params.id]);
  await createAuditLog({ action: "task_status_updated", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "task", targetId: req.params.id, details: `Status: ${status}` });
  res.json({ message: "Updated" });
});

router.put("/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  const { title, description, priority, status, assignedUserId, dueDate } = req.body as {
    title?: string; description?: string; priority?: string; status?: string; assignedUserId?: string | null; dueDate?: string | null;
  };
  await pool.query(
    "UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), priority = COALESCE($3, priority), status = COALESCE($4, status), assigned_user_id = $5, due_date = $6 WHERE id = $7",
    [title, description, priority, status, assignedUserId || null, dueDate || null, req.params.id]
  );
  await createAuditLog({ action: "task_updated", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "task", targetId: req.params.id, details: "Task updated" });
  res.json({ message: "Updated" });
});

router.delete("/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
  await createAuditLog({ action: "task_deleted", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "task", targetId: req.params.id, details: "Deleted" });
  res.json({ message: "Deleted" });
});

router.get("/:id/comments", requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT tc.*, u.full_name AS author_name, u.role AS author_role
     FROM task_comments tc
     LEFT JOIN users u ON tc.user_id = u.id
     WHERE tc.task_id = $1
     ORDER BY tc.created_at ASC`,
    [req.params.id]
  );
  res.json(result.rows);
});

router.post("/:id/comments", requireAuth, async (req: Request, res: Response) => {
  const { content } = req.body as { content?: string };
  if (!content?.trim()) { res.status(400).json({ message: "Content required" }); return; }
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO task_comments (id, task_id, user_id, content, created_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [id, req.params.id, ((((req.user!.userId as string) as string) as string) as string), content.trim()]
  );
  res.status(201).json(result.rows[0]);
});

router.delete("/:taskId/comments/:commentId", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  await pool.query("DELETE FROM task_comments WHERE id = $1", [req.params.commentId]);
  res.json({ message: "Deleted" });
});

export default router;





