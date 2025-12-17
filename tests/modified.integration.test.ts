import mongoose from "mongoose";
import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import express, { Express } from "express";
import request from "supertest";
import { Request, Response, NextFunction } from "express";

import { modifiedRouter } from "../src/controller/modified";
import { ImageObject, OnType } from "../src/models/ObjectModel";
import { User } from "../src/models/UserModel";
import {
  ModifiedObject,
  ModifiedObjectModel,
} from "../src/models/ModifiedObject";
import { ModifiedService } from "../src/services/modifiedService";
import { ItemFunction } from "../src/types";

// Mock authentication middleware (same pattern as object.integration.test.ts)
interface GlobalTestUsers {
  __testUser?: InstanceType<typeof User>;
  __testAdmin?: InstanceType<typeof User>;
}

vi.mock("../src/middleware/auth", () => ({
  authenticateJWT: (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const testUser = (global as GlobalTestUsers).__testUser;
      const testAdmin = (global as GlobalTestUsers).__testAdmin;

      if (token === "test-user-token" && testUser) {
        req.user = {
          id: testUser._id.toString(),
          email: testUser.email,
          name: testUser.name,
        };
        return next();
      } else if (token === "test-admin-token" && testAdmin) {
        req.user = {
          id: testAdmin._id.toString(),
          email: testAdmin.email,
          name: testAdmin.name,
        };
        return next();
      }
    }
    return res.status(401).json({
      message: "Access denied. Token is invalid or expired.",
    });
  },
  authenticateAdmin: (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const testAdmin = (global as GlobalTestUsers).__testAdmin;

      if (token === "test-admin-token" && testAdmin) {
        req.user = {
          id: testAdmin._id.toString(),
          email: testAdmin.email,
          name: testAdmin.name,
        };
        return next();
      }
    }
    return res.status(401).json({
      message: "Access denied. Token is invalid or expired.",
    });
  },
}));

