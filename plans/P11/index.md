# Plan P11 — Preuves et contrôles économes

Workflow : v0.48.0

## Objectif d'ensemble
Fiabiliser la clôture des sessions et réduire les délégations mécaniques.
Décision : `docs/decisions/2026-09-25-preuves-et-controles-workflow.md`.
Exécution directe par Codex demandée par l'utilisateur ; pas d'orchestration Claude imbriquée.

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | T1-T4 | Implémentation et tests des points 2 à 5 | Codex | — | — | — | `plugin/` · `tests/` · `.claude/n0.json` | [x] |
| S2 | T5 | Version et publication | Codex | — | — | S1 | `plugin/.claude-plugin/plugin.json` · `CHANGELOG.md` | [ ] |

## Ordonnancement
- **Vague 1** : S1.
- **Vague 2** : S2.

## Validation
Tests ciblés, suites de hooks/scripts/renvois, N0 et publication à blanc.
Publication : procédure `plugin/bin/publier.mjs`, après push de Templates/main.

## Livraison
Version 0.48.0 préparée. N0 : hooks, scripts, renvois et publication à blanc PASS.
Publication distante bloquée : git sans identifiants et plugin GitHub HTTP 403
« Resource not accessible by integration ». S2 reste ouverte jusqu’à vérification distante.
