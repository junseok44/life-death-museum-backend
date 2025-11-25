import { ImageObject } from "../models/ObjectModel";
import { User } from "../models/UserModel";
import { textGenerator, imageGenerator } from "./ai-services";
import { ObjectPrompts } from "../prompts/objectPrompts";
import { storage } from "./storage";
import { ImageConverter } from "../utils/imageConverter";
import { ResponseParser } from "../utils/responseParser";

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
  onType: "LeftWall" | "RightWall" | "Floor";
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
    // Generate object metadata (name, description, onType) together
    const metadataPrompt = ObjectPrompts.generateObjectMetadata(content);
    const metadataText = await textGenerator.generateText(metadataPrompt, {
      temperature: 0.7,
    });

    // Parse JSON response using ResponseParser
    const metadata = ResponseParser.parseJSON(metadataText) as {
      name: string;
      description: string;
      onType: "LeftWall" | "RightWall" | "Floor";
    };

    if (
      !metadata ||
      !metadata.name ||
      !metadata.description ||
      !metadata.onType
    ) {
      throw new Error("Failed to parse object metadata from AI response");
    }

    const { name, description, onType } = metadata;
    // Generate image prompt using metadata
    const imagePrompt = ObjectPrompts.generateImagePrompt(
      content,
      name,
      description,
      onType
    );

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

    // Upload image to storage
    const imagePath = `objects/${userId}/${Date.now()}.png`;
    const imageUrl = await storage.uploadFromBuffer(
      buffer,
      imagePath,
      mimeType
    );

    // Generate image sets (variations) - for now, create a single default set
    const imageSets = [
      {
        name: "Default",
        color: "#ffffff",
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
      onType,
    });

    const savedObject = await newObject.save();

    // Update user's objectIds and questionIndex
    await User.findByIdAndUpdate(userId, {
      $push: { objectIds: savedObject._id },
      $inc: {
        questionIndex: 1,
      },
    });

    return {
      object: savedObject,
      userId,
    };
  }

  /**
   * Create a preset object from uploaded files
   */
  static async createBasicObject(
    params: CreatePresetObjectParams
  ): Promise<ImageObject> {
    const { name, description, onType, imageSets } = params;

    // Upload all images to storage
    const uploadedImageSets = await Promise.all(
      imageSets.map(async (set, index) => {
        const fileExtension = set.file.originalname.split(".").pop() || "png";
        const path = `presets/${Date.now()}-${index}-${set.name}.${fileExtension}`;
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
