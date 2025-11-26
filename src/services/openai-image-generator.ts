import OpenAI from 'openai';
import { ImageGeneratorInterface, ImageGenerationResult } from '../types/ai-services';

/**
 * 🤖 OpenAI implementation of ImageGeneratorInterface.
 * Uses DALL-E models for image generation.
 */
export class OpenAIImageGenerator implements ImageGeneratorInterface {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    console.log('🤖 OpenAI Image Generator initialized');
  }

  async generateImage(
    prompt: string,
    options?: {
      size?: string;
      n?: number;
      model?: string;
      [key: string]: any;
    }
  ): Promise<ImageGenerationResult> {
    try {
      const model = options?.model || 'dall-e-3';
      const size = options?.size || '1024x1024';
      const n = options?.n || 1;

      const response = await this.openai.images.generate({
        model,
        prompt,
        n,
        size: size as '1024x1024' | '1792x1024' | '1024x1792',
      });

      if (!response.data) {
        throw new Error('No image data from OpenAI');
      }

      return {
        data: response.data.map(img => ({
          url: img.url,
          b64_json: img.b64_json
        })),
        created: response.created
      };
    } catch (error) {
      console.error('❌ OpenAI Image Generation Error:', error);
      throw error;
    }
  }
}
