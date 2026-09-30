import { describe, expect, it } from "vitest";

import type { DecisionPoint, Question } from "@repo/shared";

import {
  advance,
  computeCoverage,
  selectPoint,
  type InterviewEvent,
} from "./reducer";
import {
  emptyCoverage,
  MAX_TURNS,
  STUCK_ATTEMPTS,
  type InterviewState,
} from "./state";

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

function point(
  id: string,
  priority: DecisionPoint["priority"],
  blocks: DecisionPoint["blocks"],
  title = `Point ${id}`,
): DecisionPoint {
  return {
    id,
    title,
    why: `Why ${id}`,
    priority,
    eliminatesPaths: [`path-${id}`],
    blocks,
    status: "open",
  };
}

function makeQuestion(p: DecisionPoint, optionIds: string[] = []): Question {
  return {
    point: p,
    prompt: `How to handle ${p.id}?`,
    why: p.why,
    options: [
      { id: "opt-a", label: "Option A", consequence: "Goes A" },
      { id: "opt-b", label: "Option B", consequence: "Goes B" },
      ...optionIds.slice(2).map((id) => ({ id, label: `Option ${id}` })),
    ],
    canSkip: true,
  };
}

/** Drives a single event without requiring assertions in the middle. */
function drive(state: InterviewState, event: InterviewEvent) {
  return advance(state, event).state;
}

/** Pulls the answer out of a `REEVALUATED`-ready directive chain. */
function answerFor(result: ReturnType<typeof advance>) {
  const directive = result.directives.find(
    (d) => d.type === "reevaluate",
  ) as Extract<InterviewEvent, { type: "REEVALUATED" }> | undefined;
  return directive!.answer;
}

const CORE_LOOP = point("core-loop", "P0", ["mechanics", "progression"]);
const ART_STYLE = point("art-style", "P1", ["art-audio"]);
const MONETIZATION = point("monetization", "P1", ["playtest"]);
const UPGRADE_CADENCE = point(
  "upgrade-cadence",
  "P1",
  ["mechanics", "progression"],
  "Upgrade cadence",
);
const PRESTIGE_LAYER = point("prestige-layer", "P1", ["progression"], "Prestige layer");

const CLASSIFIED: Extract<InterviewEvent, { type: "CLASSIFIED" }> = {
  type: "CLASSIFIED",
  domain: {
    primary: "clicker-game",
    confidence: 0.92,
    signals: ["cookie clicks", "idle earnings"],
  },
  open: [CORE_LOOP, ART_STYLE, MONETIZATION],
};

const HYBRID: Extract<InterviewEvent, { type: "ANSWERED" }> = {
  type: "ANSWERED",
  answer: {
    pointId: "core-loop",
    optionId: "hybrid",
    value: "Hybrid idle + prestige loop",
    freeText: null,
  },
};

const HYBRID_REEVAL: Extract<InterviewEvent, { type: "REEVALUATED" }> = {
  type: "REEVALUATED",
  answer: HYBRID.answer,
  opened: [UPGRADE_CADENCE, PRESTIGE_LAYER],
  closed: ["art-style"],
  invalidated: [],
};

describe("advance START", () => {
  it("emits a classify directive on a fresh CLASSIFY state", () => {
    const result = advance(makeState(), { type: "START" });
    expect(result.directives).toEqual([{ type: "classify" }]);
    expect(result.state.phase).toBe("CLASSIFY");
  });

  it("is a no-op once classification has happened", () => {
    const state = makeState({ phase: "ASK", open: [CORE_LOOP] });
    const result = advance(state, { type: "START" });
    expect(result.directives).toEqual([]);
    expect(result.state.phase).toBe("ASK");
  });
});

describe("advance CLASSIFIED", () => {
  it("seeds the P0/P1 frontier and asks the highest-priority point", () => {
    const result = advance(makeState(), CLASSIFIED);
    expect(result.state.phase).toBe("ASK");
    expect(result.state.domain?.primary).toBe("clicker-game");
    expect(result.state.open.map((p) => p.id)).toEqual(
      expect.arrayContaining(["core-loop", "art-style", "monetization"]),
    );
    expect(result.state.open.every((p) => p.status === "open")).toBe(true);
    expect(result.directives).toEqual([{ type: "ask", pointId: "core-loop" }]);
  });

  it("rejects a frontier point that eliminates no paths", () => {
    const bad: DecisionPoint = { ...CORE_LOOP, eliminatesPaths: [] };
    expect(() => {
      advance(makeState(), {
        ...CLASSIFIED,
        open: [bad, ART_STYLE],
      });
    }).toThrow();
  });
});

