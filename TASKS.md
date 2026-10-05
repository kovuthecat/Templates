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

## Tâches — plan P12 (preuve des mods, exploration)

Suivi d'avancement dans `plans/P12/index.md`, jamais ici.

- T1 — Instrument : mod d'observation dans le plugin installé · → plans/P12/S1.md
- T2 — M1 : chargement sans réglage · → plans/P12/S1.md
- T3 — M2 : outils des sous-agents · → plans/P12/S1.md
- T4 — M3 coût d'un plan · M4 affichage de l'état · → plans/P12/S1.md
- T5 — Rendu : mesures, réfutations, mod candidat · → plans/P12/S1.md

## Tâches — plan P13 (preuves des mods, autonomes et parallèles)

Suivi d'avancement dans `plans/P13/index.md` (sur `preuve/mods-2`), jamais ici.

- T1 — F : mod de fichiers et ses tests simulés · → plans/P13/S1.md
- T2 — L : mod de limites d'usage et ses tests simulés · → plans/P13/S2.md
- T3 — Observateur v2 · → plans/P13/S3.md
- T4 — Harnais : consignes A et B, attente, collecte · → plans/P13/S3.md
- T5 — Plans de fixture P92 et P93, relus · → plans/P13/S3.md
- T6 — O1 à O5 : mods d'orchestration et leurs tests · → plans/P13/S4.md
- T7 — Installation à froid des quatre mods · → plans/P13/S5.md
- T8 — M5 : sessions planifiées, attente, verdicts, archivage · → plans/P13/S6.md
- T9 — État remis en ordre · → plans/P13/S6.md
- T10 — Fichier de mesures · → plans/P13/S7.md
- T11 — Mods retirés, réinstallation, report sur main · → plans/P13/S7.md
