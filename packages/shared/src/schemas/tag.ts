import { z } from "zod";

const tagNameSchema = z.string().trim().min(1).max(50);

const tagColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #FF6B6B")
  .optional()
  .nullable();

export const createTagSchema = z.object({
  name: tagNameSchema,
  color: tagColorSchema,
});

export const updateTagSchema = z
  .object({
    name: tagNameSchema.optional(),
    color: tagColorSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;