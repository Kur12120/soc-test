import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { apiRouter } from "./routes";
import logger from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { pool } from "./db/pool";

const app = express();
const port = Number(process.env.APP_PORT || 3000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", service: "soc-management-backend", database: "connected", timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

app.use("/api", apiRouter);
app.use(errorHandler);

app.listen(port, () => { logger.info(`SOC backend running on port ${port}`); });
