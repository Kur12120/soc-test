import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { pool } from "../db/pool";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import { JwtPayload } from "../types/auth";
import { authenticateWithLdap } from "../services/ldapService";
import { createAuditLog } from "../services/auditService";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { email, password, mfaToken } = req.body as {
    email?: string; password?: string; mfaToken?: string;
  };

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const result = await pool.query(
    "SELECT id, full_name, email, password_hash, role, team_id, auth_provider, mfa_enabled, mfa_secret FROM users WHERE email = $1 LIMIT 1",
    [email]
  );

  if (result.rows.length === 0) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const user = result.rows[0];
  let authenticated = false;

  if (user.auth_provider === "ldap") {
    const ldapConfig = {
      url: process.env.LDAP_URL || "ldap://localhost:389",
      bindDN: process.env.LDAP_BIND_DN || "",
      bindPassword: process.env.LDAP_BIND_PASSWORD || "",
      searchBase: process.env.LDAP_SEARCH_BASE || "",
      searchFilter: process.env.LDAP_SEARCH_FILTER || "(mail={username})",
      tlsEnabled: process.env.LDAP_TLS === "true",
    };
    const ldapResult = await authenticateWithLdap(ldapConfig, email, password);
    authenticated = ldapResult.success;
    if (!authenticated) {
      res.status(401).json({ message: ldapResult.error || "LDAP authentication failed" });
      return;
    }
  } else {
    if (!user.password_hash) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    authenticated = await bcrypt.compare(password, user.password_hash);
    if (!authenticated) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
  }

  if (user.mfa_enabled && user.mfa_secret) {
    if (!mfaToken) {
      res.status(200).json({ requiresMfa: true, message: "MFA token required" });
      return;
    }
    const isValidToken = authenticator.verify({ token: mfaToken, secret: user.mfa_secret });
    if (!isValidToken) {
      res.status(401).json({ message: "Invalid MFA token" });
      return;
    }
  }

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });

  await createAuditLog({ action: "user_login", actorUserId: user.id, targetType: "user", targetId: user.id, details: `Login via ${user.auth_provider}` });

  res.json({
    token,
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, teamId: user.team_id, mfaEnabled: user.mfa_enabled },
  });
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT id, full_name, email, role, team_id, auth_provider, mfa_enabled, created_at FROM users WHERE id = $1 LIMIT 1",
    [(req.user!.userId as string)]
  );
  if (result.rows.length === 0) { res.status(404).json({ message: "User not found" }); return; }
  const u = result.rows[0];
  res.json({ id: u.id, fullName: u.full_name, email: u.email, role: u.role, teamId: u.team_id, authProvider: u.auth_provider, mfaEnabled: u.mfa_enabled, createdAt: u.created_at });
});

router.post("/mfa/setup", requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query("SELECT email, mfa_enabled FROM users WHERE id = $1", [(req.user!.userId as string)]);
  if (result.rows[0].mfa_enabled) { res.status(400).json({ message: "MFA already enabled" }); return; }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(result.rows[0].email, "SOC Management", secret);
  const qrDataUrl = await qrcode.toDataURL(otpauth);

  await pool.query("UPDATE users SET mfa_secret = $1 WHERE id = $2", [secret, (req.user!.userId as string)]);

  res.json({ secret, qrCode: qrDataUrl });
});

router.post("/mfa/verify", requireAuth, async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!token) { res.status(400).json({ message: "Token required" }); return; }

  const result = await pool.query("SELECT mfa_secret FROM users WHERE id = $1", [(req.user!.userId as string)]);
  const secret = result.rows[0]?.mfa_secret;
  if (!secret) { res.status(400).json({ message: "MFA not set up yet" }); return; }

  const isValid = authenticator.verify({ token, secret });
  if (!isValid) { res.status(401).json({ message: "Invalid token" }); return; }

  await pool.query("UPDATE users SET mfa_enabled = TRUE WHERE id = $1", [(req.user!.userId as string)]);
  await createAuditLog({ action: "mfa_enabled", actorUserId: (req.user!.userId as string), targetType: "user", targetId: (req.user!.userId as string), details: "MFA enabled" });

  res.json({ message: "MFA enabled successfully" });
});

router.post("/mfa/disable", requireAuth, async (req: Request, res: Response) => {
  await pool.query("UPDATE users SET mfa_enabled = FALSE, mfa_secret = NULL WHERE id = $1", [(req.user!.userId as string)]);
  await createAuditLog({ action: "mfa_disabled", actorUserId: (req.user!.userId as string), targetType: "user", targetId: (req.user!.userId as string), details: "MFA disabled" });
  res.json({ message: "MFA disabled" });
});

router.post("/change-password", requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) { res.status(400).json({ message: "Both passwords required" }); return; }
  if (newPassword.length < 8) { res.status(400).json({ message: "Password must be at least 8 characters" }); return; }

  const result = await pool.query("SELECT password_hash, auth_provider FROM users WHERE id = $1", [(req.user!.userId as string)]);
  const user = result.rows[0];
  if (user.auth_provider === "ldap") { res.status(400).json({ message: "Password managed by LDAP" }); return; }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) { res.status(401).json({ message: "Current password is incorrect" }); return; }

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, (req.user!.userId as string)]);
  await createAuditLog({ action: "password_changed", actorUserId: (req.user!.userId as string), targetType: "user", targetId: (req.user!.userId as string), details: "Password changed" });

  res.json({ message: "Password changed successfully" });
});

export default router;

