import OpenAI from "openai";
import {
  ImageGeneratorInterface,
  ImageGenerationResult,
} from "../types/ai-services";

/**
 * 🤖 OpenAI implementation of ImageGeneratorInterface.
 * Uses GPT-Image models (gpt-image-1) for image generation.
 */
export class OpenAIImageGenerator implements ImageGeneratorInterface {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
    console.log("🤖 OpenAI Image Generator initialized (gpt-image-1)");
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
      const model =
        options?.model ||
        process.env.OPENAI_IMAGE_MODEL_DEFAULT ||
        "gpt-image-1";
      const size = (options?.size || "1024x1024") as
        | "1024x1024"
        | "1792x1024"
        | "1024x1792";
      const n = options?.n ?? 1;

      // size, n, model은 이미 위에서 처리했으므로 options에서 제거하고 나머지만 전달
      const {
        size: _ignoredSize,
        n: _ignoredN,
        model: _ignoredModel,
        ...restOptions
      } = options ?? {};

      const response = await this.openai.images.generate({
        model,
        prompt,
        n,
        size,
        background: "transparent",
        // 새 API에서 추가된 옵션들: 필요 시 options에서 override 가능
        // 투명 배경/고품질 기본값
        ...restOptions,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("No image data from OpenAI");
      }

      return {
        data: response.data.map((img) => ({
          url: (img as any).url,
          b64_json: (img as any).b64_json,
        })),
        created: response.created ?? Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      console.error("❌ OpenAI Image Generation Error:", error);
      throw error;
    }
  }
}
