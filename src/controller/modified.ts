import { Router, Request, Response, NextFunction } from "express";
import { authenticateJWT } from "../middleware/auth";
import { ModifiedService } from "../services/modifiedService";

export const modifiedRouter = Router();

// POST /modified - Create modified object
modifiedRouter.post(
  "/",
  authenticateJWT,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const {
        name,
        imageSrc,
        itemFunction,
        coordinates,
        imageSets,
        description,
        isReversed,
      } = req.body;
      const userId = req.user!.id;

      // Validate required fields
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          message: "name field is required and must be a non-empty string",
        });
      }

      if (!imageSrc || typeof imageSrc !== "string") {
        return res.status(400).json({
          message: "imageSrc field is required and must be a string",
        });
      }

      if (itemFunction === undefined) {
        return res.status(400).json({
          message: "itemFunction field is required",
        });
      }

      if (
        itemFunction !== null &&
        !["Gallery", "Link", "Board"].includes(itemFunction)
      ) {
        return res.status(400).json({
          message:
            'itemFunction must be one of: "Gallery", "Link", "Board", or null',
        });
      }

      if (!coordinates || typeof coordinates !== "object") {
        return res.status(400).json({
          message: "coordinates field is required and must be an object",
        });
      }

      if (
        typeof coordinates.x !== "number" ||
        typeof coordinates.y !== "number"
      ) {
        return res.status(400).json({
          message:
            "coordinates.x and coordinates.y are required and must be numbers",
        });
      }

      // Validate isReversed if provided
      if (isReversed !== undefined && typeof isReversed !== "boolean") {
        return res.status(400).json({
          message: "isReversed must be a boolean",
        });
      }

      // Validate imageSets if provided
      if (imageSets !== undefined) {
        if (!Array.isArray(imageSets)) {
          return res.status(400).json({
            message: "imageSets must be an array",
          });
        }

        // Validate each imageSet if array is not empty
        for (let i = 0; i < imageSets.length; i++) {
          const imageSet = imageSets[i];
          if (!imageSet || typeof imageSet !== "object") {
            return res.status(400).json({
              message: `imageSets[${i}] must be an object`,
            });
          }
          if (
            !imageSet.name ||
            typeof imageSet.name !== "string" ||
            imageSet.name.trim().length === 0
          ) {
            return res.status(400).json({
              message: `imageSets[${i}].name is required and must be a non-empty string`,
            });
          }
          if (
            !imageSet.color ||
            typeof imageSet.color !== "string" ||
            imageSet.color.trim().length === 0
          ) {
            return res.status(400).json({
              message: `imageSets[${i}].color is required and must be a non-empty string`,
            });
          }
          if (
            !imageSet.src ||
            typeof imageSet.src !== "string" ||
            imageSet.src.trim().length === 0
          ) {
            return res.status(400).json({
              message: `imageSets[${i}].src is required and must be a non-empty string`,
            });
          }
        }
      }

      // Create modified object using service
      const modified = await ModifiedService.createModified(
        {
          name,
          imageSrc,
          itemFunction,
          coordinates,
          imageSets,
          description,
          isReversed,
        },
        userId
      );

      res.status(201).json(modified);
    } catch (error) {
      console.error("Error creating modified object:", error);
      res.status(500).json({
        message: "Failed to create modified object",
      });
    }
  }
);

// PATCH /modified/:id - Update modified object
modifiedRouter.patch(
  "/:id",
  authenticateJWT,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const {
        name,
        description,
        itemFunction,
        additionalData,
        coordinates,
        imageSrc,
        imageSets,
        isReversed,
      } = req.body;

      // Check if request body is empty
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
          message: "Request body cannot be empty",
        });
      }

      // imageSets cannot be updated via PATCH endpoint
      if (imageSets !== undefined) {
        return res.status(400).json({
          message:
            "imageSets cannot be updated. Please create a new modified object instead.",
        });
      }

      // Validate coordinates if provided
      if (coordinates !== undefined) {
        if (typeof coordinates !== "object") {
          return res.status(400).json({
            message: "coordinates must be an object",
          });
        }
        if (
          typeof coordinates.x !== "number" ||
          typeof coordinates.y !== "number"
        ) {
          return res.status(400).json({
            message:
              "coordinates.x and coordinates.y are required and must be numbers",
          });
        }
      }

      // Validate itemFunction if provided
      if (itemFunction !== undefined) {
        if (
          itemFunction !== null &&
          !["Gallery", "Link", "Board"].includes(itemFunction)
        ) {
          return res.status(400).json({
            message:
              'itemFunction must be one of: "Gallery", "Link", "Board", or null',
          });
        }
      }

      // Validate isReversed if provided
      if (isReversed !== undefined && typeof isReversed !== "boolean") {
        return res.status(400).json({
          message: "isReversed must be a boolean",
        });
      }

      // Update modified object using service
      const updatedModified = await ModifiedService.updateModified(
        id,
        {
          name,
          description,
          itemFunction,
          additionalData,
          coordinates,
          imageSrc,
          imageSets,
          isReversed,
        },
        userId
      );

      res.status(200).json(updatedModified);
    } catch (error) {
      console.error("Error updating modified object:", error);
      if (error instanceof Error) {
        if (error.message === "Modified object not found") {
          return res.status(404).json({
            message: "Modified object not found",
          });
        }
        if (error.message.includes("Forbidden")) {
          return res.status(403).json({
            message: error.message,
          });
        }
        if (
          error.message.includes("imageSrc can only be updated") ||
          error.message.includes("coordinates") ||
          error.message.includes("itemFunction") ||
          error.message.includes("imageSets")
        ) {
          return res.status(400).json({
            message: error.message,
          });
        }
      }
      res.status(500).json({
        message: "Failed to update modified object",
      });
    }
  }
);

// GET /modified - Get all modified objects for authenticated user
modifiedRouter.get(
  "/",
  authenticateJWT,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const userId = req.user!.id;

      // Get all modified objects using service
      const modifiedObjects = await ModifiedService.getAllModified(userId);

      res.status(200).json(modifiedObjects);
    } catch (error) {
      console.error("Error getting modified objects:", error);
      res.status(500).json({
        message: "Failed to get modified objects",
      });
    }
  }
);

// DELETE /modified/:id - Delete modified object
modifiedRouter.delete(
  "/:id",
  authenticateJWT,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Delete modified object using service
      await ModifiedService.deleteModified(id, userId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting modified object:", error);
      if (error instanceof Error) {
        if (error.message === "Modified object not found") {
          return res.status(404).json({
            message: "Modified object not found",
          });
        }
        if (error.message.includes("Forbidden")) {
          return res.status(403).json({
            message: error.message,
          });
        }
      }
      res.status(500).json({
        message: "Failed to delete modified object",
      });
    }
  }
);
