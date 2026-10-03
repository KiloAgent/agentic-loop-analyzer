/** Map an input or prompt back to a mocked fixture. Used by the mock provider. */

import type { LlmOutput, LoopAuditInput } from "../src/schemas.js";
import { EVAL_CASES } from "./cases.js";
import { EVAL_FIXTURES } from "./fixtures.js";

export function pickMockFixture(input: LoopAuditInput): LlmOutput {
  const first = input.tasks[0]?.description.toLowerCase() ?? "";
  for (const item of EVAL_CASES) {
    const needle = item.input.tasks[0]?.description.toLowerCase() ?? "";
    if (needle && first.includes(needle.slice(0, 24))) return EVAL_FIXTURES[item.id];
  }
  if (first.includes("ignore previous")) return EVAL_FIXTURES.prompt_injection;
  if (first.includes("tax")) return EVAL_FIXTURES.tax_signoff;
  if (first.includes("payment")) return EVAL_FIXTURES.supplier_payments;
  if (first.includes("customer stuff")) return EVAL_FIXTURES.vague_customer;
  if (first.includes("fournisseurs") || first.includes("attestation")) {
    return EVAL_FIXTURES.non_english;
  }
  if (first.includes("asdf") || first.includes("xyzzy") || first.includes("lorem")) {
    return EVAL_FIXTURES.nonsense;
  }
  if (first.includes("invoice")) return EVAL_FIXTURES.invoice_followup;
  return EVAL_FIXTURES.coi_chase;
}
