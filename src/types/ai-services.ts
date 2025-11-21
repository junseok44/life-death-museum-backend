/**
 * 🖼️ Defines the basic structure of image generation results.
 * Can be extended to match actual AI API responses.
 */
interface ImageOutput {
  /**
   * Temporary URL of the generated image (e.g., DALL-E)
   * Either Base64 data or URL will always be included.
   */
  url?: string;

  /**
   * Base64-encoded image data string (useful for direct storage in file storage)
   */
  b64_json?: string;
}

/**
 * Final response structure for image generation requests.
 */
interface ImageGenerationResult {
  /**
   * Array of generated images (for cases where n >= 1)
   */
  data: ImageOutput[];

  /**
   * Unix timestamp of when the request was created
   */
  created: number;
}

// --- 1. Text Generation Interface ---

interface TextGeneratorInterface {
  /**
   * Generates text based on the given prompt.
   * @param prompt User-input text prompt
   * @param options Additional API-specific settings such as model, temperature, etc.
   * @returns Promise containing the generated text string
   */
  generateText(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      [key: string]: any;
    }
  ): Promise<string>;
}

// --- 2. Image Generation Interface ---

interface ImageGeneratorInterface {
  /**
   * Generates an image based on the given prompt.
   * @param prompt User-input image description prompt
   * @param options Additional API-specific settings such as image size, count (n), etc.
   * @returns Promise containing image URL or Base64 data
   */
  generateImage(
    prompt: string,
    options?: {
      size?: string; // e.g., "1024x1024", "1792x1024"
      n?: number; // Number of images to generate (DALL-E 3 is limited to 1)
      model?: string; // e.g., "dall-e-3"
      [key: string]: any;
    }
  ): Promise<ImageGenerationResult>;
}

export {
  TextGeneratorInterface,
  ImageGeneratorInterface,
  ImageGenerationResult,
  ImageOutput,
};
