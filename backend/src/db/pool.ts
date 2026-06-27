import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: env.dbHost,
        port: env.dbPort,
        database: env.dbName,
        user: env.dbUser,
        password: env.dbPassword,
      }
);