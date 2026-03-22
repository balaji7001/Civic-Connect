import Joi from "joi";
import mongoose from "mongoose";
import type { NextFunction, Response } from "express";

import { ComplaintModel } from "../models/Complaint";
import { DepartmentModel } from "../models/Department";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { updateComplaintStatus } from "../services/complaintService";
import { HttpError } from "../middleware/errorHandler";

const assignSchema = Joi.object({
  department: Joi.string().trim().min(3).max(120).required(),
});

const manageSchema = Joi.object({
  department: Joi.string().trim().min(3).max(120).optional(),
  status: Joi.string().valid("Pending", "In Progress", "Resolved", "Rejected").optional(),
  remark: Joi.string().trim().max(500).optional().allow(""),
}).or("department", "status", "remark");

export const getAdminComplaints = async (
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

    if (req.query.priority) {
      filters.priority = req.query.priority;
    }

    const complaints = await ComplaintModel.find(filters)
      .populate("citizenId", "name ward address")
      .sort({ severityScore: -1, createdAt: -1 });

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

export const assignDepartment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = await assignSchema.validateAsync(req.body, { abortEarly: false });
    const identifier = String(req.params.id);
    const filter = mongoose.isValidObjectId(identifier)
      ? { _id: identifier }
      : { complaintId: identifier };

    const complaint = await ComplaintModel.findOne(filter);

    if (!complaint) {
      throw new HttpError(404, "Complaint not found");
    }

    complaint.department = payload.department;
    await complaint.save();

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

export const manageComplaint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = await manageSchema.validateAsync(req.body, { abortEarly: false });

    const complaint = await updateComplaintStatus({
      complaintIdentifier: String(req.params.id),
      department: payload.department,
      status: payload.status,
      remark: payload.remark,
      actorId: req.user?.id,
      actorName: req.user?.email || "admin",
    });

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

export const getSlaViolations = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const complaints = await ComplaintModel.find({
      status: { $nin: ["Resolved", "Rejected"] },
      slaDeadline: { $lt: new Date() },
    }).sort({ slaDeadline: 1 });

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const departments = await DepartmentModel.find().sort({ name: 1 });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};
