import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Validation 미들웨어 생성 함수
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
          errors: error.issues,
        });
      }
      return res.status(500).json({
        message: "Validation error",
      });
    }
  };
};
