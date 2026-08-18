import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Public — guests hit this after scanning a QR code, no auth required.
router.get("/public/:slug", eventController.getPublicEvent);
router.get("/public/:slug/photos", eventController.getPublicEventPhotos);

// Organizer-only
router.post("/", requireAuth, eventController.createEvent);
router.get("/", requireAuth, eventController.listMyEvents);
router.get("/:id", requireAuth, eventController.getMyEvent);
router.patch("/:id", requireAuth, eventController.updateEvent);
router.delete("/:id", requireAuth, eventController.deleteEvent);

export default router;
