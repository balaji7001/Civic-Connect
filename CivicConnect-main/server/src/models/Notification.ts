import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    complaintId: {
      type: Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema>;
export type NotificationDocument = HydratedDocument<Notification>;

export const NotificationModel = model<Notification>("Notification", notificationSchema);
