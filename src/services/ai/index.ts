import {
  ImageGeneratorInterface,
  TextGeneratorInterface,
} from "../../types/ai-services";
import { GeminiTextGenerator } from "./gemini-text-generator";
import { GoogleImagenImageGenerator } from "./google-imagen-image-generator";

/**
 * Text generation service instance
 * Uses Gemini 2.5 Flash (requires GOOGLE_GENAI_API_KEY)
 */
export const textGenerator: TextGeneratorInterface = new GeminiTextGenerator();

/**
 * Image generation service instance
 * Automatically chooses between OpenAI and Mock implementation based on API key availability
 */
export const imageGenerator: ImageGeneratorInterface =
  new GoogleImagenImageGenerator(process.env.GOOGLE_GENAI_API_KEY || "");
