# Plan P<n> — Fixture moteur, validation-humaine sur une vague dont un membre n'a pas tourné (P21/S1/T3)

## Objectif d'ensemble
Fixture dédiée aux tests de L3 — pas un plan réel. Forme de l'incident torrent-uploader du 2026-10-25 : S1
est `[x]!` (revue à bloquant non trié), la vague 2 `validation-humaine` réunit S2 (sans dépendance) et S3
(qui dépend de S1) ; S3 ne peut pas partir.

Workflow : v0.68.0
Preuve N0 : non requise

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1 | Première tâche | Sonnet | low | — | — | `src/s1.mjs` | [x]! 2026-11-25 |
| [S2](S2.md) | T2 | Deuxième tâche | Sonnet | low | — | — | `src/s2.mjs` | [ ] |
| [S3](S3.md) | T3 | Troisième tâche | Sonnet | low | — | S1 | `src/s3.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
- **Vague 2 — validation-humaine** : S2 · S3.
  *Pourquoi maintenant* : fixture.
  - **S2** — fixture.
  - **S3** — fixture.
