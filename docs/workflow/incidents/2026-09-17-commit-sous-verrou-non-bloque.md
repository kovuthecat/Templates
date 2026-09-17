# Incident workflow — 2026-09-17 — commit sous `wave.lock` non bloqué

- Projet : Templates (dépôt source) · Workflow : v0.38.1 · Plan : P6/S5/T10, P6/S5/T11
- Environnement : Desktop · sous-agent (session orchestrée par `/orchestrer-plan`)
- Étape : `EXECUTANT.md` point « Fin de tâche » · Nature : environnement

## Symptôme
`.claude/wave.lock` était présent (`P6 vague 5 — S5,S6,S7 — 2026-09-17T15:29:17Z`) avant mes deux
commits de tâche (T10, T11). D'après `WORKFLOW.md` §4b/§7, `pretooluse-git.mjs` doit refuser tout
commit sous ce verrou — c'est l'orchestrateur qui committe en fin de vague. Les deux `git commit` ont
pourtant réussi sans aucun refus.

## Preuve
`ls -la .claude/wave.lock` → fichier présent, contenu `P6 vague 5 — S5,S6,S7 — 2026-09-17T15:29:17Z`.
`git log --oneline -3` (après coup) → `c1c9ea9 refactor(skill): remediation.md …` et
`2972edc refactor(skill): orchestrer-plan exécute l'action du script d'état …`, tous deux réussis
alors que le verrou existait déjà au moment du premier commit.

## Sur place
Rien annulé (des sessions sœurs S6/S7 tournent peut-être en parallèle sur le même arbre ; un
`git reset` serait plus risqué que le laisser en l'état). Les commits portent les bons repères
`Plan: P6/S5/T10` et `Plan: P6/S5/T11` : l'état dérivé par `prochaine-action.mjs` (qui ne lit que
`git log`) reste correct malgré l'écart de procédure.
