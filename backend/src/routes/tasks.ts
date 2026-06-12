import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { createAuditLog } from "../services/auditService";
import { createNotification } from "../services/notificationService";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  let result;
  if (user.role === "admin" || user.role === "super_admin") {
    result = await pool.query(`
      SELECT t.*,
        u.full_name AS assigned_user_name,
        c.full_name AS created_by_name,
        (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      ORDER BY t.created_at DESC
    `);
  } else {
    result = await pool.query(`
      SELECT t.*,
        u.full_name AS assigned_user_name,
        c.full_name AS created_by_name,
        (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.assigned_user_id = $1
      ORDER BY t.created_at DESC
    `, [user.userId]);
  }
  res.json(result.rows);
});

router.post("/", requireAuth, requireRole(["admin", "super_admin"]), async (req: Request, res: Response) => {
  const { title, description, priority, assignedUserId, dueDate } = req.body as {
    title?: string; description?: string; priority?: string; assignedUserId?: string; dueDate?: string;
  };
  if (!title) { res.status(400).json({ message: "title is required" }); return; }

  const id = uuidv4();
  await pool.query(
    "INSERT INTO tasks (id, title, description, priority, assigned_user_id, created_by, due_date) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [id, title, description || null, priority || "medium", assignedUserId || null, req.user!.userId, dueDate || null]
  );

  if (assignedUserId) {
    await createNotification({
      userId: assignedUserId,
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${title}`,
    });
  }

  await createAuditLog({ action: "task_created", actorUserId: req.user!.userId, targetType: "task", targetId: id, details: `Created task: ${title}` });
  res.status(201).json({ id, title, description, priority, assignedUserId, dueDate });
});

router.put("/:id", requireAuth, requireRole(["admin", "super_admin"]), async (req: Request, res: Response) => {
  const { title, description, priority, assignedUserId, dueDate, status } = req.body as {
    title?: string; description?: string; priority?: string; assignedUserId?: string; dueDate?: string; status?: string;
  };
  await pool.query(
    "UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), priority = COALESCE($3, priority), assigned_user_id = $4, due_date = $5, status = COALESCE($6, status) WHERE id = $7",
    [title, description, priority, assignedUserId || null, dueDate || null, status, req.params.id]
  );
  await createAuditLog({ action: "task_updated", actorUserId: req.user!.userId, targetType: "task", targetId: req.params.id, details: "Task updated" });
  res.json({ message: "Updated" });
});

router.patch("/:id/status", requireAuth, async (req: Request, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status) { res.status(400).json({ message: "status is required" }); return; }
  await pool.query("UPDATE tasks SET status = $1 WHERE id = $2", [status, req.params.id]);
  await createAuditLog({ action: "task_status_updated", actorUserId: req.user!.userId, targetType: "task", targetId: req.params.id, details: `Status changed to ${status}` });
  res.json({ message: "Updated" });
});

router.delete("/:id", requireAuth, requireRole(["admin", "super_admin"]), async (req: Request, res: Response) => {
  await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
  await createAuditLog({ action: "task_deleted", actorUserId: req.user!.userId, targetType: "task", targetId: req.params.id, details: "Task deleted" });
  res.json({ message: "Deleted" });
});

router.get("/:id/comments", requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT tc.*, u.full_name AS user_name, u.role AS user_role
    FROM task_comments tc
    JOIN users u ON tc.user_id = u.id
    WHERE tc.task_id = $1
    ORDER BY tc.created_at ASC
  `, [req.params.id]);
  res.json(result.rows);
});

router.post("/:id/comments", requireAuth, async (req: Request, res: Response) => {
  const { content } = req.body as { content?: string };
  if (!content || !content.trim()) { res.status(400).json({ message: "Comment content is required" }); return; }

  const id = uuidv4();
  await pool.query(
    "INSERT INTO task_comments (id, task_id, user_id, content) VALUES ($1, $2, $3, $4)",
    [id, req.params.id, req.user!.userId, content.trim()]
  );

  const taskResult = await pool.query("SELECT title, assigned_user_id, created_by FROM tasks WHERE id = $1", [req.params.id]);
  const task = taskResult.rows[0];
  const commenter = req.user!;

  const notifyIds = new Set<string>();
  if (task.assigned_user_id && task.assigned_user_id !== commenter.userId) notifyIds.add(task.assigned_user_id);
  if (task.created_by && task.created_by !== commenter.userId) notifyIds.add(task.created_by);

  for (const uid of notifyIds) {
    await createNotification({
      userId: uid,
      title: "New Comment on Task",
      message: `A new comment was added to task: ${task.title}`,
    });
  }

  await createAuditLog({ action: "comment_added", actorUserId: req.user!.userId, targetType: "task", targetId: req.params.id, details: "Comment added" });
  res.status(201).json({ id, content, taskId: req.params.id });
});

router.delete("/:taskId/comments/:commentId", requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  const comment = await pool.query("SELECT user_id FROM task_comments WHERE id = $1", [req.params.commentId]);
  if (comment.rows.length === 0) { res.status(404).json({ message: "Comment not found" }); return; }
  if (comment.rows[0].user_id !== user.userId && user.role !== "admin" && user.role !== "super_admin") {
    res.status(403).json({ message: "Cannot delete another user comment" }); return;
  }
  await pool.query("DELETE FROM task_comments WHERE id = $1", [req.params.commentId]);
  res.json({ message: "Comment deleted" });
});

export default router;