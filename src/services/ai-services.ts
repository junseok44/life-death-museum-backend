import {
  ImageGeneratorInterface,
  TextGeneratorInterface,
} from "../types/ai-services";
import { GoogleImagenImageGenerator } from "./ai/google-imagen-image-generator";
import { MockTextGenerator } from "./mock-ai-services";
import { OpenAITextGenerator } from "./openai-text-generator";

/**
 * Text generation service instance
 * Automatically chooses between OpenAI and Mock implementation based on API key availability
 */
export const textGenerator: TextGeneratorInterface = process.env.OPENAI_API_KEY
  ? new OpenAITextGenerator(process.env.OPENAI_API_KEY)
  : (() => {
      console.warn(
        "⚠️  OpenAI API key not found. Using mock text generation mode."
      );
      return new MockTextGenerator();
    })();

/**
 * Image generation service instance
 * Automatically chooses between OpenAI and Mock implementation based on API key availability
 */
export const imageGenerator: ImageGeneratorInterface =
  new GoogleImagenImageGenerator(process.env.GOOGLE_GENAI_API_KEY);
