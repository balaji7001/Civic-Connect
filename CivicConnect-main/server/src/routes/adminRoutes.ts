import { Router } from "express";

import {
  assignDepartment,
  getAdminComplaints,
  getDepartments,
  getSlaViolations,
  manageComplaint,
} from "../controllers/adminController";
import { getAdminDashboardTrends } from "../controllers/dashboardTrendController";
import { authMiddleware } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";

const router = Router();

router.use(authMiddleware, roleMiddleware("admin"));
router.get("/complaints", getAdminComplaints);
router.get("/dashboard-trends", getAdminDashboardTrends);
router.patch("/complaints/:id/assign", assignDepartment);
router.patch("/complaints/:id/manage", manageComplaint);
router.get("/departments", getDepartments);
router.get("/sla-violations", getSlaViolations);

export default router;
