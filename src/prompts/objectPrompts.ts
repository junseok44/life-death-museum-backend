/**
 * Object generation prompts
 * These prompts are used for AI text and image generation
 */

export const ObjectPrompts = {
  /**
   * Generate a follow-up question based on user's Q&A content
   */
  generateFollowUpQuestion: (content: string): string => {
    return `# Role

당신은 온라인 추모관의 '기억 큐레이터'입니다. 유저의 답변을 바탕으로, 추모 공간에 놓을 소중한 물건을 시각화하려고 합니다.

# Task

유저의 {질문: Q1, 답변: A1}을 분석하여, 물건의 생김새를 구체적으로 파악하기 위한 **단 하나의 추가 질문**을 생성하세요.

# Guidelines

1. 유저의 답변에서 물건의 '색상', '재질', '모양', '특정 브랜드' 등의 시각적 정보가 부족하다면 이를 물어보세요.

2. 이미 시각적 정보가 충분하다면, 그 물건에 담긴 특별한 분위기나 느낌을 물어보세요.

3. 말투는 따뜻하고 공감하되, 질문은 간결하고 명확해야 합니다.

# Input Data

질문과 답변:
${content}

# Output

추가 질문:`;
  },

  /**
   * Generate object metadata including name, color, description, onType, and visual_prompt
   * Returns JSON format: { name: string, color: string, description: string, onType: "LeftWall" | "RightWall" | "Floor" (OnType enum), visual_prompt: string }
   */
  generateObjectMetadata: (content: string): string => {
    return `# Role

당신은 추억을 시각화하는 데이터 설계자입니다. 유저와의 대화 내용을 바탕으로 추모관에 배치할 오브젝트의 정보를 구조화해야 합니다.

# Task

제공된 대화 내역을 분석하여, 아래 JSON 포맷에 맞춰 데이터를 생성하세요.

# Constraints

1. **name**: '수식어 + 물건 이름' 형태 (예: 엄마의 사랑이 담긴 빨간 목도리)

2. **color**: 아이템의 주조색 1가지를 Hex Code로 반환 (예: #FF5733)

3. **description**: 유저에게 이 물건이 어떤 의미인지 100자 이내의 한국어로 감성적으로 서술.

4. **onType**: 물건의 특성에 따라 반드시 "LeftWall"(왼쪽 벽에 걸리는 액자, 시계 등), "Floor"(가구, 화분 등 바닥형) 중 하나만 선택.

5. **visual_prompt**: **중요** DALL-E 등의 이미지 생성 AI에게 보낼 '오브젝트 묘사' 프롬프트를 영어로 작성. (배경 없이, 물건의 생김새, 색상, 재질 위주로 묘사)

# Input Data

${content}

# Output Format (JSON Only)

{
  "name": "",
  "color": "",
  "description": "",
  "onType": "",
  "visual_prompt": ""
}`;
  },

  /**
   * Generate final image prompt with style description and object description
   */
  generateImagePrompt: (visualPrompt: string): string => {
    return `# Style Description

An isometric 3D game asset style. 

Soft pastel colors, cute and minimal design, smooth vector-like rendering.

Soft lighting without harsh shadows. 

Similar to 'Sims' or casual mobile interior game assets.

# Object Description

${visualPrompt}

# View & Orientation

Isometric view, facing left.

Isolated on a pure white background. 

Do not add any text inside the image.

High quality, detailed texture.`;
  },
};
