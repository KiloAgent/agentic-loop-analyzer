import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT } from "../src/prompts.js";

const here = dirname(fileURLToPath(import.meta.url));

describe("system prompt", () => {
  it("keeps the system prompt file in sync", () => {
    const md = readFileSync(join(here, "../src/prompts/system.md"), "utf8").trim();
    expect(md).toBe(SYSTEM_PROMPT.trim());
  });

  it("uses hyphen-minus only in the prompt", () => {
    expect(SYSTEM_PROMPT).not.toMatch(/[—–]/);
  });
});
