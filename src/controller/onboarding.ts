import { Router, Request, Response, NextFunction, response } from "express";
import { authenticateJWT } from "../middleware/auth";

export const onboardingRouter = Router();

interface OnboardingResponse {
    question: string;
    answer: string;
}

const onboardingQuestions: string[] = [
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
            questions: onboardingQuestions
        });
    } catch (error) {
        next(error);
    }
});

onboardingRouter.post("/theme", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const responses: OnboardingResponse[] = req.body;

        // 3. Validation: Check if it is actually an array
        if (!Array.isArray(responses)) {
            return res.status(400).json({ 
                error: "Invalid format. Expected an array of objects." 
            });
        }

        // if responses are less than onboardingQuestions length, return error
        if (!responses || responses.length < onboardingQuestions.length) {
            console.log("Received onboarding data:", responses);
            return res.status(400).json({
                status: "error",
                message: "Incomplete responses"
            });
        }

        if (!userId) {
        return res.status(401).json({
            success: false,
            message: "User not authenticated"
        });
        }
        
        // log successful reception
        console.log("SUCCESS: Onboarding responses received for user:", userId);

        // Later adding AI analysis and recommended theme based on responses

        res.status(201).json({
            status: "success",
            message: "Onboarding responses received"
        });
    } catch (error) {
        next(error);
    }
});

