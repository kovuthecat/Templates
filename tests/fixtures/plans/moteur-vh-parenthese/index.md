# Plan P<n> — Fixture moteur, parenthèse qui cite validation-humaine (P21/S1/T1)

## Objectif d'ensemble
Cas témoin : un en-tête de vague dont la PARENTHÈSE cite le mot `validation-humaine` ne déclenche aucun
arrêt humain — le mot n'est cherché que hors des parenthèses (pas un plan réel).

Workflow : v0.68.0
Preuve N0 : non requise

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1 | Première tâche | Sonnet | low | — | — | `src/s1.mjs` | [ ] |
| [S2](S2.md) | T2 | Deuxième tâche | Sonnet | low | — | S1 | `src/s2.mjs` | [ ] |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : fixture.
  - **S1** — fixture.
- **Vague 2** : S2 (après la validation-humaine de S1, déjà tranchée à l'écrit).
  *Pourquoi maintenant* : fixture.
  - **S2** — fixture.
