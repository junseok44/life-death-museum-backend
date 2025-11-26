import mongoose from "mongoose";
import { z } from "zod";

// POST /object/followup 스키마
export const followupQuestionSchema = z.object({
  body: z.object({
    content: z
      .string()
      .min(1, "content field is required and must be a non-empty string")
      .trim(),
  }),
});

// POST /object 스키마
export const createObjectSchema = z.object({
  body: z.object({
    content: z
      .string()
      .min(1, "content field is required and must be a non-empty string")
      .trim(),
  }),
});

// POST /object/basic 스키마
// Note: multipart/form-data의 파일은 multer에서 처리되므로 body의 텍스트 필드만 검증
// imageSets가 배열로 파싱된 경우에만 구조 검증 (평면 키 형태는 컨트롤러에서 처리)
export const createBasicObjectSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "name is required").trim(),
      description: z.string().optional(),
      onType: z.enum(["Wall", "Floor"], {
        message: "onType must be one of: Wall, Floor",
      }),
      imageSets: z
        .array(
          z.object({
            name: z.string().min(1, "imageSet name is required"),
            color: z.string().min(1, "imageSet color is required"),
          })
        )
        .min(1, "At least one imageSet is required")
        .optional(),
    })
    .passthrough(), // imageSets[0][name] 같은 평면 키도 허용
});

// POST /object/add 스키마
export const addObjectToInventorySchema = z.object({
  body: z.object({
    objectId: z
      .string()
      .min(1, "objectId field is required and must be a non-empty string")
      .refine((objectId) => mongoose.Types.ObjectId.isValid(objectId), {
        message: "objectId is not a valid ObjectId",
      }),
  }),
});

// PATCH /object/:objectId 스키마
export const updateObjectSchema = z.object({
  params: z.object({
    objectId: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).trim().optional(),
    currentImageSetId: z
      .string()
      .refine(
        (currentImageSet) => mongoose.Types.ObjectId.isValid(currentImageSet),
        {
          message: "currentImageSet is not a valid ObjectId",
        }
      )
      .optional(),
    description: z.string().optional(),
    onType: z.enum(["Wall", "Floor"]).optional(),
    imageSets: z
      .array(
        z.object({
          name: z.string().min(1),
          color: z.string().min(1),
          src: z.string().min(1),
        })
      )
      .min(1, "imageSets must be a non-empty array")
      .optional(),
  }),
});

// 타입 추출
export type FollowupQuestionBody = z.infer<
  typeof followupQuestionSchema
>["body"];
export type CreateObjectBody = z.infer<typeof createObjectSchema>["body"];
export type CreateBasicObjectBody = z.infer<
  typeof createBasicObjectSchema
>["body"];
export type AddObjectToInventoryBody = z.infer<
  typeof addObjectToInventorySchema
>["body"];
export type UpdateObjectBody = z.infer<typeof updateObjectSchema>["body"];
export type UpdateObjectParams = z.infer<typeof updateObjectSchema>["params"];
