import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const slaRuleSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["garbage", "water", "electricity", "road", "drainage"],
      required: true,
      unique: true,
    },
    deadlineHours: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: false },
);

export type SlaRule = InferSchemaType<typeof slaRuleSchema>;
export type SlaRuleDocument = HydratedDocument<SlaRule>;

export const SlaRuleModel = model<SlaRule>("SlaRule", slaRuleSchema);

