/** Tiny model interface. The caller supplies the complete() implementation. */

import { appendValidationRetry, buildUserPrompt, SYSTEM_PROMPT } from "./prompts.js";
import {
  formatZodError,
  parseLlmOutput,
  parseLoopAuditInput,
  type LlmOutput,
  type LoopAuditInput,
  type LoopAuditResult,
} from "./schemas.js";
import { scoreLoopAudit } from "./score.js";

export type LlmProvider = {
  complete(request: { system: string; prompt: string }): Promise<unknown>;
};

export type GenerateLlmOk = { ok: true; llm: LlmOutput };
export type GenerateLlmErr = { ok: false; error: "model_failed" };
export type GenerateLlmResult = GenerateLlmOk | GenerateLlmErr;

export type RunLoopAuditOk = { ok: true; result: LoopAuditResult };
export type RunLoopAuditErr = {
  ok: false;
  error: "invalid_input" | "model_failed";
  detail?: string;
};
export type RunLoopAuditResult = RunLoopAuditOk | RunLoopAuditErr;

function coerceJson(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return raw;
}

export async function generateLlmOutput(
  input: LoopAuditInput,
  provider: LlmProvider,
): Promise<GenerateLlmResult> {
  let prompt = buildUserPrompt(input);
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: unknown;
    try {
      raw = await provider.complete({ system: SYSTEM_PROMPT, prompt });
    } catch {
      return { ok: false, error: "model_failed" };
    }
    const object = coerceJson(raw);
    if (object === undefined) {
      prompt = appendValidationRetry(prompt, "output is not valid JSON");
      continue;
    }
    const parsed = parseLlmOutput(object);
    if (parsed.success) return { ok: true, llm: parsed.data };
    prompt = appendValidationRetry(prompt, formatZodError(parsed.error));
  }
  return { ok: false, error: "model_failed" };
}

export async function runLoopAudit(args: {
  input: unknown;
  provider: LlmProvider;
  id?: string;
  created_at?: string;
  email_hash?: string;
  model?: string;
}): Promise<RunLoopAuditResult> {
  const parsed = parseLoopAuditInput(args.input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input", detail: formatZodError(parsed.error) };
  }
  const generated = await generateLlmOutput(parsed.data, args.provider);
  if (!generated.ok) return generated;
  return {
    ok: true,
    result: scoreLoopAudit({
      id: args.id ?? "local",
      created_at: args.created_at ?? new Date().toISOString(),
      email_hash: args.email_hash ?? "local",
      input: parsed.data,
      llm: generated.llm,
      model: args.model ?? "user-provider",
      cost_usd: 0,
    }),
  };
}
