const fs = require('fs');

// Fix users.ts - protect admin role/team, add email/username/password update
let u = fs.readFileSync('/app/src/routes/users.ts', 'utf8');

// 1. Protect admin from role change
u = u.replace(
  `router.patch('/:id/role', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const { role } = req.body as { role?: string };
  if (!role || !['admin', 'user', 'ciso'].includes(role)) {
    res.status(400).json({ message: 'Invalid role' });
    return;
  }
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
  await createAuditLog({ action: 'user_role_updated', actorUserId: (req.user as any).userId, targetType: 'user', targetId: req.params.id, details: 'Role updated to ' + role });
  res.json({ message: 'Role updated' });
});`,
  `router.patch('/:id/role', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const { role } = req.body as { role?: string };
  if (!role || !['admin', 'user', 'ciso'].includes(role)) {
    res.status(400).json({ message: 'Invalid role' });
    return;
  }
  const target = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
  if (target.rows[0]?.role === 'admin') {
    res.status(403).json({ message: 'Cannot change role of an admin user' });
    return;
  }
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
  await createAuditLog({ action: 'user_role_updated', actorUserId: (req.user as any).userId, targetType: 'user', targetId: req.params.id, details: 'Role updated to ' + role });
  res.json({ message: 'Role updated' });
});`
);

// 2. Add PATCH /:id/profile for email, username, password reset
const profileRoute = `
router.patch('/:id/profile', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body as { fullName?: string; email?: string; password?: string };
  const target = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
  if (!target.rows[0]) { res.status(404).json({ message: 'User not found' }); return; }
  if (fullName) await pool.query('UPDATE users SET full_name = $1 WHERE id = $2', [fullName, req.params.id]);
  if (email) await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, req.params.id]);
  if (password) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
  }
  await createAuditLog({ action: 'user_profile_updated', actorUserId: (req.user as any).userId, targetType: 'user', targetId: req.params.id, details: 'Profile updated by admin' });
  res.json({ message: 'Profile updated' });
});
`;

if (!u.includes('/:id/profile')) {
  u = u.replace('export default router;', profileRoute + '\nexport default router;');
}

fs.writeFileSync('/app/src/routes/users.ts', u);
console.log('users.ts fixed - admin protection + profile update');