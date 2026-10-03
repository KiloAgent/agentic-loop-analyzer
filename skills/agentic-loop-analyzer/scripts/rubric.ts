/** Single source of truth for Loop Audit scoring. No app imports. */

export const SCORE_MIN = 0;
export const SCORE_MAX = 5;

export const DIMENSIONS = {
  repeatability: { weight: 0.25 },
  rule_clarity: { weight: 0.25 },
  digital_surface: { weight: 0.2 },
  low_blast_radius: { weight: 0.15 },
  volume: { weight: 0.15 },
} as const;

export type ModelDimension =
  | "repeatability"
  | "rule_clarity"
  | "digital_surface"
  | "low_blast_radius";
export type ScoreDimension = ModelDimension | "volume";

export const MODEL_DIMENSIONS: readonly ModelDimension[] = [
  "repeatability",
  "rule_clarity",
  "digital_surface",
  "low_blast_radius",
];

export const FREQUENCY = ["daily", "weekly", "monthly", "ad_hoc"] as const;
export type Frequency = (typeof FREQUENCY)[number];

/** Runs counted in a typical working month. ad_hoc is an assumption. */
export const RUNS_PER_MONTH: Record<Frequency, number> = {
  daily: 21,
  weekly: 4.33,
  monthly: 1,
  ad_hoc: 2,
};

export const AD_HOC_ASSUMPTION = "ad_hoc frequency is counted as 2 runs per month";

export const HARD_GATES = [
  "none",
  "licensed_judgment",
  "irreversible_money",
  "physical_world",
  "relationship_negotiation",
  "no_digital_surface",
] as const;
export type HardGate = (typeof HARD_GATES)[number];

export const VERDICTS = ["hand_off", "hand_off_with_review", "partial", "keep_human"] as const;
export type Verdict = (typeof VERDICTS)[number];

/** Automation share applied to monthly hours when a verdict is not gated. */
export const AUTOMATION_SHARE: Record<Verdict, number> = {
  hand_off: 0.8,
  hand_off_with_review: 0.6,
  partial: 0.35,
  keep_human: 0,
};

export const VERDICT_THRESHOLDS = {
  hand_off: 75,
  hand_off_with_review: 60,
  partial: 40,
} as const;

export const ROLES = ["owner", "ops", "finance", "sales", "support", "other"] as const;
export type Role = (typeof ROLES)[number];

export const TEAM_SIZES = ["1", "2-10", "11-50", "51+"] as const;
export type TeamSize = (typeof TEAM_SIZES)[number];

export const TASK_DESCRIPTION_MIN = 15;
export const TASK_DESCRIPTION_MAX = 400;
export const TASK_TOOLS_MAX = 5;
export const TASK_TOOL_MAX_CHARS = 40;
export const MINUTES_PER_RUN_MIN = 1;
export const MINUTES_PER_RUN_MAX = 480;
export const TITLE_MAX = 60;
export const RATIONALE_MAX = 200;
export const PILOT_MAX = 160;
export const OVERALL_NOTE_MAX = 240;
export const AGENT_DOES_MIN = 3;
export const AGENT_DOES_MAX = 5;
export const HUMAN_CHECKPOINTS_MAX = 3;
export const SETUP_STEPS_MIN = 3;
export const SETUP_STEPS_MAX = 5;
export const RISKS_MAX = 3;

export const SCORE_ANCHORS = {
  repeatability: {
    low: "0-1 different every time",
    mid: "3 mostly same some variation",
    high: "5 identical steps each run",
  },
  rule_clarity: {
    low: "0-1 needs taste/judgment",
    mid: "3 rules exist with many exceptions",
    high: "5 clear if/then a new hire could follow from a checklist",
  },
  digital_surface: {
    low: "0-1 physical or in person",
    mid: "3 mixed",
    high: "5 fully in digital tools",
  },
  low_blast_radius: {
    low: "0-1 costly/irreversible (payments, legal)",
    mid: "3 fixable but annoying",
    high: "5 trivial/easily reversed or a human review step is natural",
  },
  volume: {
    low: "<1h/mo 0",
    mid: "~4h 3",
    high: ">=16h 5",
  },
} as const;

export function monthlyMinutes(frequency: Frequency, minutesPerRun: number): number {
  return RUNS_PER_MONTH[frequency] * minutesPerRun;
}

export function monthlyHours(minutes: number): number {
  return minutes / 60;
}

/** Volume is computed by code from monthly hours, never by the model. */
export function volumeScoreFromHours(monthlyHoursValue: number): number {
  if (monthlyHoursValue < 1) return 0;
  if (monthlyHoursValue < 2) return 1;
  if (monthlyHoursValue < 4) return 2;
  if (monthlyHoursValue < 8) return 3;
  if (monthlyHoursValue < 16) return 4;
  return 5;
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return SCORE_MIN;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(value)));
}

export function weightedScore(scores: Record<ScoreDimension, number>): number {
  const sum =
    DIMENSIONS.repeatability.weight * scores.repeatability +
    DIMENSIONS.rule_clarity.weight * scores.rule_clarity +
    DIMENSIONS.digital_surface.weight * scores.digital_surface +
    DIMENSIONS.low_blast_radius.weight * scores.low_blast_radius +
    DIMENSIONS.volume.weight * scores.volume;
  return (sum / SCORE_MAX) * 100;
}

export function verdictFromScore(score: number, hardGate: HardGate): Verdict {
  if (hardGate !== "none") return "keep_human";
  if (score >= VERDICT_THRESHOLDS.hand_off) return "hand_off";
  if (score >= VERDICT_THRESHOLDS.hand_off_with_review) return "hand_off_with_review";
  if (score >= VERDICT_THRESHOLDS.partial) return "partial";
  return "keep_human";
}

export function automationShare(verdict: Verdict): number {
  return AUTOMATION_SHARE[verdict];
}

export function hoursSavedMonth(monthlyMinutesValue: number, share: number): number {
  return round1((monthlyMinutesValue / 60) * share);
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export const VERDICT_PLAIN: Record<Verdict, string> = {
  hand_off: "a strong fit to hand off",
  hand_off_with_review: "a good fit with a quick human check",
  partial: "partly automatable",
  keep_human: "best kept with a person",
};

export function isHandoffOk(verdict: Verdict): boolean {
  return verdict === "hand_off" || verdict === "hand_off_with_review";
}
