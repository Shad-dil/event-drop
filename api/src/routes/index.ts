import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import eventRoutes from "./event.routes";
import guestRoutes from "./guest.routes";
import photoRoutes from "./photo.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/events", eventRoutes);
router.use("/guests", guestRoutes);
router.use("/photos", photoRoutes);

export default router;
