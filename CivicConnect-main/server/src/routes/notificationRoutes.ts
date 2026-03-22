import { Router } from "express";

import { getNotifications, markNotificationRead } from "../controllers/notificationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getNotifications);
router.patch("/:id/read", markNotificationRead);

export default router;
