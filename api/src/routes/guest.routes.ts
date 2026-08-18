import { Router } from "express";
import * as guestController from "../controllers/guest.controller";

const router = Router();

// All public — guests never authenticate, identity comes from a signed cookie.
router.post("/sessions", guestController.createOrResumeSession);
router.patch("/sessions", guestController.updateName);

export default router;
