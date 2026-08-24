# Workflow Claude Code — plans multi-sessions, validation, contexte plafonné

Un workflow de développement assisté par Claude Code : découpage d'un chantier en sessions
cadrées, validation à trois niveaux, fichiers de contexte sous plafond, garde-fous git.

**Il ne s'installe pas — il se copie dans votre dépôt.** Skills, agents, hooks et documentation
vivent sous `.claude/` de votre projet, versionnés avec lui. Conséquence directe : l'app Desktop,
l'extension VS Code, une session cloud et l'appli mobile y ont accès sans que personne n'installe
quoi que ce soit, parce que la seule chose que tous ces environnements garantissent, c'est le clone
du dépôt.

## Amorçage — une commande, aucun prérequis

Depuis la racine du dépôt à équiper :

```bash
git clone --depth 1 https://github.com/kovuthecat/claude-workflow "${TMPDIR:-/tmp}/wf" && node "${TMPDIR:-/tmp}/wf/bin/sync-workflow.mjs" --source "${TMPDIR:-/tmp}/wf" --projet .
```

Puis copier le fichier de réglages et ouvrir une nouvelle session :

```bash
cp .claude/workflow/templates/project-settings.json .claude/settings.json
```

C'est tout. Pas de marketplace, pas de plugin, pas de CLI à avoir sur le `PATH` : `git` et `node`,
que tout environnement Claude Code possède déjà. Le clone temporaire peut être jeté aussitôt.

À partir de là, tout passe par les skills du projet :

- **dépôt vide** → `/nouveau-projet` (interview de cadrage puis instanciation) ;
- **dépôt existant** → `/migrer-projet` (le diagnostic détecte l'état de départ) ;
- **plus tard** → `/maj-workflow` (resynchronise depuis ce dépôt, signale les fichiers modifiés).

## Ce que ça installe dans votre projet

| Emplacement | Contenu |
| --- | --- |
| `.claude/skills/` | les skills du workflow (découverte native par Claude Code) |
| `.claude/agents/` | 4 agents mécaniques : exploration, build/tests, git, doc externe |
| `.claude/workflow/hooks/` | garde-fous git, dérive du contexte, formatage |
| `.claude/workflow/` | `WORKFLOW.md`, `CONVENTIONS.md`, `CLAUDE-BASE.md`, squelettes |
| `.claude/workflow/manifest.json` | un hash par fichier géré — c'est lui qui rend la mise à jour possible |

Votre `AGENTS.md` racine et vos skills propres au projet ne sont **jamais** écrasés.

## La règle à connaître

**Un fichier listé dans `manifest.json` est géré : ne le modifiez pas à la main.** Une amélioration
remonte ici, puis redescend par `/maj-workflow`. Le manifeste rend la règle vérifiable — une
modification locale est détectée et *préservée* (jamais écrasée en silence), le temps que vous
décidiez si elle doit remonter.

## Mise à jour

```bash
node .claude/workflow/bin/sync-workflow.mjs --source <clone-de-ce-dépôt> --projet . --check
```

Sort en `1` si une action est due, `0` si tout est aligné. Sans `--check`, synchronise. La skill
`/maj-workflow` déroule la procédure complète, arbitrage des dérives compris.

## Installation en plugin (optionnelle)

Ce dépôt est aussi une marketplace Claude Code, si vous préférez disposer des skills sur toute une
machine sans équiper chaque dépôt :

```bash
claude plugin marketplace add kovuthecat/claude-workflow
```
```bash
claude plugin install workflow@templates
```

C'est un confort, pas un prérequis — et cette voie ne suit pas vos dépôts en session cloud, ce que
le vendoring fait.

## Licence

MIT.
