import { GoogleGenAI } from "@google/genai";
import { TextGeneratorInterface } from "../../types/ai-services";

/**
 * 🤖 Google Gemini implementation of TextGeneratorInterface.
 * Uses Gemini 2.5 Pro model for text generation.
 */
export class GeminiTextGenerator implements TextGeneratorInterface {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_GENAI_API_KEY;
    if (!key) {
      throw new Error("Google GenAI API key is required");
    }
    this.ai = new GoogleGenAI({
      apiKey: key,
    });
    console.log("🤖 Gemini Text Generator initialized (gemini-2.5-pro)");
  }

  async generateText(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      system_prompt?: string;
      response_format?: { type: string };
      [key: string]: any;
    }
  ): Promise<string> {
    try {
      const model = options?.model || "gemini-2.5-pro";
      const temperature = options?.temperature ?? 0.7;
      const systemPrompt = options?.system_prompt;
      const responseFormat = options?.response_format;

      // Gemini API 호출 구성
      // system prompt가 있으면 prompt 앞에 추가
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const config: {
        temperature?: number;
        responseMimeType?: string;
        [key: string]: any;
      } = {
        temperature,
      };

      // JSON 형식 요청 시
      if (responseFormat?.type === "json_object") {
        config.responseMimeType = "application/json";
      }

      const response = await this.ai.models.generateContent({
        model,
        contents: fullPrompt,
        config,
      });

      // 응답에서 텍스트 추출
      const candidates = response.candidates || [];
      if (candidates.length === 0) {
        throw new Error("No response from Gemini");
      }

      const candidate = candidates[0];
      if (!candidate.content?.parts || candidate.content.parts.length === 0) {
        throw new Error("No content in Gemini response");
      }

      const textParts = candidate.content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text);

      if (textParts.length === 0) {
        throw new Error("No text in Gemini response");
      }

      return textParts.join("\n");
    } catch (error) {
      console.error("❌ Gemini Text Generation Error:", error);
      throw error;
    }
  }
}