describe("Modified Integration Tests", () => {
  let app: Express;
  let testUser: InstanceType<typeof User>;
  let testAdmin: InstanceType<typeof User>;
  let baseImageObject: InstanceType<typeof ImageObject>;
  let baseCurrentImageSetId: string;

  const BASE_MONGODB_URI = process.env.MONGODB_TEST_URI;

  if (!BASE_MONGODB_URI) {
    throw new Error("MONGODB_TEST_URI is not set");
  }

  // 이 테스트 파일 전용 DB 이름을 위해 suffix 추가
  const MONGODB_TEST_URI = (() => {
    const [base, query] = BASE_MONGODB_URI.split("?");
    const lastSlash = base.lastIndexOf("/");
    if (lastSlash === -1) return BASE_MONGODB_URI;
    const dbName = base.slice(lastSlash + 1);
    const newBase = `${base.slice(0, lastSlash + 1)}${dbName}_modified`;
    return query ? `${newBase}?${query}` : newBase;
  })();

  // Helper function to create authenticated request
  const createAuthRequest = (token?: string) => {
    const authHeader = `Bearer ${token || "test-user-token"}`;
    return {
      get: (path: string) =>
        request(app)
          .get(path)
          .set("Authorization", authHeader)
          .set("Content-Type", "application/json"),
      post: (path: string) =>
        request(app)
          .post(path)
          .set("Authorization", authHeader)
          .set("Content-Type", "application/json"),
      patch: (path: string) =>
        request(app)
          .patch(path)
          .set("Authorization", authHeader)
          .set("Content-Type", "application/json"),
      delete: (path: string) =>
        request(app)
          .delete(path)
          .set("Authorization", authHeader)
          .set("Content-Type", "application/json"),
    };
  };

  beforeAll(async () => {
    await mongoose.connect(MONGODB_TEST_URI);
    console.log("\n✅ [modified] Test database connected");

    // Create test user
    testUser = new User({
      email: "modified-user@example.com",
      password: "hashedpassword",
      theme: {
        floorColor: "#FFFFFF",
        leftWallColor: "#FFFFFF",
        rightWallColor: "#FFFFFF",
        weather: "sunny",
        backgroundMusic: {
          url: "https://example.com/music.mp3",
          name: "Test Music",
        },
      },
      objectIds: [],
      modifiedObjectIds: [],
      questionIndex: 0,
    });
    await testUser.save();

    // Create admin user (not heavily used here but kept for consistency)
    testAdmin = new User({
      email: "modified-admin@example.com",
      password: "hashedpassword",
      theme: {
        floorColor: "#FFFFFF",
        leftWallColor: "#FFFFFF",
        rightWallColor: "#FFFFFF",
        weather: "sunny",
        backgroundMusic: {
          url: "https://example.com/music.mp3",
          name: "Admin Music",
        },
      },
      objectIds: [],
      modifiedObjectIds: [],
      questionIndex: 0,
    });
    await testAdmin.save();

    (global as GlobalTestUsers).__testUser = testUser;
    (global as GlobalTestUsers).__testAdmin = testAdmin;

    // Base ImageObject for modified tests
    baseImageObject = new ImageObject({
      name: "Base Object",
      currentImageSet: {
        name: "Default",
        color: "#FF0000",
        src: "https://example.com/base.png",
      },
      imageSets: [
        {
          name: "Default",
          color: "#FF0000",
          src: "https://example.com/base.png",
        },
      ],
      isUserMade: true,
      onType: OnType.Floor,
    });
    await baseImageObject.save();
    baseCurrentImageSetId = baseImageObject.imageSets[0]._id!.toString();

    // Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/modified", modifiedRouter);
  });

  afterAll(async () => {
    try {
      await ModifiedObjectModel.deleteMany({});
      await ImageObject.deleteMany({});
      await User.deleteMany({});
      console.log("✅ [modified] Test collections cleaned up");
    } catch (error) {
      console.warn("[modified] Failed to clean up collections:", error);
    }
    await mongoose.connection.close();
    console.log("✅ [modified] Test database closed");
  });

  beforeEach(async () => {
    await ModifiedObjectModel.deleteMany({});
    await User.updateMany(
      {},
      { $set: { modifiedObjectIds: [], objectIds: [], questionIndex: 0 } }
    );
  });

  describe("POST /modified", () => {
    it("should create a modified object with null itemFunction", async () => {
      const body = {
        name: "Modified Object",
        currentImageSetId: baseCurrentImageSetId,
        originalObjectId: baseImageObject._id.toString(),
        itemFunction: null,
        coordinates: { x: 0.5, y: 0.5 },
        onType: OnType.Floor,
        description: "Test description",
        isReversed: false,
        additionalData: {}, // allowed when itemFunction is null
      };

      const response = await createAuthRequest()
        .post("/modified")
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("name", body.name);
      expect(response.body).toHaveProperty("onType", body.onType);
      expect(response.body).toHaveProperty("isReversed", body.isReversed);

      const user = await User.findById(testUser._id);
      expect(user).not.toBeNull();
      expect(user!.modifiedObjectIds).toHaveLength(1);
      expect(
        user!.modifiedObjectIds[0].toString()
      ).toBe(response.body._id.toString());
    });
  });

  describe("PATCH /modified/:id", () => {
    it("should update an existing modified object", async () => {
      // 먼저 수정 객체 하나 생성
      const created = await ModifiedService.createModified(
        {
          name: "Original Name",
          currentImageSetId: baseCurrentImageSetId,
          originalObjectId: baseImageObject._id.toString(),
          itemFunction: null,
          coordinates: { x: 0.2, y: 0.3 },
          onType: OnType.Floor,
          description: "Original description",
          isReversed: false,
          additionalData: {},
        },
        testUser._id.toString()
      );

      const updateBody = {
        name: "Updated Name",
        description: "Updated Description",
        coordinates: { x: 0.8, y: 0.9 },
        isReversed: true,
      };

      const response = await createAuthRequest()
        .patch(`/modified/${created._id.toString()}`)
        .send(updateBody);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", updateBody.name);
      expect(response.body).toHaveProperty(
        "description",
        updateBody.description
      );
      expect(response.body.coordinates).toEqual(updateBody.coordinates);
      expect(response.body).toHaveProperty("isReversed", true);
    });

    it("should return 404 when modified object does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await createAuthRequest()
        .patch(`/modified/${fakeId}`)
        .send({
          name: "Does Not Matter",
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Modified object not found"
      );
    });
  });

  describe("GET /modified", () => {
    it("should get all modified objects for authenticated user", async () => {
      // 2개의 modified object 생성
      const paramsBase = {
        currentImageSetId: baseCurrentImageSetId,
        originalObjectId: baseImageObject._id.toString(),
        coordinates: { x: 0.1, y: 0.2 },
        onType: OnType.Floor,
        description: "desc",
        isReversed: false,
        additionalData: {},
      };

      await ModifiedService.createModified(
        {
          ...paramsBase,
          name: "Mod 1",
          itemFunction: null,
        },
        testUser._id.toString()
      );
      await ModifiedService.createModified(
        {
          ...paramsBase,
          name: "Mod 2",
          itemFunction: null,
        },
        testUser._id.toString()
      );

      const response = await createAuthRequest().get("/modified");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty("name");
    });

    it("should return empty array when user has no modified objects", async () => {
      const response = await createAuthRequest().get("/modified");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe("DELETE /modified/:id", () => {
    it("should delete a modified object and update user", async () => {
      const created = await ModifiedService.createModified(
        {
          name: "To Be Deleted",
          currentImageSetId: baseCurrentImageSetId,
          originalObjectId: baseImageObject._id.toString(),
          itemFunction: null,
          coordinates: { x: 0.3, y: 0.4 },
          onType: OnType.Floor,
          description: "To be deleted",
          isReversed: false,
          additionalData: {},
        },
        testUser._id.toString()
      );

      const response = await createAuthRequest().delete(
        `/modified/${created._id.toString()}`
      );

      expect(response.status).toBe(204);

      const found = await ModifiedObjectModel.findById(created._id);
      expect(found).toBeNull();

      const user = await User.findById(testUser._id);
      expect(user).not.toBeNull();
      expect(
        user!.modifiedObjectIds.some(
          (id) => id.toString() === created._id.toString()
        )
      ).toBe(false);
    });

    it("should return 404 when trying to delete non-existing modified object", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await createAuthRequest().delete(
        `/modified/${fakeId}`
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Modified object not found"
      );
    });
  });
});


