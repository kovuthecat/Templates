# Templates — création d'un nouveau projet

Templates des fichiers de contexte à copier dans chaque nouveau projet.
**Ce README reste ici** — ne pas le copier dans le projet.

## Copiés dans le projet

`PROJECT_BRIEF.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PROJECT_MAP.md`, `STATUS.md`, `TASKS.md`,
`VALIDATION.md`, `CLAUDE.md` (squelette), et — si le projet a une UI — `DESIGN_SPEC.md`.
`project-settings.json` → **renommé `.claude/settings.json`** (effort par défaut, `enabledPlugins`
et permissions ; les hooks voyagent désormais dans le plugin, plus dans ce fichier).

## Référencés — ne jamais copier

`CLAUDE-BASE.md`, `WORKFLOW.md`, `CONVENTIONS.md`, `AGENTS.md`, `MIGRATION.md`, `CHANGELOG.md`,
`README.md`, `plans/`.

## Distribution

Le repo entier est la marketplace Claude Code `templates` (GitHub privé `kovuthecat/Templates`),
qui expose un plugin unique `workflow` (skills, hooks, agents — voir `.claude-plugin/plugin.json`).

Un projet active le workflow en ajoutant `"enabledPlugins": {"workflow@templates": true}` à son
`.claude/settings.json` — déjà présent dans `project-settings.json` ci-dessus. `CLAUDE-BASE.md`
n'est plus importé par une ligne `@chemin` dans le `CLAUDE.md` du projet : son contenu est injecté
par le hook `SessionStart` du plugin à chaque session.

Les projets **non encore migrés** (chemins absolus, import `@CLAUDE-BASE.md`) continuent de
fonctionner tels quels — pas d'urgence à migrer. Marche à suivre : `MIGRATION.md` §5.

## Skills du workflow

| Skill | Quand |
| --- | --- |
| `/nouveau-projet` | Repo vide, avant toute autre chose → interview de cadrage puis instanciation des fichiers |
| `/nouveau-plan` | Opus cadre un plan → crée `plans/P<n>/` (contient les squelettes et la règle de découpage) |
| `/verif-visuelle` | Après une tâche qui touche l'UI → N1 au navigateur in-app, ou checklist si VSCode |
| `/fin-de-tache` | Tâche/session terminée → statuts, contexte, rapport, commit en fin de plan |
| `/purge-contexte` | Un hook signale un plafond dépassé → archivage sans perte |
| `/choisir-mecanisme` | Hésitation entre plusieurs mécanismes Claude Code, ou audit périodique de la config `.claude/` d'un projet |

## Séquence de création

1. **Dans le repo vide** : dérouler `/nouveau-projet` (interview de cadrage + instanciation des
   fichiers, settings, premier commit).
2. Rédiger `ARCHITECTURE.md` avec Opus. Si le projet a une UI : `DESIGN_SPEC.md`, puis maquette
   Claude Design (claude.ai) → exports dans `design/maquettes/` du projet.
3. Dérouler `/nouveau-plan` pour cadrer le premier plan à partir du brief, de l'architecture et de
   la maquette.

## Coût & fiabilité — les règles qui tiennent le workflow

- **Un statut vit à un seul endroit** : l'`index.md` du plan (`WORKFLOW.md` §4a).
- **Plafonds de lignes** sur les fichiers de contexte, appliqués par hook (`WORKFLOW.md` §7) —
  `VALIDATION.md` à 60 lignes (N2 en attente uniquement, item tranché = ligne supprimée).
- **Le détail des décisions** vit dans `docs/decisions/`, pas dans le registre.
- **Modèle = capacité, effort = quantité de travail** — ne pas monter l'un pour l'autre (§3).
- **N0/N1/N2** : ne mettre dans `VALIDATION.md` que ce qu'un humain seul peut juger (§6).
- **Délégation** : les tâches mécaniques (exploration, build/typecheck/tests, résumé de diff,
  lecture de doc externe) passent par les quatre agents du plugin — seule leur conclusion remonte
  dans la conversation principale, jamais les traces brutes (`CLAUDE-BASE.md` §Avant de coder).

Workflow modifié ? → une ligne dans `CHANGELOG.md` ; projets existants : `MIGRATION.md`, au fil
de l'eau.
