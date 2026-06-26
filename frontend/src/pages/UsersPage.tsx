import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";

const roleColor: Record<string, string> = { admin: "#4f46e5", ciso: "#0891b2", user: "#16a34a" };

export function UsersPage() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const viewerRole = currentUser?.role || "";
  const readOnly = viewerRole === "ciso";

  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [teamId, setTeamId] = useState("");

  function load() {
    apiRequest<any[]>("/users", {}, true).then(setUsers).catch((e) => setError(e.message));
    apiRequest<any[]>("/teams", {}, true).then(setTeams).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      await apiRequest("/users", { method: "POST", body: JSON.stringify({ fullName, email, password, role, teamId: teamId || null }) }, true);
      setFullName(""); setEmail(""); setPassword(""); setRole("user"); setTeamId("");
      setSuccess("User created"); setShowForm(false); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    try {
      await apiRequest(`/users/${id}`, { method: "DELETE" }, true);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  }

  
  async function updateRole(userId: string, newRole: string) {
    try {
      await apiRequest('/users/' + userId + '/role', { method: 'PATCH', body: JSON.stringify({ role: newRole }) }, true);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  }

  async function updateTeam(userId: string, newTeamId: string) {
    try {
      await apiRequest(`/users/${userId}/team`, { method: "PATCH", body: JSON.stringify({ teamId: newTeamId || null }) }, true);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "24px" }}>{readOnly ? "Users (Read-only)" : "User Management"}</h1>
          <p style={{ margin: 0, color: "#6b7280" }}>{users.length} accounts</p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
            {showForm ? "Cancel" : "+ New User"}
          </button>
        )}
      </div>

      {showForm && !readOnly && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", marginBottom: "24px", maxWidth: "560px" }}>
          <h3 style={{ margin: "0 0 16px 0" }}>Create New User</h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "12px" }}>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500, display: "block", marginBottom: "4px" }}>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="ciso">CISO</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500, display: "block", marginBottom: "4px" }}>Team</label>
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}>
                  <option value="">— No Team —</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: "10px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
              {loading ? "Creating..." : "Create User"}
            </button>
            {success && <p style={{ color: "#16a34a", margin: 0 }}>{success}</p>}
            {error && <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>}
          </form>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Name", "Email", "Role", "Team", ...(readOnly ? [] : ["Actions"])].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id} style={{ borderBottom: idx < users.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                <td style={{ padding: "14px 16px", fontWeight: 500, color: "#111827" }}>{u.fullName || u.full_name}</td>
                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6b7280" }}>{u.email}</td>
                <td style={{ padding: "14px 16px" }}>
                  {readOnly ? (
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
                  )}
                </td>
                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6b7280" }}>
                  {readOnly ? (u.team_name || "—") : (
                    <select value={u.team_id || ""} onChange={(e) => updateTeam(u.id, e.target.value)}
                      style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}>
                      <option value="">— No Team —</option>
                      {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                </td>
                {!readOnly && (
                  <td style={{ padding: "14px 16px" }}>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => deleteUser(u.id)}
                        style={{ padding: "5px 12px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
