import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { Link } from "react-router-dom";

function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>
        <span>{value} of {total}</span>
        <span style={{ fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: "8px", height: "10px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: "8px", transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [incidents, setIncidents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<any[]>("/incidents", {}, true).catch(() => []),
      apiRequest<any[]>("/tasks", {}, true).catch(() => []),
      apiRequest<any[]>("/users", {}, true).catch(() => []),
      apiRequest<any[]>("/teams", {}, true).catch(() => []),
    ]).then(([inc, tsk, usr, tm]) => {
      setIncidents(inc); setTasks(tsk); setUsers(usr); setTeams(tm);
      setLoading(false);
    });
  }, []);

  const openInc = incidents.filter((i) => i.status === "open").length;
  const resolvedInc = incidents.filter((i) => i.status === "resolved").length;
  const criticalInc = incidents.filter((i) => i.severity === "critical").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const recentIncidents = incidents.slice(0, 5);
  const myTasks = tasks.filter((t) => t.assigned_user_id === user?.id).slice(0, 5);

  const severityColor: Record<string, string> = { low: "#16a34a", medium: "#d97706", high: "#ea580c", critical: "#dc2626" };
  const statusColor: Record<string, string> = { open: "#dc2626", in_progress: "#d97706", resolved: "#16a34a" };
  const taskStatusColor: Record<string, string> = { pending: "#6b7280", in_progress: "#d97706", completed: "#16a34a" };
  const priorityColor: Record<string, string> = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };

  const badge = (value: string, colors: Record<string, string>) => (
    <span style={{ background: (colors[value] || "#6b7280") + "20", color: colors[value] || "#6b7280", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
      {value.replace(/_/g, " ")}
    </span>
  );

  const statCard = (label: string, value: number, color: string, icon: string, sub: string) => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px", flex: 1, minWidth: "150px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>{label}</div>
          <div style={{ fontSize: "32px", fontWeight: 700, color }}>{value}</div>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>{sub}</div>
        </div>
        <div style={{ fontSize: "24px" }}>{icon}</div>
      </div>
    </div>
  );

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", color: "#111827" }}>Welcome back, {user?.fullName} 👋</h1>
        <p style={{ margin: 0, color: "#6b7280" }}>Here is your SOC operations overview for today.</p>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        {statCard("Total Users", users.length, "#4f46e5", "👤", "Active accounts")}
        {statCard("Total Teams", teams.length, "#0891b2", "👥", "SOC teams")}
        {statCard("Open Incidents", openInc, "#dc2626", "🚨", "Needs attention")}
        {statCard("Active Tasks", tasks.length - completedTasks, "#d97706", "📋", "In progress")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "15px", color: "#111827" }}>📊 Incident Progress</h3>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Resolved</div>
              <ProgressBar value={resolvedInc} total={incidents.length} color="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Open</div>
              <ProgressBar value={openInc} total={incidents.length} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Critical</div>
              <ProgressBar value={criticalInc} total={incidents.length} color="#ea580c" />
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "15px", color: "#111827" }}>✅ Task Progress</h3>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Completed</div>
              <ProgressBar value={completedTasks} total={tasks.length} color="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Pending</div>
              <ProgressBar value={pendingTasks} total={tasks.length} color="#6b7280" />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>In Progress</div>
              <ProgressBar value={tasks.filter((t) => t.status === "in_progress").length} total={tasks.length} color="#d97706" />
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", color: "#111827" }}>🚨 Recent Incidents</h3>
            <Link to="/incidents" style={{ fontSize: "13px", color: "#4f46e5", textDecoration: "none" }}>View all</Link>
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            {recentIncidents.map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f9fafb", borderRadius: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827", flex: 1, marginRight: "8px" }}>{i.title}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {badge(i.severity, severityColor)}
                  {badge(i.status, statusColor)}
                </div>
              </div>
            ))}
            {recentIncidents.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", margin: "20px 0" }}>No incidents yet</p>}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", color: "#111827" }}>📋 {user?.role === "admin" ? "All Tasks" : "My Tasks"}</h3>
            <Link to="/tasks" style={{ fontSize: "13px", color: "#4f46e5", textDecoration: "none" }}>View all</Link>
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            {(user?.role === "admin" ? tasks.slice(0, 5) : myTasks).map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f9fafb", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{t.title}</div>
                  {t.assigned_user_name && <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>Assigned to {t.assigned_user_name}</div>}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {badge(t.priority, priorityColor)}
                  {badge(t.status, taskStatusColor)}
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", margin: "20px 0" }}>No tasks yet</p>}
          </div>
        </div>

      </div>
    </div>
  );
}