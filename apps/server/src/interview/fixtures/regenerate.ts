/**
 * Observed-tier trace regeneration.
 *
 * Runs the three seed ideas against the REAL provider and writes the resulting
 * branch structure to `interview/fixtures/observed/`. This is the tier that
 * shows what the prompts actually do, as opposed to the golden tier's
 * hand-authored expectations.
 *
 *   pnpm --filter @repo/server interview:regenerate-fixtures
 *
 * Requires LLM_API_KEY. Output is reviewed as a diff and committed deliberately
 * — never auto-committed. A silent regeneration would let prompt regressions
 * through unnoticed, which is the exact failure mode the golden tier prevents.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { InterviewAgent } from '../graph';
import { runLoop } from '../loop';
import { llm } from '../../services/llm.service';
import { env } from '../../config/env';
import { SEED_IDEAS, type SeedIdea } from './index';
import { initialState } from './trace-runner';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(HERE, 'observed');

/** Max user turns before we stop and record what we have. */
const MAX_TURNS = 8;

interface ObservedPoint {
  id: string;
  title: string;
  priority: string;
  blocks: string[];
}

interface ObservedTrace {
  seed: string;
  projectType: string;
  generatedAt: string;
  model: string | null;
  synthesisModel: string | null;
  turns: Array<{
    turn: number;
    askedPoint: ObservedPoint | null;
    prompt: string;
    options: string[];
    action: string;
    frontierAfter: ObservedPoint[];
    opened: string[];
    closed: string[];
    phase: string;
  }>;
  synthesis: {
    recommendation: string;
    keyTradeoffs: string[];
    strongestDisagreement: string;
    forPointId: string;
  } | null;
  finalPhase: string;
  finalCoverage: Record<string, number>;
}

function summarize(point: ObservedPoint) {
  return {
    id: point.id,
    title: point.title,
    priority: point.priority,
    blocks: point.blocks,
  };
}

async function observe(seed: SeedIdea): Promise<ObservedTrace> {
  const agent = new InterviewAgent(llm, 'en', {
    ...(env.LLM_SYNTHESIS_MODEL ? { synthesisModel: env.LLM_SYNTHESIS_MODEL } : {}),
  });

  const started = Date.now();
  let state = initialState(seed);
  const started0 = await runLoop(agent, state, [{ type: 'START' }]);
  state = started0.state;

  const trace: ObservedTrace = {
    seed: seed.id,
    projectType: seed.projectType,
    generatedAt: new Date().toISOString(),
    model: env.LLM_MODEL ?? null,
    synthesisModel: env.LLM_SYNTHESIS_MODEL ?? null,
    turns: [],
    synthesis: null,
    finalPhase: state.phase,
    finalCoverage: state.coverage,
  };

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const current = state.current;
    if (!current) break;

    const point = summarize({
      id: current.point.id,
      title: current.point.title,
      priority: current.point.priority,
      blocks: current.point.blocks,
    });

    // Answer with the first option so runs stay comparable across regenerations.
    const optionId = current.options[0]?.id ?? 'unspecified';
    const answer = {
      pointId: current.point.id,
      optionId,
      value: current.options[0]?.label ?? optionId,
      freeText: null,
    };

    const result = await runLoop(agent, state, [{ type: 'ANSWERED', answer }]);
    state = result.state;
    const decision = state.decisions[current.point.id];

    trace.turns.push({
      turn,
      askedPoint: point,
      prompt: current.prompt,
      options: current.options.map((o) => o.id),
      action: optionId,
      frontierAfter: state.open.map((p) =>
        summarize({
          id: p.id,
          title: p.title,
          priority: p.priority,
          blocks: p.blocks,
        })
      ),
      opened: (decision?.openedPointIds ?? []).map(
        (id) => state.open.find((p) => p.id === id)?.title ?? id
      ),
      closed: (decision?.closedPointIds ?? []).map(
        (id) => state.open.find((p) => p.id === id)?.title ?? id
      ),
      phase: state.phase,
    });

    if (state.phase === 'READY' || state.phase === 'DONE') break;
  }

  trace.synthesis = state.synthesis;
  trace.finalPhase = state.phase;
  trace.finalCoverage = state.coverage;

  const elapsed = Date.now() - started;
  console.log(
    `  ${seed.id}: ${trace.turns.length} turns, phase ${trace.finalPhase}, ${elapsed}ms` +
      (trace.synthesis ? ', synthesized' : '')
  );
  return trace;
}

async function main() {
  if (!env.LLM_API_KEY) {
    console.error(
      'LLM_API_KEY is not set. The observed tier needs a real provider.\n' +
        'The golden tier (pnpm --filter @repo/server test) runs with no key.'
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  console.log('Regenerating observed traces...');
  for (const seed of SEED_IDEAS) {
    const trace = await observe(seed);
    const file = path.join(OUT_DIR, `${seed.id}.json`);
    await writeFile(file, `${JSON.stringify(trace, null, 2)}\n`, 'utf8');
    console.log(`  wrote ${path.relative(process.cwd(), file)}`);
  }

  console.log(
    '\nReview this output as a diff before committing — it is a record of what\n' +
      'the prompts actually did, not an assertion that they did the right thing.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
