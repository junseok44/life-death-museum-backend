import mongoose from "mongoose";
import { z } from "zod";
import { OnType } from "../models/ObjectModel";

// POST /modified 스키마
export const createModifiedSchema = z.object({
  body: z.object({
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
    itemFunction: z.union([z.enum(["Gallery", "Link", "Board"]), z.null()]),
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
        (originalObjectId) => mongoose.Types.ObjectId.isValid(originalObjectId),
        {
          message: "originalObjectId is not a valid ObjectId",
        }
      ),
    onType: z.enum(OnType),
    description: z.string().optional(),
    isReversed: z.boolean().optional(),
    additionalData: z.any().optional(),
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
      itemFunction: z.enum(["Gallery", "Link", "Board"]).nullable().optional(),
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
    }),
});

// 타입 추출
export type CreateModifiedBody = z.infer<typeof createModifiedSchema>["body"];
export type UpdateModifiedBody = z.infer<typeof updateModifiedSchema>["body"];
export type UpdateModifiedParams = z.infer<
  typeof updateModifiedSchema
>["params"];
