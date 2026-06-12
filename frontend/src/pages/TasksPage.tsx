import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";

const priorityColor: Record<string, string> = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };
const statusColor: Record<string, string> = { pending: "#6b7280", in_progress: "#d97706", completed: "#16a34a" };

const badge = (value: string, colors: Record<string, string>) => (
  <span style={{ background: (colors[value] || "#6b7280") + "20", color: colors[value] || "#6b7280", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
    {value.replace(/_/g, " ")}
  </span>
);

function CommentsPanel({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function loadComments() {
    apiRequest<any[]>("/tasks/" + taskId + "/comments", {}, true).then(setComments).catch(() => {});
  }

  useEffect(() => { loadComments(); }, [taskId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true); setError("");
    try {
      await apiRequest("/tasks/" + taskId + "/comments", { method: "POST", body: JSON.stringify({ content }) }, true);
      setContent(""); loadComments();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function deleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    try {
      await apiRequest("/tasks/" + taskId + "/comments/" + commentId, { method: "DELETE" }, true);
      loadComments();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  }

  const roleColor: Record<string, string> = { admin: "#4f46e5", super_admin: "#7c3aed", analyst: "#0891b2" };

  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: "420px", height: "100vh", background: "#fff", borderLeft: "1px solid #e5e7eb", zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.08)" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "16px", color: "#111827" }}>💬 Comments ({comments.length})</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {comments.length === 0 && (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: "14px" }}>
            No comments yet. Be the first to comment.
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id} style={{ background: "#f9fafb", borderRadius: "10px", padding: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", background: "#e0e7ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#4f46e5" }}>
                  {c.user_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span style={{ fontWeight: 600, fontSize: "13px", color: "#111827" }}>{c.user_name}</span>
                  <span style={{ marginLeft: "6px", background: (roleColor[c.user_role] || "#6b7280") + "20", color: roleColor[c.user_role] || "#6b7280", padding: "1px 7px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>{c.user_role}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>{new Date(c.created_at).toLocaleString()}</span>
                {(c.user_id === user?.id || user?.role === "admin" || user?.role === "super_admin") && (
                  <button onClick={() => deleteComment(c.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px", padding: "0 4px" }}>✕</button>
                )}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#374151", lineHeight: "1.5" }}>{c.content}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb" }}>
        {error && <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 8px 0" }}>{error}</p>}
        <form onSubmit={submitComment} style={{ display: "flex", gap: "8px" }}>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a comment..." rows={2}
            style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", resize: "none" }} />
          <button type="submit" disabled={loading || !content.trim()}
            style={{ padding: "0 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function TasksPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [dueDate, setDueDate] = useState("");

  function load() {
    apiRequest<any[]>("/tasks", {}, true).then(setTasks).catch((e) => setError(e.message));
    if (isAdmin) apiRequest<any[]>("/users", {}, true).then(setUsers).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      await apiRequest("/tasks", { method: "POST", body: JSON.stringify({ title, description, priority, assignedUserId: assignedUserId || null, dueDate: dueDate || null }) }, true);
      setTitle(""); setDescription(""); setPriority("medium"); setAssignedUserId(""); setDueDate("");
      setSuccess("Task created"); setShowForm(false); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await apiRequest("/tasks/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status }) }, true);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    try {
      await apiRequest("/tasks/" + id, { method: "DELETE" }, true);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  }

  const filtered = tasks
    .filter((t) => filter === "all" || t.status === filter || t.priority === filter)
    .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.assigned_user_name || "").toLowerCase().includes(search.toLowerCase()));

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pct = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  return (
    <div>
      {selectedTaskId && <CommentsPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "24px" }}>{isAdmin ? "Task Management" : "My Tasks"}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>{tasks.length} tasks</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ background: "#f3f4f6", borderRadius: "8px", height: "8px", width: "120px", overflow: "hidden" }}>
                <div style={{ width: pct + "%", background: "#16a34a", height: "100%", borderRadius: "8px", transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>{pct}% complete</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." 
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", width: "200px" }} />
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)}
              style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap" }}>
              {showForm ? "Cancel" : "+ New Task"}
            </button>
          )}
        </div>
      </div>

      {showForm && isAdmin && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", marginBottom: "24px", maxWidth: "560px" }}>
          <h3 style={{ margin: "0 0 16px 0" }}>Create New Task</h3>
          {success && <p style={{ color: "#16a34a", margin: "0 0 12px 0" }}>{success}</p>}
          {error && <p style={{ color: "#dc2626", margin: "0 0 12px 0" }}>{error}</p>}
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "12px" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={3}
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", resize: "vertical" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#6b7280", display: "block", marginBottom: "4px" }}>Due Date (optional)</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", width: "100%", boxSizing: "border-box" as const }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: "10px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
              {loading ? "Creating..." : "Create Task"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["all", "pending", "in_progress", "completed", "high", "medium", "low"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid #e5e7eb", cursor: "pointer", fontSize: "13px", fontWeight: 500,
              background: filter === f ? "#4f46e5" : "#fff", color: filter === f ? "#fff" : "#374151" }}>
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#dc2626", marginBottom: "12px" }}>{error}</p>}

      <div style={{ display: "grid", gap: "12px" }}>
        {filtered.map((t) => (
          <div key={t.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: "15px", color: t.status === "completed" ? "#9ca3af" : "#111827", textDecoration: t.status === "completed" ? "line-through" : "none" }}>{t.title}</span>
                {badge(t.priority, priorityColor)}
                {badge(t.status, statusColor)}
              </div>
              {t.description && <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#6b7280" }}>{t.description}</p>}
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#9ca3af", flexWrap: "wrap", alignItems: "center" }}>
                {t.assigned_user_name && <span>👤 {t.assigned_user_name}</span>}
                {t.created_by_name && <span>📝 {t.created_by_name}</span>}
                {t.due_date && <span style={{ color: new Date(t.due_date) < new Date() && t.status !== "completed" ? "#dc2626" : "#9ca3af" }}>📅 {new Date(t.due_date).toLocaleDateString()}</span>}
                <button onClick={() => setSelectedTaskId(t.id === selectedTaskId ? null : t.id)}
                  style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "2px 10px", cursor: "pointer", fontSize: "12px", color: "#4f46e5", fontWeight: 500 }}>
                  💬 {t.comment_count || 0} comments
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
              <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}
                style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", cursor: "pointer" }}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              {isAdmin && (
                <button onClick={() => deleteTask(t.id)}
                  style={{ padding: "6px 12px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
}