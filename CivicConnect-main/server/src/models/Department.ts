import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    headOfficer: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: false },
);

export type Department = InferSchemaType<typeof departmentSchema>;
export type DepartmentDocument = HydratedDocument<Department>;

export const DepartmentModel = model<Department>("Department", departmentSchema);

