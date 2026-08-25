# Plan P3 — Option C + `/orchestrer-plan`   (rédigé par Opus)

## Objectif d'ensemble

Appliquer la décision du 2026-08-25 (`docs/decisions/2026-08-25-cadrage-voie-unique-orchestration.md`,
option C) et en tirer la conséquence : puisqu'une vague se termine désormais **dans le tour**, plus
rien ne justifie que l'orchestrateur rende la main entre deux vagues. `/executer-vague` devient
**`/orchestrer-plan`** : il déroule les vagues d'un plan les unes après les autres jusqu'à
épuisement, un échec, ou une gate humaine déclarée.

En même temps : guérir la cause racine des bugs du 2026-08-24 — chaque règle reçoit un **domicile
unique** dans `WORKFLOW.md`, les skills renvoient au lieu de reformuler — et ramener la skill
d'orchestration de 492 à ≤ 250 lignes en sortant le narratif vers `docs/decisions/`.

## Ce que « vague » devient

La vague **survit** comme unité de lot déclarée : elle encode le jugement « ces zones sont
disjointes, donc parallélisables », que seul le cadrage Opus peut porter. Ce qui disparaît, c'est
l'**arrêt** entre deux vagues. Les artefacts gardent leurs noms (`wave.lock`, `.claude/vague/`) :
ils restent par-lot, et les renommer coûterait une migration dans 6 projets pour rien.

## Sessions

| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Domicilier les règles dans `WORKFLOW.md` | Sonnet | medium | — | — | `plugin/WORKFLOW.md`, `plugin/CLAUDE-BASE.md` | [x] (2026-08-25) |
| [S2](S2.md) | T3-T4 | `/orchestrer-plan` : boucle de vagues, ≤ 250 lignes | Sonnet | high | headless (effort `high` réellement appliqué) | S1 | `plugin/skills/orchestrer-plan/`, `docs/decisions/` (1 nouveau) | [ ] |
| [S3](S3.md) | T5-T8 | Satellites : renvois, colonne `Env.`, renommage | Sonnet | medium | — | S1 | `plugin/skills/{fin-de-tache,nouveau-plan,reprendre,reprendre-echec}/`, `plugin/hooks/pretooluse-git.mjs` | [ ] |

## Ordonnancement

- **Vague 1** : S1 seule — les domiciles doivent exister avant que quiconque y renvoie.
- **Vague 2 — parallélisable** : S2 · S3 (zones disjointes, ne dépendent que de S1).
  S2 est `high` : `Env. = headless` déclaré, cas d'exception n°1 de l'option C — l'outil `Agent` ne
  règle pas l'effort. Lancement : `claude -p "Ouvre plans/P3/S2.md et exécute-le." --model
  claude-sonnet-5 --effort high`.
- **Vague 3 — clôture** (humain ou session Haiku `low`) : bump `0.16.0` + `CHANGELOG.md`,
  synchronisation des 6 projets vendorés, `node plugin/bin/publier.mjs`, statuts `[x]`, un push.

⚠ **S2 et S3 renomment la même skill de deux côtés** : S2 crée `skills/orchestrer-plan/` (contenu),
S3 met à jour les **références** dans les autres fichiers. Aucune des deux ne supprime
`skills/executer-vague/` : c'est la vague 3 qui le fait, une fois les deux commitées — sinon la
première des deux casse l'autre.

## Particularités de ce dépôt

- **Templates est la source, pas un projet vendoré** : pas de hooks git, pas de `.claude/workflow/`.
  Les règles de commit par session (staging explicite, repère `Plan: P3/S<k>/T<m>`) s'appliquent
  **sur discipline** — aucun hook ne les rattrapera.
- Pas de `TASKS.md` : le suivi vit dans cet index uniquement.
- ⚠ **Aucun projet ne lance `/maj-workflow` entre les vagues 2 et 3** : il vendoriserait un état
  intermédiaire (skill renommée d'un côté, références de l'autre).

## Hors périmètre

- **Ordonnanceur dynamique** (calculer le lot prêt à partir des dépendances plutôt que lire les
  vagues déclarées) : séduisant, mais la parallélisabilité repose sur un jugement de zones que le
  cadrage porte mieux qu'une inférence. À rouvrir seulement si les vagues déclarées se révèlent
  fausses à l'usage.
- Renommer `wave.lock` et `.claude/vague/` : migration dans 6 projets sans gain.
- Vendoriser le workflow dans Templates lui-même : question distincte, non tranchée.
- Les hooks au-delà des 2 messages d'erreur citant l'ancien nom.
