import { Router, Request, Response, NextFunction } from "express";
import { Example } from "../models";

export const exampleRouter = Router();

// GET /api/example - 모든 Example 조회
exampleRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const examples = await Example.find().sort({ createdAt: -1 });
      res.status(200).json({
        status: "success",
        data: examples,
        count: examples.length,
      });
    } catch (error) {
      console.error("❌ Error fetching Examples:", error);
      next(error);
    }
  }
);

// GET /api/example/:id - ID로 Example 조회
exampleRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const example = await Example.findById(id);

      if (!example) {
        res.status(404).json({
          status: "error",
          message: "Example을 찾을 수 없습니다.",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        data: example,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/example - 새 Example 생성
exampleRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;

      // 필수 필드 검증
      if (!name) {
        res.status(400).json({
          status: "error",
          message: "name 필드는 필수입니다.",
        });
        return;
      }

      // 새 Example 생성
      const newExample = new Example({
        name,
        description,
      });

      const savedExample = await newExample.save();
      console.log("✅ Example created:", savedExample._id);

      res.status(201).json({
        status: "success",
        data: savedExample,
        message: "Example이 성공적으로 생성되었습니다.",
      });
    } catch (error) {
      console.error("❌ Error creating Example:", error);
      next(error);
    }
  }
);

// PUT /api/example/:id - Example 수정
exampleRouter.put(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const updatedExample = await Example.findByIdAndUpdate(
        id,
        { name, description },
        { new: true, runValidators: true }
      );

      if (!updatedExample) {
        res.status(404).json({
          status: "error",
          message: "Example을 찾을 수 없습니다.",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        data: updatedExample,
        message: "Example이 성공적으로 수정되었습니다.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/example/:id - Example 삭제
exampleRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const deletedExample = await Example.findByIdAndDelete(id);

      if (!deletedExample) {
        res.status(404).json({
          status: "error",
          message: "Example을 찾을 수 없습니다.",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Example이 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      next(error);
    }
  }
);
