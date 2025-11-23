import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { ImageObject } from "../models/ObjectModel";
import { User } from "../models/UserModel";
import { authenticateJWT, authenticateAdmin } from "../middleware/auth";
import { ObjectService } from "../services/objectService";

export const objectRouter = Router();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// POST /object/followup - Generate follow-up question
objectRouter.post(
  "/followup",
  authenticateJWT,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { content } = req.body;

      // Validate content field
      if (
        !content ||
        typeof content !== "string" ||
        content.trim().length === 0
      ) {
        return res.status(400).json({
          message: "content field is required and must be a non-empty string",
        });
      }

      // Generate follow-up question using service
      const result = await ObjectService.generateFollowUpQuestion(content);

      res.status(200).json(result);
    } catch (error) {
      console.error("Error generating follow-up question:", error);
      res.status(500).json({
        message: "Failed to generate follow-up question",
      });
    }
  }
);

// POST /object - Create user-made object
objectRouter.post(
  "/",
  authenticateJWT,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { content } = req.body;
      const userId = req.user!.id;

      // Validate content field
      if (
        !content ||
        typeof content !== "string" ||
        content.trim().length === 0
      ) {
        return res.status(400).json({
          message: "content field is required and must be a non-empty string",
        });
      }

      // Create object using service
      const result = await ObjectService.createUserObject(content, userId);

      res.status(201).json(result.object);
    } catch (error) {
      console.error("Error creating object:", error);
      res.status(500).json({
        message: "Failed to create object",
      });
    }
  }
);

// GET /object - Get all user-made objects for authenticated user
objectRouter.get(
  "/",
  authenticateJWT,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const userId = req.user!.id;

      // Get user's objectIds
      const user = await User.findById(userId).exec();
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // If user has no objects, return empty array
      if (!user.objectIds || user.objectIds.length === 0) {
        return res.status(200).json([]);
      }

      // Fetch objects using user's objectIds
      const objects = await ImageObject.find({
        _id: { $in: user.objectIds },
        isUserMade: true,
      })
        .sort({ createdAt: -1 })
        .exec();

      res.status(200).json(objects);
    } catch (error) {
      console.error("Error fetching user objects:", error);
      res.status(500).json({
        message: "Failed to fetch objects",
      });
    }
  }
);

// GET /object/basic - Get all basic objects
objectRouter.get(
  "/basic",
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const objects = await ImageObject.find({
        isUserMade: false,
      })
        .sort({ createdAt: -1 })
        .exec();

      res.status(200).json(objects);
    } catch (error) {
      console.error("Error fetching basic objects:", error);
      res.status(500).json({
        message: "Failed to fetch basic objects",
      });
    }
  }
);

// POST /object/basic - Create basic object (Admin only)
// Expects multipart/form-data with:
// - name: string
// - description: string (optional)
// - onType: "LeftWall" | "RightWall" | "Floor"
// - imageSets[0][name]: string
// - imageSets[0][color]: string
// - imageSets[0][file]: File
// - imageSets[1][name]: string
// - imageSets[1][color]: string
// - imageSets[1][file]: File
// - ... (for each imageSet)
objectRouter.post(
  "/basic",
  authenticateAdmin,
  upload.any(),
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { name, description, onType } = req.body;
      console.log("🚀 ~ req.body:", req.body);
      const files = req.files;
      console.log("🚀 ~ req.files:", req.files);

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          message: "files are required and must be a non-empty array",
        });
      }

      // Validate required fields
      if (!name || !onType) {
        return res.status(400).json({
          message: "name and onType are required fields",
        });
      }

      // Validate onType enum
      if (!["LeftWall", "RightWall", "Floor"].includes(onType)) {
        return res.status(400).json({
          message: "onType must be one of: LeftWall, RightWall, Floor",
        });
      }

      // Parse imageSets from form data
      // FormData sends nested arrays as: imageSets[0][name], imageSets[0][color], imageSets[0][file]
      // Multer may auto-parse imageSets into an array in req.body.imageSets
      const imageSetsMap = new Map<
        number,
        { name: string; color: string; file?: Express.Multer.File }
      >();

      // Case 1: imageSets is already parsed as an array (most common case)
      if (Array.isArray(req.body.imageSets)) {
        req.body.imageSets.forEach((set: unknown, index: number) => {
          if (
            set &&
            typeof set === "object" &&
            "name" in set &&
            "color" in set &&
            typeof (set as { name: unknown; color: unknown }).name ===
              "string" &&
            typeof (set as { name: unknown; color: unknown }).color === "string"
          ) {
            const typedSet = set as { name: string; color: string };
            imageSetsMap.set(index, {
              name: typedSet.name,
              color: typedSet.color,
            });
          }
        });
      } else {
        // Case 2: Parse imageSets metadata from flat keys: imageSets[0][name], imageSets[0][color]
        Object.keys(req.body).forEach((key) => {
          const match = key.match(/^imageSets\[(\d+)\]\[(name|color)\]$/);
          if (match) {
            const index = parseInt(match[1], 10);
            const field = match[2] as "name" | "color";
            const value = req.body[key];

            if (!imageSetsMap.has(index)) {
              imageSetsMap.set(index, { name: "", color: "" });
            }
            const set = imageSetsMap.get(index)!;
            set[field] = value;
          }
        });
      }

      // Match files to imageSets by field name pattern: imageSets[0][file]
      files.forEach((file) => {
        const match = file.fieldname.match(/^imageSets\[(\d+)\]\[file\]$/);
        if (match) {
          const index = parseInt(match[1], 10);
          if (!imageSetsMap.has(index)) {
            // If imageSet doesn't exist yet, create it (in case files come before metadata)
            imageSetsMap.set(index, { name: "", color: "" });
          }
          imageSetsMap.get(index)!.file = file;
        }
      });

      // Convert map to array and validate
      const imageSetInputs = Array.from(imageSetsMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([, set]) => set);

      if (imageSetInputs.length === 0) {
        return res.status(400).json({
          message: "At least one imageSet is required",
        });
      }

      // Validate each imageSet has all required fields
      for (let i = 0; i < imageSetInputs.length; i++) {
        const set = imageSetInputs[i];
        if (!set.name || !set.color) {
          return res.status(400).json({
            message: `imageSets[${i}] must have name and color fields`,
          });
        }
        if (!set.file) {
          return res.status(400).json({
            message: `imageSets[${i}] must have a file`,
          });
        }
      }

      // Create basic object using service
      const savedObject = await ObjectService.createBasicObject({
        name,
        description,
        onType,
        imageSets: imageSetInputs as Array<{
          name: string;
          color: string;
          file: Express.Multer.File;
        }>,
      });

      res.status(201).json(savedObject);
    } catch (error) {
      console.error("Error creating basic object:", error);
      res.status(500).json({
        message: "Failed to create basic object",
      });
    }
  }
);

