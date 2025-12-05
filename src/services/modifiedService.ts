import { ModifiedObject, ModifiedObjectModel } from "../models/ModifiedObject";
import { ImageObject, ImageSet, OnType } from "../models/ObjectModel";
import { User } from "../models/UserModel";
import { ItemFunction } from "../types";

export interface CreateModifiedParams {
  name: string;
  currentImageSetId: string;
  itemFunction: ItemFunction | null;
  coordinates: {
    x: number;
    y: number;
  };
  originalObjectId: string;
  onType: OnType;
  description?: string;
  isReversed?: boolean;
  additionalData?: unknown;
}

export interface UpdateModifiedParams {
  name?: string;
  description?: string;
  currentImageSetId?: string;
  itemFunction?: "Gallery" | "Link" | "Board" | null;
  onType?: OnType;
  additionalData?: unknown;
  coordinates?: {
    x: number;
    y: number;
  };
  imageSets?: ImageSet[];
  isReversed?: boolean;
}

/**
 * Modified Service
 * Handles business logic for modified object operations
 */
export class ModifiedService {
  /**
   * Create a new modified object
   */
  static async createModified(
    params: CreateModifiedParams,
    userId: string
  ): Promise<ModifiedObject> {
    const {
      name,
      currentImageSetId,
      itemFunction,
      coordinates,
      description,
      isReversed,
      originalObjectId,
      onType,
      additionalData,
    } = params;

    const originalObject = await ImageObject.findById(originalObjectId).exec();

    if (!originalObject) {
      throw new Error("Original object not found");
    }

    // imageSets 검증 및 _id 제거
    if (!originalObject.imageSets || originalObject.imageSets.length === 0) {
      throw new Error("Original object has no imageSets");
    }

    const currentImageSet = originalObject.imageSets.find(
      (set) => set._id?.toString() === currentImageSetId
    );

    if (!currentImageSet) {
      throw new Error("Current image set not found");
    }

    const { _id, ...currentImageSetWithoutId } = currentImageSet;

    const originalImageSetsWithoutId = originalObject.imageSets.map((set) => ({
      name: set.name,
      color: set.color,
      src: set.src,
    }));

    // Create new modified object
    const newModified = new ModifiedObjectModel({
      name: name.trim(),
      currentImageSet: currentImageSetWithoutId,
      description: description?.trim(),
      itemFunction: itemFunction ?? null,
      coordinates,
      isReversed: isReversed ?? false,
      isUserMade: originalObject.isUserMade,
      onType: onType,
      imageSets: originalImageSetsWithoutId,
      additionalData: additionalData ?? {},
    });

    const savedModified = await newModified.save();

    // Update user's modifiedObjectIds
    await User.findByIdAndUpdate(userId, {
      $push: { modifiedObjectIds: savedModified._id },
    });

    return savedModified;
  }

