import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  logger.error("Unhandled error", { message: err.message, path: req.path, method: req.method });
  res.status(500).json({ message: "Internal server error" });
};