describe("selectPoint", () => {
  it("picks the highest-priority unasked point", () => {
    const selected = selectPoint({ open: [MONETIZATION, CORE_LOOP], asked: [] });
    expect(selected?.priority).toBe("P0");
    expect(selected?.id).toBe("core-loop");
  });

  it("never re-asks a point already in `asked`", () => {
    const selected = selectPoint({
      open: [CORE_LOOP, ART_STYLE],
      asked: ["core-loop"],
    });
    expect(selected?.id).toBe("art-style");
  });

  it("returns null when every open point has been asked", () => {
    expect(
      selectPoint({ open: [ART_STYLE], asked: ["art-style"] }),
    ).toBeNull();
  });
});

describe("advance QUESTION_RENDERED", () => {
  it("records the asked point and stores the current question", () => {
    const state = drive(drive(makeState(), CLASSIFIED), {
      type: "QUESTION_RENDERED",
      question: makeQuestion(CORE_LOOP),
    });
    expect(state.asked).toContain("core-loop");
    expect(state.current?.point.id).toBe("core-loop");
  });

  it("never duplicates an asked id", () => {
    const preAsked = drive(makeState(), CLASSIFIED);
    let state = drive(preAsked, {
      type: "QUESTION_RENDERED",
      question: makeQuestion(CORE_LOOP),
    });
    state = drive(state, {
      type: "QUESTION_RENDERED",
      question: makeQuestion(CORE_LOOP),
    });
    expect(state.asked.filter((id) => id === "core-loop")).toHaveLength(1);
  });
});

describe("hybrid answer on core-loop (clicker-game trace)", () => {
  it("opens upgrade-cadence and prestige-layer, closes art-style", () => {
    const state = drive(makeState(), CLASSIFIED);
    const rendered = drive(state, {
      type: "QUESTION_RENDERED",
      question: makeQuestion(CORE_LOOP),
    });
    const answered = advance(rendered, HYBRID);
    expect(answered.directives).toEqual([
      { type: "reevaluate", answer: HYBRID.answer },
    ]);

    const result = advance(answered.state, HYBRID_REEVAL);

    const openIds = result.state.open.map((p) => p.id);
    expect(openIds).toContain("upgrade-cadence");
    expect(openIds).toContain("prestige-layer");
    expect(openIds).not.toContain("art-style");
    expect(openIds).toContain("monetization");

    const decision = result.state.decisions["core-loop"];
    expect(decision).toMatchObject({
      pointId: "core-loop",
      optionId: "hybrid",
      value: "Hybrid idle + prestige loop",
      closedPointIds: ["art-style"],
      blocks: ["mechanics", "progression"],
      deferred: false,
    });
    expect(decision.openedPointIds).toEqual(
      expect.arrayContaining(["upgrade-cadence", "prestige-layer"]),
    );

    // Coverage is re-derived: sections with remaining open blockers stay 0.
    expect(result.state.coverage.overview).toBe(1);
    expect(result.state.coverage.progression).toBe(0);
    expect(result.state.coverage["art-audio"]).toBe(1);

    // Next question targets the highest-priority unasked point. After the
    // hybrid opens the secondary points, ties keep frontier order, so the
    // pre-existing P1 (monetization) is asked before the new P1s.
    expect(result.directives).toEqual([
      { type: "ask", pointId: "monetization" },
    ]);
  });

  it("does NOT open secondary points for a pure-incremental answer", () => {
    const state = drive(makeState(), CLASSIFIED);
    const rendered = drive(state, {
      type: "QUESTION_RENDERED",
      question: makeQuestion(CORE_LOOP),
    });
    const answered = advance(rendered, HYBRID);
    const result = advance(answered.state, {
      type: "REEVALUATED",
      answer: HYBRID.answer,
      opened: [],
      closed: [],
      invalidated: [],
    });

    const openIds = result.state.open.map((p) => p.id);
    expect(openIds).not.toContain("upgrade-cadence");
    expect(openIds).not.toContain("prestige-layer");
    expect(openIds).toContain("art-style");
  });
});

describe("reevaluation & invalidation", () => {
  it("an invalidated open point is closed out of the plan", () => {
    const state = drive(makeState(), CLASSIFIED);
    const rendered = drive(state, {
      type: "QUESTION_RENDERED",
      question: makeQuestion(CORE_LOOP),
    });
    const answered = advance(rendered, HYBRID);
    const result = advance(answered.state, {
      type: "REEVALUATED",
      answer: HYBRID.answer,
      opened: [],
      closed: [],
      invalidated: ["monetization"],
    });

    expect(result.state.open.map((p) => p.id)).not.toContain("monetization");
    expect(result.state.decisions["core-loop"]?.closedPointIds).toContain(
      "monetization",
    );
  });
});

