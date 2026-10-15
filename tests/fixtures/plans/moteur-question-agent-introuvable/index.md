# Plan P<n> — Fixture d'une reprise à froid après une question (P20/S6)

## Objectif d'ensemble
Fixture dédiée aux tests de la reprise à froid d'une session arrêtée sur une question (`Agent :
introuvable`) — pas un plan réel. La passe Opus du plan est déjà consommée : une reprise ordinaire d'une
session Opus rendrait `budget-opus`, celle-ci doit rester hors budget.

Workflow : v0.39.0
Remédiation Opus : 1

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Nommer la fonction | Opus | high | — | — | `src/a.mjs` | [ ] |
| [S2](S2.md) | T3 | La brancher | Sonnet | medium | — | S1 | `src/b.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : fixture.
  - **S2** — fixture.
