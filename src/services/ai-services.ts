import {
  TextGeneratorInterface,
  ImageGeneratorInterface,
  ThemeAnalyzerInterface,
} from "../types/ai-services";
import { MockTextGenerator, MockImageGenerator, MockThemeAnalyzer } from "./mock-ai-services";
import { OpenAIThemeAnalyzer } from "./openai-theme-analyzer";

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

/**
 * Theme analysis service instance
 *
 * Automatically chooses between OpenAI and Mock implementation based on API key availability
 */
export const themeAnalyzer: ThemeAnalyzerInterface = process.env.OPENAI_API_KEY 
  ? new OpenAIThemeAnalyzer(process.env.OPENAI_API_KEY)
  : (() => {
      console.warn('⚠️  OpenAI API key not found. Using mock theme analysis mode.');
      return new MockThemeAnalyzer();
    })();
