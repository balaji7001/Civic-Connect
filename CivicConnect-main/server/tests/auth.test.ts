import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import { app } from "../src/server";
import { connectDatabase, disconnectDatabase } from "../src/config/db";
import { UserModel } from "../src/models/User";

let mongoServer: MongoMemoryServer | undefined;

describe("auth routes", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it("registers a user and returns a JWT", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Asha Kumar",
      email: "asha@example.com",
      password: "password123",
      ward: "Ward 12",
      address: "12 Market Road",
    });

    expect(response.status).toBe(201);
    expect(response.body.data.token).toBeTruthy();
    expect(response.body.data.user.email).toBe("asha@example.com");
  });

  it("logs in and fetches the current profile", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send({
      name: "Rahul Admin",
      email: "rahul@example.com",
      password: "password123",
      ward: "Ward 1",
      address: "1 Civic Plaza",
      role: "admin",
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "rahul@example.com",
      password: "password123",
    });

    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registerResponse.body.data.token || loginResponse.body.data.token}`);

    expect(loginResponse.status).toBe(200);
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.role).toBe("admin");
  });
});
