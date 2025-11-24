import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { ArtiAIService, AIAnalysisResult } from '../services/arti-ai-service';
import { User } from '../models/UserModel';
import { OnboardingResponse } from '../types';

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

    if (responses.length !== 5) {
      return res.status(400).json({
        success: false,
        message: 'Exactly 5 responses are required for analysis'
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
    const analysisResult: AIAnalysisResult = await ArtiAIService.analyzeOnboardingResponses(responses);

    // Get theme information
    const themeInfo = ArtiAIService.getThemeInfo(analysisResult.choice);

    // Save analysis result to user profile
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'aiAnalysis.choice': analysisResult.choice,
          'aiAnalysis.reason': analysisResult.reason,
          'aiAnalysis.theme': themeInfo.name,
          'aiAnalysis.analyzedAt': new Date(),
          'aiAnalysis.responses': responses
        }
      },
      { runValidators: true }
    );

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

// POST /arti/analyze-from-profile - Analyze using saved onboarding responses
themeOnboardingRouter.post('/analyze-from-profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    console.log('🎭 Arti AI Analysis from Profile for user:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user's saved onboarding responses
    const user = await User.findById(userId).select('onboardingResponses').exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.onboardingResponses || user.onboardingResponses.length !== 5) {
      return res.status(400).json({
        success: false,
        message: 'User must complete onboarding first (5 responses required)'
      });
    }

    console.log('📝 Using saved onboarding responses for analysis');

    // Call AI service for analysis
    const analysisResult: AIAnalysisResult = await ArtiAIService.analyzeOnboardingResponses(user.onboardingResponses);

    // Get theme information
    const themeInfo = ArtiAIService.getThemeInfo(analysisResult.choice);

    // Save analysis result to user profile
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'aiAnalysis.choice': analysisResult.choice,
          'aiAnalysis.reason': analysisResult.reason,
          'aiAnalysis.theme': themeInfo.name,
          'aiAnalysis.analyzedAt': new Date(),
          'aiAnalysis.responses': user.onboardingResponses
        }
      },
      { runValidators: true }
    );

    console.log('✅ AI Analysis completed from profile:', {
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

// GET /arti/analysis - Get user's saved AI analysis
themeOnboardingRouter.get('/analysis', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(userId).select('aiAnalysis').exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.aiAnalysis || !user.aiAnalysis.choice) {
      return res.status(404).json({
        success: false,
        message: 'No AI analysis found. Please complete analysis first.'
      });
    }

    // Get theme information
    const themeInfo = ArtiAIService.getThemeInfo(user.aiAnalysis.choice);

    return res.status(200).json({
      success: true,
      data: {
        analysis: {
          choice: user.aiAnalysis.choice,
          reason: user.aiAnalysis.reason,
          analyzedAt: user.aiAnalysis.analyzedAt
        },
        theme: {
          id: user.aiAnalysis.choice,
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
    console.error('❌ Get AI Analysis Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get AI analysis',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export { themeOnboardingRouter };
