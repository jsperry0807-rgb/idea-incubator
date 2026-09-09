import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { ValidationError } from "../lib/errors";

type Source = "body" | "query" | "params";

type SourceSchema = { [K in Source]?: ZodType };

const SOURCES: Source[] = ["body", "query", "params"];

export function validate(sourceConfig: ZodType | SourceSchema) {
  const config: SourceSchema = SOURCES.some((s) => s in (sourceConfig as object))
    ? (sourceConfig as SourceSchema)
    : { body: sourceConfig as ZodType };

  return (req: Request, _res: Response, next: NextFunction) => {
    const sourceEntries = Object.entries(config) as [Source, ZodType][];

    for (const [source, schema] of sourceEntries) {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        next(
          new ValidationError(
            {
              source,
              fields: result.error.flatten().fieldErrors,
            },
            `Validation failed for ${source}`,
          ),
        );
        return;
      }
      req[source] = result.data as never;
    }

    next();
  };
}
