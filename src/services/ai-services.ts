import {
  TextGeneratorInterface,
  ImageGeneratorInterface,
} from "../types/ai-services";
import { MockTextGenerator, MockImageGenerator } from "./mock-ai-services";

// TODO: When replacing with actual implementation, change the imports below and modify the instance initialization.
// Example:
// import { OpenAITextGenerator } from './openai-text-generator';
// import { OpenAIImageGenerator } from './openai-image-generator';

/**
 * Text generation service instance
 *
 * To replace with actual implementation:
 * 1. Import the actual implementation class
 * 2. Replace textGenerator below with the actual implementation instance
 */
export const textGenerator: TextGeneratorInterface = new MockTextGenerator();

/**
 * Image generation service instance
 *
 * To replace with actual implementation:
 * 1. Import the actual implementation class
 * 2. Replace imageGenerator below with the actual implementation instance
 */
export const imageGenerator: ImageGeneratorInterface = new MockImageGenerator();
