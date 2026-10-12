# Plan P18 — Génération 5.5 : Haiku en medium partout, réglages de modèle en retard signalés   (rédigé par Opus)

Workflow : v0.63.0
Preuve N0 : requise

## Objectif d'ensemble
La 0.63.0 a passé l'orchestrateur en Haiku et le gabarit de réglages en `medium` pour Haiku, mais
quatre endroits écrivent encore « Haiku `low` » : une session Haiku reprise après un échec
repartirait en `low`. À la fin de P18, tout réglage par défaut du workflow donne `medium` à Haiku,
et `/maj-workflow` signale dans chaque projet les réglages de modèle du gabarit qui lui manquent.
Sans ce signal, les projets restent sur les identifiants 5.0, et leur Opus tourne en `medium`. Le
tout est publié en 0.64.0.
Décision : `docs/decisions/2026-10-12-generation-5-5.md` (§ Chantier, points 1 à 3).

**Risques du plan** : la clé `modelSettings` lue par Claude Code est l'identifiant complet sans
date (`claude-haiku-5-5`). C'est constaté pour Opus (`docs/analyses/2026-10-06-session-neuve-mesures.md`)
et cohérent avec le `modelUsage` sondé le 2026-10-12 pour Haiku, mais pas mesuré pour Haiku. Ce qui
le réfuterait : une session Haiku lancée avec `claude-haiku-5-5` à `medium` et `effortLevel` racine à
`low`, qui tourne en `low`. Ce plan ne change rien à ce mécanisme, il ne fait qu'aligner les valeurs.

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Haiku medium partout, réglages de modèle en retard signalés | Sonnet | medium | — | — | `plugin/bin/prochaine-action.mjs` · `plugin/skills/nouveau-plan/references/squelette-index.md` · `plugin/templates/TASKS.md` · `plugin/skills/purge-contexte/SKILL.md` · `tests/fixtures/plans/squelette/index.md` · `plugin/bin/sync-workflow.mjs` · `plugin/skills/maj-workflow/SKILL.md` · `tests/tester-scripts.mjs` · `TASKS.md` | [ ] | — |
| [S2](S2.md) | T3 | Publication 0.64.0 | Haiku | medium | — | S1 | `plugin/.claude-plugin/plugin.json` · `plugin/mods/garde-fous/.claude-plugin/plugin.json` · `plugin/mods/affichage/.claude-plugin/plugin.json` · `CHANGELOG.md` · `docs/decisions/2026-10-12-generation-5-5.md` | [x] 2026-10-12 | — |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : la 0.63.0 publiée lance déjà l'orchestrateur en Haiku ; chaque reprise
  d'une session Haiku d'ici là repart en `low`.
  - **S1** — Une session Haiku reprise après un échec repart en `medium`, comme au premier
    lancement, et les gabarits de plan proposent Haiku en `medium`. Dans un projet, `/maj-workflow`
    affiche une ligne qui nomme les réglages de modèle à recopier, puis te propose de les recopier
    ou de laisser. Tu le verras aux nouveaux cas de test verts.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : la publication n'emporte S1 qu'une fois relue ; les projets la
  reçoivent au prochain `/maj-workflow`.
  - **S2** — Le workflow 0.64.0 est publié et installé sur ce poste. Au prochain `/maj-workflow`,
    chaque projet resté sur les anciens identifiants de modèle le voit signalé.
- **Vague 3 — clôture** : contexte (`TASKS.md`) et push. Pas de commits de code à rattraper :
  chaque session a commité les siens.
