/**
 * Response Parser Utility
 * Handles parsing of AI-generated text responses, especially JSON extraction
 */
export class ResponseParser {
  /**
   * Extract JSON from AI response text
   * Handles cases where AI returns extra text along with JSON
   * @param text - AI response text that may contain JSON
   * @returns Extracted JSON string or null if not found
   */
  static extractJSON(text: string): string | null {
    // 중첩된 중괄호를 올바르게 처리하여 가장 마지막에 있는 유효한 JSON을 찾음
    let depth = 0;
    let startIndex = -1;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === "{") {
        if (depth === 0) {
          startIndex = i;
        }
        depth++;
      } else if (text[i] === "}") {
        depth--;
        if (depth === 0 && startIndex !== -1) {
          // 유효한 JSON 후보를 찾았으므로 파싱 시도
          const candidate = text.substring(startIndex, i + 1);
          try {
            JSON.parse(candidate);
            // 파싱 성공하면 이것이 유효한 JSON
            return candidate;
          } catch {
            // 파싱 실패하면 계속 찾기
            startIndex = -1;
          }
        }
      }
    }

    return null;
  }

  /**
   * Parse JSON from AI response
   * @param text - AI response text that may contain JSON
   * @returns Parsed JSON object
   * @throws Error if JSON parsing fails
   */
  static parseJSON<T>(text: string): T {
    const jsonString = this.extractJSON(text);
    if (!jsonString) {
      throw new Error("No JSON found in response");
    }
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      throw new Error(
        `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
