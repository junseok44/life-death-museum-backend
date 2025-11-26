import { textGenerator } from './ai-services';

/**
 * Theme analysis result structure
 */
export interface ThemeAnalysisResult {
  choice: number;
  reason: string;
}

/**
 * Onboarding response structure
 */
export interface OnboardingResponse {
  question: string;
  answer: string;
}

/**
 * Theme Analysis Service using the generic TextGeneratorInterface
 * This demonstrates how to use the generic AI services for specific tasks
 */
export class ThemeAnalysisService {
  // System prompt for theme analysis
  private readonly SYSTEM_PROMPT = `# Role
당신은 유저의 성향과 가치관을 분석하여 가장 적합한 추모 공간을 추천해주는 '공간 심리 분석가'입니다.

# Task
제공된 [유저의 응답] 5가지를 종합적으로 분석하여, 아래 [5개의 추모관 테마] 중 유저의 성향(가치관, 분위기)과 가장 잘 어울리는 하나를 선택하세요.

[5개의 추모관 테마]
1. 동심파
   - 특징: 순수함, 가족애, 따뜻함
   - 분석 기준: 어린 시절의 추억, 가족과의 유대감, 따뜻하고 순수한 마음을 중시하는 답변이 많을 경우.
2. 낭만파
   - 특징: 감성, 예술, 사랑
   - 분석 기준: 감성적이고 예술적인 표현, 사랑과 낭만을 삶의 중요한 가치로 여기는 답변이 많을 경우.
3. 도시파
   - 특징: 자립심, 열정, 세련됨
   - 분석 기준: 주체적이고 열정적인 태도, 현대적이고 세련된 감각, 성취를 중시하는 답변이 많을 경우.
4. 자연파
   - 특징: 자연, 소박함, 평온함
   - 분석 기준: 복잡함보다는 단순함, 자연 속에서의 평화, 여유로운 삶을 지향하는 답변이 많을 경우.
5. 기억파
   - 특징: 추억, 그리움, 연결
   - 분석 기준: 과거의 인연을 소중히 여기고, 깊은 그리움과 사람 간의 연결을 강조하는 답변이 많을 경우.

# Output Format (JSON Only)
다음 JSON 형식으로만 출력하세요.
{
  "choice": (선택한 테마의 번호, 숫자만),
  "reason": "(유저의 핵심 성향 수식어) 당신에게는, 이 테마가 잘 어울릴 것 같아요."
}

# Reason 작성 가이드
- 'reason' 값은 반드시 "**[유저 성향 요약]** 당신에게는, 이 테마가 잘 어울릴 것 같아요."라는 문장 구조를 지키세요.
- [유저 성향 요약] 부분은 유저의 답변 내용을 바탕으로 20자 이내의 따뜻한 어조로 작성하세요.
- 예시: "따뜻한 가족애를 간직한 당신에게는, 이 테마가 잘 어울릴 것 같아요."`;

  /**
   * Analyzes user onboarding responses using the generic text generator
   */
  async analyzeResponses(responses: OnboardingResponse[]): Promise<ThemeAnalysisResult> {
    try {
      // Validate input
      if (!responses || responses.length !== 5) {
        throw new Error('Exactly 5 onboarding responses are required');
      }

      // Format user responses for the prompt
      const userResponsesText = responses
        .map((response, index) => `Q${index + 1}: ${response.question}\nA${index + 1}: ${response.answer}`)
        .join('\n\n');

      const userPrompt = `[유저의 응답]\n${userResponsesText}`;

      console.log('🤖 Analyzing responses using text generator...');

      // Use the generic text generator
      const responseText = await textGenerator.generateText(userPrompt, {
        system_prompt: this.SYSTEM_PROMPT,
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      console.log('🤖 Theme Analysis Response:', responseText);

      // Parse the JSON response
      const analysisResult: ThemeAnalysisResult = JSON.parse(responseText);

      // Validate the response structure
      if (!analysisResult.choice || !analysisResult.reason) {
        throw new Error('Invalid AI response format');
      }

      // Validate choice is between 1-5
      if (analysisResult.choice < 1 || analysisResult.choice > 5) {
        throw new Error('Invalid theme choice from AI');
      }

      return analysisResult;

    } catch (error) {
      console.error('❌ Theme Analysis Error:', error);
      
      // Fallback to rule-based analysis if text generation fails
      console.log('🔄 Falling back to rule-based analysis');
      return this.fallbackAnalysis(responses);
    }
  }

  /**
   * Fallback analysis when AI fails
   */
  private fallbackAnalysis(responses: OnboardingResponse[]): ThemeAnalysisResult {
    const allAnswers = responses.map(r => r.answer.toLowerCase()).join(' ');
    
    const themeScores = {
      1: 0, // 동심파
      2: 0, // 낭만파
      3: 0, // 도시파
      4: 0, // 자연파
      5: 0  // 기억파
    };

    if (allAnswers.includes('가족') || allAnswers.includes('따뜻') || allAnswers.includes('순수')) {
      themeScores[1] += 2;
    }
    if (allAnswers.includes('사랑') || allAnswers.includes('감성') || allAnswers.includes('예술')) {
      themeScores[2] += 2;
    }
    if (allAnswers.includes('성공') || allAnswers.includes('열정') || allAnswers.includes('성장')) {
      themeScores[3] += 2;
    }
    if (allAnswers.includes('자연') || allAnswers.includes('평화') || allAnswers.includes('단순')) {
      themeScores[4] += 2;
    }
    if (allAnswers.includes('추억') || allAnswers.includes('기억') || allAnswers.includes('그리움')) {
      themeScores[5] += 2;
    }

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

    return {
      choice,
      reason: reasons[choice as keyof typeof reasons]
    };
  }

  /**
   * Get theme information by ID
   */
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

// Export a singleton instance
export const themeAnalysisService = new ThemeAnalysisService();
