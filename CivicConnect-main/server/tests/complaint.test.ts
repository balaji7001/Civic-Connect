import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import { connectDatabase, disconnectDatabase } from "../src/config/db";
import { ComplaintModel } from "../src/models/Complaint";
import { DepartmentModel } from "../src/models/Department";
import { NotificationModel } from "../src/models/Notification";
import { SlaRuleModel } from "../src/models/SlaRule";
import { UserModel } from "../src/models/User";
import { app } from "../src/server";
import { seedReferenceData } from "../src/services/complaintService";
import { runSlaSweep } from "../src/services/slaMonitor";

let mongoServer: MongoMemoryServer | undefined;

const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  ward: string;
  address: string;
  role?: "citizen" | "admin";
}) => {
  const response = await request(app).post("/api/auth/register").send(payload);
  return response.body.data.token as string;
};

describe("complaint and analytics routes", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDatabase();
    await seedReferenceData();
    await ComplaintModel.syncIndexes();
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await NotificationModel.deleteMany({});
    await ComplaintModel.deleteMany({});
    await UserModel.deleteMany({});
    await DepartmentModel.deleteMany({});
    await SlaRuleModel.deleteMany({});
    await seedReferenceData();
  });

  it("creates a complaint, notifies admins, lists it, and returns nearby results", async () => {
    const citizenToken = await registerUser({
      name: "Citizen One",
      email: "citizen@example.com",
      password: "password123",
      ward: "Ward 12",
      address: "12 Example Street",
    });
    const adminToken = await registerUser({
      name: "Admin One",
      email: "admin-one@example.com",
      password: "password123",
      ward: "HQ",
      address: "1 Admin Street",
      role: "admin",
    });

    const createResponse = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${citizenToken}`)
      .field("title", "Garbage overflowing near school")
      .field("description", "The garbage bins are overflowing and smell terrible for two days")
      .field("address", "Ward 12 Public School")
      .field("longitude", 78.4867)
      .field("latitude", 17.385);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.complaint.category).toBe("garbage");

    const listResponse = await request(app)
      .get("/api/complaints?mine=true")
      .set("Authorization", `Bearer ${citizenToken}`);

    const nearbyResponse = await request(app).get(
      "/api/complaints/nearby?longitude=78.4867&latitude=17.385&radiusKm=2",
    );

    const adminNotificationsResponse = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(nearbyResponse.status).toBe(200);
    expect(nearbyResponse.body.data).toHaveLength(1);
    expect(adminNotificationsResponse.status).toBe(200);
    expect(adminNotificationsResponse.body.data.items[0].title).toBe("New complaint submitted");
  });

  it("allows an admin to update complaint status, creates notifications, reminds on SLA violations, and exposes analytics", async () => {
    const citizenToken = await registerUser({
      name: "Citizen Two",
      email: "citizen2@example.com",
      password: "password123",
      ward: "Ward 9",
      address: "9 Green Lane",
    });
    const adminToken = await registerUser({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      ward: "HQ",
      address: "1 Admin Street",
      role: "admin",
    });

    const createResponse = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${citizenToken}`)
      .field("title", "Water leakage on main road")
      .field("description", "Urgent water leakage is wasting water and making the road unsafe")
      .field("address", "Ward 9 Main Road")
      .field("longitude", 78.49)
      .field("latitude", 17.39);

    const complaintId = createResponse.body.data.complaint.complaintId as string;

    const patchResponse = await request(app)
      .patch(`/api/complaints/${complaintId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "In Progress", department: "Water Board" });

    const citizenNotificationsResponse = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${citizenToken}`);

    const citizenNotificationId = citizenNotificationsResponse.body.data.items[0]._id as string;

    const markReadResponse = await request(app)
      .patch(`/api/notifications/${citizenNotificationId}/read`)
      .set("Authorization", `Bearer ${citizenToken}`);

    const complaint = await ComplaintModel.findOne({ complaintId });
    if (!complaint) {
      throw new Error("Expected complaint to exist for SLA test");
    }

    complaint.slaDeadline = new Date(Date.now() - 60 * 60 * 1000);
    complaint.lastAdminSlaReminderAt = undefined;
    await complaint.save();

    const overdueCount = await runSlaSweep();

    const adminNotificationsResponse = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${adminToken}`);

    const rejectResponse = await request(app)
      .patch(`/api/admin/complaints/${complaintId}/manage`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Rejected", remark: "Duplicate complaint already exists." });

    const categoryResponse = await request(app).get("/api/analytics/category");
    const severityResponse = await request(app).get("/api/analytics/severity");

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.data.status).toBe("In Progress");
    expect(citizenNotificationsResponse.status).toBe(200);
    expect(citizenNotificationsResponse.body.data.items[0].message).toContain("Water leakage on main road");
    expect(markReadResponse.status).toBe(200);
    expect(markReadResponse.body.data.unreadCount).toBe(0);
    expect(overdueCount).toBe(1);
    expect(adminNotificationsResponse.status).toBe(200);
    expect(adminNotificationsResponse.body.data.items.some((item: { title: string }) => item.title === "SLA violation alert")).toBe(true);
    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body.data.status).toBe("Rejected");
    expect(rejectResponse.body.data.remarks).toHaveLength(1);
    expect(categoryResponse.status).toBe(200);
    expect(categoryResponse.body.data[0].category).toBe("water");
    expect(severityResponse.status).toBe(200);
    expect(severityResponse.body.data[0].complaintId).toBe(complaintId);
  });
});
