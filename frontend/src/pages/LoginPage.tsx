import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@soc.local");
  const [password, setPassword] = useState("Admin123!");
  const [mfaToken, setMfaToken] = useState("");
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const result = await apiRequest<{ token?: string; user?: any; requiresMfa?: boolean; message?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, mfaToken: mfaToken || undefined }),
      });

      if (result.requiresMfa) {
        setRequiresMfa(true);
        setLoading(false);
        return;
      }

      if (result.token && result.user) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🛡️</div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#111827" }}>SOC Management</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            {requiresMfa ? "Enter your authenticator code" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          {!requiresMfa ? (
            <>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" as const }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" as const }} />
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>6-Digit Authenticator Code</label>
              <input value={mfaToken} onChange={(e) => setMfaToken(e.target.value)} placeholder="000000" maxLength={6} required autoFocus
                style={{ width: "100%", padding: "14px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "24px", letterSpacing: "8px", textAlign: "center", boxSizing: "border-box" as const }} />
              <button type="button" onClick={() => setRequiresMfa(false)} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer", fontSize: "13px", marginTop: "8px", padding: 0 }}>
                Back to login
              </button>
            </div>
          )}

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "10px 12px", color: "#dc2626", fontSize: "14px" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ padding: "11px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "15px" }}>
            {loading ? "Signing in..." : requiresMfa ? "Verify Code" : "Sign In"}
          </button>
        </form>

        {!requiresMfa && (
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#9ca3af" }}>
            Default: admin@soc.local / Admin123!
          </p>
        )}
      </div>
    </div>
  );
}