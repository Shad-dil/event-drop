import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as photoController from "../controllers/photo.controller";

const router = Router();

// Uploads are the main abuse surface (storage cost) — keep this tighter than
// the global limiter.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Reactions are cheap taps, not uploads — allow a much higher rate.
const reactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/presign", uploadLimiter, photoController.presignUpload);
router.post("/", uploadLimiter, photoController.confirmUpload);
router.post("/:photoId/reactions", reactionLimiter, photoController.toggleReaction);

export default router;
