import { ModifiedObject, ModifiedObjectModel } from "../models/ModifiedObject";
import { ImageObject, ImageSet } from "../models/ObjectModel";
import { User } from "../models/UserModel";

export interface CreateModifiedParams {
  name: string;
  imageSrc: string;
  itemFunction: "Gallery" | "Link" | "Board" | null;
  coordinates: {
    x: number;
    y: number;
  };
  originalObjectId: string;
  description?: string;
  isReversed?: boolean;
  additionalData?: unknown;
}

export interface UpdateModifiedParams {
  name?: string;
  description?: string;
  itemFunction?: "Gallery" | "Link" | "Board" | null;
  additionalData?: unknown;
  coordinates?: {
    x: number;
    y: number;
  };
  imageSrc?: string;
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
      imageSrc,
      itemFunction,
      coordinates,
      description,
      isReversed,
      originalObjectId,
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

    const originalImageSetsWithoutId = originalObject.imageSets.map((set) => ({
      name: set.name,
      color: set.color,
      src: set.src,
    }));

    // Create new modified object
    const newModified = new ModifiedObjectModel({
      name: name.trim(),
      imageSrc,
      description: description?.trim(),
      itemFunction: itemFunction ?? null,
      coordinates,
      isReversed: isReversed ?? false,
      isUserMade: originalObject.isUserMade,
      onType: originalObject.onType,
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
    if (params.additionalData !== undefined) {
      modified.additionalData = params.additionalData;
    }
    if (params.coordinates !== undefined) {
      modified.coordinates = params.coordinates;
    }
    if (params.imageSrc !== undefined) {
      modified.imageSrc = params.imageSrc;
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
