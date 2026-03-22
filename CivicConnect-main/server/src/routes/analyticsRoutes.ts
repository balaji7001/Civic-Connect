import { Router } from "express";

import {
  getCategoryAnalytics,
  getSeverityAnalytics,
  getTrendAnalytics,
  getWardAnalytics,
} from "../controllers/analyticsController";

const router = Router();

router.get("/category", getCategoryAnalytics);
router.get("/trends", getTrendAnalytics);
router.get("/wards", getWardAnalytics);
router.get("/severity", getSeverityAnalytics);

export default router;
