import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { Comment, Task } from "../types";
const priorityColor: Record<string, string> = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };
const statusColor: Record<string, string> = { pending: "#6b7280", in_progress: "#d97706", completed: "#16a34a" };
function badge(value: string, colors: Record<string, string>) {
  return (
    <span style={{
      background: (colors[value] || "#6b7280") + "20",
      color: colors[value] || "#6b7280",
      padding: "3px 10px", borderRadius: "12px",
      fontSize: "12px", fontWeight: 600,
    }}>
      {value.replace(/_/g, " ")}
    </span>
  );
}
function CommentPanel({ taskId, readOnly }: { taskId: string; readOnly: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  function load() {
    apiRequest<Comment[]>(`/tasks/${taskId}/comments`, {}, true).then(setComments).catch(() => {});
  }
  useEffect(() => { load(); }, [taskId]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true); setError("");
    try {
      await apiRequest(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify({ content }) }, true);
      setContent(""); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }
  async function deleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    try {
      await apiRequest(`/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" }, true);
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
            style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
            {loading ? "..." : "Post"}
          </button>
        </form>
      )}
      {error && <p style={{ color: "#dc2626", fontSize: "13px", margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}
function TaskDetailPanel({ task, users, onClose, onSave, readOnly }: {
  task: Task; users: any[]; onClose: () => void;
  onSave: (id: string, assignedUserId: string | null, status: string) => Promise<void>;
  readOnly: boolean;
}) {
  const [assignedUserId, setAssignedUserId] = useState(task.assigned_user_id || "");
  const [status, setStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const role = currentUser?.role;
  async function handleSave() {
    setSaving(true); setSaveMsg("");
    try {
      await onSave(task.id, assignedUserId || null, status);
      setSaveMsg("Saved ✓"); setTimeout(() => setSaveMsg(""), 2000);
    } catch { setSaveMsg("Save failed"); }
    finally { setSaving(false); }
  }
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "480px", background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", zIndex: 200, overflowY: "auto", padding: "28px 28px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", color: "#111827", flex: 1, paddingRight: "12px" }}>{task.title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {badge(task.priority, priorityColor)}
        {badge(task.status, statusColor)}
        {task.due_date && <span style={{ fontSize: "12px", color: "#6b7280" }}>📅 Due {new Date(task.due_date).toLocaleDateString()}</span>}
      </div>
      {task.description && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase" }}>Description</div>
          <p style={{ margin: 0, fontSize: "14px", color: "#374151", lineHeight: 1.6 }}>{task.description}</p>
        </div>
      )}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase" }}>Assigned To</div>
        <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>{task.assigned_user_name || "Unassigned"}</p>
      </div>
      {!readOnly && role === "admin" && (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
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
              <select value={status} onChange={(e) => setStatus(e.target.value as Task["status"])}
                style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: "9px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", opacity: saving ? 0.7 : 1 }}>
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
            <select value={status} onChange={(e) => setStatus(e.target.value as Task["status"])}
              style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
              {saving ? "..." : "Save"}
            </button>
          </div>
          {saveMsg && <p style={{ margin: "6px 0 0", fontSize: "13px", color: saveMsg.includes("✓") ? "#16a34a" : "#dc2626" }}>{saveMsg}</p>}
        </div>
      )}
      <CommentPanel taskId={task.id} readOnly={readOnly} />
    </div>
  );
}
export function TasksPage() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const role = currentUser?.role || "";
  const readOnly = role === "ciso";
  const adminAccess = role === "admin";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  function load() {
    apiRequest<Task[]>("/tasks", {}, true).then((data) => {
      if (role === "user") setTasks(data.filter((t) => t.assigned_user_id === currentUser?.id));
      else setTasks(data);
    }).catch((e) => setError(e.message));
    if (adminAccess) apiRequest<any[]>("/users", {}, true).then(setUsers).catch(() => {});
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
  async function handleSaveTask(id: string, uid: string | null, status: string) {
    await apiRequest(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ assignedUserId: uid, status }) }, true);
    load();
    setSelectedTask((prev) => prev ? { ...prev, assigned_user_id: uid, status: status as Task["status"] } : prev);
  }
  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    try {
      await apiRequest(`/tasks/${id}`, { method: "DELETE" }, true);
      if (selectedTask?.id === id) setSelectedTask(null);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  }
  const filtered = tasks
    .filter((t) => filter === "all" || t.status === filter || t.priority === filter)
    .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.assigned_user_name || "").toLowerCase().includes(search.toLowerCase()));
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pct = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "24px" }}>
            {adminAccess ? "Task Management" : role === "ciso" ? "Tasks (Read-only)" : "My Tasks"}
          </h1>
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
          {adminAccess && (
            <button onClick={() => setShowForm(!showForm)}
              style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap" }}>
              {showForm ? "Cancel" : "+ New Task"}
            </button>
          )}
        </div>
      </div>
      {showForm && adminAccess && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", marginBottom: "24px", maxWidth: "560px" }}>
          <h3 style={{ margin: "0 0 16px 0" }}>Create New Task</h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "12px" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3}
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", resize: "vertical" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }} />
            </div>
            <select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}>
              <option value="">— Assign to user (optional) —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.fullName || u.full_name} ({u.role})</option>)}
            </select>
            <button type="submit" disabled={loading}
              style={{ padding: "10px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
              {loading ? "Creating..." : "Create Task"}
            </button>
            {error && <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>}
            {success && <p style={{ color: "#16a34a", margin: 0 }}>{success}</p>}
          </form>
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["all", "pending", "in_progress", "completed", "high", "medium", "low"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: "20px", border: "1px solid #e5e7eb",
            cursor: "pointer", fontSize: "13px", fontWeight: 500,
            background: filter === f ? "#4f46e5" : "#fff",
            color: filter === f ? "#fff" : "#374151",
          }}>{f.replace(/_/g, " ")}</button>
        ))}
      </div>
      <div style={{ display: "grid", gap: "10px" }}>
        {filtered.map((t) => (
          <div key={t.id} onClick={() => setSelectedTask(t)} style={{
            background: "#fff", border: `1px solid ${selectedTask?.id === t.id ? "#4f46e5" : "#e5e7eb"}`,
            borderRadius: "10px", padding: "16px 20px", display: "flex", justifyContent: "space-between",
            alignItems: "center", cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s",
            boxShadow: selectedTask?.id === t.id ? "0 0 0 2px #e0e7ff" : "none",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "15px", color: "#111827", marginBottom: "4px" }}>{t.title}</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {badge(t.priority, priorityColor)}
                {badge(t.status, statusColor)}
                {t.assigned_user_name && <span style={{ fontSize: "12px", color: "#6b7280" }}>👤 {t.assigned_user_name}</span>}
                {t.due_date && <span style={{ fontSize: "12px", color: "#6b7280" }}>📅 {new Date(t.due_date).toLocaleDateString()}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "12px" }}>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>View →</span>
              {adminAccess && (
                <button onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }}
                  style={{ padding: "5px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>
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
      {selectedTask && (
        <>
          <div onClick={() => setSelectedTask(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 199 }} />
          <TaskDetailPanel task={selectedTask} users={users} onClose={() => setSelectedTask(null)} onSave={handleSaveTask} readOnly={readOnly} />
        </>
      )}
    </div>
  );
}
