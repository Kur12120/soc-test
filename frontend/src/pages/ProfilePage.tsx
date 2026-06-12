import { useState } from "react";
import { apiRequest } from "../api/client";

export function ProfilePage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [tab, setTab] = useState<"profile" | "password" | "mfa">("profile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaQr, setMfaQr] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true); setMsg(""); setError("");
    try {
      await apiRequest("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }, true);
      setMsg("Password changed successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function setupMfa() {
    setLoading(true); setMsg(""); setError("");
    try {
      const res = await apiRequest<{ qrCode: string }>("/auth/mfa/setup", { method: "POST" }, true);
      setMfaQr(res.qrCode);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function verifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(""); setError("");
    try {
      await apiRequest("/auth/mfa/verify", { method: "POST", body: JSON.stringify({ token: mfaToken }) }, true);
      setMfaEnabled(true); setMfaQr(""); setMfaToken("");
      setMsg("MFA enabled successfully");
      localStorage.setItem("user", JSON.stringify({ ...user, mfaEnabled: true }));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function disableMfa() {
    if (!confirm("Disable MFA? This reduces your account security.")) return;
    setLoading(true); setMsg(""); setError("");
    try {
      await apiRequest("/auth/mfa/disable", { method: "POST" }, true);
      setMfaEnabled(false); setMsg("MFA disabled");
      localStorage.setItem("user", JSON.stringify({ ...user, mfaEnabled: false }));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  const tabBtn = (t: typeof tab, label: string) => (
    <button onClick={() => { setTab(t); setMsg(""); setError(""); }}
      style={{ padding: "10px 20px", border: "none", borderBottom: tab === t ? "2px solid #4f46e5" : "2px solid transparent",
        background: "transparent", cursor: "pointer", fontWeight: tab === t ? 700 : 400,
        color: tab === t ? "#4f46e5" : "#6b7280", fontSize: "14px" }}>
      {label}
    </button>
  );

  const inp = (value: string, onChange: (v: string) => void, placeholder: string, type = "text") => (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} required
      style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", width: "100%", boxSizing: "border-box" as const }} />
  );

  const alertBox = (text: string, color: string, bg: string, border: string) => (
    <div style={{ background: bg, border: "1px solid " + border, borderRadius: "6px", padding: "10px 14px", color, marginBottom: "16px", fontSize: "14px" }}>{text}</div>
  );

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ margin: "0 0 24px 0", fontSize: "24px" }}>My Profile</h1>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "60px", height: "60px", background: "#e0e7ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 700, color: "#4f46e5" }}>
            {user?.fullName?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "18px" }}>{user?.fullName}</div>
            <div style={{ color: "#6b7280", fontSize: "14px" }}>{user?.email}</div>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <span style={{ background: "#e0e7ff", color: "#4f46e5", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>{user?.role}</span>
              {mfaEnabled && <span style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>MFA ON</span>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          {tabBtn("profile", "Profile")}
          {tabBtn("password", "Password")}
          {tabBtn("mfa", "MFA Security")}
        </div>

        <div style={{ padding: "24px" }}>
          {msg && alertBox(msg, "#16a34a", "#dcfce7", "#bbf7d0")}
          {error && alertBox(error, "#dc2626", "#fef2f2", "#fecaca")}

          {tab === "profile" && (
            <div style={{ display: "grid", gap: "16px" }}>
              {[["Full Name", user?.fullName], ["Email", user?.email], ["Role", user?.role], ["Auth Method", user?.authProvider || "local"]].map(([label, val]) => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: "14px", color: "#111827" }}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "password" && (
            <form onSubmit={changePassword} style={{ display: "grid", gap: "12px" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#6b7280" }}>Must be at least 8 characters. LDAP users cannot change their password here.</p>
              {inp(currentPassword, setCurrentPassword, "Current password", "password")}
              {inp(newPassword, setNewPassword, "New password", "password")}
              {inp(confirmPassword, setConfirmPassword, "Confirm new password", "password")}
              <button type="submit" disabled={loading}
                style={{ padding: "10px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          )}

          {tab === "mfa" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "15px" }}>Two-Factor Authentication</div>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
                    {mfaEnabled ? "Your account is protected with MFA." : "Add an extra layer of security."}
                  </div>
                </div>
                <span style={{ fontSize: "28px" }}>{mfaEnabled ? "🔒" : "🔓"}</span>
              </div>

              {!mfaEnabled && !mfaQr && (
                <button onClick={setupMfa} disabled={loading}
                  style={{ padding: "10px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                  {loading ? "Setting up..." : "Enable MFA"}
                </button>
              )}

              {mfaQr && (
                <div style={{ display: "grid", gap: "16px" }}>
                  <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>
                    Scan this QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>, then enter the 6-digit code to confirm.
                  </p>
                  <img src={mfaQr} alt="MFA QR Code" style={{ width: "200px", height: "200px", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                  <form onSubmit={verifyMfa} style={{ display: "flex", gap: "10px" }}>
                    <input value={mfaToken} onChange={(e) => setMfaToken(e.target.value)} placeholder="Enter 6-digit code" maxLength={6}
                      style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "16px", letterSpacing: "4px", width: "160px", textAlign: "center" }} />
                    <button type="submit" disabled={loading}
                      style={{ padding: "9px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
                      {loading ? "Verifying..." : "Verify"}
                    </button>
                  </form>
                </div>
              )}

              {mfaEnabled && (
                <button onClick={disableMfa} disabled={loading}
                  style={{ padding: "10px 20px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                  {loading ? "Disabling..." : "Disable MFA"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}