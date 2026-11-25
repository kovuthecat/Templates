# Plan P<n> — Fixture moteur, validation-humaine hors du gras (EBM-MSPv2 P18)

## Objectif d'ensemble
Fixture dédiée aux tests de `validation-humaine` écrite après les deux-points (P21/S1/T1) — pas un plan
réel. La ligne de la vague 3 est recopiée telle quelle de l'incident EBM-MSPv2 du 2026-10-25 (plan P18).

Workflow : v0.67.1
Preuve N0 : non requise

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1 | Première tâche | Sonnet | low | — | — | `src/s1.mjs` | [ ] |
| [S2](S2.md) | T2 | Deuxième tâche | Sonnet | low | — | S1 | `src/s2.mjs` | [ ] |
| [S3](S3.md) | T3 | Troisième tâche | Sonnet | low | — | S1 | `src/s3.mjs` | [ ] |
| [S4](S4.md) | T4 | Pilote | Sonnet | low | — | S2, S3 | `src/s4.mjs` | [ ] |
| [S5](S5.md) | T5 | Suite du pilote | Sonnet | low | — | S4 | `src/s5.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
- **Vague 2** : S2 · S3 (après S1).
  *Pourquoi maintenant* : fixture.
  - **S2** — fixture.
  - **S3** — fixture.
- **Vague 3** : S4 (après S2 et S3) — `validation-humaine`.
  *Pourquoi maintenant* : fixture.
  - **S4** — fixture.
- **Vague 4** : S5 (après S4).
  *Pourquoi maintenant* : fixture.
  - **S5** — fixture.
