import {
  TextGeneratorInterface,
  ImageGeneratorInterface,
  ThemeAnalyzerInterface,
  ImageGenerationResult,
  ImageOutput,
  ThemeAnalysisResult,
  OnboardingResponse,
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

/**
 * 🧪 Mock implementation of ThemeAnalyzerInterface for testing/development.
 * Uses rule-based analysis to determine theme based on keywords.
 */
export class MockThemeAnalyzer implements ThemeAnalyzerInterface {
  async analyzeResponses(responses: OnboardingResponse[]): Promise<ThemeAnalysisResult> {
    // 간단한 지연 시뮬레이션 (실제 API 호출 느낌)
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Validate input
    if (!responses || responses.length !== 5) {
      throw new Error('Exactly 5 onboarding responses are required');
    }

    // Simple rule-based analysis based on keywords
    const allAnswers = responses.map(r => r.answer.toLowerCase()).join(' ');
    
    // Theme scoring based on keywords
    const themeScores = {
      1: 0, // 동심파 - 순수함, 가족애, 따뜻함
      2: 0, // 낭만파 - 감성, 예술, 사랑
      3: 0, // 도시파 - 자립심, 열정, 세련됨
      4: 0, // 자연파 - 자연, 소박함, 평온함
      5: 0  // 기억파 - 추억, 그리움, 연결
    };

    // 동심파 keywords
    if (allAnswers.includes('가족') || allAnswers.includes('따뜻') || allAnswers.includes('순수')) {
      themeScores[1] += 2;
    }

    // 낭만파 keywords
    if (allAnswers.includes('사랑') || allAnswers.includes('감성') || allAnswers.includes('예술')) {
      themeScores[2] += 2;
    }

    // 도시파 keywords
    if (allAnswers.includes('성공') || allAnswers.includes('열정') || allAnswers.includes('성장')) {
      themeScores[3] += 2;
    }

    // 자연파 keywords
    if (allAnswers.includes('자연') || allAnswers.includes('평화') || allAnswers.includes('단순')) {
      themeScores[4] += 2;
    }

    // 기억파 keywords
    if (allAnswers.includes('추억') || allAnswers.includes('기억') || allAnswers.includes('그리움')) {
      themeScores[5] += 2;
    }

    // Find the theme with highest score
    const bestTheme = Object.entries(themeScores).reduce((a, b) => 
      themeScores[parseInt(a[0]) as keyof typeof themeScores] > themeScores[parseInt(b[0]) as keyof typeof themeScores] ? a : b
    )[0];

    const choice = parseInt(bestTheme);
    
    // Generate appropriate reason based on theme
    const reasons = {
      1: "따뜻한 마음을 간직한 당신에게는, 이 테마가 잘 어울릴 것 같아요.",
      2: "감성이 풍부한 당신에게는, 이 테마가 잘 어울릴 것 같아요.",
      3: "열정적이고 진취적인 당신에게는, 이 테마가 잘 어울릴 것 같아요.",
      4: "평온함을 추구하는 당신에게는, 이 테마가 잘 어울릴 것 같아요.",
      5: "소중한 추억을 간직한 당신에게는, 이 테마가 잘 어울릴 것 같아요."
    };

    console.log('🧪 Mock Theme Analysis:', { choice, allAnswers: allAnswers.substring(0, 100) });

    return {
      choice,
      reason: reasons[choice as keyof typeof reasons]
    };
  }

  getThemeInfo(themeId: number): { 
    name: string; 
    characteristics: string[]; 
    description: string; 
  } {
    const themes = {
      1: {
        name: "동심파",
        characteristics: ["순수함", "가족애", "따뜻함"],
        description: "어린 시절의 추억과 가족과의 유대감을 중시하는 따뜻하고 순수한 마음"
      },
      2: {
        name: "낭만파",
        characteristics: ["감성", "예술", "사랑"],
        description: "감성적이고 예술적인 표현을 통해 사랑과 낭만을 삶의 중요한 가치로 여기는 성향"
      },
      3: {
        name: "도시파",
        characteristics: ["자립심", "열정", "세련됨"],
        description: "주체적이고 열정적인 태도로 현대적이고 세련된 감각을 추구하며 성취를 중시하는 성향"
      },
      4: {
        name: "자연파",
        characteristics: ["자연", "소박함", "평온함"],
        description: "복잡함보다는 단순함을 추구하며 자연 속에서의 평화와 여유로운 삶을 지향하는 성향"
      },
      5: {
        name: "기억파",
        characteristics: ["추억", "그리움", "연결"],
        description: "과거의 인연을 소중히 여기고 깊은 그리움과 사람 간의 연결을 강조하는 성향"
      }
    };

    return themes[themeId as keyof typeof themes] || themes[1];
  }
}
