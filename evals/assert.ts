import { expect } from "vitest";
import { parseLlmOutput, type LlmOutput } from "../src/schemas.js";
import { scoreLoopAudit } from "../src/score.js";
import { EVAL_CASES, type EvalCaseId } from "./cases.js";

export function assertEvalCase(id: EvalCaseId, llm: LlmOutput) {
  const item = EVAL_CASES.find((entry) => entry.id === id);
  if (!item) throw new Error(id);
  const parsed = parseLlmOutput(llm);
  expect(parsed.success, `${id} schema`).toBe(true);
  if (!parsed.success) return;
  const result = scoreLoopAudit({
    id: "eval",
    created_at: "2026-10-03T00:00:00.000Z",
    email_hash: "hash",
    input: item.input,
    llm: parsed.data,
    model: "eval",
    cost_usd: 0,
  });
  const rankedByInput = item.input.tasks.map((_, index) => {
    const title = parsed.data.tasks.find((task) => task.index === index)?.title;
    return result.tasks_ranked.find((task) => task.title === title) ?? result.tasks_ranked[index];
  });
  item.expected.verdicts.forEach((allowed, index) => {
    expect(allowed, `${id} verdict ${index}`).toContain(rankedByInput[index]?.verdict);
  });
  if (item.expected.gates) {
    item.expected.gates.forEach((gate, index) => {
      if (gate) expect(rankedByInput[index]?.hard_gate).toBe(gate);
    });
  }
  if (item.expected.rationaleIncludes) {
    const text = (rankedByInput[0]?.rationale ?? "").toLowerCase();
    for (const needle of item.expected.rationaleIncludes) {
      expect(text).toContain(needle);
    }
  }
  if (item.expected.titlesEnglish) {
    for (const task of result.tasks_ranked) {
      expect(task.title).toMatch(/^[A-Za-z0-9 ,./():'+-]+$/);
      expect(task.title).toMatch(/[A-Za-z]/);
    }
  }
  if (item.expected.allZeroScores) {
    for (const task of parsed.data.tasks) {
      expect(task.scores).toEqual({
        repeatability: 0,
        rule_clarity: 0,
        digital_surface: 0,
        low_blast_radius: 0,
      });
    }
  }
  if (item.expected.noLeak) {
    const blob = JSON.stringify(parsed.data).toLowerCase();
    for (const needle of item.expected.noLeak) {
      expect(blob).not.toContain(needle.toLowerCase());
    }
  }
}
