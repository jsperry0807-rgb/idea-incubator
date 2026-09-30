import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  extractJson,
  OpenAICompatibleClient,
} from "../services/llm.service";

const CONFIG = {
  apiKey: "test-key",
  baseUrl: "https://llm.example.com/v1",
  model: "test-model",
};

function client() {
  return new OpenAICompatibleClient(CONFIG);
}

function okFetch(content: string) {
  return vi.fn(async () =>
    new Response(
      JSON.stringify({ choices: [{ message: { content } }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
}

const schema = z.object({ decision: z.string().min(1), score: z.number() });

describe("extractJson", () => {
  it("parses bare JSON and JSON wrapped in fences", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson("not json")).toBeNull();
  });
});

describe("OpenAICompatibleClient.completeStructured", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("parses and validates a well-formed response", async () => {
    const fetchMock = okFetch('{"decision":"ship","score":0.8}');
    vi.stubGlobal("fetch", fetchMock);

    const out = await client().completeStructured(
      schema,
      [{ role: "user", content: "hi" }],
    );

    expect(out).toEqual({ decision: "ship", score: 0.8 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once with validation feedback when the model returns bad JSON", async () => {
    const badContent = JSON.stringify({
      choices: [{ message: { content: "not json at all" } }],
    });
    const goodContent = JSON.stringify({
      choices: [{ message: { content: '{"decision":"ship","score":1}' } }],
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(badContent, { status: 200 }))
      .mockResolvedValueOnce(new Response(goodContent, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const out = await client().completeStructured(
      schema,
      [{ role: "user", content: "hi" }],
    );

    expect(out).toEqual({ decision: "ship", score: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries once with validation feedback when the schema rejects", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"decision":""}' } }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"decision":"ship","score":0.5}' } }],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const out = await client().completeStructured(
      schema,
      [{ role: "user", content: "hi" }],
    );

    expect(out).toEqual({ decision: "ship", score: 0.5 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws with a descriptive error after two failed attempts", async () => {
    const badContent = JSON.stringify({
      choices: [{ message: { content: "not json" } }],
    });
    const fetchMock = vi.fn(async () => new Response(badContent, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      client().completeStructured(schema, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(/failed validation/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("OpenAICompatibleClient model routing", () => {
  afterEach(() => vi.unstubAllGlobals());

  function modelOf(call: unknown): string | undefined {
    return (call as [string, { body: string }])[1].body
      ? (JSON.parse((call as [string, { body: string }])[1].body) as { model: string })
          .model
      : undefined;
  }

  it("uses the configured default model when no override is given", async () => {
    const fetchMock = okFetch('{"decision":"ship","score":1}');
    vi.stubGlobal("fetch", fetchMock);

    await client().completeStructured(schema, [{ role: "user", content: "hi" }]);

    expect(modelOf(fetchMock.mock.calls[0])).toBe("test-model");
  });

  it("uses the per-call override when one is given, and keeps it on retry", async () => {
    const fetchMock = okFetch('{"decision":"ship","score":1}');
    vi.stubGlobal("fetch", fetchMock);

    await client().completeStructured(schema, [{ role: "user", content: "hi" }], {
      model: "strong-model",
    });

    expect(modelOf(fetchMock.mock.calls[0])).toBe("strong-model");
  });

  it("still retries on the override model rather than falling back", async () => {
    const bad = JSON.stringify({ choices: [{ message: { content: "nope" } }] });
    const good = JSON.stringify({
      choices: [{ message: { content: '{"decision":"ship","score":1}' } }],
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(bad, { status: 200 }))
      .mockResolvedValueOnce(new Response(good, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await client().completeStructured(schema, [{ role: "user", content: "hi" }], {
      model: "strong-model",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(modelOf)).toEqual([
      "strong-model",
      "strong-model",
    ]);
  });
});