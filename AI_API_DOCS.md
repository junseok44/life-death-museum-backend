# AI Service API Documentation

## Overview
The AI Service analyzes user onboarding responses and recommends one of five memorial themes using a modular AI services architecture. The system automatically selects between OpenAI GPT-3.5-turbo and a rule-based fallback system, providing reliable service regardless of API availability.

### Architecture Benefits
- **🏗️ Modular Design**: Interface-based architecture allows easy provider switching
- **🔄 Automatic Fallback**: Seamlessly switches between OpenAI and mock implementations
- **🧪 Development-Friendly**: Mock implementation enables development without API costs
- **📈 Scalable**: Easy to add new AI providers following the same interface
- **🛡️ Robust**: Graceful degradation when external services are unavailable

## Base URL
```
http://localhost:3000
```

## Authentication
All Arti AI endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Theme Analysis System

### Five Memorial Themes
1. **동심파 (Innocence)** - 순수함, 가족애, 따뜻함
2. **낭만파 (Romance)** - 감성, 예술, 사랑  
3. **도시파 (Urban)** - 자립심, 열정, 세련됨
4. **자연파 (Nature)** - 자연, 소박함, 평온함
5. **기억파 (Memory)** - 추억, 그리움, 연결

## Endpoints

### 1. Get Onboarding Questions

**GET** `/onboarding/theme`

Retrieves the set of onboarding questions for theme analysis.

#### Request Headers
```
Authorization: Bearer <jwt-token>
```

#### Response Body (Success - 200)
```json
{
  "status": "success",
  "questions": [
    "어떤 칭찬을 들으면 기분이 좋던가요?",
    "평소에 무엇을 기대하며 살고 있나요?",
    "주변 사람들에게 어떻게 기억되고 싶은가요?",
    "나의 삶을 한 문장으로 정리하자면?",
    "당신의 장례식은 분위기가 어땠으면 하나요?"
  ]
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### 2. Get All Memorial Themes

**GET** `/onboarding/themes`

Retrieves information about all available memorial themes.

#### Response Body (Success - 200)
```json
{
  "success": true,
  "data": {
    "themes": [
      {
        "id": 1,
        "name": "동심파",
        "characteristics": ["순수함", "가족애", "따뜻함"],
        "description": "어린 시절의 추억과 가족과의 유대감을 중시하는 따뜻하고 순수한 마음"
      },
      {
        "id": 2,
        "name": "낭만파",
        "characteristics": ["감성", "예술", "사랑"],
        "description": "감성적이고 예술적인 표현을 통해 사랑과 낭만을 삶의 중요한 가치로 여기는 성향"
      },
      {
        "id": 3,
        "name": "도시파",
        "characteristics": ["자립심", "열정", "세련됨"],
        "description": "주체적이고 열정적인 태도로 현대적이고 세련된 감각을 추구하며 성취를 중시하는 성향"
      },
      {
        "id": 4,
        "name": "자연파",
        "characteristics": ["자연", "소박함", "평온함"],
        "description": "복잡함보다는 단순함을 추구하며 자연 속에서의 평화와 여유로운 삶을 지향하는 성향"
      },
      {
        "id": 5,
        "name": "기억파",
        "characteristics": ["추억", "그리움", "연결"],
        "description": "과거의 인연을 소중히 여기고 깊은 그리움과 사람 간의 연결을 강조하는 성향"
      }
    ],
    "count": 5
  }
}
```

#### Error Responses

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to get themes"
}
```

### 3. Theme Analysis

**POST** `/onboarding/theme/analyze`

Analyzes user onboarding responses and returns a recommended memorial theme.

