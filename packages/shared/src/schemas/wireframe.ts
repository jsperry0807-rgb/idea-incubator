import { z } from 'zod';

export const wireframeNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(48)
  .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and dashes');

export const uploadWireframeSchema = z.object({
  name: wireframeNameSchema,
  html: z.string().min(1).max(500_000),
});

export type WireframeFilename = string;

export interface Wireframe {
  filename: WireframeFilename;
  html: string;
}

export type UploadWireframeInput = z.infer<typeof uploadWireframeSchema>;
