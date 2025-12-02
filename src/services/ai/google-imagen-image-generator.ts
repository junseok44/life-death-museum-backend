import { GoogleGenAI } from "@google/genai";
import {
  ImageGeneratorInterface,
  ImageGenerationResult,
  ImageOutput,
} from "../../types/ai-services";

/**
 * 🖼️ Google Imagen implementation of ImageGeneratorInterface.
 * Uses `imagen-4.0-generate-001` via @google/genai `generateImages`.
 */
export class GoogleImagenImageGenerator implements ImageGeneratorInterface {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error("Google GenAI API key is required");
    }
    this.ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    console.log("🖼️ Google Imagen Image Generator initialized");
  }

  async generateImage(
    prompt: string,
    options?: {
      size?: string; // e.g., "1024x1024"
      n?: number; // Number of images to generate
      model?: string; // e.g., "imagen-4.0-generate-001"
      [key: string]: unknown;
    }
  ): Promise<ImageGenerationResult> {
    const model = options?.model || "imagen-4.0-generate-001";
    const n = options?.n ?? 1;

    const images: ImageOutput[] = [];

    // Imagen은 generateImages를 통해 이미지를 생성
    const response = await this.ai.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages: n,
        // 필요하다면 size 옵션을 여기서 매핑할 수 있음
      },
    } as any);

    // 응답에서 Base64 이미지 데이터 추출
    for (const generated of response.generatedImages || []) {
      const imgBytes = generated.image?.imageBytes;
      if (imgBytes) {
        images.push({
          b64_json: imgBytes, // 그대로 Base64 문자열로 반환
        });
      }
    }

    if (images.length === 0) {
      throw new Error("No image data from Imagen");
    }

    return {
      data: images,
      created: Math.floor(Date.now() / 1000),
    };
  }
}
