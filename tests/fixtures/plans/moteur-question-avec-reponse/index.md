# Plan P<n> — Fixture d'une session arrêtée sur une question, réponse donnée (P20/S6)

## Objectif d'ensemble
Fixture dédiée aux tests de l'action `transmettre` de `prochaine-action.mjs` — pas un plan réel. S1 a
écrit `S1.question.md` et l'orchestrateur y a recopié la réponse ; S3 est indépendante de S1 (le budget de
reprises de S1 est lu dans un `S1.echec.md` posé par le test : il ne doit jamais être consulté).

Workflow : v0.39.0

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Nommer la fonction | Sonnet | high | — | — | `src/a.mjs` | [ ] |
| [S2](S2.md) | T3 | La brancher | Sonnet | medium | — | S1 | `src/b.mjs` | [ ] |
| [S3](S3.md) | T4 | Les messages | Haiku | low | — | — | `src/c.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1 · S3.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
  - **S3** — fixture.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : fixture.
  - **S2** — fixture.
