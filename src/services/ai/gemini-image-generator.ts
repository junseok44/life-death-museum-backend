import { GoogleGenAI } from "@google/genai";
import {
  ImageGeneratorInterface,
  ImageGenerationResult,
  ImageOutput,
} from "../../types/ai-services";

/**
 * 🤖 Google Gemini implementation of ImageGeneratorInterface.
 * Uses Gemini 3 Pro Image Preview model for image generation.
 */
export class GeminiImageGenerator implements ImageGeneratorInterface {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error("Google GenAI API key is required");
    }
    this.ai = new GoogleGenAI({
      apiKey: apiKey || process.env.GOOGLE_GENAI_API_KEY,
    });
    console.log(
      "🤖 Gemini Image Generator initialized (gemini-3-pro-image-preview)"
    );
  }

  async generateImage(
    prompt: string,
    options?: {
      size?: string; // e.g., "1024x1024", "1792x1024"
      n?: number; // Number of images to generate
      model?: string; // e.g., "gemini-3-pro-image-preview"
      aspectRatio?: string; // e.g., "16:9", "1:1", "9:16"
      imageSize?: string; // e.g., "4K", "HD"
      tools?: unknown[];
      [key: string]: unknown;
    }
  ): Promise<ImageGenerationResult> {
    try {
      const model = options?.model || "gemini-3-pro-image-preview";
      const n = options?.n ?? 1;
      const aspectRatio =
        options?.aspectRatio ||
        this.parseSizeToAspectRatio(options?.size) ||
        "16:9";
      const imageSize =
        options?.imageSize || this.parseSizeToImageSize(options?.size) || "4K";

      const images: ImageOutput[] = [];

      // Gemini는 한 번에 하나의 이미지만 생성할 수 있으므로 n번 반복
      for (let i = 0; i < n; i++) {
        const config: {
          imageConfig: {
            aspectRatio: string;
            imageSize: string;
          };
          tools?: Array<{ googleSearch?: Record<string, never> }>;
        } = {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        };

        if (options?.tools) {
          config.tools = options.tools as Array<{
            googleSearch?: Record<string, never>;
          }>;
        }

        const response = await this.ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        // 응답에서 이미지 데이터 추출
        for (const candidate of response.candidates || []) {
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData) {
                const imageData = part.inlineData.data;
                images.push({
                  b64_json: imageData,
                });
              }
            }
          }
        }
      }

      if (images.length === 0) {
        throw new Error("No image data from Gemini");
      }

      return {
        data: images,
        created: Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      console.error("❌ Gemini Image Generation Error:", error);
      throw error;
    }
  }

  /**
   * size 문자열을 aspectRatio로 변환
   * "1024x1024" -> "1:1"
   * "1792x1024" -> "16:9"
   * "1024x1792" -> "9:16"
   */
  private parseSizeToAspectRatio(size?: string): string | undefined {
    if (!size) return undefined;

    const [width, height] = size.split("x").map(Number);
    if (!width || !height) return undefined;

    const ratio = width / height;

    if (Math.abs(ratio - 1) < 0.1) return "1:1";
    if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9";
    if (Math.abs(ratio - 9 / 16) < 0.1) return "9:16";
    if (Math.abs(ratio - 4 / 3) < 0.1) return "4:3";
    if (Math.abs(ratio - 3 / 4) < 0.1) return "3:4";

    // 기본값
    return "16:9";
  }

  /**
   * size 문자열을 imageSize로 변환
   * 해상도에 따라 "4K" 또는 "HD" 반환
   */
  private parseSizeToImageSize(size?: string): string | undefined {
    if (!size) return undefined;

    const [width, height] = size.split("x").map(Number);
    if (!width || !height) return undefined;

    // 4K는 보통 3840x2160 이상
    if (width >= 3840 || height >= 2160) return "4K";

    // 그 외는 HD
    return "HD";
  }
}
