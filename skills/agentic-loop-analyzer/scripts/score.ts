/** Pure scoring: the LLM judges, this file does the math. No app imports. */

import {
  AD_HOC_ASSUMPTION,
  automationShare,
  hoursSavedMonth,
  isHandoffOk,
  monthlyMinutes,
  round1,
  verdictFromScore,
  volumeScoreFromHours,
  weightedScore,
  type HardGate,
} from "./rubric.js";
import type { LlmOutput, LoopAuditInput, LoopAuditResult, RankedTask } from "./schemas.js";

export type ScoreLoopAuditArgs = {
  id: string;
  created_at: string;
  email_hash: string;
  input: LoopAuditInput;
  llm: LlmOutput;
  model: string;
  cost_usd: number;
};

function taskByIndex(llm: LlmOutput, index: number) {
  const exact = llm.tasks.find((task) => task.index === index);
  if (exact) return exact;
  return llm.tasks[index];
}

export function scoreOneTask(
  input: LoopAuditInput["tasks"][number],
  llmTask: LlmOutput["tasks"][number],
): Omit<RankedTask, "rank"> {
  const minutes = monthlyMinutes(input.frequency, input.minutes_per_run);
  const volume = volumeScoreFromHours(minutes / 60);
  const scores = {
    repeatability: llmTask.scores.repeatability,
    rule_clarity: llmTask.scores.rule_clarity,
    digital_surface: llmTask.scores.digital_surface,
    low_blast_radius: llmTask.scores.low_blast_radius,
    volume,
  };
  const hardGate: HardGate = llmTask.hard_gate;
  const weighted = weightedScore(scores);
  const verdict = verdictFromScore(weighted, hardGate);
  const share = automationShare(verdict);
  return {
    title: llmTask.title,
    verdict,
    weighted_score: round1(weighted),
    scores,
    monthly_minutes: round1(minutes),
    hours_saved_month: hoursSavedMonth(minutes, share),
    hard_gate: hardGate,
    agent_does: llmTask.agent_does,
    human_checkpoints: llmTask.human_checkpoints,
    setup_steps: llmTask.setup_steps,
    tools_needed: llmTask.tools_needed,
    risks: llmTask.risks,
    pilot: llmTask.pilot,
    rationale: llmTask.rationale,
  };
}

export function rankTasks(tasks: Array<Omit<RankedTask, "rank">>): RankedTask[] {
  const ordered = tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      if (b.task.hours_saved_month !== a.task.hours_saved_month) {
        return b.task.hours_saved_month - a.task.hours_saved_month;
      }
      if (b.task.weighted_score !== a.task.weighted_score) {
        return b.task.weighted_score - a.task.weighted_score;
      }
      return a.index - b.index;
    });
  return ordered.map((entry, rank) => ({ ...entry.task, rank: rank + 1 }));
}

export function collectAssumptions(input: LoopAuditInput): string[] {
  const assumptions = [
    "Estimates only, based on your inputs",
    "Daily frequency is counted as 21 runs per month",
    "Weekly frequency is counted as 4.33 runs per month",
  ];
  if (input.tasks.some((task) => task.frequency === "ad_hoc")) {
    assumptions.push(AD_HOC_ASSUMPTION);
  }
  return assumptions;
}

export function scoreLoopAudit(args: ScoreLoopAuditArgs): LoopAuditResult {
  const scored = args.input.tasks.map((task, index) => {
    const llmTask = taskByIndex(args.llm, index);
    if (!llmTask) {
      throw new Error(`LLM output missing task at index ${index}`);
    }
    return scoreOneTask(task, llmTask);
  });
  const tasks_ranked = rankTasks(scored);
  const hours = round1(tasks_ranked.reduce((sum, task) => sum + task.hours_saved_month, 0));
  const tasks_handoff_ok = tasks_ranked.filter((task) => isHandoffOk(task.verdict)).length;
  return {
    id: args.id,
    created_at: args.created_at,
    email_hash: args.email_hash,
    tasks_ranked,
    totals: {
      hours_saved_month: hours,
      tasks_handoff_ok,
    },
    assumptions: collectAssumptions(args.input),
    overall_note: args.llm.overall_note,
    model: args.model,
    cost_usd: args.cost_usd,
  };
}