describe("stuck handling", () => {
  it("records stuck attempts on skip", () => {
    const state = makeState({
      phase: "ASK",
      open: [CORE_LOOP, ART_STYLE],
      asked: ["core-loop"],
      current: makeQuestion(CORE_LOOP),
    });
    const result = advance(state, { type: "SKIPPED", pointId: "core-loop" });
    expect(result.state.stuck).toEqual({ pointId: "core-loop", attempts: 1 });
    expect(result.directives).toEqual([{ type: "ask", pointId: "art-style" }]);
  });

  it(`synthesizes after ${STUCK_ATTEMPTS} non-committal attempts on one point`, () => {
    const state = makeState({
      phase: "ASK",
      open: [CORE_LOOP, ART_STYLE],
      asked: ["core-loop"],
      current: makeQuestion(CORE_LOOP),
    });
    const first = advance(state, { type: "SKIPPED", pointId: "core-loop" });
    const rendered = advance(first.state, {
      type: "QUESTION_RENDERED",
      question: makeQuestion(ART_STYLE),
    });
    const result = advance(rendered.state, {
      type: "SKIPPED",
      pointId: "core-loop",
    });

    expect(result.state.phase).toBe("SYNTHESIZE");
    expect(result.state.stuck).toEqual({ pointId: "core-loop", attempts: 2 });
    expect(result.directives).toEqual([
      { type: "synthesize", pointId: "core-loop" },
    ]);
  });

  it("synthesizes when the frontier has nothing left to ask", () => {
    const state = makeState({
      phase: "ASK",
      open: [ART_STYLE],
      asked: ["art-style"],
      current: makeQuestion(ART_STYLE),
    });
    const result = advance(state, { type: "SKIPPED", pointId: "art-style" });
    expect(result.state.phase).toBe("SYNTHESIZE");
    expect(result.directives).toEqual([
      { type: "synthesize", pointId: "art-style" },
    ]);
  });
});

describe("advance DEFERRED", () => {
  it("removes the point and records it as a deferred assumption", () => {
    const state = makeState({
      phase: "ASK",
      open: [ART_STYLE, MONETIZATION],
      asked: ["art-style"],
      current: makeQuestion(ART_STYLE),
    });
    const result = advance(state, {
      type: "DEFERRED",
      pointId: "art-style",
      reason: "Assume pixel art for now",
    });

    expect(result.state.open.map((p) => p.id)).toEqual(["monetization"]);
    const decision = result.state.decisions["art-style"];
    expect(decision.deferred).toBe(true);
    expect(decision.value).toContain("Assume pixel art for now");
    expect(decision.closedPointIds).toContain("art-style");
    // Deferring the last blocking point on required sections satisfies
    // coverage, so the interview settles READY.
    expect(result.state.phase).toBe("READY");
  });
});

describe("termination", () => {
  it("reaches READY when all P0s are resolved and coverage is met", () => {
    const toResolve = point("monetization", "P1", ["playtest"]);
    const state = makeState({
      phase: "ASK",
      open: [toResolve],
      current: makeQuestion(toResolve),
      coverage: computeCoverage([toResolve]),
    });
    const answered = advance(state, {
      type: "ANSWERED",
      answer: {
        pointId: "monetization",
        optionId: "ads",
        value: "Free with ads",
        freeText: null,
      },
    });
    const result = advance(answered.state, {
      type: "REEVALUATED",
      answer: answerFor(answered),
      opened: [],
      closed: [],
      invalidated: [],
    });

    expect(result.state.phase).toBe("READY");
    expect(result.directives).toEqual([
      { type: "complete", reason: "ready" },
    ]);
  });

  it(`terminates with turn-cap at ${MAX_TURNS} turns`, () => {
    const toResolve = point("monetization", "P1", ["playtest"]);
    const state = makeState({
      phase: "ASK",
      turn: MAX_TURNS - 1,
      open: [toResolve],
      current: makeQuestion(toResolve),
      coverage: computeCoverage([toResolve]),
    });
    const answered = advance(state, {
      type: "ANSWERED",
      answer: {
        pointId: "monetization",
        optionId: "ads",
        value: "Free with ads",
        freeText: null,
      },
    });
    const result = advance(answered.state, {
      type: "REEVALUATED",
      answer: answerFor(answered),
      opened: [],
      closed: [],
      invalidated: [],
    });

    expect(result.state.turn).toBe(MAX_TURNS);
    expect(result.state.phase).toBe("DONE");
    expect(result.directives).toEqual([
      { type: "complete", reason: "turn-cap" },
    ]);
  });
});