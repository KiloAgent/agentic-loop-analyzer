/** Zod schemas for Loop Audit input, LLM output, and scored results. No app imports. */

import { z } from "zod";
import {
  AGENT_DOES_MAX,
  AGENT_DOES_MIN,
  FREQUENCY,
  HARD_GATES,
  HUMAN_CHECKPOINTS_MAX,
  MINUTES_PER_RUN_MAX,
  MINUTES_PER_RUN_MIN,
  OVERALL_NOTE_MAX,
  PILOT_MAX,
  RATIONALE_MAX,
  RISKS_MAX,
  ROLES,
  SCORE_MAX,
  SCORE_MIN,
  SETUP_STEPS_MAX,
  SETUP_STEPS_MIN,
  TASK_DESCRIPTION_MAX,
  TASK_DESCRIPTION_MIN,
  TASK_TOOL_MAX_CHARS,
  TASK_TOOLS_MAX,
  TEAM_SIZES,
  TITLE_MAX,
  VERDICTS,
} from "./rubric.js";
import { cleanStringList, cleanText } from "./sanitize.js";

const intScore = z.number().int().min(SCORE_MIN).max(SCORE_MAX);

export const frequencySchema = z.enum(FREQUENCY);
export const roleSchema = z.enum(ROLES);
export const teamSizeSchema = z.enum(TEAM_SIZES);
export const hardGateSchema = z.enum(HARD_GATES);
export const verdictSchema = z.enum(VERDICTS);

export const taskInputSchema = z.object({
  description: z
    .string()
    .transform((value) => cleanText(value, TASK_DESCRIPTION_MAX))
    .pipe(z.string().min(TASK_DESCRIPTION_MIN).max(TASK_DESCRIPTION_MAX)),
  frequency: frequencySchema,
  minutes_per_run: z.coerce.number().int().min(MINUTES_PER_RUN_MIN).max(MINUTES_PER_RUN_MAX),
  tools: z
    .unknown()
    .optional()
    .transform((value) => cleanStringList(value, TASK_TOOL_MAX_CHARS, TASK_TOOLS_MAX)),
});

export const loopAuditInputSchema = z.object({
  email: z.email(),
  tasks: z.array(taskInputSchema).length(3),
  role: roleSchema.optional(),
  team_size: teamSizeSchema.optional(),
  newsletter_optin: z.boolean().optional().default(false),
});

export const modelScoresSchema = z.object({
  repeatability: intScore,
  rule_clarity: intScore,
  digital_surface: intScore,
  low_blast_radius: intScore,
});

const shortStep = z.string().trim().min(1).max(160);

export const llmTaskSchema = z.object({
  index: z.number().int().min(0).max(2),
  title: z
    .string()
    .transform((value) => cleanText(value, TITLE_MAX))
    .pipe(z.string().min(1).max(TITLE_MAX)),
  scores: modelScoresSchema,
  hard_gate: hardGateSchema,
  rationale: z
    .string()
    .transform((value) => cleanText(value, RATIONALE_MAX))
    .pipe(z.string().min(1).max(RATIONALE_MAX)),
  agent_does: z.array(shortStep).min(AGENT_DOES_MIN).max(AGENT_DOES_MAX),
  human_checkpoints: z.array(shortStep).min(0).max(HUMAN_CHECKPOINTS_MAX),
  setup_steps: z.array(shortStep).min(SETUP_STEPS_MIN).max(SETUP_STEPS_MAX),
  tools_needed: z.array(z.string().trim().min(1).max(TASK_TOOL_MAX_CHARS)).max(TASK_TOOLS_MAX),
  risks: z.array(shortStep).min(0).max(RISKS_MAX),
  pilot: z
    .string()
    .transform((value) => cleanText(value, PILOT_MAX))
    .pipe(z.string().min(1).max(PILOT_MAX)),
});

export const llmOutputSchema = z.object({
  tasks: z.array(llmTaskSchema).length(3),
  overall_note: z
    .string()
    .transform((value) => cleanText(value, OVERALL_NOTE_MAX))
    .pipe(z.string().min(1).max(OVERALL_NOTE_MAX)),
});

export const resultScoresSchema = modelScoresSchema.extend({
  volume: intScore,
});

export const rankedTaskSchema = z.object({
  rank: z.number().int().min(1).max(3),
  title: z.string().min(1).max(TITLE_MAX),
  verdict: verdictSchema,
  weighted_score: z.number().min(0).max(100),
  scores: resultScoresSchema,
  monthly_minutes: z.number().nonnegative(),
  hours_saved_month: z.number().nonnegative(),
  hard_gate: hardGateSchema,
  agent_does: z.array(z.string()),
  human_checkpoints: z.array(z.string()),
  setup_steps: z.array(z.string()),
  tools_needed: z.array(z.string()),
  risks: z.array(z.string()),
  pilot: z.string(),
  rationale: z.string(),
});

export const loopAuditResultSchema = z.object({
  id: z.string().min(1),
  created_at: z.string().min(1),
  email_hash: z.string().min(1),
  tasks_ranked: z.array(rankedTaskSchema).length(3),
  totals: z.object({
    hours_saved_month: z.number().nonnegative(),
    tasks_handoff_ok: z.number().int().min(0).max(3),
  }),
  assumptions: z.array(z.string()),
  overall_note: z.string().min(1).max(OVERALL_NOTE_MAX),
  model: z.string().min(1),
  cost_usd: z.number().nonnegative(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
export type LoopAuditInput = z.infer<typeof loopAuditInputSchema>;
export type LlmTask = z.infer<typeof llmTaskSchema>;
export type LlmOutput = z.infer<typeof llmOutputSchema>;
export type RankedTask = z.infer<typeof rankedTaskSchema>;
export type LoopAuditResult = z.infer<typeof loopAuditResultSchema>;

export function parseLoopAuditInput(raw: unknown) {
  return loopAuditInputSchema.safeParse(raw);
}

export function parseLlmOutput(raw: unknown) {
  return llmOutputSchema.safeParse(raw);
}

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}
