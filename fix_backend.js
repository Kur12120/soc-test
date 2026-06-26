const fs = require('fs');

// Fix tasks.ts - team-scoped GET
let t = fs.readFileSync('/app/src/routes/tasks.ts', 'utf8');
const tasksGet = `router.get("/", requireAuth, async (req: Request, res: Response) => {
  const role = (req.user as any).role;
  const userId = (req.user as any).userId as string;
  if (role === 'user') {
    const userRow = await pool.query('SELECT team_id FROM users WHERE id = $1', [userId]);
    const teamId = userRow.rows[0]?.team_id;
    const result = teamId
      ? await pool.query(
          \`SELECT t.*, u.full_name AS assigned_user_name, c.full_name AS created_by_name
           FROM tasks t
           LEFT JOIN users u ON t.assigned_user_id = u.id
           LEFT JOIN users c ON t.created_by = c.id
           WHERE u.team_id = $1 OR t.assigned_user_id = $2
           ORDER BY t.created_at DESC\`,
          [teamId, userId]
        )
      : await pool.query(
          \`SELECT t.*, u.full_name AS assigned_user_name, c.full_name AS created_by_name
           FROM tasks t
           LEFT JOIN users u ON t.assigned_user_id = u.id
           LEFT JOIN users c ON t.created_by = c.id
           WHERE t.assigned_user_id = $1
           ORDER BY t.created_at DESC\`,
          [userId]
        );
    return res.json(result.rows);
  }
  const result = await pool.query(
    \`SELECT t.*, u.full_name AS assigned_user_name, c.full_name AS created_by_name
     FROM tasks t
     LEFT JOIN users u ON t.assigned_user_id = u.id
     LEFT JOIN users c ON t.created_by = c.id
     ORDER BY t.created_at DESC\`
  );
  res.json(result.rows);
});`;
t = t.replace(/router\.get\("\/", requireAuth, async \(_?req[\s\S]*?res\.json\(result\.rows\);\s*\}\);/, tasksGet);
fs.writeFileSync('/app/src/routes/tasks.ts', t);
console.log('tasks.ts fixed');

// Fix incidents.ts - team-scoped GET
let i = fs.readFileSync('/app/src/routes/incidents.ts', 'utf8');
const incGet = `router.get("/", requireAuth, async (req: Request, res: Response) => {
  const role = (req.user as any).role;
  const userId = (req.user as any).userId as string;
  if (role === 'user') {
    const userRow = await pool.query('SELECT team_id FROM users WHERE id = $1', [userId]);
    const teamId = userRow.rows[0]?.team_id;
    const result = teamId
      ? await pool.query(
          \`SELECT i.*, u.full_name AS assigned_user_name, c.full_name AS created_by_name
           FROM incidents i
           LEFT JOIN users u ON i.assigned_user_id = u.id
           LEFT JOIN users c ON i.created_by = c.id
           WHERE u.team_id = $1 OR i.assigned_user_id = $2
           ORDER BY i.created_at DESC\`,
          [teamId, userId]
        )
      : await pool.query(
          \`SELECT i.*, u.full_name AS assigned_user_name, c.full_name AS created_by_name
           FROM incidents i
           LEFT JOIN users u ON i.assigned_user_id = u.id
           LEFT JOIN users c ON i.created_by = c.id
           WHERE i.assigned_user_id = $1
           ORDER BY i.created_at DESC\`,
          [userId]
        );
    return res.json(result.rows);
  }
  const result = await pool.query(
    \`SELECT i.*, u.full_name AS assigned_user_name, c.full_name AS created_by_name
     FROM incidents i
     LEFT JOIN users u ON i.assigned_user_id = u.id
     LEFT JOIN users c ON i.created_by = c.id
     ORDER BY i.created_at DESC\`
  );
  res.json(result.rows);
});`;
i = i.replace(/router\.get\("\/", requireAuth, async \(_?req[\s\S]*?res\.json\(result\.rows\);\s*\}\);/, incGet);
fs.writeFileSync('/app/src/routes/incidents.ts', i);
console.log('incidents.ts fixed');

// Fix users.ts - add role PATCH
let u = fs.readFileSync('/app/src/routes/users.ts', 'utf8');
const roleRoute = `
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
`;
if (!u.includes('/:id/role')) {
  u = u.replace('export default router;', roleRoute + '\nexport default router;');
  fs.writeFileSync('/app/src/routes/users.ts', u);
  console.log('users.ts role PATCH added');
} else {
  console.log('users.ts role PATCH already exists');
}