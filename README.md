# Templates — création d'un nouveau projet

Templates des fichiers de contexte à copier dans chaque nouveau projet.
**Ce README reste ici** — ne pas le copier dans le projet.

## Copiés dans le projet

Squelettes fournis par le plugin, dans `plugin/templates/` : `PROJECT_BRIEF.md`, `ARCHITECTURE.md`,
`DECISIONS.md`, `PROJECT_MAP.md`, `STATUS.md`, `TASKS.md`, `VALIDATION.md`, `CLAUDE.md`
(squelette), et — si le projet a une UI — `DESIGN_SPEC.md`.
`plugin/templates/project-settings.json` → **renommé `.claude/settings.json`** (effort par défaut,
`enabledPlugins` et permissions ; les hooks voyagent désormais dans le plugin, plus dans ce
fichier).

## Référencés — ne jamais copier

Fournis par le plugin (`plugin/CLAUDE-BASE.md`, `plugin/WORKFLOW.md`, `plugin/CONVENTIONS.md`,
`plugin/AGENTS.md`, `plugin/MIGRATION.md`) : pas de copie, ils voyagent avec le plugin installé et
se référencent depuis lui par `${CLAUDE_PLUGIN_ROOT}/…`. Fichiers privés de ce dépôt, hors
plugin, jamais distribués : `README.md`, `CHANGELOG.md`, `DECISIONS.md`, `plans/`, `docs/`.

## Distribution

Le plugin est **auto-contenu dans `plugin/`** : manifeste, marketplace, skills, agents, hooks et
squelettes. Ce dossier est extractible tel quel — rien en dehors ne lui est nécessaire.

La marketplace `templates` s'enregistre par une source **`git-subdir`** (cf.
`plugin/templates/project-settings.json`), qui fait un **clone sparse** : un projet ne rapatrie que
`plugin/`, jamais les plans ni les décisions de ce dépôt. Un projet active ensuite le workflow avec
`"enabledPlugins": {"workflow@templates": true}`. `CLAUDE-BASE.md` n'est pas importé par une ligne
`@chemin` : son contenu est injecté par le hook `SessionStart` du plugin à chaque session.

**Où le plugin est disponible, et où il ne l'est pas.** Ce dépôt est privé, et une session cloud
(claude.ai/code, appli mobile) n'a pas de credentials git à elle : elle ne peut pas cloner cette
marketplace, donc le plugin ne s'y charge pas. En local (Desktop, CLI) il se charge parce que les
credential helpers git de la machine authentifient le clone. Deux issues, non exclusives :

1. **Environnement cloud authentifié** — stocker un PAT à portée réduite en variable
   d'environnement, et poser un URL-rewrite git dans le script de setup de l'environnement :
   `git config --global url."https://x-access-token:$TOKEN@github.com/kovuthecat/Templates".insteadOf "https://github.com/kovuthecat/Templates"`.
2. **Publier `plugin/` dans un repo public** — un repo public se clone sans aucune
   authentification, ce qui règle le cloud définitivement. Procédure : `CHANGELOG.md`, entrée
   `plugin/ extractible`. Le nom de la marketplace reste `templates`, donc `workflow@templates` et
   les `enabledPlugins` déjà déployés continuent de fonctionner : seule la source change.

Projet existant pas encore migré → `/migrer-projet` (`plugin/MIGRATION.md` pour les cas tordus).

## Skills du workflow

| Skill | Quand |
| --- | --- |
| `/nouveau-projet` | Repo vide, avant toute autre chose → interview de cadrage puis instanciation des fichiers |
| `/cadrer` | Le QUOI/POURQUOI n'est pas tranché → session de réflexion Opus bornée, sortie = une décision écrite |
| `/nouveau-plan` | Opus découpe un plan → crée `plans/P<n>/` (contient les squelettes et la règle de découpage) |
| `/verif-visuelle` | Après une tâche qui touche l'UI → N1 au navigateur in-app, ou checklist si VSCode |
| `/executer-vague` | Vague prête sans session `Desktop` → lance chaque session en processus séparé, ne garde que les verdicts |
| `/fin-de-tache` | Tâche/session terminée → statuts, contexte, rapport, commit en fin de plan |
| `/purge-contexte` | Un hook signale un plafond dépassé → archivage sans perte |
| `/reprendre` | Projet laissé de côté, « où j'en étais ? » → lecture bornée, écarts signalés, une prochaine action proposée |
| `/migrer-projet` | Projet existant encore hors plugin (import `@CLAUDE-BASE.md`, hooks en dur, skills locales) → bascule puis vérification prouvée |
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
