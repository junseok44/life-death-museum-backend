import {
  ImageGeneratorInterface,
  TextGeneratorInterface,
} from "../../types/ai-services";
import { GeminiTextGenerator } from "./gemini-text-generator";
import { GoogleImagenFallbackImageGenerator } from "./google-imagen-fallback-image-generator";

/**
 * Text generation service instance
 * Uses Gemini 2.5 Flash (requires GOOGLE_GENAI_API_KEY)
 */
export const textGenerator: TextGeneratorInterface = new GeminiTextGenerator();

/**
 * Image generation service instance
 * Uses Google Imagen with automatic fallback (fast -> standard -> ultra) to handle quota limits
 */
export const imageGenerator: ImageGeneratorInterface =
  new GoogleImagenFallbackImageGenerator(
    process.env.GOOGLE_GENAI_API_KEY || ""
  );
