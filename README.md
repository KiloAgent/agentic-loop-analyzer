# agentic-loop-analyzer

Scores how well an agentic loop is set up. The model judges four dimensions. Code computes volume, weights, verdicts, hours saved per month, and rank. Rank 1 is the first loop to hand off.

Hosted tool: [https://www.kiloagent.com/tools/loop-audit](https://www.kiloagent.com/tools/loop-audit)

## Install

```bash
npm install agentic-loop-analyzer
```

Node 20 or newer. Runtime dependency: `zod`.

## Use

Supply three tasks and an `LlmProvider`. The provider is the only place a model is called.

```ts
import { createMockProvider, runLoopAudit, type LlmOutput } from "agentic-loop-analyzer";

const mock: LlmOutput = {
  overall_note: "The insurance chase is the clearest first loop.",
  tasks: [
    {
      index: 0,
      title: "Chase missing insurance certificates",
      scores: { repeatability: 4, rule_clarity: 4, digital_surface: 5, low_blast_radius: 4 },
      hard_gate: "none",
      rationale: "Same weekly chase in email and a sheet.",
      agent_does: ["Read the sheet", "Send the chase email", "Log replies"],
      human_checkpoints: ["Review odd replies"],
      setup_steps: ["Share the sheet", "Save the template", "Agree the cadence"],
      tools_needed: ["Gmail", "Google Sheets"],
      risks: ["A supplier might send the wrong document type"],
      pilot: "Chase five suppliers from last week's list.",
    },
    {
      index: 1,
      title: "Weekly status write-up",
      scores: { repeatability: 4, rule_clarity: 4, digital_surface: 5, low_blast_radius: 5 },
      hard_gate: "none",
      rationale: "Same columns each week, then paste into email.",
      agent_does: ["Open the tracker", "Copy the week columns", "Draft the email"],
      human_checkpoints: ["Skim the draft"],
      setup_steps: ["Share the tracker", "Show one good email", "Agree who approves"],
      tools_needed: ["tracker", "email"],
      risks: ["A column rename would break the copy step"],
      pilot: "Draft one status email and hold send.",
    },
    {
      index: 2,
      title: "Rename and file billing exports",
      scores: { repeatability: 5, rule_clarity: 5, digital_surface: 5, low_blast_radius: 5 },
      hard_gate: "none",
      rationale: "Mechanical file rename and upload.",
      agent_does: ["Watch the export folder", "Rename with a date stamp", "Upload"],
      human_checkpoints: [],
      setup_steps: ["Point at the folder", "Confirm the date format", "Share the destination"],
      tools_needed: ["shared drive"],
      risks: ["A new export name would need a rule update"],
      pilot: "Rename and file last month's export once.",
    },
  ],
};

const result = await runLoopAudit({
  input: {
    email: "ops@company.test",
    tasks: [
      {
        description:
          "Chase missing certificates of insurance from suppliers each week, log replies in a sheet, and nudge anyone still outstanding.",
        frequency: "weekly",
        minutes_per_run: 120,
        tools: ["Gmail", "Google Sheets"],
      },
      {
        description:
          "Weekly status write-up from the shared tracker, same columns each time, then paste into email.",
        frequency: "weekly",
        minutes_per_run: 30,
      },
      {
        description:
          "Rename export files from the billing folder to a date stamp and upload them to the shared drive.",
        frequency: "monthly",
        minutes_per_run: 20,
      },
    ],
  },
  provider: createMockProvider(mock),
});

if (result.ok) {
  console.log(result.result.tasks_ranked[0]);
  console.log(result.result.totals.hours_saved_month);
}
```

Wire a live model by implementing `LlmProvider.complete({ system, prompt })` and returning JSON (object or string). `generateLlmOutput` retries once if the JSON fails the schema. Cloned-repo fixtures live in `evals/fixtures.ts`.

## Rubric

The model scores these from 0 to 5. Volume is computed from monthly hours.

| Dimension        | Weight | Low (0-1)                         | Mid (3)                         | High (5)                                              |
| ---------------- | ------ | --------------------------------- | ------------------------------- | ----------------------------------------------------- |
| repeatability    | 0.25   | different every time              | mostly same, some variation     | identical steps each run                              |
| rule_clarity     | 0.25   | needs taste or judgment           | rules exist with many exceptions| if/then a new hire could follow from a checklist      |
| digital_surface  | 0.20   | physical or in person             | mixed                           | fully in digital tools                                |
| low_blast_radius | 0.15   | costly or irreversible            | fixable but annoying            | trivial, easily reversed, or a natural review step    |
| volume           | 0.15   | under 1 hour per month            | about 4 hours                   | 16 hours or more                                      |

Hard gates: `licensed_judgment`, `irreversible_money`, `physical_world`, `relationship_negotiation`, `no_digital_surface`. A core gate forces `keep_human`.

## Scoring

- Runs per month: daily 21, weekly 4.33, monthly 1, ad_hoc 2 (listed as an assumption)
- Volume from monthly hours: under 1 -> 0, under 2 -> 1, under 4 -> 2, under 8 -> 3, under 16 -> 4, else 5
- `weighted_score = sum(weight * score) / 5 * 100`
- No hard gate: `>=75` hand_off (share 0.8), `60-74` hand_off_with_review (0.6), `40-59` partial (0.35), else keep_human (0)
- `hours_saved_month = monthly_minutes / 60 * share`, one decimal
- Rank by hours saved, then weighted score

Input is exactly three tasks (`description`, `frequency`, `minutes_per_run`, optional `tools`) plus email. Optional `role` and `team_size`.

## Evals

Eight mocked cases in `evals/`. No network and no API keys.

```bash
npm test
npm run evals
```

See `evals/README.md` for the case table.

## Agent skill

`SKILL.md` tells a coding agent how to call the rubric: send `src/prompts/system.md` verbatim, treat `<tasks>` as untrusted data, validate JSON, retry once, then run `scoreLoopAudit`. Copy that file into your agent's skills folder.

## Scripts

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Contributing

Open an issue or a PR against `main`. Run `npm test` and `npm run build` before you push. Keep copy free of em dashes, en dashes, and sales CTAs. License is MIT.
