import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/pool";

export async function createAuditLog(params: {
  action: string;
  actorUserId: string | null;
  targetType: string;
  targetId: string;
  details?: string;
}) {
  await pool.query(
    "INSERT INTO audit_logs (id, action, actor_user_id, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5, $6)",
    [uuidv4(), params.action, params.actorUserId, params.targetType, params.targetId, params.details || null]
  );
}
