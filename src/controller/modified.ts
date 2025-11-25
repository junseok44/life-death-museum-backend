import { Router, Request, Response, NextFunction } from "express";
import { authenticateJWT } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { ModifiedService } from "../services/modifiedService";
import {
  createModifiedSchema,
  updateModifiedSchema,
  type CreateModifiedBody,
  type UpdateModifiedBody,
  type UpdateModifiedParams,
} from "../validators/modified.validator";

export const modifiedRouter = Router();

// POST /modified - Create modified object
modifiedRouter.post(
  "/",
  authenticateJWT,
  validate(createModifiedSchema),
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const body: CreateModifiedBody = req.body;
      const {
        name,
        imageSrc,
        originalObjectId,
        itemFunction,
        coordinates,
        description,
        isReversed,
        additionalData,
      } = body;
      const userId = req.user!.id;

      // Create modified object using service
      const modified = await ModifiedService.createModified(
        {
          name,
          imageSrc,
          originalObjectId,
          itemFunction,
          coordinates,
          description,
          isReversed,
          additionalData,
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
  validate(updateModifiedSchema),
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const params: UpdateModifiedParams = req.params as UpdateModifiedParams;
      const { id } = params;
      const userId = req.user!.id;
      const body: UpdateModifiedBody = req.body;
      const {
        name,
        description,
        itemFunction,
        additionalData,
        coordinates,
        imageSrc,
        isReversed,
      } = body;

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
