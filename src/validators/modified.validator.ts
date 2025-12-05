import mongoose from "mongoose";
import { z } from "zod";
import { OnType } from "../models/ObjectModel";
import { ItemFunction } from "../types";

// Link additionalData schema
const linkAdditionalDataSchema = z.object({
  link: z.string().min(1, "link field is required and cannot be empty"),
});

// Board additionalData schema
const boardAdditionalDataSchema = z.object({
  data: z.object({
    title: z.string(), // 빈 문자열 가능
    description: z.string(), // 빈 문자열 가능
    items: z.array(
      z.object({
        writer: z
          .string()
          .min(1, "writer field is required and cannot be empty"),
        text: z.string().min(1, "text field is required and cannot be empty"),
        color: z.string().min(1, "color field is required and cannot be empty"),
      })
    ),
  }),
});

// POST /modified 스키마
export const createModifiedSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(1, "name field is required and must be a non-empty string")
        .trim(),
      currentImageSetId: z
        .string()
        .refine(
          (currentImageSet) => mongoose.Types.ObjectId.isValid(currentImageSet),
          {
            message: "currentImageSetId is not a valid ObjectId",
          }
        ),
      itemFunction: z.union([z.nativeEnum(ItemFunction), z.null()]),
      coordinates: z.object({
        x: z.number({
          message: "coordinates.x is required and must be a number",
        }),
        y: z.number({
          message: "coordinates.y is required and must be a number",
        }),
      }),
      originalObjectId: z
        .string({
          message: "originalObjectId is required and must be a string",
        })
        .refine(
          (originalObjectId) =>
            mongoose.Types.ObjectId.isValid(originalObjectId),
          {
            message: "originalObjectId is not a valid ObjectId",
          }
        ),
      onType: z.enum(OnType),
      description: z.string().optional(),
      isReversed: z.boolean().optional(),
      additionalData: z.any().optional(),
    })
    .superRefine((data, ctx) => {
      // additionalData validation based on itemFunction
      if (data.itemFunction === ItemFunction.Link) {
        // Link일 때는 additionalData가 필수
        if (data.additionalData === undefined || data.additionalData === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `additionalData is required when itemFunction is ${ItemFunction.Link}`,
            path: ["additionalData"],
          });
        } else {
          const result = linkAdditionalDataSchema.safeParse(
            data.additionalData
          );
          if (!result.success) {
            result.error.issues.forEach((err: z.ZodIssue) => {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `additionalData validation failed: ${err.message}`,
                path: ["additionalData", ...err.path],
              });
            });
          }
        }
      } else if (data.itemFunction === ItemFunction.Board) {
        // Board일 때는 additionalData가 필수
        if (data.additionalData === undefined || data.additionalData === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `additionalData is required when itemFunction is ${ItemFunction.Board}`,
            path: ["additionalData"],
          });
        } else {
          const result = boardAdditionalDataSchema.safeParse(
            data.additionalData
          );
          if (!result.success) {
            result.error.issues.forEach((err: z.ZodIssue) => {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `additionalData validation failed: ${err.message}`,
                path: ["additionalData", ...err.path],
              });
            });
          }
        }
      } else if (data.itemFunction === null) {
        // null: additionalData should be empty object or undefined
        if (
          data.additionalData !== undefined &&
          data.additionalData !== null &&
          Object.keys(data.additionalData).length > 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "additionalData should be empty or undefined when itemFunction is null",
            path: ["additionalData"],
          });
        }
      }
    }),
});

// PATCH /modified/:id 스키마
export const updateModifiedSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z
    .object({
      name: z.string().min(1).trim().optional(),
      description: z.string().optional(),
      itemFunction: z.nativeEnum(ItemFunction).nullable().optional(),
      onType: z.enum(OnType).optional(),
      additionalData: z.any().optional(),
      coordinates: z
        .object({
          x: z.number({
            message: "coordinates.x is required and must be a number",
          }),
          y: z.number({
            message: "coordinates.y is required and must be a number",
          }),
        })
        .optional(),
      currentImageSetId: z
        .string()
        .refine(
          (currentImageSetId) =>
            mongoose.Types.ObjectId.isValid(currentImageSetId),
          {
            message: "currentImageSetId is not a valid ObjectId",
          }
        )
        .optional(),
      isReversed: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Request body cannot be empty",
    })
    .superRefine((data, ctx) => {
      // additionalData validation based on itemFunction
      // Use the itemFunction from the request body
      const itemFunction = data.itemFunction;

      // If itemFunction is provided in the update request, validate additionalData accordingly
      if (itemFunction !== undefined) {
        if (itemFunction === ItemFunction.Link) {
          // Link일 때는 additionalData가 필수 (업데이트 시)
          if (data.additionalData === undefined || data.additionalData === null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `additionalData is required when itemFunction is ${ItemFunction.Link}`,
              path: ["additionalData"],
            });
          } else {
            const result = linkAdditionalDataSchema.safeParse(
              data.additionalData
            );
            if (!result.success) {
              result.error.issues.forEach((err: z.ZodIssue) => {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `additionalData validation failed: ${err.message}`,
                  path: ["additionalData", ...err.path],
                });
              });
            }
          }
        } else if (itemFunction === ItemFunction.Board) {
          // Board일 때는 additionalData가 필수 (업데이트 시)
          if (data.additionalData === undefined || data.additionalData === null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `additionalData is required when itemFunction is ${ItemFunction.Board}`,
              path: ["additionalData"],
            });
          } else {
            const result = boardAdditionalDataSchema.safeParse(
              data.additionalData
            );
            if (!result.success) {
              result.error.issues.forEach((err: z.ZodIssue) => {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `additionalData validation failed: ${err.message}`,
                  path: ["additionalData", ...err.path],
                });
              });
            }
          }
        } else if (itemFunction === null) {
          // null: additionalData should be empty object or undefined
          if (
            data.additionalData !== undefined &&
            data.additionalData !== null &&
            Object.keys(data.additionalData).length > 0
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "additionalData should be empty or undefined when itemFunction is null",
              path: ["additionalData"],
            });
          }
        }
      } else {
        // If itemFunction is not provided in the update, validate additionalData if it's provided
        // (will use existing itemFunction in service layer)
        if (data.additionalData !== undefined && data.additionalData !== null) {
          // additionalData가 제공되었지만 itemFunction이 없으면, 서비스 레이어에서 검증
          // 여기서는 형식만 체크 (실제 itemFunction은 서비스에서 확인)
        }
      }
    }),
});

// 타입 추출
export type CreateModifiedBody = z.infer<typeof createModifiedSchema>["body"];
export type UpdateModifiedBody = z.infer<typeof updateModifiedSchema>["body"];
export type UpdateModifiedParams = z.infer<
  typeof updateModifiedSchema
>["params"];
