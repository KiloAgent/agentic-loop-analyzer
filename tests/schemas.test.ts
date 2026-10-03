import { describe, expect, it } from "vitest";
import { cleanText, parseLoopAuditInput } from "../src/index.js";

describe("loop audit schemas", () => {
  it("rejects short descriptions after trim", () => {
    const parsed = parseLoopAuditInput({
      email: "ops@company.test",
      tasks: [
        { description: "too short", frequency: "weekly", minutes_per_run: 30 },
        { description: "b".repeat(20), frequency: "weekly", minutes_per_run: 30 },
        { description: "c".repeat(20), frequency: "weekly", minutes_per_run: 30 },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts three valid tasks and strips HTML", () => {
    const parsed = parseLoopAuditInput({
      email: "ops@company.test",
      tasks: [
        {
          description: "<b>Chase missing certificates of insurance each week.</b>",
          frequency: "weekly",
          minutes_per_run: 30,
          tools: "Gmail, Sheets",
        },
        { description: "b".repeat(20), frequency: "weekly", minutes_per_run: 30 },
        { description: "c".repeat(20), frequency: "weekly", minutes_per_run: 30 },
      ],
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.tasks[0]?.description).toContain("Chase missing certificates");
    expect(parsed.data.tasks[0]?.description).not.toContain("<b>");
    expect(parsed.data.tasks[0]?.tools).toEqual(["Gmail", "Sheets"]);
  });

  it("trims cleaned text to the max length", () => {
    expect(cleanText("  hello   world  ", 7)).toBe("hello w");
  });
});
