import { describe, expect, it } from "vitest";
import { EVAL_CASES } from "../skills/agentic-loop-analyzer/evals/cases.js";
import { EVAL_FIXTURES } from "../skills/agentic-loop-analyzer/evals/fixtures.js";
import { generateLlmOutput, type LlmProvider } from "../skills/agentic-loop-analyzer/scripts/index.js";

describe("generateLlmOutput", () => {
  it("retries once when the first JSON fails validation", async () => {
    let calls = 0;
    const provider: LlmProvider = {
      async complete() {
        calls += 1;
        if (calls === 1) return { tasks: [], overall_note: "bad" };
        return EVAL_FIXTURES.coi_chase;
      },
    };
    const generated = await generateLlmOutput(EVAL_CASES[0].input, provider);
    expect(calls).toBe(2);
    expect(generated.ok).toBe(true);
  });

  it("stops when the provider throws", async () => {
    const provider: LlmProvider = {
      async complete() {
        throw new Error("network");
      },
    };
    const generated = await generateLlmOutput(EVAL_CASES[0].input, provider);
    expect(generated.ok).toBe(false);
  });
});
