# 2026-09-29 — Un lanceur `/creer-projet` dans le dossier parent des projets

## Ce que ça change

Créer un projet se fait désormais depuis le dossier où l'on se place pour ça, `Projets/`, en tapant
`/creer-projet`. Le lanceur demande le nom, crée le dossier, lance `git init`, vendore le workflow
depuis le dépôt public, puis bascule la session dans le nouveau dossier (outil `change_directory`
sur Desktop, `/cd` au terminal). `/nouveau-projet` y prend le relais, dans sa version tout juste
vendorée.

À quoi on le verra :

- `/creer-projet` apparaît dans une session ouverte sur `Projets/`, et dans aucun projet.
- Le lanceur se met à jour seul : à chaque création, il se compare à la copie du clone public et se
  remplace s'il diffère (message `LANCEUR MIS A JOUR`).

## Décision

- **Source** : `plugin/lanceur/creer-projet/SKILL.md`. Hors du plan de `sync-workflow` (jamais
  vendoré dans un projet), publié avec le reste de `plugin/`. Déployé une fois à la main dans
  `Projets/.claude/skills/creer-projet/` ; les versions suivantes arrivent par l'auto-mise à jour.
- **Plomberie seulement** : aucune interview dans le lanceur. La logique de `/nouveau-projet` n'existe
  qu'à un endroit.
- Nom distinct de `nouveau-projet` : après la bascule, les deux skills sont visibles dans la même
  session.

## Contexte

`/nouveau-projet` suppose une session ouverte dans le dossier du futur projet (chemins
`.claude/workflow/…` relatifs, renvois `${CLAUDE_PLUGIN_ROOT}` substitués au vendoring). Or
l'utilisateur se place dans `Projets/` pour créer un projet, et ce dossier n'avait aucune skill.

Claude Code cherche les skills de projet dans le dossier de départ et ses parents **jusqu'à la
racine du dépôt git** (doc « Skills », section monorepos). `Projets/` n'est pas un dépôt, chaque
projet en est un : une skill posée dans `Projets/.claude/skills/` n'atteint aucun projet. Le
`_comment` de `Projets/.claude/settings.json` (« ni skills ni plugin ») visait le plugin
`workflow@templates`, qui masquait les versions vendorées au scope user ; il est reformulé.

## Alternatives écartées

- **Copie complète de `nouveau-projet` dans `Projets/`** (option de `sync-workflow` filtrée) : skill
  à réécrire pour travailler depuis le parent, deux copies à tenir à jour.
- **Jonction vers `Templates/plugin/skills/nouveau-projet`** : `${CLAUDE_PLUGIN_ROOT}` n'y est pas
  substitué (renvois vers `cadrer` cassés), et ce n'est pas un vendoring.
- **Skill personnelle `~/.claude/skills/`** : prioritaire sur la skill de projet, elle masquerait la
  version vendorée dans chaque projet — le défaut du 2026-08-26.

## Conséquences

- Le lanceur dépend de la publication : un changement de `plugin/lanceur/` n'atteint `Projets/`
  qu'après `publier.mjs`.
- Constaté au test : sur le poste du dépôt source, `sync-workflow` refuse (sortie 3) à cause des
  anciennes versions laissées dans `~/.claude/plugins/cache/templates/workflow/` par les
  `claude plugin update` successifs. Le lanceur montre les lignes `CACHE` et pose la question
  (supprimer, ou `--ignorer-cache`). Incident :
  `docs/workflow/incidents/2026-09-29-cache-plugin-anciennes-versions.md`.

Brief : inchangé.

## Impact IA

Une session ouverte sur `Projets/` voit `/creer-projet` ; elle ne mène pas l'interview elle-même,
elle bascule et laisse `/nouveau-projet` la conduire.
