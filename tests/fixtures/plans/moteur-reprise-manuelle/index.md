# Plan P<n> — Fixture moteur, vague reprise-manuelle (S10)

## Objectif d'ensemble
Fixture dédiée aux tests du moteur de `prochaine-action.mjs` (S10) — pas un plan réel.

Workflow : v0.39.0

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Première tâche | Sonnet | medium | — | — | `src/a.mjs` | [ ] |
| [S2](S2.md) | T3 | Deuxième tâche | Sonnet | medium | — | S1 | `src/b.mjs` | [ ] |

## Ordonnancement
- **Vague 1 — reprise-manuelle** : S1.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : fixture.
  - **S2** — fixture.
