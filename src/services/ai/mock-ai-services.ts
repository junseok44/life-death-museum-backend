import {
  TextGeneratorInterface,
  ImageGeneratorInterface,
  ImageGenerationResult,
  ImageOutput,
} from "../../types/ai-services";

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
    const responseFormat = options?.response_format;

    // If JSON format is requested, check if this is a theme analysis request
    if (responseFormat?.type === 'json_object' && prompt.includes('유저의 응답')) {
      // Simple rule-based theme analysis for mock
      const themeScores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const lowerPrompt = prompt.toLowerCase();
      
      if (lowerPrompt.includes('가족') || lowerPrompt.includes('따뜻')) themeScores[1] += 2;
      if (lowerPrompt.includes('사랑') || lowerPrompt.includes('감성')) themeScores[2] += 2;
      if (lowerPrompt.includes('성공') || lowerPrompt.includes('열정')) themeScores[3] += 2;
      if (lowerPrompt.includes('자연') || lowerPrompt.includes('평화')) themeScores[4] += 2;
      if (lowerPrompt.includes('추억') || lowerPrompt.includes('기억')) themeScores[5] += 2;
      
      const bestTheme = Object.entries(themeScores).reduce((a, b) => 
        themeScores[parseInt(a[0]) as keyof typeof themeScores] > themeScores[parseInt(b[0]) as keyof typeof themeScores] ? a : b
      )[0];
      
      const choice = parseInt(bestTheme);
      const reasons = {
        1: "따뜻한 마음을 간직한 당신에게는, 이 테마가 잘 어울릴 것 같아요.",
        2: "감성이 풍부한 당신에게는, 이 테마가 잘 어울릴 것 같아요.",
        3: "열정적이고 진취적인 당신에게는, 이 테마가 잘 어울릴 것 같아요.",
        4: "평온함을 추구하는 당신에게는, 이 테마가 잘 어울릴 것 같아요.",
        5: "소중한 추억을 간직한 당신에게는, 이 테마가 잘 어울릴 것 같아요."
      };
      
      console.log('🧪 Mock Text Generator - Theme Analysis:', { choice });
      
      return JSON.stringify({
        choice,
        reason: reasons[choice as keyof typeof reasons]
      });
    }

    // Default mock text generation
    return `[Mock Text Generation]
모델: ${model}
Temperature: ${temperature}
프롬프트: "${prompt.substring(0, 50)}..."

이것은 mock 응답입니다. 실제 AI 서비스로 교체하면 실제 생성된 텍스트가 반환됩니다.
{
  "name": "Generated Object",
  "description": "Generated object description",
  "onType": "Floor"
}
`;
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