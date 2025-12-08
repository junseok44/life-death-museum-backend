import OpenAI from "openai";
import { TextGeneratorInterface } from "../../types/ai-services";

/**
 * 🤖 OpenAI implementation of TextGeneratorInterface.
 * Uses OpenAI's GPT models for text generation.
 */
export class OpenAITextGenerator implements TextGeneratorInterface {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
    console.log("🤖 OpenAI Text Generator initialized (responses API)");
  }

  async generateText(
    prompt: string,
    options?: {
      model?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    try {
      const model =
        options?.model ||
        process.env.OPENAI_TEXT_MODEL_DEFAULT ||
        "gpt-4o-mini";
      const maxTokens =
        options?.max_tokens ||
        parseInt(process.env.OPENAI_TEXT_MAX_TOKENS_DEFAULT || "2000");
      const systemPrompt = options?.system_prompt;
      const responseFormat = options?.response_format; // 그대로 두지만 responses API에선 사용하지 않을 수 있음

      // responses API용 input 구성
      const input: any[] = [];
      if (systemPrompt) {
        input.push({
          role: "system",
          content: systemPrompt,
        });
      }
      input.push({
        role: "user",
        content: prompt,
      });

      const response = await this.openai.responses.create({
        model,
        input,
        max_output_tokens: maxTokens,
        // responses API의 구조가 바뀔 수 있어, 추가 옵션은 그대로 전달만 함
        ...(responseFormat ? { response_format: responseFormat } : {}),
      } as any);

      // 간단한 텍스트 추출 유틸리티
      const outputText =
        // 공식 예시: response.output_text (가장 단순)
        (response as any).output_text ??
        // 혹시 output[0].content 기반 구조인 경우 대비
        (() => {
          const outputs = (response as any).output;
          if (!outputs || !outputs[0] || !outputs[0].content) return undefined;
          const first = outputs[0].content[0];
          if (first.type === "output_text" && first.text && first.text.value) {
            return first.text.value;
          }
          return undefined;
        })();

      if (!outputText || typeof outputText !== "string") {
        throw new Error("No response from OpenAI");
      }

      return outputText;
    } catch (error) {
      console.error("❌ OpenAI Text Generation Error:", error);
      throw error;
    }
  }
}
