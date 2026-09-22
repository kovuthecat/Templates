# Incident workflow — 2026-09-22 — commit sous `wave.lock` non bloqué (récidive)

- Projet : Templates (dépôt source) · Workflow : v0.40.0 · Plan : P8/S1/T1, P8/S1/T2
- Environnement : Desktop · sous-agent (session orchestrée par `/orchestrer-plan`)
- Étape : `EXECUTANT.md` point « Fin de tâche » · Nature : environnement

## Symptôme
Récidive exacte de `2026-09-17-commit-sous-verrou-non-bloque.md` (v0.38.1, jamais corrigée depuis).
`.claude/wave.lock` était présent avant mes deux commits de tâche (T1, T2). `WORKFLOW.md` §4b/§7 et
`plugin/hooks/pretooluse-git.mjs` disent que `commit`/`push` doivent être refusés sous ce verrou —
c'est l'orchestrateur qui committe et pousse en fin de vague. Les deux `git commit` ont pourtant
réussi sans aucun refus. Autre écart trouvé en même temps : `EXECUTANT.md` § « Fin de tâche »
(section chargée par la session, lue avant le premier geste) dit littéralement l'inverse de
`WORKFLOW.md` §4b — « Un commit par tâche… sauf sous `.claude/wave.lock`, seule exemption qui
diffère **le push** à l'orchestrateur » — sans exempter le commit. Une session qui suit
`EXECUTANT.md` à la lettre committe donc sous verrou par construction, hook ou pas.

## Preuve
`git status --porcelain` avant mon premier commit → `?? .claude/wave.lock` listé (fichier présent,
non suivi). `git log --oneline -3` après coup → `084a49b feat(prochaine-action): arrêt sur arbre
sale…` et `cee954f feat(prochaine-action): appel d'agent prêt à recopier…`, tous deux réussis avec
le verrou déjà présent au premier commit. `plugin/EXECUTANT.md` (source, ~l. 66-71) : « Un commit
par tâche… — sauf sous `.claude/wave.lock`, seule exemption qui diffère **le push** à
l'orchestrateur » — à comparer à `plugin/WORKFLOW.md:116` : « Sous `.claude/wave.lock` : règle
suspendue, `pretooluse-git.mjs` refuse commit/push/worktree. »

## Sur place
Rien annulé (vague parallèle en cours, sessions sœurs possiblement actives sur le même arbre ; un
`git reset` serait plus risqué que le laisser en l'état — même choix que l'incident du 2026-09-17).
Les commits portent les bons repères `Plan: P8/S1/T1` et `Plan: P8/S1/T2` : l'état dérivé par
`prochaine-action.mjs` reste correct. Signalé en tête de mon rapport pour que l'orchestrateur pousse
ces commits tels quels plutôt que de les recommitter.
