import "dotenv/config";

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { connectDatabase } from "./config/db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import adminRoutes from "./routes/adminRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import authRoutes from "./routes/authRoutes";
import citizenRoutes from "./routes/citizenRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import publicRoutes from "./routes/publicRoutes";
import { seedReferenceData } from "./services/complaintService";
import { startSlaMonitor } from "./services/slaMonitor";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
    credentials: true,
  }),
);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter as any);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Civic Connect API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/citizen", citizenRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  await connectDatabase();
  await seedReferenceData();
  startSlaMonitor();

  const port = Number(process.env.PORT || 5000);
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}/api/health`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
}
