import OpenAI from 'openai';
import { TextGeneratorInterface } from '../types/ai-services';

/**
 * 🤖 OpenAI implementation of TextGeneratorInterface.
 * Uses OpenAI's GPT models for text generation.
 */
export class OpenAITextGenerator implements TextGeneratorInterface {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    console.log('🤖 OpenAI Text Generator initialized');
  }

  async generateText(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      [key: string]: any;
    }
  ): Promise<string> {
    try {
      const model = options?.model || 'gpt-3.5-turbo';
      const temperature = options?.temperature ?? 0.7;
      const maxTokens = options?.max_tokens || 500;
      const systemPrompt = options?.system_prompt;
      const responseFormat = options?.response_format;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt
      });

      const completionOptions: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      if (responseFormat) {
        completionOptions.response_format = responseFormat;
      }

      const completion = await this.openai.chat.completions.create(completionOptions);

      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      return responseText;
    } catch (error) {
      console.error('❌ OpenAI Text Generation Error:', error);
      throw error;
    }
  }
}
