import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/pool";

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
}) {
  await pool.query(
    "INSERT INTO notifications (id, user_id, title, message) VALUES ($1, $2, $3, $4)",
    [uuidv4(), params.userId, params.title, params.message]
  );
}