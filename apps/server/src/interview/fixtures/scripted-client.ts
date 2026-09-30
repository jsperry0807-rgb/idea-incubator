import type { z } from "zod";

import type {
  LlmClient,
  LlmCompleteOptions,
  LlmMessage,
} from "../../services/llm.service";
import type { ClassifyOutput } from "../prompts/classify";
import type { QuestionOutput } from "../prompts/question";
import type { ReevaluateOutput } from "../prompts/reevaluate";
import type { SynthesisOutput } from "../prompts/synthesis";

/**
 * Canned, schema-valid model responses for one golden trace, dispatched by
 * directive kind. This is the seam that lets a trace run with no API key: the
 * agent's prompt-build -> parse -> normalize -> event path is exercised for
 * real, only the network call is replaced.
 */
export interface TraceScript {
  classify: ClassifyOutput;
  /** Consumed in call order — one entry per `ask` directive. */
  questions: QuestionOutput[];
  /** Consumed in call order — one entry per `reevaluate` directive. */
  reevaluations: ReevaluateOutput[];
  /** Consumed in call order — one entry per `synthesize` directive. */
  syntheses: SynthesisOutput[];
}

export type DirectiveKind = "classify" | "ask" | "reevaluate" | "synthesize";

export interface RecordedCall {
  kind: DirectiveKind;
  model: string | undefined;
  messages: LlmMessage[];
}

const KIND_MARKERS: Array<[DirectiveKind, string]> = [
  ["classify", "You classify new product ideas"],
  ["ask", "You interview founders on a specific decision point"],
  ["reevaluate", "You maintain a frontier of open decision points"],
  ["synthesize", "You give a decisive 3-part verdict"],
];

function kindOf(messages: LlmMessage[]): DirectiveKind {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  for (const [kind, marker] of KIND_MARKERS) {
    if (system.includes(marker)) return kind;
  }
  throw new Error("Unrecognized prompt: no directive marker found");
}

export class ScriptedTraceClient implements LlmClient {
  readonly calls: RecordedCall[] = [];
  private readonly cursors: Record<DirectiveKind, number> = {
    classify: 0,
    ask: 0,
    reevaluate: 0,
    synthesize: 0,
  };

  constructor(private readonly script: TraceScript) {}

  async complete(): Promise<string> {
    throw new Error("Golden traces must not reach the raw HTTP path");
  }

  async completeStructured<T>(
    schema: z.ZodType<T>,
    messages: LlmMessage[],
    options?: LlmCompleteOptions,
  ): Promise<T> {
    const kind = kindOf(messages);
    this.calls.push({ kind, model: options?.model, messages });

    const queue: unknown[] =
      kind === "classify"
        ? [this.script.classify]
        : kind === "ask"
          ? this.script.questions
          : kind === "reevaluate"
            ? this.script.reevaluations
            : this.script.syntheses;

    const index = this.cursors[kind]++;
    const fixture = queue[index];
    if (fixture === undefined) {
      throw new Error(
        `Golden trace ran out of "${kind}" responses (wanted #${index + 1}, scripted ${queue.length})`,
      );
    }

    const parsed = schema.safeParse(fixture);
    if (!parsed.success) {
      throw new Error(
        `Trace fixture invalid for ${kind} #${index + 1}: ${parsed.error.message}`,
      );
    }
    return parsed.data as T;
  }
}
