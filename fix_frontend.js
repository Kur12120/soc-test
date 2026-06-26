const fs = require('fs');

// Fix App.tsx - hide teams from user role
let app = fs.readFileSync('/app/src/app/App.tsx', 'utf8');
app = app.replace(
  "navLink(\"/teams\", \"Teams\", \"",
  "TEAMS_PLACEHOLDER_"
);
app = app.replace(
  /\{TEAMS_PLACEHOLDER_([^}]+)\}/,
  (m, inner) => `{(role === "admin" || role === "ciso") && navLink("/teams", "Teams", "${inner.split('"')[0]}")}`
);
// Simpler approach - just find and wrap the teams navLink
app = app.replace(
  /{navLink\("\/teams", "Teams", "([^"]+)"\)}/,
  `{(role === "admin" || role === "ciso") && navLink("/teams", "Teams", "$1")}`
);
// Fix teams route guard
app = app.replace(
  'path="/teams" element={token ? <TeamsPage />',
  'path="/teams" element={token && (role === "admin" || role === "ciso") ? <TeamsPage />'
);
fs.writeFileSync('/app/src/app/App.tsx', app);
console.log('App.tsx fixed');

// Fix UsersPage.tsx - add updateRole function and role dropdown
let u = fs.readFileSync('/app/src/pages/UsersPage.tsx', 'utf8');

// Add updateRole function
const updateRoleFn = `
  async function updateRole(userId: string, newRole: string) {
    try {
      await apiRequest('/users/' + userId + '/role', { method: 'PATCH', body: JSON.stringify({ role: newRole }) }, true);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  }
`;
if (!u.includes('updateRole')) {
  u = u.replace('async function updateTeam', updateRoleFn + '\n  async function updateTeam');
}

// Replace static role badge with dropdown for admin
u = u.replace(
  /<span style=\{\{ background: \(roleColor\[u\.role\][^}]+\}\}>\s*\{u\.role\}\s*<\/span>/,
  `{readOnly ? (
                    <span style={{ background: (roleColor[u.role] || '#6b7280') + '20', color: roleColor[u.role] || '#6b7280', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                      {u.role}
                    </span>
                  ) : (
                    <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}
                      style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="ciso">CISO</option>
                    </select>
                  )}`
);

fs.writeFileSync('/app/src/pages/UsersPage.tsx', u);
console.log('UsersPage.tsx fixed');