  /**
   * Update an existing modified object
   */
  static async updateModified(
    modifiedId: string,
    params: UpdateModifiedParams,
    userId: string
  ): Promise<ModifiedObject> {
    const modified = await ModifiedObjectModel.findById(modifiedId).exec();

    if (!modified) {
      throw new Error("Modified object not found");
    }

    // Check if user owns this modified object
    const user = await User.findById(userId).exec();
    if (!user || !user.modifiedObjectIds.includes(modified._id)) {
      throw new Error(
        "Forbidden: You don't have permission to update this object"
      );
    }

    // imageSets cannot be updated via updateModified
    if (params.imageSets !== undefined) {
      throw new Error(
        "imageSets cannot be updated. Please create a new modified object instead."
      );
    }

    // Validate additionalData based on itemFunction
    const targetItemFunction = params.itemFunction ?? modified.itemFunction;

    // If itemFunction is being set to Link or Board, additionalData is required
    if (params.itemFunction === ItemFunction.Link || params.itemFunction === ItemFunction.Board) {
      if (params.additionalData === undefined || params.additionalData === null) {
        throw new Error(
          `additionalData is required when itemFunction is ${params.itemFunction}`
        );
      }
    }

    if (params.additionalData !== undefined) {
      if (targetItemFunction === ItemFunction.Link) {
        // Validate Link format
        if (
          typeof params.additionalData !== "object" ||
          params.additionalData === null ||
          !("link" in params.additionalData) ||
          typeof params.additionalData.link !== "string" ||
          params.additionalData.link.trim().length === 0
        ) {
          throw new Error(
            "Invalid additionalData for Link: must have 'link' field as non-empty string"
          );
        }
      } else if (targetItemFunction === ItemFunction.Board) {
        // Validate Board format
        if (
          typeof params.additionalData !== "object" ||
          params.additionalData === null ||
          !("data" in params.additionalData)
        ) {
          throw new Error(
            "Invalid additionalData for Board: must have 'data' field"
          );
        }

        const boardData = params.additionalData.data;
        if (
          typeof boardData !== "object" ||
          boardData === null ||
          !("title" in boardData) ||
          !("description" in boardData) ||
          !("items" in boardData) ||
          !Array.isArray(boardData.items)
        ) {
          throw new Error(
            "Invalid additionalData for Board: 'data' must have 'title', 'description', and 'items' fields"
          );
        }

        // Validate each item in items array
        for (let i = 0; i < boardData.items.length; i++) {
          const item = boardData.items[i];
          if (
            typeof item !== "object" ||
            item === null ||
            !("writer" in item) ||
            !("text" in item) ||
            !("color" in item) ||
            typeof item.writer !== "string" ||
            item.writer.trim().length === 0 ||
            typeof item.text !== "string" ||
            item.text.trim().length === 0 ||
            typeof item.color !== "string" ||
            item.color.trim().length === 0
          ) {
            throw new Error(
              `Invalid additionalData for Board: items[${i}] must have 'writer', 'text', and 'color' as non-empty strings`
            );
          }
        }
      } else if (targetItemFunction === null) {
        // null: additionalData should be empty object or undefined
        if (
          typeof params.additionalData === "object" &&
          params.additionalData !== null &&
          Object.keys(params.additionalData).length > 0
        ) {
          throw new Error(
            "additionalData should be empty or undefined when itemFunction is null"
          );
        }
      }
    }

    // Update fields
    if (params.name !== undefined) {
      modified.name = params.name.trim();
    }
    if (params.description !== undefined) {
      modified.description = params.description?.trim();
    }
    if (params.itemFunction !== undefined) {
      modified.itemFunction = params.itemFunction ?? null;
    }
    if (params.onType !== undefined) {
      modified.onType = params.onType;
    }
    if (params.additionalData !== undefined) {
      modified.additionalData = params.additionalData;
    }
    if (params.coordinates !== undefined) {
      modified.coordinates = params.coordinates;
    }
    if (params.currentImageSetId !== undefined) {
      const currentImageSet = modified.imageSets.find(
        (set) => set._id?.toString() === params.currentImageSetId
      );
      if (!currentImageSet) {
        throw new Error("Current image set not found");
      }
      modified.currentImageSet = currentImageSet;
    }
    if (params.isReversed !== undefined) {
      modified.isReversed = params.isReversed;
    }
    // Note: imageSets cannot be updated (checked earlier in the function)

    const updatedModified = await modified.save();
    return updatedModified;
  }

  /**
   * Get all modified objects for a user
   */
  static async getAllModified(userId: string): Promise<ModifiedObject[]> {
    const user = await User.findById(userId).exec();

    if (!user) {
      throw new Error("User not found");
    }

    // If user has no modified objects, return empty array
    if (!user.modifiedObjectIds || user.modifiedObjectIds.length === 0) {
      return [];
    }

    // Fetch modified objects using user's modifiedObjectIds
    const modifiedObjects = await ModifiedObjectModel.find({
      _id: { $in: user.modifiedObjectIds },
    })
      .sort({ createdAt: -1 })
      .exec();

    return modifiedObjects;
  }

  /**
   * Delete a modified object
   */
  static async deleteModified(
    modifiedId: string,
    userId: string
  ): Promise<void> {
    const modified = await ModifiedObjectModel.findById(modifiedId).exec();

    if (!modified) {
      throw new Error("Modified object not found");
    }

    // Check if user owns this modified object
    const user = await User.findById(userId).exec();
    if (!user || !user.modifiedObjectIds.includes(modified._id)) {
      throw new Error(
        "Forbidden: You don't have permission to delete this object"
      );
    }

    // Remove from user's modifiedObjectIds
    await User.findByIdAndUpdate(userId, {
      $pull: { modifiedObjectIds: modified._id },
    });

    // Delete the modified object
    await ModifiedObjectModel.findByIdAndDelete(modifiedId).exec();
  }
}
