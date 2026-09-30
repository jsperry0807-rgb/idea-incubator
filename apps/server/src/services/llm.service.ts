import { env } from "../config/env";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmCompleteOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LlmClient {
  complete(messages: LlmMessage[], options?: LlmCompleteOptions): Promise<string>;
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

  async complete(
    messages: LlmMessage[],
    options: LlmCompleteOptions = {},
  ): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: options.temperature ?? 0.7,
        ...(options.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `LLM request failed (${response.status} ${response.statusText})`,
      );
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new Error("LLM response contained no content");
    }

    return content;
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
          "LLM_API_KEY is not configured. Set it in apps/server/.env to use the AI interview.",
        );
      },
    };
  }

  return new OpenAICompatibleClient({
    apiKey,
    baseUrl: (env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    model: env.LLM_MODEL ?? "gpt-4o-mini",
  });
}

export const llm: LlmClient = createLlmClient();