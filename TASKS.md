# TASKS.md — bloquants et tâches en cours

## Bloquants de revue (à corriger avant prochaine vague)

- **P8/S5** — `docs/analyses/2026-09-22-evals-orchestrateur.md:17-20,79-118` : le doc T12 reste figé
  sur le rejeu intermédiaire à 7/9 alors que la remédiation a ensuite atteint 9/9 avant publication ;
  renvoie en l.118 à `plans/P8/S5.echec.md`, supprimé — lien mort dans un livrable publié, contredit
  par `CHANGELOG.md:6` qui affirme « 9/9 » et renvoie au même doc. Preuve : `plans/P8/S5.revue.md`.

- **P9/S3** — `docs/analyses/2026-09-23-eval-revue-d-usage.md:32,47-49` : l'analyse affirme que les
  graders du cas négatif sont `withOnly` en citant une phrase absente des JSON commités ; or
  `docs/analyses/evals-23.json` montre `withOnly: false` et un score `without` réel (0/3). Conclusion
  PASS correcte, justification fabriquée. Preuve : `plans/P9/S3.revue.md`.

## Tâches — plan P10 (fins de session à propriétaire unique, verrou réparé, régime Pro)

Suivi d'avancement dans `plans/P10/index.md`, jamais ici.

- T1-T3 — Racine du dépôt juste, garde du verrou, collecteur, version chargée · → plans/P10/S1.md
- T4-T6 — Script d'orchestration : lecture tolérante, nouveaux états, clôture, budget Opus · → plans/P10/S2.md
- T7-T8 — Fin de session orchestrée à forme unique, relecture manuelle, EXECUTANT réservé · → plans/P10/S3.md
- T9-T12 — Orchestrateur seul rédacteur, fin-de-plan, WORKFLOW aligné, publication 0.45.0 · → plans/P10/S4.md
- T13-T14 — Clarté des skills de plan, renvois gardés par test, annexes · → plans/P10/S5.md
- T15-T16 — Clarté des agents et des petites skills, glossaire · → plans/P10/S6.md
- T17-T18 — Ménage des plans P6-P9, publication 0.46.0 · → plans/P10/S7.md

## Tâches — plan P9 (revue d'usage, brief tenu par les décisions)

Suivi d'avancement dans `plans/P9/index.md`, jamais ici.

- T1 — Grilles Nielsen et WCAG AA observables · → plans/P9/S1.md
- T2 — `/revue-d-usage` : SKILL.md, parcours-types, rapport · → plans/P9/S1.md
- T3 — Agent `parcoureur-usage` · → plans/P9/S1.md
- T4 — Script `brief-a-jour.mjs` et ses sept cas · → plans/P9/S2.md
- T5 — Ligne `Brief :` écrite par `/cadrer`, roadmap cochée en clôture · → plans/P9/S2.md
- T6 — Onzième contrôle de `verificateur-plan` · → plans/P9/S2.md
- T7 — Aiguillages vers `/revue-d-usage`, exception N2 écrite · → plans/P9/S3.md
- T8 — Éval de déclenchement, cas positif et négatif · → plans/P9/S3.md
- T9 — Version 0.42.0 et publication (si éval PASS) · → plans/P9/S4.md
- T10 — Déroulé réel sur Chords, bilan en cinq points · → plans/P9/S5.md
