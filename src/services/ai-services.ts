import {
  ImageGeneratorInterface,
  TextGeneratorInterface,
} from "../types/ai-services";
import { GoogleImagenImageGenerator } from "./ai/google-imagen-image-generator";
import { GeminiTextGenerator } from "./ai/gemini-text-generator";

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
  new GoogleImagenImageGenerator(process.env.GOOGLE_GENAI_API_KEY);
