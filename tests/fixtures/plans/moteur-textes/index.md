# Plan P<n> — Fixture des textes finaux (P20/S5)

## Objectif d'ensemble
Fixture dédiée aux tests des textes rendus par `prochaine-action.mjs` (annonce de vague, question,
reste lançable, rapport final) — pas un plan réel. La prose de l'Ordonnancement est écrite sur
plusieurs lignes, comme dans un index réel : le texte rendu doit la porter en entier.

Workflow : v0.39.0

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Les fondations | Sonnet | high | — | — | `src/a.mjs` | [ ] |
| [S2](S2.md) | T3 | L'interface | Haiku | low | — | — | `src/b.mjs` · `docs/` | [ ] |
| [S3](S3.md) | T4 | Le moteur | Sonnet | medium | — | S1, S2 | `src/c.mjs` | [ ] |
| [S4](S4.md) | T5 | Les mods | Sonnet | medium | — | S3 | `src/d.mjs` | [ ] |
| [S5](S5.md) | T6 | La publication | Haiku | medium | — | S4 | `src/e.mjs` | [ ] |
| [S6](S6.md) | T7 | La remesure | Sonnet | medium | — | — | `src/f.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1 · S2.
  *Pourquoi maintenant* : tout le reste s'appuie sur ces deux sessions ;
  sans elles, le moteur n'aurait rien à rédiger.
  - **S1** — Les fondations existent : tu le verras à un test
    qui passe là où il échouait.
  - **S2** — L'interface se branche sur les fondations.
- **Vague 2** : S3 (après S1, S2) · S6.
  *Pourquoi maintenant* : le moteur rédige enfin ses textes.
  - **S3** — Le moteur rend les textes finaux.
  - **S6** — La remesure compare le tout à la référence.
- **Vague 3** : S4 (après S3).
  *Pourquoi maintenant* : les mods suivent le moteur.
  - **S4** — Les mods affichent le texte du moteur.
- **Vague 4 — validation-humaine** : S5 (après S4).
  *Pourquoi maintenant* : on publie.
  - **S5** — La version sort.
