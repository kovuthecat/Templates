# Plan P<n> — Fixture moteur, gestes mécaniques de `--appliquer` (P20/S7)

## Objectif d'ensemble
Fixture dédiée aux tests de `prochaine-action.mjs --appliquer` — pas un plan réel. Deux sessions ;
chaque cas pose dans un dépôt jetable les commits de tâche (`Plan: P9/S<k>/T<m>`), les revues déposées
non commitées, les rapports d'échec, selon le geste à éprouver.

Workflow : v0.39.0
Preuve N0 : non requise

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Première tâche | Sonnet | medium | — | — | `src/a.mjs` | [ ] |
| [S2](S2.md) | T3 | Deuxième tâche | Sonnet | medium | — | S1 | `src/b.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : fixture.
  - **S2** — fixture.
