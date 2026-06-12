import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  function load() {
    apiRequest<any[]>("/notifications", {}, true).then(setNotifications).catch(() => {});
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  async function markAllRead() {
    await apiRequest("/notifications/read-all", { method: "PATCH" }, true);
    load();
  }

  async function dismiss(id: string) {
    await apiRequest("/notifications/" + id, { method: "DELETE" }, true);
    load();
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", position: "relative", padding: "4px" }}>
        🔔
        {unread > 0 && (
          <span style={{ position: "absolute", top: "0", right: "0", background: "#dc2626", color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
          <div style={{ position: "absolute", right: 0, top: "40px", width: "340px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>Notifications {unread > 0 && <span style={{ color: "#dc2626" }}>({unread})</span>}</span>
              {unread > 0 && (
                <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Mark all read</button>
              )}
            </div>
            <div style={{ maxHeight: "380px", overflowY: "auto" }}>
              {notifications.length === 0 && (
                <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>No notifications</div>
              )}
              {notifications.map((n) => (
                <div key={n.id} style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6", background: n.read ? "#fff" : "#f0f4ff", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: n.read ? 400 : 600, fontSize: "13px", color: "#111827", marginBottom: "2px" }}>{n.title}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{n.message}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => dismiss(n.id)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "14px", padding: "0", flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}