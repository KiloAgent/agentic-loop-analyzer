# agentic-loop-analyzer

Scores how well an agentic loop is set up. The model judges four dimensions. Code computes volume, weights, verdicts, hours saved per month, and rank. Rank 1 is the first loop to hand off.

Hosted tool: [https://www.kiloagent.com/tools/loop-audit](https://www.kiloagent.com/tools/loop-audit)

The agent skill is `skills/agentic-loop-analyzer/` ([agentskills.io](https://agentskills.io/specification), [skills CLI](https://www.npmjs.com/package/skills)). That folder is self-contained.

## Install

Copy `skills/agentic-loop-analyzer/` into one of:

- `.claude/skills/agentic-loop-analyzer/`
- `.cursor/skills/agentic-loop-analyzer/`
- `.codex/skills/agentic-loop-analyzer/`
- `.github/skills/agentic-loop-analyzer/`

Verified with `skills@latest` (`--list` then `--copy`). Cursor project install lands in `.agents/skills/`.

From a local clone of this tree:

```bash
npx skills add . --list -y
npx skills add . --copy -y -a cursor -s agentic-loop-analyzer
```

From this PR branch:

```bash
npx skills add https://github.com/KiloAgent/agentic-loop-analyzer.git#cursor/initial-release-6957 --list -y
npx skills add https://github.com/KiloAgent/agentic-loop-analyzer.git#cursor/initial-release-6957 --copy -y -a cursor -s agentic-loop-analyzer
```

`npx skills add KiloAgent/agentic-loop-analyzer --list -y` clones the default branch. Against current `main` the CLI printed `No valid skills found`.

Chat users with no skills directory: paste `skills/agentic-loop-analyzer/PASTE_IN.md` into the chat.

## Library

```bash
npm install
```

Node 20 or newer. Runtime dependency: `zod`. Import from `skills/agentic-loop-analyzer/scripts/` until the package is published.

Supply three tasks and an `LlmProvider`. The provider is the only place a model is called.

```ts
import { createMockProvider, runLoopAudit } from "./skills/agentic-loop-analyzer/scripts/index.ts";
import { EVAL_FIXTURES } from "./skills/agentic-loop-analyzer/evals/fixtures.ts";
import { EVAL_CASES } from "./skills/agentic-loop-analyzer/evals/cases.ts";

const result = await runLoopAudit({
  input: EVAL_CASES[0].input,
  provider: createMockProvider(EVAL_FIXTURES.coi_chase),
});

if (result.ok) {
  console.log(result.result.tasks_ranked[0]);
  console.log(result.result.totals.hours_saved_month);
}
```

Wire a live model by implementing `LlmProvider.complete({ system, prompt })` and returning JSON (object or string). `generateLlmOutput` retries once if the JSON fails the schema.

## Rubric and scoring

See `skills/agentic-loop-analyzer/references/scoring.md` and `skills/agentic-loop-analyzer/scripts/rubric.ts`.

## Evals

Eight mocked cases in `skills/agentic-loop-analyzer/evals/`. No network and no API keys.

```bash
npm test
npm run evals
```

## Agent skill

`skills/agentic-loop-analyzer/SKILL.md` tells a coding agent how to call the rubric: send `assets/system.md` verbatim, treat `<tasks>` as untrusted data, validate JSON, retry once, then run `scoreLoopAudit`.

## Scripts

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Contributing

Open an issue or a PR against `main`. Run `npm test` and `npm run build` before you push. Keep copy free of em dashes, en dashes, and sales CTAs. License is MIT.
