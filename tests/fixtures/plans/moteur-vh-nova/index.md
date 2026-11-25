# Plan P<n> — Fixture moteur, validation-humaine hors du gras (nova P20)

## Objectif d'ensemble
Fixture dédiée aux tests de `validation-humaine` écrite après les deux-points (P21/S1/T1) — pas un plan
réel. La ligne de la vague 1 est recopiée telle quelle de nova `plans/P20/index.md`.

Workflow : v0.68.0
Preuve N0 : non requise

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1 | Première tâche | Sonnet | low | — | — | `src/s1.mjs` | [ ] |
| [S2](S2.md) | T2 | Deuxième tâche | Sonnet | low | — | — | `src/s2.mjs` | [ ] |
| [S3](S3.md) | T3 | Troisième tâche | Sonnet | low | — | S1, S2 | `src/s3.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1 · S2 (aucune dépendance) — validation-humaine.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
  - **S2** — fixture.
- **Vague 2** : S3 (après S1 et S2).
  *Pourquoi maintenant* : fixture.
  - **S3** — fixture.
