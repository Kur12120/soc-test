import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool } from "./pool";

async function initDb() {
  const sqlPath = path.join(__dirname, "init.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  await pool.query(sql);

  const tasksPath = path.join(__dirname, "tasks.sql");
  if (fs.existsSync(tasksPath)) {
    const tasksSql = fs.readFileSync(tasksPath, "utf-8");
    await pool.query(tasksSql);
  }

  console.log("Database initialized");
}

async function seedAdmin() {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", ["admin@soc.local"]);
  if (existing.rows.length > 0) {
    console.log("Admin already seeded");
    return;
  }
  const teamId = uuidv4();
  await pool.query(
    "INSERT INTO teams (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING",
    [teamId, "SOC Core Team", "Default SOC operations team"]
  );
  const team = await pool.query("SELECT id FROM teams WHERE name = $1 LIMIT 1", ["SOC Core Team"]);
  const passwordHash = await bcrypt.hash("Admin123!", 10);
  await pool.query(
    "INSERT INTO users (id, full_name, email, password_hash, role, team_id) VALUES ($1, $2, $3, $4, $5, $6)",
    [uuidv4(), "System Administrator", "admin@soc.local", passwordHash, "admin", team.rows[0].id]
  );
  console.log("Default admin seeded");
}

async function main() {
  const isInit = process.argv.includes("--init");
  try {
    if (isInit) { await initDb(); } else { await seedAdmin(); }
  } catch (error) {
    console.error("Database setup error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();