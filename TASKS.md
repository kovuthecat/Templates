# TASKS.md — bloquants et tâches en cours

## Bloquants de revue P6 (à corriger avant prochaine vague)

- **P6/S1** — `plans/P6/S1.md:94-95` : section « Bilan de session » jamais remplie (reste `<à compléter>`), alors que `/fin-de-tache` l'exige « Toujours ». Contenu existe dans `docs/analyses/2026-09-17-sondes-p6.md` mais au mauvais endroit. `S1.md` est le point d'entrée attendu ; lecteur tombe sur placeholder. Incohérence visible avec `plans/P6/index.md`.

- **P6/S3** — `plugin/hooks/stop-contexte.mjs:90-108` : Sur branche sans amont configuré (ex. `wip/…`), le contrôle ne fait que `git ls-remote --heads origin <branche>` : dès que la branche existe sur le remote, reste muet même si commits ultérieurs ne sont jamais repoussés. Flux normal d'une branche `wip/…` poussée une première fois puis retravaillée : commit peut rester local sans signal. Le hook refuse de rendre la main sur commits non poussés (Objectif T5) mais test existant ne recommite pas après premier push → laisse passer la régression.

- **P6/S4** — `plugin/EXECUTANT.md:68` : ligne « Push en fin de session… sauf sous `wave.lock`… ou en sous-agent orchestré » invente exemption absente de `WORKFLOW.md` §4b et C3. « Sous-agent orchestré » = voie normale §5b (quasi-totalité des sessions). Utilisateur suit `EXECUTANT.md` (ce que *toute* session charge), ne pousse pas en fin de session dans cas le plus courant, croyant orchestrateur poussera « après collecte ». Contredit objectif T9 (sans dupliquer `WORKFLOW.md`) : règle divergente hors domicile. Commits session orchestrée restent non poussés plus longtemps que promis.

- **P6/S7** — `plugin/skills/nouveau-plan/references/squelette-session.md:12`, `plugin/skills/nouveau-plan/SKILL.md:181`, `plugin/agents/verificateur-plan.md:49` : trois disent session `exploration` n'a besoin que branche jetable **nommée**, citant C6. Mais C6 exige branche jetable **poussée** — et même session l'a écrit correctement dans `plugin/skills/cadrer/SKILL.md:136` (« branche jetable poussée »). Cadreur qui suit squelette nomme branche locale sans la pousser ; `verificateur-plan` (contrôle 10) dont c'est rôle rattraper écart, rend RAS car vérifie que présence de nom, pas push. Session `exploration` tourne en sous-agent sur branche invisible d'autre machine/`orchestrer-plan` — défaut exact que C6 voulait fermer.

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
