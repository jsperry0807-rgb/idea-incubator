import { describe, expect, it } from "vitest";

import type { z } from "zod";

import type { LlmClient, LlmMessage } from "../services/llm.service";
import { InterviewAgent } from "./graph";
import {
  advance,
  type Answer,
} from "./reducer";
import { emptyCoverage, type InterviewState } from "./state";

/**
 * Zero-network test double. Implements `completeStructured` directly and
 * dispatches canned, schema-valid responses by the system-prompt role, so
 * every graph test exercises prompt-build -> parse -> normalize -> event with
 * no HTTP.
 */
class ScriptedClient implements LlmClient {
  calls: Array<{ kind: "classify" | "ask" | "reevaluate"; messages: LlmMessage[] }> = [];

  async complete(): Promise<string> {
    throw new Error("Should not reach the raw HTTP path in tests");
  }

  async completeStructured<T>(schema: z.ZodType<T>, messages: LlmMessage[]): Promise<T> {
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const kind = system.includes("classify")
      ? "classify"
      : system.includes("interview founders")
        ? "ask"
        : "reevaluate";
    this.calls.push({ kind, messages });

    const fixture = FIXTURES[kind];
    const parsed = schema.safeParse(fixture);
    if (!parsed.success) {
      throw new Error(`Fixture invalid for ${kind}: ${parsed.error.message}`);
    }
    return parsed.data as T;
  }
}

const FIXTURES = {
  classify: {
    domain: { primary: "clicker-game", confidence: 0.92, signals: ["cookie clicks"] },
    open: [
      {
        id: "core-loop",
        title: "Core loop",
        why: "Capturing the loop defines every other system.",
        priority: "P0",
        eliminatesPaths: ["incremental-clicker", "match-based"],
        blocks: ["mechanics", "progression"],
        status: "open",
      },
      {
        id: "art-style",
        title: "Art style",
        why: "Asset pipeline depends on this.",
        priority: "P1",
        eliminatesPaths: ["pixel", "3d"],
        blocks: ["art-audio"],
        status: "open",
      },
    ],
  },
  ask: {
    point: {
      id: "core-loop",
      title: "Core loop",
      why: "Capturing the loop defines every other system.",
      priority: "P0",
      eliminatesPaths: ["incremental-clicker", "match-based"],
      blocks: ["mechanics", "progression"],
      status: "open",
    },
    prompt: "How should the core loop work?",
    why: "The loop determines pacing and retention.",
    options: [
      { id: "idle", label: "Idle clicker", consequence: "Simple passive play" },
      {
        id: "hybrid",
        label: "Hybrid idle + prestige",
        consequence: "More systems to design",
      },
    ],
    canSkip: true,
  },
  reevaluate: {
    opened: [
      {
        id: "upgrade-cadence",
        title: "Upgrade cadence",
        why: "How often upgrades unlock affects pacing.",
        priority: "P1",
        eliminatesPaths: ["no-upgrades", "manual-only"],
        blocks: ["mechanics", "progression"],
        status: "open",
      },
      {
        id: "prestige-layer",
        title: "Prestige layer",
        why: "Prestige is the long-term hook for idle games.",
        priority: "P1",
        eliminatesPaths: ["no-prestige", "one-time"],
        blocks: ["progression"],
        status: "open",
      },
    ],
    closed: [InterviewAgent.pointId("art-style", "GAME")],
    invalidated: [],
  },
} as const;

function makeState(overrides: Partial<InterviewState> = {}): InterviewState {
  return {
    idea: {
      id: "idea-1",
      title: "Cookie Tycoon",
      description: "An idle cookie clicker with deep upgrades.",
      projectType: "GAME",
    },
    domain: null,
    decisions: {},
    open: [],
    asked: [],
    stuck: null,
    current: null,
    synthesis: null,
    coverage: emptyCoverage(),
    phase: "CLASSIFY",
    turn: 0,
    ...overrides,
  };
}

/** Returns the current question's point id from a QUESTION_RENDERED event. */
describe("InterviewAgent.pointId", () => {
  it("is stable for equal labels and unique across different labels", () => {
    expect(InterviewAgent.pointId("Core loop", "GAME")).toBe(
      InterviewAgent.pointId("Core loop", "GAME"),
    );
    expect(InterviewAgent.pointId("Core loop", "GAME")).toMatch(/^core-loop-[a-f0-9]{4}$/);
    // Same slug but different label text must not collide.
    expect(InterviewAgent.pointId("Core Loop!", "GAME")).not.toBe(
      InterviewAgent.pointId("core loop", "GAME"),
    );
  });
});

