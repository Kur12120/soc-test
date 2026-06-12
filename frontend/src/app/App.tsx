import { Link, useNavigate, useLocation } from "react-router-dom";
import { AppRoutes } from "../routes/AppRoutes";
import { NotificationBell } from "../components/NotificationBell";

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const navLink = (to: string, label: string, emoji: string) => (
    <Link to={to} style={{
      padding: "8px 12px", borderRadius: "6px", textDecoration: "none", fontWeight: 500,
      fontSize: "13px", display: "flex", alignItems: "center", gap: "5px",
      background: location.pathname === to ? "#4f46e5" : "transparent",
      color: location.pathname === to ? "#fff" : "#374151",
    }}><span>{emoji}</span>{label}</Link>
  );

  return (
    <div style={{ fontFamily: "Segoe UI, Arial, sans-serif", minHeight: "100vh", background: "#f9fafb" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "22px" }}>🛡️</span>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#4f46e5" }}>SOC</span>
          <span style={{ fontSize: "18px", fontWeight: 400, color: "#374151" }}>Management</span>
        </div>

        {token && (
          <nav style={{ display: "flex", gap: "2px", alignItems: "center" }}>
            {navLink("/", "Dashboard", "📊")}
            {navLink("/incidents", "Incidents", "🚨")}
            {navLink("/tasks", "Tasks", "📋")}
            {navLink("/teams", "Teams", "👥")}
            {navLink("/users", "Users", "👤")}
            {navLink("/audit", "Audit", "📜")}
          </nav>
        )}

        {token ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <NotificationBell />
            <Link to="/profile" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <div style={{ width: "34px", height: "34px", background: "#e0e7ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#4f46e5", cursor: "pointer" }}>
                {user?.fullName?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
              <div style={{ lineHeight: "1.2" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{user?.fullName}</div>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>{user?.role}</div>
              </div>
            </Link>
            <button onClick={logout} style={{ padding: "6px 14px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px" }}>Logout</button>
          </div>
        ) : (
          <Link to="/login" style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", borderRadius: "6px", textDecoration: "none", fontWeight: 500 }}>Login</Link>
        )}
      </header>

      <main style={{ padding: "32px 24px", maxWidth: "1280px", margin: "0 auto" }}>
        <AppRoutes />
      </main>
    </div>
  );
}