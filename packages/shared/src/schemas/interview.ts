import { z } from "zod";

import { planningSectionSchema } from "./planning";

export const prioritySchema = z.enum(["P0", "P1", "P2", "P3"]);
export type InterviewPriority = z.infer<typeof prioritySchema>;

export const decisionPointSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  why: z.string().min(1),
  priority: prioritySchema,
  eliminatesPaths: z.array(z.string().min(1)).min(1),
  blocks: z.array(planningSectionSchema),
  status: z.enum(["open", "resolved", "deferred"]),
});

export const questionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  consequence: z.string().optional(),
});

export const questionSchema = z.object({
  point: decisionPointSchema,
  prompt: z.string().min(1),
  why: z.string().min(1),
  options: z.array(questionOptionSchema).min(2),
  canSkip: z.boolean().default(true),
});

export const synthesisSchema = z.object({
  recommendation: z.string().min(1),
  keyTradeoffs: z.array(z.string()).min(1),
  strongestDisagreement: z.string().min(1),
  forPointId: z.string().min(1),
});

export const answerInterviewSchema = z.object({
  pointId: z.string().min(1),
  optionId: z.string().min(1),
  value: z.string().min(1),
  freeText: z.string().max(5000).nullable().optional(),
});

export const deferInterviewSchema = z.object({
  pointId: z.string().min(1),
  reason: z.string().max(2000).optional(),
});

export const synthesisRequestSchema = z.object({
  pointId: z.string().min(1),
});

export type DecisionPoint = z.infer<typeof decisionPointSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Synthesis = z.infer<typeof synthesisSchema>;
export type AnswerInterviewInput = z.infer<typeof answerInterviewSchema>;
export type DeferInterviewInput = z.infer<typeof deferInterviewSchema>;
export type SynthesisRequestInput = z.infer<typeof synthesisRequestSchema>;