describe("InterviewAgent.resolve classify", () => {
  it("returns a CLASSIFIED event with normalized, hashed frontier ids", async () => {
    const client = new ScriptedClient();
    const agent = new InterviewAgent(client, "en");

    const event = (await agent.resolve(makeState(), { type: "classify" }))!;
    expect(event.type).toBe("CLASSIFIED");
    if (event.type !== "CLASSIFIED") return;

    expect(event.domain).toEqual({
      primary: "clicker-game",
      confidence: 0.92,
      signals: ["cookie clicks"],
    });
    expect(event.open.map((p) => p.id)).toEqual([
      expect.stringMatching(/^core-loop-/) as unknown as string,
      expect.stringMatching(/^art-style-/) as unknown as string,
    ]);
    expect(event.open.every((p) => p.status === "open")).toBe(true);
    expect(event.open.every((p) => p.eliminatesPaths.length >= 1)).toBe(true);
    expect(client.calls.map((c) => c.kind)).toEqual(["classify"]);
  });
});

describe("InterviewAgent.resolve ask", () => {
  it("renders a question bound to the requested point", async () => {
    const client = new ScriptedClient();
    const agent = new InterviewAgent(client, "en");
    const classified = (await agent.resolve(makeState(), { type: "classify" }))!;
    const state = advance(makeState(), classified).state;
    const target = state.open[0];
    const event = (await agent.resolve(state, { type: "ask", pointId: target.id }))!;

    expect(event.type).toBe("QUESTION_RENDERED");
    if (event.type !== "QUESTION_RENDERED") return;
    expect(event.question.point.id).toBe(target.id);
    expect(event.question.options.length).toBeGreaterThanOrEqual(2);
  });
});

describe("hybrid answer full pipeline (graph + reducer, zero network)", () => {
  it("opens upgrade-cadence and prestige-layer and keeps going", async () => {
    const client = new ScriptedClient();
    const agent = new InterviewAgent(client, "en");
    let state = makeState();

    // START -> CLASSIFIED
    const classified = (await agent.resolve(state, { type: "classify" }))!;
    state = advance(state, classified).state;
    expect(state.open.map((p) => p.priority)).toEqual(["P0", "P1"]);

    // ask the P0 core-loop
    const coreLoopId = state.open[0].id;
    const renderedEvent = (await agent.resolve(state, {
      type: "ask",
      pointId: coreLoopId,
    }))!;
    let result = advance(state, renderedEvent);
    state = result.state;
    expect(state.current?.point.id).toBe(coreLoopId);

    // answer hybrid -> reevaluate
    const answer: Answer = {
      pointId: coreLoopId,
      optionId: "hybrid",
      value: "Hybrid idle + prestige loop",
      freeText: null,
    };
    result = advance(state, { type: "ANSWERED", answer });
    expect(result.directives).toEqual([{ type: "reevaluate", answer }]);

    const reevaluated = await agent.resolve(result.state, {
      type: "reevaluate",
      answer,
    });
    result = advance(result.state, reevaluated!);
    state = result.state;

    const openIds = state.open.map((p) => p.id);
    expect(openIds).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^upgrade-cadence-/) as unknown as string,
        expect.stringMatching(/^prestige-layer-/) as unknown as string,
      ]),
    );
    expect(state.open.map((p) => p.id)).not.toContain(
      expect.stringMatching(/^art-style-/) as unknown as string,
    );

    const decision = state.decisions[coreLoopId];
    expect(decision?.optionId).toBe("hybrid");
    expect(decision?.closedPointIds).toEqual(
      expect.arrayContaining([InterviewAgent.pointId("art-style", "GAME")]),
    );

    // pipeline continues: afterResolution asks the next priority point
    expect(result.directives[0]?.type).toBe("ask");
    const nextId = (result.directives[0] as { pointId: string }).pointId;
    expect(state.open.some((p) => p.id === nextId)).toBe(true);

    expect(client.calls.map((c) => c.kind)).toEqual([
      "classify",
      "ask",
      "reevaluate",
    ]);
  });
});