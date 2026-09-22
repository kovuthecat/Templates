# Plan P<n> — Fixture moteur, arrêt sur arbre sale (T2, P8/S1)

## Objectif d'ensemble
Fixture dédiée aux tests d'arrêt sur arbre sale dans la zone d'une vague (T2, P8/S1) — pas un plan
réel. La cellule « Zone modifiée » de S1 est remplacée par les tests eux-mêmes (technique déjà en
usage sur `moteur-effort`), pour couvrir les différents motifs sans multiplier les fixtures.

Workflow : v0.40.0

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Première tâche | Sonnet | medium | — | — | `src/a.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
