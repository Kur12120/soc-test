import { Router } from "express";
import authRoutes from "./auth";
import usersRoutes from "./users";
import teamsRoutes from "./teams";
import incidentsRoutes from "./incidents";
import auditRoutes from "./audit";
import tasksRoutes from "./tasks";
import notificationsRoutes from "./notifications";

const router = Router();
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/teams", teamsRoutes);
router.use("/incidents", incidentsRoutes);
router.use("/audit", auditRoutes);
router.use("/tasks", tasksRoutes);
router.use("/notifications", notificationsRoutes);

export const apiRouter = router;