import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { IncidentsPage } from "../pages/IncidentsPage";
import { TasksPage } from "../pages/TasksPage";
import { TeamsPage } from "../pages/TeamsPage";
import { UsersPage } from "../pages/UsersPage";
import { AuditPage } from "../pages/AuditPage";
import { ProfilePage } from "../pages/ProfilePage";
import { NotificationBell } from "../components/NotificationBell";
const roleBadgeColor: Record<string, string> = {
  admin: "#4f46e5",
  ciso: "#0891b2",
  user: "#16a34a",
};
export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("user") || "null"));
  useEffect(() => {
    const sync = () => {
      setToken(localStorage.getItem("token"));
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setUser(JSON.parse(localStorage.getItem("user") || "null"));
  }, [location.pathname]);
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/login");
  }
  const role: string = user?.role || "";
  function navLink(to: string, label: string, icon: string) {
    const active = location.pathname === to || location.pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "8px 14px", borderRadius: "8px", textDecoration: "none",
          fontSize: "14px", fontWeight: 500,
          background: active ? "#ede9fe" : "transparent",
          color: active ? "#4f46e5" : "#374151",
          transition: "background 0.15s",
        }}
      >
        <span>{icon}</span>{label}
      </Link>
    );
  }
  return (
    <div style={{ fontFamily: "Segoe UI, Arial, sans-serif", minHeight: "100vh", background: "#f9fafb" }}>
      <header style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: "60px",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}>
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
            {(role === "admin" || role === "ciso") && navLink("/teams", "Teams", "👥")}
            {(role === "admin" || role === "ciso") && navLink("/users", "Users", "👤")}
            {role === "admin" && navLink("/audit", "Audit", "📜")}
          </nav>
        )}
        {token ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <NotificationBell />
            <span style={{
              fontSize: "11px", fontWeight: 700, padding: "3px 10px",
              borderRadius: "12px", textTransform: "uppercase",
              background: (roleBadgeColor[role] || "#6b7280") + "20",
              color: roleBadgeColor[role] || "#6b7280",
            }}>
              {role}
            </span>
            <Link to="/profile" style={{ textDecoration: "none" }}>
              <div style={{
                width: "34px", height: "34px", background: "#e0e7ff",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "12px", fontWeight: 700,
                color: "#4f46e5", cursor: "pointer",
              }}>
                {user?.fullName?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
            </Link>
            <button onClick={logout} style={{
              padding: "7px 14px", background: "transparent",
              border: "1px solid #e5e7eb", borderRadius: "8px",
              cursor: "pointer", fontSize: "13px", color: "#6b7280",
            }}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" style={{ color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
        )}
      </header>
      <main style={{ padding: "32px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={token ? <DashboardPage /> : <LoginPage />} />
          <Route path="/incidents" element={token ? <IncidentsPage /> : <LoginPage />} />
          <Route path="/tasks" element={token ? <TasksPage /> : <LoginPage />} />
          <Route path="/teams" element={token && (role === "admin" || role === "ciso") ? <TeamsPage /> : <LoginPage />} />
          <Route path="/users" element={token && (role === "admin" || role === "ciso") ? <UsersPage /> : <LoginPage />} />
          <Route path="/audit" element={token && role === "admin" ? <AuditPage /> : <LoginPage />} />
          <Route path="/profile" element={token ? <ProfilePage /> : <LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}
