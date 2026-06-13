import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { Comment, Incident } from "../types";

const severityColor: Record<string, string> = { low: "#16a34a", medium: "#d97706", high: "#ea580c", critical: "#dc2626" };
const statusColor: Record<string, string> = { open: "#dc2626", in_progress: "#d97706", resolved: "#16a34a" };

function badge(value: string, colors: Record<string, string>) {
  return (
    <span style={{ background: (colors[value] || "#6b7280") + "20", color: colors[value] || "#6b7280", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function IncidentCommentPanel({ incidentId, readOnly }: { incidentId: string; readOnly: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  function load() {
    apiRequest<Comment[]>(`/incidents/${incidentId}/comments`, {}, true).then(setComments).catch(() => {});
  }

  useEffect(() => { load(); }, [incidentId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true); setError("");
    try {
      await apiRequest(`/incidents/${incidentId}/comments`, { method: "POST", body: JSON.stringify({ content }) }, true);
      setContent(""); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function deleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    try {
      await apiRequest(`/incidents/${incidentId}/comments/${commentId}`, { method: "DELETE" }, true);
      load();
    } catch {}
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#374151" }}>💬 Comments ({comments.length})</h4>
      <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
        {comments.length === 0 && <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>No comments yet.</p>}
        {comments.map((c) => (
          <div key={c.id} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#374151" }}>
                {c.author_name || "Unknown"}
                {c.author_role && <span style={{ marginLeft: "6px", fontSize: "11px", color: "#9ca3af", fontWeight: 400 }}>({c.author_role})</span>}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>{new Date(c.created_at).toLocaleString()}</span>
                {!readOnly && currentUser?.role === "admin" && (
                  <button onClick={() => deleteComment(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "12px", padding: 0 }}>✕</button>
                )}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}>{c.content}</p>
          </div>
        ))}
      </div>
      {!readOnly && (
        <form onSubmit={submit} style={{ display: "flex", gap: "8px" }}>
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a comment..."
            style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px" }} />
          <button type="submit" disabled={loading || !content.trim()}
            style={{ padding: "8px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
            {loading ? "..." : "Post"}
          </button>
        </form>
      )}
      {error && <p style={{ color: "#dc2626", fontSize: "13px", margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}

function IncidentDetailPanel({ incident, users, onClose, onSave, readOnly }: {
  incident: Incident; users: any[]; onClose: () => void;
  onSave: (id: string, assignedUserId: string | null, status: string) => Promise<void>;
  readOnly: boolean;
}) {
  const [assignedUserId, setAssignedUserId] = useState(incident.assigned_user_id || "");
  const [status, setStatus] = useState(incident.status);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const role = currentUser?.role;

  async function handleSave() {
    setSaving(true); setSaveMsg("");
    try {
      await onSave(incident.id, assignedUserId || null, status);
      setSaveMsg("Saved ✓"); setTimeout(() => setSaveMsg(""), 2000);
    } catch { setSaveMsg("Save failed"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "480px", background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", zIndex: 200, overflowY: "auto", padding: "28px 28px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", color: "#111827", flex: 1, paddingRight: "12px" }}>{incident.title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {badge(incident.severity, severityColor)}
        {badge(incident.status, statusColor)}
        {incident.created_at && <span style={{ fontSize: "12px", color: "#6b7280" }}>📅 {new Date(incident.created_at).toLocaleDateString()}</span>}
      </div>
      {incident.description && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase" }}>Description</div>
          <p style={{ margin: 0, fontSize: "14px", color: "#374151", lineHeight: 1.6 }}>{incident.description}</p>
        </div>
      )}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase" }}>Assigned To</div>
        <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>{incident.assigned_user_name || "Unassigned"}</p>
      </div>
      {!readOnly && role === "admin" && (
        <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "12px" }}>⚙️ Admin Controls</div>
          <div style={{ display: "grid", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>Assign To</label>
              <select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}
                style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}>
                <option value="">— Unassigned —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName || u.full_name} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Incident["status"])}
                style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: "9px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saveMsg && <p style={{ margin: 0, fontSize: "13px", color: saveMsg.includes("✓") ? "#16a34a" : "#dc2626" }}>{saveMsg}</p>}
          </div>
        </div>
      )}
      {!readOnly && role === "user" && (
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>Update Status</label>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <select value={status} onChange={(e) => setStatus(e.target.value as Incident["status"])}
              style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: "8px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
              {saving ? "..." : "Save"}
            </button>
          </div>
          {saveMsg && <p style={{ margin: "6px 0 0", fontSize: "13px", color: saveMsg.includes("✓") ? "#16a34a" : "#dc2626" }}>{saveMsg}</p>}
        </div>
      )}
      <IncidentCommentPanel incidentId={incident.id} readOnly={readOnly} />
    </div>
  );
}

export function IncidentsPage() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const role = currentUser?.role || "";
  const readOnly = role === "ciso";
  const adminAccess = role === "admin";

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [status, setStatus] = useState("open");
  const [assignedUserId, setAssignedUserId] = useState("");

  function load() {
    apiRequest<Incident[]>("/incidents", {}, true).then((data) => {
      if (role === "user") setIncidents(data.filter((i) => i.assigned_user_id === currentUser?.id));
      else setIncidents(data);
    }).catch((e) => setError(e.message));
    if (adminAccess) apiRequest<any[]>("/users", {}, true).then(setUsers).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      await apiRequest("/incidents", { method: "POST", body: JSON.stringify({ title, description, severity, status, assignedUserId: assignedUserId || null }) }, true);
      setTitle(""); setDescription(""); setSeverity("medium"); setStatus("open"); setAssignedUserId("");
      setSuccess("Incident created"); setShowForm(false); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function handleSaveIncident(id: string, uid: string | null, newStatus: string) {
    await apiRequest(`/incidents/${id}`, { method: "PATCH", body: JSON.stringify({ assignedUserId: uid, status: newStatus }) }, true);
    load();
    setSelectedIncident((prev) => prev ? { ...prev, assigned_user_id: uid, status: newStatus as Incident["status"] } : prev);
  }

  const filtered = filter === "all" ? incidents : incidents.filter((i) => i.status === filter || i.severity === filter);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "24px" }}>
            {adminAccess ? "Incidents" : role === "ciso" ? "Incidents (Read-only)" : "My Incidents"}
          </h1>
          <p style={{ margin: 0, color: "#6b7280" }}>{incidents.length} total incidents</p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: "10px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
            {showForm ? "Cancel" : "+ New Incident"}
          </button>
        )}
      </div>

      {showForm && !readOnly && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "24px", marginBottom: "24px", maxWidth: "560px" }}>
          <h3 style={{ margin: "0 0 16px 0" }}>Create New Incident</h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "12px" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident title" required
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required rows={3}
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", resize: "vertical" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}>
                {["low","medium","high","critical"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}>
                {["open","in_progress","resolved"].map((v) => <option key={v} value={v}>{v.replace(/_/g," ")}</option>)}
              </select>
            </div>
            {adminAccess && (
              <select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}>
                <option value="">— Assign to user (optional) —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName || u.full_name} ({u.role})</option>)}
              </select>
            )}
            <button type="submit" disabled={loading}
              style={{ padding: "10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
              {loading ? "Creating..." : "Create Incident"}
            </button>
            {success && <p style={{ color: "#16a34a", margin: 0 }}>{success}</p>}
            {error && <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>}
          </form>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["all","open","in_progress","resolved","critical","high","medium","low"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: "20px", border: "1px solid #e5e7eb",
            cursor: "pointer", fontSize: "13px", fontWeight: 500,
            background: filter === f ? "#4f46e5" : "#fff", color: filter === f ? "#fff" : "#374151",
          }}>{f.replace(/_/g," ")}</button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Title","Severity","Status","Assigned To","Date",""].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((i, idx) => (
              <tr key={i.id} onClick={() => setSelectedIncident(i)} style={{
                borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                cursor: "pointer", background: selectedIncident?.id === i.id ? "#ede9fe" : "transparent", transition: "background 0.1s",
              }}>
                <td style={{ padding: "14px 16px", fontWeight: 500, color: "#111827", fontSize: "14px" }}>{i.title}</td>
                <td style={{ padding: "14px 16px" }}>{badge(i.severity, severityColor)}</td>
                <td style={{ padding: "14px 16px" }}>{badge(i.status, statusColor)}</td>
                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6b7280" }}>{i.assigned_user_name || "—"}</td>
                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6b7280" }}>{i.created_at ? new Date(i.created_at).toLocaleDateString() : "—"}</td>
                <td style={{ padding: "14px 16px" }}><span style={{ fontSize: "12px", color: "#9ca3af" }}>View →</span></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>No incidents found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedIncident && (
        <>
          <div onClick={() => setSelectedIncident(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 199 }} />
          <IncidentDetailPanel incident={selectedIncident} users={users} onClose={() => setSelectedIncident(null)} onSave={handleSaveIncident} readOnly={readOnly} />
        </>
      )}
    </div>
  );
}
