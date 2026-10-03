import { describe, expect, it } from "vitest";
import { createMockProvider } from "../src/mock-provider.js";
import { generateLlmOutput, runLoopAudit } from "../src/provider.js";
import { EVAL_CASES } from "./cases.js";
import { EVAL_FIXTURES } from "./fixtures.js";
import { assertEvalCase } from "./assert.js";

describe("loop audit evals (mocked model)", () => {
  for (const item of EVAL_CASES) {
    it(item.id, async () => {
      const generated = await generateLlmOutput(
        item.input,
        createMockProvider(EVAL_FIXTURES[item.id]),
      );
      expect(generated.ok).toBe(true);
      if (!generated.ok) return;
      assertEvalCase(item.id, generated.llm);
    });
  }
});

describe("runLoopAudit with mock provider", () => {
  it("returns ranked hours for the coi_chase fixture", async () => {
    const ran = await runLoopAudit({
      input: EVAL_CASES[0].input,
      provider: createMockProvider(EVAL_FIXTURES.coi_chase),
      model: "mock",
    });
    expect(ran.ok).toBe(true);
    if (!ran.ok) return;
    expect(ran.result.tasks_ranked).toHaveLength(3);
    expect(ran.result.tasks_ranked[0]?.rank).toBe(1);
    expect(ran.result.totals.hours_saved_month).toBeGreaterThan(0);
  });
});
