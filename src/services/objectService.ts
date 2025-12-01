import { ImageObject, OnType } from "../models/ObjectModel";
import { User } from "../models/UserModel";
import mongoose from "mongoose";
import { textGenerator, imageGenerator } from "./ai-services";
import { ObjectPrompts } from "../prompts/objectPrompts";
import { storage } from "./storage";
import { ImageConverter } from "../utils/imageConverter";
import { ResponseParser } from "../utils/responseParser";
import { randomBytes } from "crypto";

export interface CreateObjectResult {
  object: ImageObject;
  userId: string;
}

export interface GenerateFollowUpQuestionResult {
  question: string;
}

export interface ImageSetInput {
  name: string;
  color: string;
  file: Express.Multer.File;
}

export interface CreatePresetObjectParams {
  name: string;
  description?: string;
  onType: OnType;
  imageSets: ImageSetInput[];
}

/**
 * Object Service
 * Handles business logic for object creation and AI generation
 */
export class ObjectService {
  /**
   * Generate a follow-up question based on user's Q&A content
   */
  static async generateFollowUpQuestion(
    content: string
  ): Promise<GenerateFollowUpQuestionResult> {
    const prompt = ObjectPrompts.generateFollowUpQuestion(content);

    const followUpQuestion = await textGenerator.generateText(prompt, {
      temperature: 0.7,
    });

    return {
      question: followUpQuestion.trim(),
    };
  }

  /**
   * Create a user-made object from Q&A content
   * Generates name, description, onType, and image using AI
   */
  static async createUserObject(
    content: string,
    userId: string
  ): Promise<CreateObjectResult> {
    // Generate object metadata (name, color, description, onType, visual_prompt) together
    const metadataPrompt = ObjectPrompts.generateObjectMetadata(content);
    const metadataText = await textGenerator.generateText(metadataPrompt, {});

    // Parse JSON response using ResponseParser
    const metadata = ResponseParser.parseJSON(metadataText) as {
      name: string;
      color: string;
      description: string;
      onType: string;
      visual_prompt: string;
    };

    if (
      !metadata ||
      !metadata.name ||
      !metadata.color ||
      !metadata.description ||
      !metadata.onType ||
      !metadata.visual_prompt
    ) {
      throw new Error("Failed to parse object metadata from AI response");
    }

    const { name, color, description, onType, visual_prompt } = metadata;

    // Generate image prompt using visual_prompt
    const imagePrompt = ObjectPrompts.generateImagePrompt(visual_prompt);

    // Generate image
    const imageResult = await imageGenerator.generateImage(imagePrompt.trim(), {
      size: "1024x1024",
      n: 1,
    });

    const imageData = imageResult.data[0]?.b64_json || imageResult.data[0]?.url;

    if (!imageData) {
      throw new Error("Failed to generate image from AI response");
    }

    // Convert image data (URL or base64) to Buffer
    const { buffer, mimeType } = await ImageConverter.toBuffer(imageData);

    // Upload image to storage (랜덤 문자열로 고유성 보장)
    const randomId = randomBytes(8).toString("hex"); // 16자리 hex 문자열
    const imagePath = `objects/${userId}/${randomId}.png`;
    const imageUrl = await storage.uploadFromBuffer(
      buffer,
      imagePath,
      mimeType
    );

    // Generate image sets (variations) - for now, create a single default set
    // Use color from metadata
    const imageSets = [
      {
        name: "Default",
        color: color,
        src: imageUrl,
      },
    ];

    // Create new object
    const newObject = new ImageObject({
      name: name.trim(),
      description: description.trim(),
      currentImageSet: imageSets[0],
      imageSets,
      isUserMade: true,
      onType: onType,
    });

    const savedObject = await newObject.save();

    return {
      object: savedObject,
      userId,
    };
  }

  /**
   * Add an object to user's inventory
   * Adds objectId to user's objectIds array and increments questionIndex
   */
  static async addObjectToInventory(
    objectId: string,
    userId: string
  ): Promise<void> {
    // Verify object exists and is user-made
    const object = await ImageObject.findById(objectId).exec();
    if (!object) {
      throw new Error("Object not found");
    }
    if (!object.isUserMade) {
      throw new Error("Only user-made objects can be added to inventory");
    }

    // Check if object is already in user's inventory
    const user = await User.findById(userId).exec();
    if (!user) {
      throw new Error("User not found");
    }
    const objectIdString = String(object._id);
    if (
      user.objectIds &&
      user.objectIds.some((id) => id.toString() === objectIdString)
    ) {
      throw new Error("Object is already in user's inventory");
    }

    // Add object to user's inventory and increment questionIndex
    await User.findByIdAndUpdate(userId, {
      $push: { objectIds: object._id as mongoose.Types.ObjectId },
      $inc: {
        questionIndex: 1,
      },
    });
  }

  /**
   * Create a preset object from uploaded files
   */
  static async createBasicObject(
    params: CreatePresetObjectParams
  ): Promise<ImageObject> {
    const { name, description, onType, imageSets } = params;

    // 랜덤 문자열로 고유성 보장 (같은 오브젝트의 파일들은 공통 prefix 사용)
    const randomPrefix = randomBytes(8).toString("hex"); // 16자리 hex 문자열

    // Upload all images to storage
    const uploadedImageSets = await Promise.all(
      imageSets.map(async (set, index) => {
        const fileExtension = set.file.originalname.split(".").pop() || "png";
        // 파일명: randomPrefix-index
        const path = `presets/${randomPrefix}-${index}.${fileExtension}`;
        const url = await storage.uploadFromBuffer(
          set.file.buffer,
          path,
          set.file.mimetype || "image/png"
        );

        return {
          name: set.name,
          color: set.color,
          src: url,
        };
      })
    );

    // Use first image as currentImageSet
    const currentImageSet = uploadedImageSets[0];

    // Create preset object
    const newObject = new ImageObject({
      name: name.trim(),
      currentImageSet,
      description: description?.trim(),
      imageSets: uploadedImageSets,
      isUserMade: false,
      onType,
    });

    const savedObject = await newObject.save();

    return savedObject;
  }
}
