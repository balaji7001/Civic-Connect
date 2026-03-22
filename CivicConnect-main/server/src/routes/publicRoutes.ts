import { Router } from "express";

import { getPublicDashboardTrends } from "../controllers/dashboardTrendController";

const router = Router();

router.get("/stats/trends", getPublicDashboardTrends);

export default router;