// PATCH /object/:objectId - Update basic object (Admin only)
objectRouter.patch(
  "/:objectId",
  authenticateAdmin,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { objectId } = req.params;
      const { name, imageSrc, description, onType, imageSets } = req.body;

      // Find the object
      const object = await ImageObject.findById(objectId);

      if (!object) {
        return res.status(404).json({
          message: "Object not found",
        });
      }

      // Check if it's a basic object (not user-made)
      if (object.isUserMade) {
        return res.status(403).json({
          message:
            "Cannot update user-made objects. Only preset objects can be updated.",
        });
      }

      // Validate onType if provided
      if (onType && !["LeftWall", "RightWall", "Floor"].includes(onType)) {
        return res.status(400).json({
          message: "onType must be one of: LeftWall, RightWall, Floor",
        });
      }

      // Validate imageSets if provided
      if (imageSets !== undefined) {
        if (!Array.isArray(imageSets) || imageSets.length === 0) {
          return res.status(400).json({
            message: "imageSets must be a non-empty array",
          });
        }

        for (const set of imageSets) {
          if (!set.name || !set.color || !set.src) {
            return res.status(400).json({
              message: "Each imageSet must have name, color, and src fields",
            });
          }
        }
      }

      // Update fields
      const updateData: {
        name?: string;
        imageSrc?: string;
        description?: string;
        onType?: "LeftWall" | "RightWall" | "Floor";
        imageSets?: Array<{ name: string; color: string; src: string }>;
      } = {};
      if (name !== undefined) updateData.name = name.trim();
      if (imageSrc !== undefined) updateData.imageSrc = imageSrc.trim();
      if (description !== undefined)
        updateData.description = description?.trim();
      if (onType !== undefined) updateData.onType = onType;
      if (imageSets !== undefined) updateData.imageSets = imageSets;

      const updatedObject = await ImageObject.findByIdAndUpdate(
        objectId,
        updateData,
        { new: true, runValidators: true }
      );

      res.status(200).json(updatedObject);
    } catch (error) {
      console.error("Error updating preset object:", error);
      res.status(500).json({
        message: "Failed to update preset object",
      });
    }
  }
);

// DELETE /object/:objectId - Delete preset object (Admin only)
objectRouter.delete(
  "/:objectId",
  authenticateAdmin,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { objectId } = req.params;

      // Find the object
      const object = await ImageObject.findById(objectId);

      if (!object) {
        return res.status(404).json({
          message: "Object not found",
        });
      }

      // Check if it's a preset object (not user-made)
      if (object.isUserMade) {
        return res.status(403).json({
          message:
            "Cannot delete user-made objects. Only preset objects can be deleted.",
        });
      }

      // Delete the object
      await ImageObject.findByIdAndDelete(objectId);

      res.status(200).json({
        message: "Preset object deleted successfully",
        deletedId: objectId,
      });
    } catch (error) {
      console.error("Error deleting preset object:", error);
      res.status(500).json({
        message: "Failed to delete preset object",
      });
    }
  }
);
