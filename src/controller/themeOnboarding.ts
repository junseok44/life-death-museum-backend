import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { themeAnalysisService, OnboardingResponse, ThemeAnalysisResult } from '../services/theme-analysis-service';
import { User } from '../models/UserModel';


const themeOnboardingRouter = Router();

// Interface for analysis request
interface AnalysisRequest {
  responses: OnboardingResponse[];
}

// POST /arti/analyze - Analyze user responses and get theme recommendation
themeOnboardingRouter.post('/analyze', authenticateJWT, async (req: Request<{}, {}, AnalysisRequest>, res: Response) => {
  try {
    const userId = req.user?.id;
    const { responses } = req.body;

    console.log('🎭 Arti AI Analysis Request from user:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate input
    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format. Expected responses array.'
      });
    }

    if (responses.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'At least 5 responses are required for analysis'
      });
    }

    // Validate each response
    for (const response of responses) {
      if (!response.question || !response.answer) {
        return res.status(400).json({
          success: false,
          message: 'Each response must have both question and answer fields'
        });
      }
    }

    // Call AI service for analysis
    const analysisResult: ThemeAnalysisResult = await themeAnalysisService.analyzeResponses(responses);

    // Get theme information
    const themeInfo = themeAnalysisService.getThemeInfo(analysisResult.choice);

    console.log('✅ AI Analysis completed:', {
      choice: analysisResult.choice,
      theme: themeInfo.name,
      reason: analysisResult.reason
    });

    return res.status(200).json({
      success: true,
      message: 'AI analysis completed successfully',
      data: {
        analysis: {
          choice: analysisResult.choice,
          reason: analysisResult.reason,
          analyzedAt: new Date()
        },
        theme: {
          id: analysisResult.choice,
          name: themeInfo.name,
          characteristics: themeInfo.characteristics,
          description: themeInfo.description
        },
        user: {
          id: userId
        }
      }
    });

  } catch (error) {
    console.error('❌ Arti AI Analysis Error:', error);
    return res.status(500).json({
      success: false,
      message: 'AI analysis failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export { themeOnboardingRouter };
