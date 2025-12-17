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
import { objectRouter } from "../src/controller/object";
import { ImageObject, OnType } from "../src/models/ObjectModel";
import { User } from "../src/models/UserModel";
import * as aiServices from "../src/services/ai";
import * as storageService from "../src/services/storage";

// Mock AI services
vi.mock("../src/services/ai", () => ({
  textGenerator: {
    generateText: vi.fn(),
  },
  imageGenerator: {
    generateImage: vi.fn(),
  },
}));

// Mock storage service
vi.mock("../src/services/storage", () => ({
  storage: {
    uploadFromBuffer: vi.fn(),
  },
}));

// Mock removeBackgroundService
vi.mock("../src/services/removeBackgroundService", () => ({
  removeBackgroundService: {
    removeBackground: vi.fn(),
  },
}));

// Mock ImageConverter
vi.mock("../src/utils/imageConverter", () => ({
  ImageConverter: {
    toBuffer: vi.fn(),
    urlToBuffer: vi.fn(),
    base64ToBuffer: vi.fn(),
  },
}));

// Mock authentication middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface GlobalTestUsers {
  __testUser?: InstanceType<typeof User>;
  __testAdmin?: InstanceType<typeof User>;
}

vi.mock("../src/middleware/auth", () => ({
  authenticateJWT: (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // Get test user IDs from closure
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

describe("Object Integration Tests", () => {
  let app: Express;
  let testUser: InstanceType<typeof User>;
  let testAdmin: InstanceType<typeof User>;
  const MONGODB_TEST_URI =
    process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/test-db";

  // Helper function to create authenticated request
  const createAuthRequest = (token?: string) => {
    return request(app)
      .set("Authorization", `Bearer ${token || "test-user-token"}`)
      .set("Content-Type", "application/json");
  };

  // Helper function to create admin authenticated request
  const createAdminRequest = (token?: string) => {
    return request(app)
      .set("Authorization", `Bearer ${token || "test-admin-token"}`)
      .set("Content-Type", "application/json");
  };

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_TEST_URI);
    console.log("✅ Test database connected");

    // Create test users first
    testUser = new User({
      email: "test@example.com",
      password: "hashedpassword",
      theme: {
        floorColor: "#FFFFFF",
        leftWallColor: "#FFFFFF",
        rightWallColor: "#FFFFFF",
        weather: "sunny",
        backgroundMusic: { url: "", name: "" },
      },
      objectIds: [],
      questionIndex: 0,
    });
    await testUser.save();

    testAdmin = new User({
      email: "admin@example.com",
      password: "hashedpassword",
      theme: {
        floorColor: "#FFFFFF",
        leftWallColor: "#FFFFFF",
        rightWallColor: "#FFFFFF",
        weather: "sunny",
        backgroundMusic: { url: "", name: "" },
      },
      objectIds: [],
      questionIndex: 0,
    });
    await testAdmin.save();

    // Store in global for mock access
    (global as GlobalTestUsers).__testUser = testUser;
    (global as GlobalTestUsers).__testAdmin = testAdmin;

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use("/object", objectRouter);
  });

  afterAll(async () => {
    // Clean up test database - 컬렉션만 삭제 (dropDatabase는 권한 문제로 실패할 수 있음)
    try {
      await ImageObject.deleteMany({});
      await User.deleteMany({});
      console.log("✅ Test collections cleaned up");
    } catch (error) {
      console.warn("Failed to clean up collections:", error);
    }
    await mongoose.connection.close();
    console.log("✅ Test database closed");
  });

  beforeEach(async () => {
    // Clear collections before each test
    await ImageObject.deleteMany({});
    await User.updateMany({}, { $set: { objectIds: [], questionIndex: 0 } });

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("POST /object/followup", () => {
    it("should generate follow-up question successfully", async () => {
      const mockQuestion = "이것에 대해 더 자세히 설명해주세요.";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aiServices.textGenerator.generateText as any).mockResolvedValue(
        mockQuestion
      );

      const response = await createAuthRequest().post("/object/followup").send({
        content: "나는 사랑에 대해 생각하고 있습니다.",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("question");
      expect(response.body.question).toBe(mockQuestion);
      expect(aiServices.textGenerator.generateText).toHaveBeenCalled();
    });

    it("should return 400 when content is missing", async () => {
      const response = await createAuthRequest()
        .post("/object/followup")
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/object/followup").send({
        content: "test content",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /object", () => {
    it("should create user-made object successfully", async () => {
      const mockMetadata = {
        name: "Test Object",
        color: "#FF0000",
        description: "Test Description",
        onType: "Floor",
        visual_prompt: "A red test object",
      };

      const mockImageData = {
        data: [
          {
            b64_json: "base64encodedimage",
          },
        ],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aiServices.textGenerator.generateText as any).mockResolvedValueOnce(
        JSON.stringify(mockMetadata)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aiServices.imageGenerator.generateImage as any).mockResolvedValue(
        mockImageData
      );

      // Mock image conversion and background removal
      const { ImageConverter } = await import("../src/utils/imageConverter");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ImageConverter.toBuffer as any).mockResolvedValue({
        buffer: Buffer.from("test"),
        mimeType: "image/png",
      });

      const { removeBackgroundService } = await import(
        "../src/services/removeBackgroundService"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (removeBackgroundService.removeBackground as any).mockResolvedValue(
        Buffer.from("test-no-bg")
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (storageService.storage.uploadFromBuffer as any).mockResolvedValue(
        "https://example.com/image.png"
      );

      const response = await createAuthRequest().post("/object").send({
        content: "나는 사랑에 대해 생각하고 있습니다.",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("name", mockMetadata.name);
      expect(response.body).toHaveProperty("isUserMade", true);
      expect(response.body).toHaveProperty("onType", mockMetadata.onType);
    });

    it("should return 400 when content is missing", async () => {
      const response = await createAuthRequest().post("/object").send({});

      expect(response.status).toBe(400);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/object").send({
        content: "test content",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /object/add", () => {
    it("should add user-made object to inventory successfully", async () => {
      // Create a user-made object
      const userObject = new ImageObject({
        name: "User Object",
        currentImageSet: {
          name: "Default",
          color: "#FF0000",
          src: "https://example.com/image.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#FF0000",
            src: "https://example.com/image.png",
          },
        ],
        isUserMade: true,
        onType: OnType.Floor,
      });
      await userObject.save();

      const user = await User.findById(testUser._id);
      const initialQuestionIndex = user?.questionIndex || 0;

      const response = await createAuthRequest()
        .post("/object/add")
        .send({
          objectId: (userObject._id as mongoose.Types.ObjectId).toString(),
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "Object added to inventory successfully"
      );

      // Verify object was added to user's inventory
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.objectIds).toContainEqual(
        userObject._id as mongoose.Types.ObjectId
      );
      expect(updatedUser?.questionIndex).toBe(initialQuestionIndex + 1);
    });

    it("should return 400 when object is not found", async () => {
      const fakeObjectId = new mongoose.Types.ObjectId().toString();

      const response = await createAuthRequest().post("/object/add").send({
        objectId: fakeObjectId,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Object not found");
    });

    it("should return 400 when trying to add preset object", async () => {
      // Create a preset object
      const presetObject = new ImageObject({
        name: "Preset Object",
        currentImageSet: {
          name: "Default",
          color: "#FF0000",
          src: "https://example.com/image.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#FF0000",
            src: "https://example.com/image.png",
          },
        ],
        isUserMade: false,
        onType: OnType.Floor,
      });
      await presetObject.save();

      const response = await createAuthRequest()
        .post("/object/add")
        .send({
          objectId: (presetObject._id as mongoose.Types.ObjectId).toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Only user-made objects can be added to inventory"
      );
    });

    it("should return 400 when object is already in inventory", async () => {
      // Create a user-made object
      const userObject = new ImageObject({
        name: "User Object",
        currentImageSet: {
          name: "Default",
          color: "#FF0000",
          src: "https://example.com/image.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#FF0000",
            src: "https://example.com/image.png",
          },
        ],
        isUserMade: true,
        onType: OnType.Floor,
      });
      await userObject.save();

      // Add to inventory first time
      await User.findByIdAndUpdate(testUser._id, {
        $push: { objectIds: userObject._id as mongoose.Types.ObjectId },
      });

      // Try to add again
      const response = await createAuthRequest()
        .post("/object/add")
        .send({
          objectId: (userObject._id as mongoose.Types.ObjectId).toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Object is already in user's inventory"
      );
    });
  });

  describe("GET /object", () => {
    it("should get all user-made objects for authenticated user", async () => {
      // Create user-made objects
      const object1 = new ImageObject({
        name: "User Object 1",
        currentImageSet: {
          name: "Default",
          color: "#FF0000",
          src: "https://example.com/image1.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#FF0000",
            src: "https://example.com/image1.png",
          },
        ],
        isUserMade: true,
        onType: OnType.Floor,
      });
      await object1.save();

      const object2 = new ImageObject({
        name: "User Object 2",
        currentImageSet: {
          name: "Default",
          color: "#00FF00",
          src: "https://example.com/image2.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#00FF00",
            src: "https://example.com/image2.png",
          },
        ],
        isUserMade: true,
        onType: OnType.LeftWall,
      });
      await object2.save();

      // Add objects to user's inventory
      await User.findByIdAndUpdate(testUser._id, {
        $set: {
          objectIds: [
            object1._id as mongoose.Types.ObjectId,
            object2._id as mongoose.Types.ObjectId,
          ],
        },
      });

      const response = await createAuthRequest().get("/object");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty("name");
      expect(response.body[0]).toHaveProperty("isUserMade", true);
    });

    it("should return empty array when user has no objects", async () => {
      const response = await createAuthRequest().get("/object");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/object");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /object/basic", () => {
    it("should get all basic objects", async () => {
      // Create preset objects
      const preset1 = new ImageObject({
        name: "Preset Object 1",
        currentImageSet: {
          name: "Default",
          color: "#FF0000",
          src: "https://example.com/preset1.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#FF0000",
            src: "https://example.com/preset1.png",
          },
        ],
        isUserMade: false,
        onType: OnType.Floor,
      });
      await preset1.save();

      const preset2 = new ImageObject({
        name: "Preset Object 2",
        currentImageSet: {
          name: "Default",
          color: "#00FF00",
          src: "https://example.com/preset2.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#00FF00",
            src: "https://example.com/preset2.png",
          },
        ],
        isUserMade: false,
        onType: OnType.RightWall,
      });
      await preset2.save();

      const response = await request(app).get("/object/basic");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty("isUserMade", false);
    });

    it("should return empty array when no basic objects exist", async () => {
      const response = await request(app).get("/object/basic");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe("POST /object/basic", () => {
    it("should create basic object successfully (admin only)", async () => {
      const mockFile = {
        fieldname: "imageSets[0][file]",
        originalname: "test.png",
        encoding: "7bit",
        mimetype: "image/png",
        buffer: Buffer.from("test image data"),
        size: 1024,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (storageService.storage.uploadFromBuffer as any).mockResolvedValue(
        "https://example.com/preset.png"
      );

      const response = await createAdminRequest()
        .post("/object/basic")
        .field("name", "Test Preset")
        .field("description", "Test Description")
        .field("onType", OnType.Floor)
        .field("imageSets[0][name]", "Default")
        .field("imageSets[0][color]", "#FF0000")
        .attach("imageSets[0][file]", mockFile.buffer, "test.png");

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("name", "Test Preset");
      expect(response.body).toHaveProperty("isUserMade", false);
      expect(response.body).toHaveProperty("onType", OnType.Floor);
      expect(response.body.imageSets).toHaveLength(1);
    });

    it("should return 400 when required fields are missing", async () => {
      const response = await createAdminRequest().post("/object/basic").send({
        name: "Test Preset",
        // Missing onType and imageSets
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/object/basic").send({
        name: "Test Preset",
        onType: OnType.Floor,
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /object/:objectId", () => {
    it("should update preset object successfully (admin only)", async () => {
      // Create a preset object
      const presetObject = new ImageObject({
        name: "Original Name",
        currentImageSet: {
          name: "Default",
          color: "#FF0000",
          src: "https://example.com/image.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#FF0000",
            src: "https://example.com/image.png",
          },
        ],
        isUserMade: false,
        onType: OnType.Floor,
      });
      await presetObject.save();

      const response = await createAdminRequest()
        .patch(
          `/object/${(presetObject._id as mongoose.Types.ObjectId).toString()}`
        )
        .send({
          name: "Updated Name",
          description: "Updated Description",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", "Updated Name");
      expect(response.body).toHaveProperty(
        "description",
        "Updated Description"
      );
    });

    it("should return 403 when trying to update user-made object", async () => {
      // Create a user-made object
      const userObject = new ImageObject({
        name: "User Object",
        currentImageSet: {
          name: "Default",
          color: "#FF0000",
          src: "https://example.com/image.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#FF0000",
            src: "https://example.com/image.png",
          },
        ],
        isUserMade: true,
        onType: OnType.Floor,
      });
      await userObject.save();

      const response = await createAdminRequest()
        .patch(
          `/object/${(userObject._id as mongoose.Types.ObjectId).toString()}`
        )
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "message",
        "Cannot update user-made objects. Only preset objects can be updated."
      );
    });

    it("should return 404 when object not found", async () => {
      const fakeObjectId = new mongoose.Types.ObjectId().toString();

      const response = await createAdminRequest()
        .patch(`/object/${fakeObjectId}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Object not found");
    });
  });

  describe("DELETE /object/:objectId", () => {
    it("should delete preset object successfully (admin only)", async () => {
      // Create a preset object
      const presetObject = new ImageObject({
        name: "To Be Deleted",
        currentImageSet: {
          name: "Default",
          color: "#FF0000",
          src: "https://example.com/image.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#FF0000",
            src: "https://example.com/image.png",
          },
        ],
        isUserMade: false,
        onType: OnType.Floor,
      });
      await presetObject.save();
      const objectId = (presetObject._id as mongoose.Types.ObjectId).toString();

      const response = await createAdminRequest().delete(`/object/${objectId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Preset object deleted successfully"
      );
      expect(response.body).toHaveProperty("deletedId", objectId);

      // Verify object is deleted
      const deletedObject = await ImageObject.findById(objectId);
      expect(deletedObject).toBeNull();
    });

    it("should return 403 when trying to delete user-made object", async () => {
      // Create a user-made object
      const userObject = new ImageObject({
        name: "User Object",
        currentImageSet: {
          name: "Default",
          color: "#FF0000",
          src: "https://example.com/image.png",
        },
        imageSets: [
          {
            name: "Default",
            color: "#FF0000",
            src: "https://example.com/image.png",
          },
        ],
        isUserMade: true,
        onType: OnType.Floor,
      });
      await userObject.save();

      const response = await createAdminRequest().delete(
        `/object/${(userObject._id as mongoose.Types.ObjectId).toString()}`
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "message",
        "Cannot delete user-made objects. Only preset objects can be deleted."
      );
    });

    it("should return 404 when object not found", async () => {
      const fakeObjectId = new mongoose.Types.ObjectId().toString();

      const response = await createAdminRequest().delete(
        `/object/${fakeObjectId}`
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Object not found");
    });
  });
});
