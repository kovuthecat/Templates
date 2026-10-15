# Plan P<n> — Fixture d'une session arrêtée sur une question, sans réponse (P20/S6)

## Objectif d'ensemble
Fixture dédiée aux tests de l'état `en-attente` de `prochaine-action.mjs` — pas un plan réel. S1 s'est
arrêtée sur un choix et a écrit `S1.question.md` (écrit par le test, depuis le gabarit) ; S2 dépend de S1.

Workflow : v0.39.0

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Nommer la fonction | Sonnet | high | — | — | `src/a.mjs` | [ ] |
| [S2](S2.md) | T3 | La brancher | Sonnet | medium | — | S1 | `src/b.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : fixture.
  - **S2** — fixture.
