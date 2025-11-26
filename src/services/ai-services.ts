import {
  TextGeneratorInterface,
  ImageGeneratorInterface,
} from "../types/ai-services";
import { MockTextGenerator, MockImageGenerator } from "./mock-ai-services";
import { OpenAITextGenerator } from "./openai-text-generator";
import { OpenAIImageGenerator } from "./openai-image-generator";

/**
 * Text generation service instance
 * Automatically chooses between OpenAI and Mock implementation based on API key availability
 */
export const textGenerator: TextGeneratorInterface = process.env.OPENAI_API_KEY
  ? new OpenAITextGenerator(process.env.OPENAI_API_KEY)
  : (() => {
      console.warn('⚠️  OpenAI API key not found. Using mock text generation mode.');
      return new MockTextGenerator();
    })();

/**
 * Image generation service instance
 * Automatically chooses between OpenAI and Mock implementation based on API key availability
 */
export const imageGenerator: ImageGeneratorInterface = process.env.OPENAI_API_KEY
  ? new OpenAIImageGenerator(process.env.OPENAI_API_KEY)
  : (() => {
      console.warn('⚠️  OpenAI API key not found. Using mock image generation mode.');
      return new MockImageGenerator();
    })();
