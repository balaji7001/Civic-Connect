import mongoose from "mongoose";

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(mongoUri);
  isConnected = true;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
};

