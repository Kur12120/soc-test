import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { createAuditLog } from "../services/auditService";

const router = Router();

router.get("/", requireAuth, requireRole(["admin"]), async (_req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT id, full_name, email, role, team_id, auth_provider, mfa_enabled, created_at FROM users ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

router.post("/", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  const { fullName, email, password, role, teamId, authProvider } = req.body as {
    fullName?: string; email?: string; password?: string;
    role?: string; teamId?: string | null; authProvider?: string;
  };
  if (!fullName || !email || !role) {
    res.status(400).json({ message: "fullName, email, and role are required" }); return;
  }
  if (authProvider !== "ldap" && !password) {
    res.status(400).json({ message: "password is required for local users" }); return;
  }
  const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
  if (existing.rows.length > 0) { res.status(409).json({ message: "Email already exists" }); return; }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const id = uuidv4();
  await pool.query(
    "INSERT INTO users (id, full_name, email, password_hash, role, team_id, auth_provider) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [id, fullName, email, passwordHash, role, teamId || null, authProvider || "local"]
  );
  await createAuditLog({ action: "user_created", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "user", targetId: id, details: `Created user ${email}` });
  res.status(201).json({ id, fullName, email, role, teamId: teamId || null, authProvider: authProvider || "local" });
});

router.put("/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  const { fullName, role, teamId } = req.body as { fullName?: string; role?: string; teamId?: string | null };
  await pool.query(
    "UPDATE users SET full_name = COALESCE($1, full_name), role = COALESCE($2, role), team_id = $3 WHERE id = $4",
    [fullName, role, teamId || null, req.params.id]
  );
  await createAuditLog({ action: "user_updated", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "user", targetId: req.params.id, details: "User updated" });
  res.json({ message: "Updated" });
});

router.delete("/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  if (req.params.id === ((((req.user!.userId as string) as string) as string) as string)) { res.status(400).json({ message: "Cannot delete yourself" }); return; }
  await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
  await createAuditLog({ action: "user_deleted", actorUserId: ((((req.user!.userId as string) as string) as string) as string), targetType: "user", targetId: req.params.id, details: "User deleted" });
  res.json({ message: "Deleted" });
});


// PATCH /users/:id/team — admin assigns a team to a user
router.patch("/:id/team", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  const { teamId } = req.body as { teamId?: string | null };
  await pool.query(
    "UPDATE users SET team_id = $1 WHERE id = $2",
    [teamId || null, req.params.id]
  );
  await createAuditLog({
    action: "user_team_updated",
    actorUserId: ((((req.user!.userId as string) as string) as string) as string),
    targetType: "user",
    targetId: req.params.id,
    details: `Team updated to ${teamId || "none"}`,
  });
  res.json({ message: "Team updated" });
});


router.patch('/:id/role', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const { role } = req.body as { role?: string };
  if (!role || !['admin', 'user', 'ciso'].includes(role)) {
    res.status(400).json({ message: 'Invalid role' });
    return;
  }
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
  await createAuditLog({ action: 'user_role_updated', actorUserId: (req.user as any).userId, targetType: 'user', targetId: req.params.id, details: 'Role updated to ' + role });
  res.json({ message: 'Role updated' });
});

export default router;




