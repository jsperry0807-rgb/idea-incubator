import { z } from "zod";
import { cidSchema } from "./common";
import { ShareRole } from "../enums";

export const createShareSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z
    .nativeEnum(ShareRole)
    .default("VIEW"),
});

export const updateShareSchema = z.object({
  role: z.nativeEnum(ShareRole),
});

export const shareIdParamsSchema = z.object({
  shareId: cidSchema,
});

export type CreateShareInput = z.infer<typeof createShareSchema>;
export type UpdateShareInput = z.infer<typeof updateShareSchema>;