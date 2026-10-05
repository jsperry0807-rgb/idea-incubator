import { zodToJsonSchema } from 'zod-to-json-schema';
import type { z } from 'zod';

import { env } from '../config/env';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompleteOptions {
  temperature?: number;
  maxTokens?: number;
  /** Per-call model override (e.g. route synthesis to a stronger model). */
  model?: string;
  /** Per-call override of {@link LLM_REQUEST_TIMEOUT_MS}. */
  timeoutMs?: number;
}

/** Wall-clock ceiling for a single provider request. */
export const LLM_REQUEST_TIMEOUT_MS = 30_000;

export interface LlmClient {
  complete(messages: LlmMessage[], options?: LlmCompleteOptions): Promise<string>;
  /** Returns `null` when the model text cannot be parsed/validated after retries. */
  completeStructured<T>(
    schema: z.ZodType<T>,
    messages: LlmMessage[],
    options?: LlmCompleteOptions
  ): Promise<T>;
}

export interface LlmClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Minimal OpenAI-compatible chat completions client.
 *
 * The interview engine depends on the {@link LlmClient} interface, not this
 * provider, so a different host or provider can be swapped in without touching
 * `interview/`. Keys come from the server env only and never reach the client.
 */
export class OpenAICompatibleClient implements LlmClient {
  constructor(private readonly config: LlmClientConfig) {}

  async complete(messages: LlmMessage[], options: LlmCompleteOptions = {}): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.apiKey}`,
      },
      // Without a signal a provider that accepts the connection and then stalls
      // pins this request forever, holding a handler and a connection-pool slot
      // until the client gives up.
      signal: AbortSignal.timeout(options.timeoutMs ?? LLM_REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model: options.model ?? this.config.model,
        messages,
        temperature: options.temperature ?? 0.7,
        ...(options.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed (${response.status} ${response.statusText})`);
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
      throw new Error('LLM response contained no content');
    }

    return content;
  }

  async completeStructured<T>(
    schema: z.ZodType<T>,
    messages: LlmMessage[],
    options: LlmCompleteOptions = {}
  ): Promise<T> {
    // zod-to-json-schema's d.ts still targets the Zod-3 `ZodSchema<any>`
    // alias; Zod 4 schemas convert fine at runtime, so the cast is
    // type-only.
    const jsonSchema = zodToJsonSchema(schema as unknown as Parameters<typeof zodToJsonSchema>[0], {
      name: 'response',
    });
    const schemaNote: LlmMessage = {
      role: 'system',
      content:
        'Return JSON only, conforming exactly to the provided JSON schema. ' +
        `Do not wrap it in markdown. Schema: ${JSON.stringify(jsonSchema)}`,
    };

    let lastError = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      const chatMessages =
        attempt === 0
          ? [...messages, schemaNote]
          : [
              ...messages,
              schemaNote,
              {
                role: 'user' as const,
                content: `Your previous response failed validation: ${lastError}\nReturn corrected JSON conforming to the schema — JSON only.`,
              },
            ];

      const text = await this.complete(chatMessages, {
        ...options,
        temperature: 0,
      });
      const parsed = extractJson(text);
      if (parsed === null) {
        lastError = 'response was not valid JSON';
        continue;
      }

      const result = schema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
      lastError = result.error.message;
    }

    throw new Error(`LLM structured output failed validation: ${lastError}`);
  }
}

/** Extracts a JSON value from model text, tolerating code fences. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate.trim());
  } catch {
    return null;
  }
}

/**
 * Builds the app's LLM client from server env.
 *
 * Returns a client that throws a descriptive error on use when no API key is
 * configured, so the server boots fine and only the interview feature surfaces
 * the missing-configuration problem.
 */
export function createLlmClient(): LlmClient {
  const apiKey = env.LLM_API_KEY;
  if (!apiKey) {
    return {
      async complete() {
        throw new Error(
          'LLM_API_KEY is not configured. Set it in apps/server/.env to use the AI interview.'
        );
      },
      async completeStructured() {
        throw new Error(
          'LLM_API_KEY is not configured. Set it in apps/server/.env to use the AI interview.'
        );
      },
    };
  }

  return new OpenAICompatibleClient({
    apiKey,
    baseUrl: (env.LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, ''),
    model: env.LLM_MODEL ?? 'gpt-4o-mini',
  });
}

export const llm: LlmClient = createLlmClient();
