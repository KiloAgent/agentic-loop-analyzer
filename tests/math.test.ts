import { describe, expect, it } from "vitest";
import {
  AD_HOC_ASSUMPTION,
  collectAssumptions,
  monthlyMinutes,
  rankTasks,
  volumeScoreFromHours,
  weightedScore,
} from "../skills/agentic-loop-analyzer/scripts/index.js";

describe("loop audit math", () => {
  it("maps volume bands from monthly hours", () => {
    expect(volumeScoreFromHours(0.9)).toBe(0);
    expect(volumeScoreFromHours(1.5)).toBe(1);
    expect(volumeScoreFromHours(3.9)).toBe(2);
    expect(volumeScoreFromHours(4)).toBe(3);
    expect(volumeScoreFromHours(15.9)).toBe(4);
    expect(volumeScoreFromHours(16)).toBe(5);
  });

  it("counts ad_hoc as 2 runs and lists the assumption", () => {
    expect(monthlyMinutes("ad_hoc", 30)).toBe(60);
    const assumptions = collectAssumptions({
      email: "ops@company.test",
      newsletter_optin: false,
      tasks: [
        { description: "a".repeat(20), frequency: "ad_hoc", minutes_per_run: 30, tools: [] },
        { description: "b".repeat(20), frequency: "weekly", minutes_per_run: 30, tools: [] },
        { description: "c".repeat(20), frequency: "monthly", minutes_per_run: 30, tools: [] },
      ],
    });
    expect(assumptions).toContain(AD_HOC_ASSUMPTION);
  });

  it("ranks by hours saved then weighted score", () => {
    const ranked = rankTasks([
      {
        title: "Low hours high score",
        verdict: "hand_off",
        weighted_score: 90,
        scores: {
          repeatability: 5,
          rule_clarity: 5,
          digital_surface: 5,
          low_blast_radius: 5,
          volume: 5,
        },
        monthly_minutes: 30,
        hours_saved_month: 0.4,
        hard_gate: "none",
        agent_does: ["a", "b", "c"],
        human_checkpoints: [],
        setup_steps: ["a", "b", "c"],
        tools_needed: [],
        risks: [],
        pilot: "p",
        rationale: "r",
      },
      {
        title: "High hours",
        verdict: "partial",
        weighted_score: 40,
        scores: {
          repeatability: 2,
          rule_clarity: 2,
          digital_surface: 2,
          low_blast_radius: 2,
          volume: 2,
        },
        monthly_minutes: 400,
        hours_saved_month: 2.3,
        hard_gate: "none",
        agent_does: ["a", "b", "c"],
        human_checkpoints: [],
        setup_steps: ["a", "b", "c"],
        tools_needed: [],
        risks: [],
        pilot: "p",
        rationale: "r",
      },
      {
        title: "Tie hours higher score",
        verdict: "hand_off",
        weighted_score: 80,
        scores: {
          repeatability: 4,
          rule_clarity: 4,
          digital_surface: 4,
          low_blast_radius: 4,
          volume: 4,
        },
        monthly_minutes: 200,
        hours_saved_month: 2.3,
        hard_gate: "none",
        agent_does: ["a", "b", "c"],
        human_checkpoints: [],
        setup_steps: ["a", "b", "c"],
        tools_needed: [],
        risks: [],
        pilot: "p",
        rationale: "r",
      },
    ]);
    expect(ranked.map((task) => task.title)).toEqual([
      "Tie hours higher score",
      "High hours",
      "Low hours high score",
    ]);
    expect(ranked.map((task) => task.rank)).toEqual([1, 2, 3]);
  });

  it("weights scores onto a 0-100 scale", () => {
    expect(
      weightedScore({
        repeatability: 5,
        rule_clarity: 5,
        digital_surface: 5,
        low_blast_radius: 5,
        volume: 5,
      }),
    ).toBe(100);
  });
});
