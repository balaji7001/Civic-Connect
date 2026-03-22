import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const feedbackSchema = new Schema(
  {
    complaintId: {
      type: String,
      required: true,
      trim: true,
    },
    citizenId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export type Feedback = InferSchemaType<typeof feedbackSchema>;
export type FeedbackDocument = HydratedDocument<Feedback>;

export const FeedbackModel = model<Feedback>("Feedback", feedbackSchema);

