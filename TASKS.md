# TASKS.md — bloquants et tâches en cours

## Bloquants de revue P6 (à corriger avant prochaine vague)

- **P6/S1** — `plans/P6/S1.md:94-95` : section « Bilan de session » jamais remplie (reste `<à compléter>`), alors que `/fin-de-tache` l'exige « Toujours ». Contenu existe dans `docs/analyses/2026-09-17-sondes-p6.md` mais au mauvais endroit. `S1.md` est le point d'entrée attendu ; lecteur tombe sur placeholder. Incohérence visible avec `plans/P6/index.md`.

- **P6/S3** — `plugin/hooks/stop-contexte.mjs:90-108` : Sur branche sans amont configuré (ex. `wip/…`), le contrôle ne fait que `git ls-remote --heads origin <branche>` : dès que la branche existe sur le remote, reste muet même si commits ultérieurs ne sont jamais repoussés. Flux normal d'une branche `wip/…` poussée une première fois puis retravaillée : commit peut rester local sans signal. Le hook refuse de rendre la main sur commits non poussés (Objectif T5) mais test existant ne recommite pas après premier push → laisse passer la régression.

- **P6/S4** — `plugin/EXECUTANT.md:68` : ligne « Push en fin de session… sauf sous `wave.lock`… ou en sous-agent orchestré » invente exemption absente de `WORKFLOW.md` §4b et C3. « Sous-agent orchestré » = voie normale §5b (quasi-totalité des sessions). Utilisateur suit `EXECUTANT.md` (ce que *toute* session charge), ne pousse pas en fin de session dans cas le plus courant, croyant orchestrateur poussera « après collecte ». Contredit objectif T9 (sans dupliquer `WORKFLOW.md`) : règle divergente hors domicile. Commits session orchestrée restent non poussés plus longtemps que promis.

- **P6/S7** — `plugin/skills/nouveau-plan/references/squelette-session.md:12`, `plugin/skills/nouveau-plan/SKILL.md:181`, `plugin/agents/verificateur-plan.md:49` : trois disent session `exploration` n'a besoin que branche jetable **nommée**, citant C6. Mais C6 exige branche jetable **poussée** — et même session l'a écrit correctement dans `plugin/skills/cadrer/SKILL.md:136` (« branche jetable poussée »). Cadreur qui suit squelette nomme branche locale sans la pousser ; `verificateur-plan` (contrôle 10) dont c'est rôle rattraper écart, rend RAS car vérifie que présence de nom, pas push. Session `exploration` tourne en sous-agent sur branche invisible d'autre machine/`orchestrer-plan` — défaut exact que C6 voulait fermer.

## Tâches — plan P7 (l'effort d'une session vient de son agent)

Suivi d'avancement dans `plans/P7/index.md`, jamais ici.

- T1 — Créer les quatre agents porteurs d'effort · → plans/P7/S1.md
- T2 — Normaliser et valider la colonne Effort · → plans/P7/S2.md
- T3 — Porter l'exemption `low` dans le moteur, et faire porter l'effort à `relire` · → plans/P7/S2.md
- T4 — Retirer l'action `regler-effort`, sans perdre la couverture de `lancer` · → plans/P7/S2.md
- T5 — Composer le `subagent_type` de session, avec repli annoncé · → plans/P7/S3.md
- T6 — Transmettre l'effort au relecteur, et retirer les traces de `regler-effort` · → plans/P7/S3.md
- T7 — Remédiation : reprise et enquête à l'effort de leur modèle · → plans/P7/S3.md
- T8 — Réécrire §3 « Effort d'orchestration » et §5b · → plans/P7/S4.md
- T9 — Rendre juste le décompte des agents · → plans/P7/S4.md
- T10 — Retirer les contournements devenus faux · → plans/P7/S4.md
- T11 — Numéroter, consigner, publier · → plans/P7/S5.md

## Tâches — plan P8 (un geste par instruction)

Suivi d'avancement dans `plans/P8/index.md`, jamais ici.

- T1 — Appel d'agent prêt à recopier · → plans/P8/S1.md
- T2 — Arrêt sur arbre sale dans la zone de la vague · → plans/P8/S1.md
- T3 — Le lancement et la remédiation recopient `agent` · → plans/P8/S2.md
- T4 — Canal court, `verificateur-n0`, replis d'agent · → plans/P8/S2.md
- T5 — Options d'enquête au format de la question ; `Auto : oui` · → plans/P8/S2.md
- T6 — `/nouveau-plan` : sonde, replis, dépôt source, messages de vague · → plans/P8/S3.md
- T7 — `/fin-de-tache` : bilan unique, N1 hors navigateur · → plans/P8/S3.md
- T8 — `/reprendre` : un diff non commité renvoie à la session · → plans/P8/S3.md
- T9 — Cinq hooks, et plus d'agent retiré dans les gabarits · → plans/P8/S4.md
- T10 — `/nouveau-projet` : manifeste existant, routage des réponses · → plans/P8/S4.md
- T11 — Harnais portable, et rejeu des trois cas en Sonnet `low` · → plans/P8/S5.md
- T12 — Analyse écrite · → plans/P8/S5.md
- T13 — Version 0.41.0 et publication (si 9/9) · → plans/P8/S5.md
