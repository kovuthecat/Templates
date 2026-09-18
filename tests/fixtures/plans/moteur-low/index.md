# Plan P<n> — Fixture moteur, exemption `low` de la revue (T3, P7/S2)

## Objectif d'ensemble
Fixture dédiée au test de l'exemption C7 (une session `low` n'est jamais relue) par
`prochaine-action.mjs` (T3, P7/S2) — pas un plan réel. Zone réelle (`src/a.mjs`), pas `aucune` :
c'est ce qui distingue ce cas d'une session sans revue à cause d'une zone vide.

Workflow : v0.39.0

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Première tâche | Haiku | low | — | — | `src/a.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
