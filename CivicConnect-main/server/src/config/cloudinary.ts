import { v2 as cloudinary } from "cloudinary";
import type { Express } from "express";

import { HttpError } from "../middleware/errorHandler";

export const allowedImageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const maxComplaintImageSizeBytes = 5 * 1024 * 1024;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getPreferredFormat = (mimetype: string) => {
  if (mimetype === "image/jpeg") {
    return "jpg";
  }

  return "webp";
};

export const uploadImageToCloudinary = async (
  file?: Express.Multer.File,
): Promise<{ imageUrl: string; thumbnailUrl: string } | undefined> => {
  if (!file) {
    return undefined;
  }

  if (!allowedImageMimeTypes.includes(file.mimetype as (typeof allowedImageMimeTypes)[number])) {
    throw new HttpError(400, "Only JPG, JPEG, PNG, and WebP complaint images are allowed.");
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new HttpError(
      500,
      "Cloudinary configuration is missing. Add CLOUDINARY credentials before uploading images.",
    );
  }

  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const format = getPreferredFormat(file.mimetype);

  const result = await cloudinary.uploader.upload(base64Image, {
    folder: "civic-connect/complaints",
    resource_type: "image",
    transformation: [
      {
        width: 1200,
        crop: "limit",
        quality: "auto:good",
      },
    ],
    eager: [
      {
        width: 320,
        height: 220,
        crop: "fill",
        gravity: "auto",
        quality: "auto:eco",
        format,
      },
    ],
    eager_async: false,
    format,
  });

  return {
    imageUrl: result.secure_url,
    thumbnailUrl: result.eager?.[0]?.secure_url || result.secure_url,
  };
};
