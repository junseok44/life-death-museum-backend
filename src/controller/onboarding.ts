import { Router, Request, Response, NextFunction, response } from "express";
import { authenticateJWT } from "../middleware/auth";
import { themeAnalysisService, OnboardingResponse } from "../services/theme-analysis-service";

export const onboardingRouter = Router();

const themeQuestions: string[] = [
    "어떤 칭찬을 들으면 기분이 좋던가요?",
    "평소에 무엇을 기대하며 살고 있나요?",
    "주변 사람들에게 어떻게 기억되고 싶은가요?",
    "나의 삶을 한 문장으로 정리하자면?",
    "당신의 장례식은 분위기가 어땠으면 하나요?"
];

onboardingRouter.get("/theme", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).json({
            status: "success",
            questions: themeQuestions
        });
    } catch (error) {
        next(error);
    }
});

// GET /arti/themes - Get all available themes
onboardingRouter.get('/themes', (req: Request, res: Response) => {
  try {
    const themes = [1, 2, 3, 4, 5].map(id => ({
      id,
      ...themeAnalysisService.getThemeInfo(id)
    }));

    return res.status(200).json({
      success: true,
      data: {
        themes,
        count: themes.length
      }
    });

  } catch (error) {
    console.error('❌ Get Themes Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get themes'
    });
  }
});

