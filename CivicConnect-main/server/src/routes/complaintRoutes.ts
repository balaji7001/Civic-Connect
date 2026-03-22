import { Router } from "express";
import multer from "multer";

import {
  createComplaint,
  getComplaintById,
  getComplaints,
  getNearbyComplaints,
  patchComplaintStatus,
  updateComplaint,
} from "../controllers/complaintController";
import { allowedImageMimeTypes, maxComplaintImageSizeBytes } from "../config/cloudinary";
import { authMiddleware, optionalAuth } from "../middleware/authMiddleware";
import { HttpError } from "../middleware/errorHandler";
import { roleMiddleware } from "../middleware/roleMiddleware";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxComplaintImageSizeBytes,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageMimeTypes.includes(file.mimetype as (typeof allowedImageMimeTypes)[number])) {
      callback(new HttpError(400, "Only JPG, JPEG, PNG, and WebP complaint images are allowed."));
      return;
    }

    callback(null, true);
  },
});

router.get("/", optionalAuth, getComplaints);
router.get("/nearby", getNearbyComplaints);
router.get("/:id", getComplaintById);
router.post("/", authMiddleware, roleMiddleware("citizen", "admin"), upload.single("image") as any, createComplaint);
router.patch("/:id", authMiddleware, roleMiddleware("citizen", "admin"), upload.single("image") as any, updateComplaint);
router.patch("/:id/status", authMiddleware, roleMiddleware("admin"), patchComplaintStatus);

export default router;
