import { z } from "zod";

export const PLANNING_SECTION_NAMES = [
  "overview",
  "tech-stack",
  "features",
  "timeline",
  "risks",
] as const;

const planningSectionSchema = z.enum(PLANNING_SECTION_NAMES);

export const planningSectionParamsSchema = z.object({
  section: planningSectionSchema,
});

export const updatePlanningSectionSchema = z.object({
  content: z.string().max(200_000),
});

export type PlanningSectionName = (typeof PLANNING_SECTION_NAMES)[number];
export type UpdatePlanningSectionInput = z.infer<typeof updatePlanningSectionSchema>;
