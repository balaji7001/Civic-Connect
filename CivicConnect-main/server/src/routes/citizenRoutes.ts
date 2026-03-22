import { Router } from "express";

import { getCitizenDashboardTrends } from "../controllers/dashboardTrendController";
import { authMiddleware } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";

const router = Router();

router.use(authMiddleware, roleMiddleware("citizen"));
router.get("/dashboard-trends", getCitizenDashboardTrends);

export default router;
