# Plan P<n> — Fixture moteur, vague parallèle (P21/S7)

## Objectif d'ensemble
Fixture dédiée aux tests du parallèle (`Parallèle : oui`) — pas un plan réel. Une vague de trois sessions
aux zones disjointes, puis une session qui dépend des trois. Les variantes (ligne retirée, zones qui se
recoupent, scénario à deux sessions) sont posées par chaque cas.

Workflow : v0.39.0
Preuve N0 : non requise
Parallèle : oui

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Première copie | Sonnet | medium | — | — | `src/a.mjs` | [ ] |
| [S2](S2.md) | T3 | Deuxième copie | Haiku | low | — | — | `src/b.mjs` · `docs/` | [ ] |
| [S3](S3.md) | T4 | Troisième copie | Opus | high | — | — | `src/c.mjs` | [ ] |
| [S4](S4.md) | T5 | Après la vague | Sonnet | medium | — | S1, S2, S3 | `src/d.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1 · S2 · S3.
  *Pourquoi maintenant* : les trois sessions n'ont rien en commun, elles partent ensemble.
  - **S1** — La première copie écrit `src/a.mjs`.
  - **S2** — La deuxième copie écrit `src/b.mjs` et la doc.
  - **S3** — La troisième copie écrit `src/c.mjs`.
- **Vague 2** : S4 (après S1, S2, S3).
  *Pourquoi maintenant* : elle s'appuie sur les trois copies fusionnées.
  - **S4** — Après la vague.
