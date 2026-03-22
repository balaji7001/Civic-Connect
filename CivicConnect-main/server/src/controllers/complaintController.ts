import Joi from "joi";
import mongoose from "mongoose";
import type { NextFunction, Response } from "express";

import { ComplaintModel } from "../models/Complaint";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { HttpError } from "../middleware/errorHandler";
import {
  createComplaintWithAi,
  updateComplaintStatus,
  updateComplaintWithAi,
} from "../services/complaintService";
import { parseNearbyQuery } from "../utils/geoUtils";

const complaintSchema = Joi.object({
  title: Joi.string().trim().min(5).max(120).required(),
  description: Joi.string().trim().min(10).max(1500).required(),
  category: Joi.string()
    .valid("garbage", "water", "electricity", "road", "drainage")
    .optional(),
  address: Joi.string().trim().min(5).max(200).required(),
  longitude: Joi.number().required(),
  latitude: Joi.number().required(),
});

const statusSchema = Joi.object({
  status: Joi.string().valid("Pending", "In Progress", "Resolved", "Rejected").required(),
  department: Joi.string().trim().max(120).optional(),
});

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createComplaint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const payload = await complaintSchema.validateAsync(req.body, { abortEarly: false });
    const result = await createComplaintWithAi({
      ...payload,
      citizenId: req.user.id,
      image: req.file,
    });

    res.status(201).json({
      success: true,
      data: {
        complaint: result.complaint,
        aiAnalysis: result.aiResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateComplaint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const payload = await complaintSchema.validateAsync(req.body, { abortEarly: false });
    const result = await updateComplaintWithAi({
      complaintIdentifier: String(req.params.id),
      actorId: req.user.id,
      actorRole: req.user.role,
      ...payload,
      image: req.file,
    });

    res.json({
      success: true,
      data: {
        complaint: result.complaint,
        aiAnalysis: result.aiResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getComplaints = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const filters: Record<string, unknown> = {};

    if (req.query.category) {
      filters.category = req.query.category;
    }

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.ward) {
      filters.address = { $regex: String(req.query.ward), $options: "i" };
    }

    if (req.query.query) {
      const normalizedQuery = escapeRegex(String(req.query.query).trim());
      if (normalizedQuery) {
        filters.$or = [
          { title: { $regex: normalizedQuery, $options: "i" } },
          { description: { $regex: normalizedQuery, $options: "i" } },
          { address: { $regex: normalizedQuery, $options: "i" } },
          { complaintId: { $regex: normalizedQuery, $options: "i" } },
        ];
      }
    }

    if (req.query.mine === "true") {
      if (!req.user) {
        throw new HttpError(401, "Authentication required to view your complaints");
      }

      filters.citizenId = req.user.id;
    }

    const complaints = await ComplaintModel.find(filters)
      .populate("citizenId", "name ward")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

export const getComplaintById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const identifier = String(req.params.id);
    const filter = mongoose.isValidObjectId(identifier)
      ? { $or: [{ _id: identifier }, { complaintId: identifier }] }
      : { complaintId: identifier };

    const complaint = await ComplaintModel.findOne(filter).populate("citizenId", "name ward address");

    if (!complaint) {
      throw new HttpError(404, "Complaint not found");
    }

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

export const patchComplaintStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = await statusSchema.validateAsync(req.body, { abortEarly: false });
    const complaint = await updateComplaintStatus({
      complaintIdentifier: String(req.params.id),
      status: payload.status,
      department: payload.department,
      actorId: req.user?.id,
      actorName: req.user?.email,
    });

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

export const getNearbyComplaints = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { lng, lat, radiusMeters } = parseNearbyQuery(
      req.query.longitude as string | undefined,
      req.query.latitude as string | undefined,
      req.query.radiusKm as string | undefined,
    );

    const complaints = await ComplaintModel.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radiusMeters,
        },
      },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};
