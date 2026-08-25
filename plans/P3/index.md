# Plan P3 — Option C : sous-agent par défaut, headless en exception   (rédigé par Opus)

## Objectif d'ensemble

Appliquer la décision du 2026-08-25 (`docs/decisions/2026-08-25-cadrage-voie-unique-orchestration.md`,
option C) : le sous-agent devient la voie normale de **toutes** les sessions orchestrées, la voie
headless une exception **déclarée** (effort `high`/`xhigh` à appliquer réellement, ou vague lancée
fenêtre fermée). En même temps, guérir la cause racine des bugs du 2026-08-24 : chaque règle du
workflow reçoit un **domicile unique** (`WORKFLOW.md`), les skills renvoient au lieu de reformuler.
Et `executer-vague` — 492 lignes dont un tiers de narratif — redescend sous 250 lignes.

## Sessions

| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Domicilier les règles dans `WORKFLOW.md` | Sonnet | medium | — | — | `plugin/WORKFLOW.md`, `plugin/CLAUDE-BASE.md` | [ ] |
| [S2](S2.md) | T3 | Réécrire `executer-vague` ≤ 250 lignes | Sonnet | high | — | S1 | `plugin/skills/executer-vague/`, `docs/decisions/` (1 nouveau fichier) | [ ] |
| [S3](S3.md) | T4-T6 | Les skills satellites renvoient au lieu de reformuler | Sonnet | medium | — | S1 | `plugin/skills/{fin-de-tache,nouveau-plan,reprendre,reprendre-echec}/` | [ ] |

## Ordonnancement

- **Vague 1** : S1 seule — les domiciles doivent exister avant que quiconque y renvoie.
- **Vague 2 — parallélisable** : S2 · S3 (zones disjointes, toutes deux ne dépendent que de S1).
  S2 est `high` : sous les règles actuelles (0.15.0), la lancer en **headless** (`claude -p
  --effort high`) pour que l'effort soit réellement appliqué — c'est précisément le cas d'exception
  que ce plan institutionnalise.
- **Vague 3 — clôture** (humain ou session Haiku `low`) : bump `0.16.0` + ligne `CHANGELOG.md`,
  synchronisation des 6 projets vendorés (`/maj-workflow`), `node plugin/bin/publier.mjs`,
  statuts `[x]`, **un seul push**.

## Particularités de ce dépôt

- **Templates est la source, pas un projet vendoré** : pas de hooks git, pas de `.claude/workflow/`.
  Les règles de commit par session (staging explicite, repère `Plan: P3/S<k>/T<m>` en dernière
  ligne) s'appliquent **sur discipline**, aucun hook ne les rattrapera.
- Pas de `TASKS.md` ici : le suivi vit dans cet index uniquement.
- ⚠ S2 et S3 modifient des skills que la vague 3 resynchronisera dans 6 projets : **aucun projet ne
  doit lancer `/maj-workflow` entre les vagues 2 et 3** (il vendoriserait un état intermédiaire).

## Hors périmètre

- Vendoriser le workflow dans Templates lui-même (dogfooding) : question distincte, non tranchée.
- Toute modification des hooks (`plugin/hooks/`) : l'option C ne change rien à `wave.lock`,
  qui reste requis pour tout parallélisme réel quelle que soit la voie.
- Le moteur (`bin/sync-workflow.mjs`, `bin/publier.mjs`) : livré en 0.15.0, ne bouge pas.
