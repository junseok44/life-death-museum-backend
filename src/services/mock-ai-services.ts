import {
  TextGeneratorInterface,
  ImageGeneratorInterface,
  ImageGenerationResult,
  ImageOutput,
} from "../types/ai-services";

/**
 * 🧪 Mock implementation of TextGeneratorInterface for testing/development.
 * Returns a simple response based on the prompt.
 */
export class MockTextGenerator implements TextGeneratorInterface {
  async generateText(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      [key: string]: any;
    }
  ): Promise<string> {
    // 간단한 지연 시뮬레이션 (실제 API 호출 느낌)
    await new Promise((resolve) => setTimeout(resolve, 100));

    const model = options?.model || "mock-model";
    const temperature = options?.temperature ?? 0.7;

    return `[Mock Text Generation]
모델: ${model}
Temperature: ${temperature}
프롬프트: "${prompt}"

이것은 mock 응답입니다. 실제 AI 서비스로 교체하면 실제 생성된 텍스트가 반환됩니다.`;
  }
}

/**
 * 🧪 Mock implementation of ImageGeneratorInterface for testing/development.
 * Returns a placeholder image URL or base64 data.
 */
export class MockImageGenerator implements ImageGeneratorInterface {
  async generateImage(
    prompt: string,
    options?: {
      size?: string;
      n?: number;
      model?: string;
      [key: string]: any;
    }
  ): Promise<ImageGenerationResult> {
    // 간단한 지연 시뮬레이션 (실제 API 호출 느낌)
    await new Promise((resolve) => setTimeout(resolve, 200));

    const size = options?.size || "1024x1024";
    const n = options?.n || 1;
    const model = options?.model || "mock-dall-e";

    // 더미 이미지 데이터 생성 (1x1 투명 PNG의 base64)
    const dummyBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const images: ImageOutput[] = [];
    for (let i = 0; i < n; i++) {
      images.push({
        url: `https://via.placeholder.com/${size}?text=Mock+Image+${i + 1}`,
        b64_json: dummyBase64,
      });
    }

    return {
      data: images,
      created: Math.floor(Date.now() / 1000),
    };
  }
}