#### Request Headers
```
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

#### Request Body
```json
{
  "responses": [
    {
      "question": "당신이 가장 소중하게 생각하는 가치는 무엇인가요?",
      "answer": "가족과의 따뜻한 시간을 보내는 것입니다."
    },
    {
      "question": "어떤 순간에 가장 행복을 느끼시나요?",
      "answer": "자연 속에서 평온함을 느낄 때입니다."
    },
    {
      "question": "당신의 꿈이나 목표는 무엇인가요?",
      "answer": "사랑하는 사람들과 소중한 추억을 만드는 것입니다."
    },
    {
      "question": "스트레스를 받을 때 어떻게 해소하시나요?",
      "answer": "혼자만의 시간을 가지며 생각을 정리합니다."
    },
    {
      "question": "당신에게 '집'이란 어떤 의미인가요?",
      "answer": "안전하고 따뜻한 피난처 같은 곳입니다."
    }
  ]
}
```

#### Response Body (Success - 200)
```json
{
  "success": true,
  "message": "AI analysis completed successfully",
  "data": {
    "analysis": {
      "choice": 1,
      "reason": "따뜻한 가족애를 간직한 당신에게는, 이 테마가 잘 어울릴 것 같아요.",
      "analyzedAt": "2024-01-15T10:30:00.000Z"
    },
    "theme": {
      "id": 1,
      "name": "동심파",
      "characteristics": ["순수함", "가족애", "따뜻함"],
      "description": "어린 시절의 추억과 가족과의 유대감을 중시하는 따뜻하고 순수한 마음"
    },
    "user": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3"
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid request format
```json
{
  "success": false,
  "message": "Invalid request format. Expected responses array."
}
```

**400 Bad Request - Insufficient Responses**
```json
{
  "success": false,
  "message": "At least 5 responses are required for analysis"
}
```

**400 Bad Request - Invalid Response Structure**
```json
{
  "success": false,
  "message": "Each response must have both question and answer fields"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "AI analysis failed",
  "error": "Detailed error message (only in development mode)"
}
```

## AI Analysis Architecture

### Service Layer Design
The system uses a modular AI services architecture with:
- **Interface-based design**: `ThemeAnalyzerInterface` ensures consistent behavior
- **Automatic provider selection**: Chooses between OpenAI and mock implementation
- **Seamless fallback**: No interruption when switching between providers

### 1. OpenAI Implementation (`OpenAIThemeAnalyzer`)
- **Model**: GPT-3.5-turbo
- **Temperature**: 0.7
- **Max Tokens**: 500
- **Response Format**: JSON object
- **System Prompt**: Advanced psychological analysis as "공간 심리 분석가"
- **Error Handling**: Graceful degradation to fallback mode

### 2. Mock Implementation (`MockThemeAnalyzer`)
- **Rule-based analysis**: Keyword matching algorithm
- **Scoring system**: Theme-relevant keyword detection
- **Development-friendly**: No API costs during development
- **Consistent results**: Deterministic analysis for testing

### 3. Analysis Criteria

#### 동심파 (Theme 1)
- Keywords: 가족, 따뜻, 순수
- Focus: Family bonds, childhood memories, pure emotions

#### 낭만파 (Theme 2)  
- Keywords: 사랑, 감성, 예술
- Focus: Artistic expression, romance, emotional depth

#### 도시파 (Theme 3)
- Keywords: 성공, 열정, 성장
- Focus: Achievement, modern lifestyle, self-reliance

#### 자연파 (Theme 4)
- Keywords: 자연, 평화, 단순
- Focus: Natural harmony, simplicity, tranquility

#### 기억파 (Theme 5)
- Keywords: 추억, 기억, 그리움
- Focus: Past connections, nostalgia, meaningful relationships

## Environment Variables

```env
# AI Services Configuration
OPENAI_API_KEY=your_openai_api_key_here  # Optional - uses mock if not provided

# JWT configuration
JWT_SECRET=your_jwt_secret_here

# Development mode for detailed error messages
NODE_ENV=development

# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# Server Configuration
PORT=3000
```

## Service Architecture

### AI Services Registry (`services/ai-services.ts`)
```typescript
export const themeAnalyzer: ThemeAnalyzerInterface = process.env.OPENAI_API_KEY 
  ? new OpenAIThemeAnalyzer(process.env.OPENAI_API_KEY)
  : new MockThemeAnalyzer();
```

### Automatic Provider Selection
- **With API Key**: Uses OpenAI GPT-3.5-turbo for advanced psychological analysis
- **Without API Key**: Uses rule-based mock implementation for development
- **Runtime Fallback**: Switches to mock if OpenAI fails (quota exceeded, network issues)

## Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Get onboarding questions
const getQuestions = async (token) => {
  try {
    const response = await axios.get('http://localhost:3000/onboarding/theme', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Questions:', response.data.questions);
    return response.data.questions;
  } catch (error) {
    console.error('Failed to get questions:', error.response?.data);
    throw error;
  }
};

// Get all available themes
const getThemes = async () => {
  try {
    const response = await axios.get('http://localhost:3000/onboarding/themes');
    
    console.log('Available Themes:', response.data.data.themes);
    return response.data.data.themes;
  } catch (error) {
    console.error('Failed to get themes:', error.response?.data);
    throw error;
  }
};

// Analyze user responses for theme recommendation
const analyzeTheme = async (responses, token) => {
  try {
    const response = await axios.post('http://localhost:3000/onboarding/theme/analyze', {
      responses
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Recommended Theme:', response.data.data.theme);
    return response.data;
  } catch (error) {
    console.error('Analysis failed:', error.response?.data);
    throw error;
  }
};

// Complete onboarding flow example
const completeOnboarding = async (token) => {
  try {
    // 1. Get questions
    const questions = await getQuestions(token);
    
    // 2. Get user responses (this would be from user input)
    const responses = questions.map((question, index) => ({
      question,
      answer: `Sample answer ${index + 1}` // Replace with actual user input
    }));
    
    // 3. Analyze responses
    const analysis = await analyzeTheme(responses, token);
    
    // 4. Get all themes for reference
    const allThemes = await getThemes();
    
    return {
      analysis,
      allThemes
    };
  } catch (error) {
    console.error('Onboarding flow failed:', error);
    throw error;
  }
};
```


## Implementation Details

### Service Files Structure
```
src/
├── types/
│   └── ai-services.ts          # Interface definitions
├── services/
│   ├── ai-services.ts          # Main service registry
│   ├── openai-theme-analyzer.ts # OpenAI implementation
│   └── mock-ai-services.ts     # Mock implementations
└── controller/
    ├── onboarding.ts           # Questions & themes endpoints
    └── themeOnboarding.ts      # Analysis endpoint
```

### Interface Definition
```typescript
interface ThemeAnalyzerInterface {
  analyzeResponses(responses: OnboardingResponse[]): Promise<ThemeAnalysisResult>;
  getThemeInfo(themeId: number): ThemeInfo;
}
```

## Security Notes
- All endpoints require valid JWT authentication
- User ID is extracted from JWT token for logging purposes
- Detailed error messages are only shown in development mode
- No sensitive data is logged or stored
- Service layer abstracts API implementation details

## Testing
Use the provided test script `test-arti-ai.js` to test the API:

```bash
node test-arti-ai.js
```

### Test Coverage
- ✅ **Authentication validation**
- ✅ **OpenAI integration** (when API key available)
- ✅ **Mock fallback** (when API unavailable)
- ✅ **Error condition handling**
- ✅ **Service switching** (automatic fallback)
- ✅ **Input validation**
