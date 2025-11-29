import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { themeAnalysisService, OnboardingResponse, ThemeAnalysisResult } from '../services/theme-analysis-service';
import { User } from '../models/UserModel';
import { createDefaultModifiedObject, hasValidDefaultObjectConfig } from '../services/theme-default-object.service';
import mongoose from 'mongoose';


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

    // Create and add default modified object for this theme
    let defaultObjectId = null;
    let defaultObjectWarning = null;

    if (hasValidDefaultObjectConfig(analysisResult.choice)) {
      const result = await createDefaultModifiedObject(analysisResult.choice, userId);
      
      if (result.success && result.modifiedObjectId) {
        defaultObjectId = result.modifiedObjectId;
        
        // Add the default object to user's modifiedObjectIds
        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { modifiedObjectIds: defaultObjectId } },
          { new: true }
        );
        
        console.log(`✅ Added default object ${defaultObjectId} to user ${userId}`);
      } else {
        console.warn(`⚠️ Failed to create default object for theme ${analysisResult.choice}:`, result.error);
        defaultObjectWarning = result.error;
      }
    } else {
      console.log(`ℹ️ Theme ${analysisResult.choice} configuration not finalized yet - skipping default object`);
      defaultObjectWarning = 'Theme configuration pending. Default object will be added when product team provides data.';
    }

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
        defaultObject: defaultObjectId ? {
          id: defaultObjectId,
          created: true
        } : {
          created: false,
          reason: defaultObjectWarning
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
