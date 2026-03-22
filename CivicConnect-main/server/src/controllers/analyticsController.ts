import type { NextFunction, Request, Response } from "express";

import { ComplaintModel } from "../models/Complaint";

export const getCategoryAnalytics = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await ComplaintModel.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTrendAnalytics = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await ComplaintModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          label: {
            $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }],
          },
          count: 1,
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getWardAnalytics = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await ComplaintModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "citizenId",
          foreignField: "_id",
          as: "citizen",
        },
      },
      { $unwind: "$citizen" },
      {
        $group: {
          _id: "$citizen.ward",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          ward: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getSeverityAnalytics = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await ComplaintModel.aggregate([
      { $sort: { severityScore: -1, createdAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          complaintId: 1,
          title: 1,
          category: 1,
          severityScore: 1,
          priority: 1,
          status: 1,
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
