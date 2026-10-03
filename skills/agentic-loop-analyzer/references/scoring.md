# Scoring

The model scores four dimensions from 0 to 5. Volume is computed from monthly hours.

| Dimension        | Weight | Low (0-1)              | Mid (3)                          | High (5)                                           |
| ---------------- | ------ | ---------------------- | -------------------------------- | -------------------------------------------------- |
| repeatability    | 0.25   | different every time   | mostly same, some variation      | identical steps each run                           |
| rule_clarity     | 0.25   | needs taste or judgment| rules exist with many exceptions | if/then a new hire could follow from a checklist   |
| digital_surface  | 0.20   | physical or in person  | mixed                            | fully in digital tools                             |
| low_blast_radius | 0.15   | costly or irreversible | fixable but annoying             | trivial, easily reversed, or a natural review step |
| volume           | 0.15   | under 1 hour per month | about 4 hours                    | 16 hours or more                                   |

Hard gates: `licensed_judgment`, `irreversible_money`, `physical_world`, `relationship_negotiation`, `no_digital_surface`. A core gate forces `keep_human`.

- Runs per month: daily 21, weekly 4.33, monthly 1, ad_hoc 2 (listed as an assumption)
- Volume from monthly hours: under 1 -> 0, under 2 -> 1, under 4 -> 2, under 8 -> 3, under 16 -> 4, else 5
- `weighted_score = sum(weight * score) / 5 * 100`
- No hard gate: `>=75` hand_off (share 0.8), `60-74` hand_off_with_review (0.6), `40-59` partial (0.35), else keep_human (0)
- `hours_saved_month = monthly_minutes / 60 * share`, one decimal
- Rank by hours saved, then weighted score

Input is exactly three tasks (`description`, `frequency`, `minutes_per_run`, optional `tools`) plus email. Optional `role` and `team_size`.
