# Plan P<n> — Fixture moteur, vague à efforts mêlés (T4, P7/S2)

## Objectif d'ensemble
Fixture dédiée au test « une vague peut mélanger les efforts : `lancer` rend à chacune le sien »
(T4, P7/S2) — pas un plan réel.

Workflow : v0.39.0

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Première tâche | Haiku | low | — | — | `src/a.mjs` | [ ] |
| [S2](S2.md) | T3-T4 | Deuxième tâche | Sonnet | medium | — | — | `src/b.mjs` | [ ] |

## Ordonnancement
- **Vague 1 — parallélisable** : S1 · S2.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
  - **S2** — fixture.
