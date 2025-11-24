import { z } from "zod";

// ImageSet 스키마
const imageSetSchema = z.object({
  name: z
    .string()
    .min(1, "name is required and must be a non-empty string")
    .trim(),
  color: z
    .string()
    .min(1, "color is required and must be a non-empty string")
    .trim(),
  src: z
    .string()
    .min(1, "src is required and must be a non-empty string")
    .trim(),
});

// POST /modified 스키마
export const createModifiedSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "name field is required and must be a non-empty string")
      .trim(),
    imageSrc: z
      .string()
      .min(1, "imageSrc field is required and must be a string"),
    itemFunction: z.union([z.enum(["Gallery", "Link", "Board"]), z.null()]),
    coordinates: z.object({
      x: z.number({
        message: "coordinates.x is required and must be a number",
      }),
      y: z.number({
        message: "coordinates.y is required and must be a number",
      }),
    }),
    imageSets: z.array(imageSetSchema).optional(),
    description: z.string().optional(),
    isReversed: z.boolean().optional(),
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
      imageSrc: z.string().optional(),
      imageSets: z.any().optional(), // 업데이트 불가 (별도 검증)
      isReversed: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Request body cannot be empty",
    })
    .refine((data) => data.imageSets === undefined, {
      message:
        "imageSets cannot be updated. Please create a new modified object instead.",
    }),
});

// 타입 추출
export type CreateModifiedBody = z.infer<typeof createModifiedSchema>["body"];
export type UpdateModifiedBody = z.infer<typeof updateModifiedSchema>["body"];
export type UpdateModifiedParams = z.infer<
  typeof updateModifiedSchema
>["params"];
