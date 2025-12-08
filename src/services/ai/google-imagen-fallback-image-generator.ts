import { GoogleGenAI } from "@google/genai";
import {
  ImageGeneratorInterface,
  ImageGenerationResult,
  ImageOutput,
} from "../../types/ai-services";

/**
 * 🖼️ Google Imagen Fallback implementation of ImageGeneratorInterface.
 * Tries multiple Imagen models in sequence (fast -> standard -> ultra) to handle quota limits.
 * Falls back to the next model if the current one fails.
 */
export class GoogleImagenFallbackImageGenerator
  implements ImageGeneratorInterface
{
  private ai: GoogleGenAI;
  private readonly modelCandidates: string[] = [
    "imagen-4.0-generate-001",
    "imagen-4.0-fast-generate-001",
    "imagen-4.0-ultra-generate-001",
  ];

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error("Google GenAI API key is required");
    }
    this.ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    console.log("🖼️ Google Imagen Fallback Image Generator initialized");
  }

  async generateImage(
    prompt: string,
    options?: {
      size?: string; // e.g., "1024x1024"
      n?: number; // Number of images to generate
      model?: string; // If provided, will be used as the first candidate
      [key: string]: unknown;
    }
  ): Promise<ImageGenerationResult> {
    const n = options?.n ?? 1;
    const customModel = options?.model;

    // 사용자가 모델을 지정한 경우, 그것을 첫 번째 후보로 사용
    const modelsToTry = customModel
      ? [customModel, ...this.modelCandidates.filter((m) => m !== customModel)]
      : this.modelCandidates;

    let lastError: Error | null = null;

    // 각 모델을 순차적으로 시도
    for (const model of modelsToTry) {
      try {
        console.log(`🔄 Trying model: ${model}`);
        const result = await this.tryGenerateWithModel(
          prompt,
          model,
          n,
          options
        );
        console.log(`✅ Success with model: ${model}`);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Model ${model} failed: ${errorMessage}`);
        lastError = error instanceof Error ? error : new Error(String(error));

        // quota 제한 에러인 경우에만 다음 모델로 시도
        // 다른 종류의 에러(예: 잘못된 프롬프트)는 즉시 throw
        if (
          !errorMessage.toLowerCase().includes("quota") &&
          !errorMessage.toLowerCase().includes("rate limit") &&
          !errorMessage.toLowerCase().includes("429")
        ) {
          throw error;
        }
      }
    }

    // 모든 모델이 실패한 경우 마지막 에러를 throw
    throw new Error(
      `All Imagen models failed. Last error: ${lastError?.message || "Unknown error"}`
    );
  }

  /**
   * 특정 모델로 이미지 생성 시도
   */
  private async tryGenerateWithModel(
    prompt: string,
    model: string,
    n: number,
    options?: {
      size?: string;
      [key: string]: unknown;
    }
  ): Promise<ImageGenerationResult> {
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
      throw new Error(`No image data from Imagen model: ${model}`);
    }

    return {
      data: images,
      created: Math.floor(Date.now() / 1000),
    };
  }
}
