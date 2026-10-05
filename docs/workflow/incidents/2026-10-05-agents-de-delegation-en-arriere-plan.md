# Incident workflow — 2026-10-05 — agents de délégation partis en arrière-plan pendant un cadrage

- Projet : session `/cadrer` (projet aval) · Workflow : v0.52.0 (`plugin.json`) · Plan : aucun (cadrage)
- Environnement : Desktop (Windows 11) · à la main
- Étape : `/cadrer` Étape 2, délégation à `explorateur` / `lecteur-doc` / `analyste-flux` · Nature : environnement

## Symptôme
Les deux agents de délégation lancés par le cadrage sont partis en arrière-plan : le tour a continué
sans leur conclusion, contrairement à la décision
`docs/decisions/2026-09-04-delegation-au-premier-plan.md`.

## Preuve
L'outil `Agent` de Claude Code lance désormais un sous-agent en arrière-plan quand
`run_in_background` n'est pas précisé. `EXECUTANT.md` (l. 35), `/orchestrer-plan`, `/nouveau-plan`
(bloc `critique-plan`) et `/revue-d-usage` dictaient déjà `run_in_background: false` ; `/cadrer`
Étape 2 ne disait que « déléguer », et s'appuyait sur l'ancien défaut (premier plan).

## Sur place
Rien : conclusions attendues à la notification de fin des agents.

## Corrigé
0.53.0, le jour même : `run_in_background: false` dicté en une ligne partout où une skill délègue
sans bloc `Agent({…})` — `cadrer`, `revue-de-conception`, `reprendre`, `reprendre-echec` (et mode
enquête), `nouveau-plan` (Étape 1, `verificateur-plan`), `fin-de-tache` (`relecteur-session`),
`choisir-mecanisme`, `orchestrer-plan` (`resumeur-git`), `maj-workflow`, `migrer-projet` ;
`WORKFLOW.md` §5 et `CLAUDE-BASE.md` portent la règle. Les lancements de sessions volontairement
en arrière-plan (`/orchestrer-plan`) sont inchangés.
