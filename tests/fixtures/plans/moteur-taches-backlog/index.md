# Plan P<n> — Fixture moteur, identifiants de tâche du backlog (nova P18, Journal-emotion P1)

## Objectif d'ensemble
Fixture dédiée aux tests des identifiants `T-063` (P21/S1/T2) — pas un plan réel. Le champ Tâches de S1 est
recopié tel quel de nova `plans/P18/index.md` (ligne S2) ; les commits de test portent les lignes
`Plan: P18/S2/T-063`, `T-197` et `T-247` des commits réels, sous le numéro de plan de la fixture.

Workflow : v0.68.0
Preuve N0 : non requise

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T-063, T-197, T-247 | Saisie gardée, son coupé, double appui | Sonnet | low | — | — | `src/s1.mjs` | [ ] |
| [S2](S2.md) | T-016 | Suite | Sonnet | low | — | S1 | `src/s2.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : fixture.
  - **S2** — fixture.
