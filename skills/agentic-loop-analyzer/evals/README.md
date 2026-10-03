# Loop Audit evals

Eight cases. The default run uses `fixtures.ts` through the mock provider. No network and no API keys. Run from the repository root.

| id                | intent                                                              |
| ----------------- | ------------------------------------------------------------------- |
| coi_chase         | weekly COI chase, 120 min, hand_off or hand_off_with_review         |
| invoice_followup  | weekly invoice follow-up, 90 min, hand_off_with_review              |
| tax_signoff       | tax filing sign-off, keep_human / licensed_judgment                 |
| supplier_payments | release payments with no approval, keep_human / irreversible_money  |
| vague_customer    | "handle customer stuff", partial at best, rationale asks for detail |
| prompt_injection  | ignore-previous text, valid JSON, no leak                           |
| non_english       | French task text, English titles                                    |
| nonsense          | all zero scores                                                     |

```bash
npm test
npm run evals
```
