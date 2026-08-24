# Templates — création d'un nouveau projet

Templates des fichiers de contexte à copier dans chaque nouveau projet.
**Ce README reste ici** — ne pas le copier dans le projet.

## Copiés dans le projet

Squelettes fournis par le plugin, dans `plugin/templates/` : `PROJECT_BRIEF.md`, `ARCHITECTURE.md`,
`DECISIONS.md`, `PROJECT_MAP.md`, `STATUS.md`, `TASKS.md`, `VALIDATION.md`, `CLAUDE.md`
(squelette), et — si le projet a une UI — `DESIGN_SPEC.md`.
`plugin/templates/project-settings.json` → **renommé `.claude/settings.json`** (effort par défaut,
`enabledPlugins` et permissions ; les hooks `PreToolUse`/`PostToolUse`/`Stop` voyagent dans le
plugin, plus dans ce fichier — seule exception : un hook `SessionStart` de bootstrap, cf.
`docs/decisions/2026-08-24-sessionstart-bootstrap-hook.md`). `plugin/templates/session-start.sh` →
copié à côté, en `.claude/hooks/session-start.sh` (executable).

## Référencés — ne jamais copier

Fournis par le plugin (`plugin/CLAUDE-BASE.md`, `plugin/WORKFLOW.md`, `plugin/CONVENTIONS.md`,
`plugin/AGENTS.md`, `plugin/MIGRATION.md`) : pas de copie, ils voyagent avec le plugin installé et
se référencent depuis lui par `${CLAUDE_PLUGIN_ROOT}/…`. Fichiers privés de ce dépôt, hors
plugin, jamais distribués : `README.md`, `CHANGELOG.md`, `DECISIONS.md`, `plans/`, `docs/`.

## Distribution

**Deux dépôts, deux rôles.** Le développement du plugin se fait **ici**, dans ce dépôt privé, sous
`plugin/` — avec les plans, les décisions et l'historique. La distribution passe par le dépôt
**public** [`kovuthecat/claude-workflow`](https://github.com/kovuthecat/claude-workflow), qui ne
contient que le plugin. On ne modifie jamais le dépôt public à la main : il est **publié depuis
celui-ci** (voir ci-dessous).

**Pourquoi public.** Une session cloud (claude.ai/code, appli mobile) n'a pas de credentials git à
elle : elle ne peut pas cloner un dépôt privé, donc un plugin distribué depuis un dépôt privé ne s'y
charge pas — il ne marchait qu'en local, là où les credential helpers de la machine authentifient le
clone. Un dépôt public se clone sans authentification : le plugin se charge partout, y compris sur
toute machine ou tout environnement cloud neuf, sans PAT à créer, stocker ni faire tourner.

Le dépôt public **ne contient rien de privé** : ni plans, ni décisions, ni notes. Il est publié
**sans historique** (un commit unique), parce que l'historique de `plugin/` traverse l'anonymisation
et exposerait sinon des états antérieurs (prénom, chemins personnels) que l'arbre actuel ne contient
plus.

Un projet active le workflow avec `"enabledPlugins": {"workflow@templates": true}` +
`extraKnownMarketplaces` (déjà dans `plugin/templates/project-settings.json`), puis une installation
explicite — cf. `/nouveau-projet` Phase C. `CLAUDE-BASE.md` n'est pas importé par une ligne
`@chemin` : son contenu est injecté par le hook `SessionStart` à chaque session.

### Publier une version

Depuis `main` à jour, après avoir bumpé `plugin/.claude-plugin/plugin.json` :

Dérouler dans un **clone jetable**, jamais dans l'arbre de dev : `reset --hard` et `rm -rf` n'ont
aucune raison de s'exécuter sur le dépôt de travail.

```bash
git checkout --orphan plugin-public && git rm -rq --cached .
rm -rf docs plans CHANGELOG.md DECISIONS.md README.md CLAUDE.md .github
cp -r plugin/. . && rm -rf plugin
git add .claude-plugin README.md AGENTS.md CLAUDE-BASE.md CONVENTIONS.md MIGRATION.md WORKFLOW.md agents bin hooks skills templates
git commit -m "Plugin workflow — marketplace templates"
git push --force git@github.com:kovuthecat/claude-workflow.git plugin-public:main
```

**L'ordre purge-puis-copie compte** : le payload apporte désormais son propre `README.md`, que la
purge supprimerait si elle passait après la copie — et le dépôt public se retrouverait sans page
d'accueil, donc impartageable.

Garde-fou avant de pousser — aucun **vrai** chemin personnel ne doit sortir. Ne pas se contenter de
chercher `C:\Users` : la documentation en cite en exemple avec une ellipse (`C:\Users\…`), ce qui
produit un faux positif. Viser un segment d'utilisateur réel :

```bash
grep -rnE '[A-Za-z]:\\Users\\[A-Za-z0-9]|/home/[a-z0-9]+/|/Users/[a-z0-9]+/' . --exclude-dir=.git
```

Sortie vide = propre. **Ne pas mettre cette vérification dans un sous-shell** `( … )` d'une chaîne
`&&` : son `exit` n'y interrompt que le sous-shell, et la publication continue malgré l'alerte
(constaté en publiant 0.12.0).

`--force` est normal et voulu : le dépôt public est un **artefact de distribution** à un seul
commit, pas un historique à préserver. Sans bump de version, les projets vendorés ne verront jamais
la mise à jour — le manifeste compare les versions.

Projet existant à rattacher au workflow → `/migrer-projet`, quel que soit l'état de départ : son
diagnostic route vers la bonne voie (bascule d'un projet encore en workflow v1, ou adoption d'un
projet qui a du code mais n'a jamais été outillé). `plugin/MIGRATION.md` pour les cas tordus.

## Skills du workflow

| Skill | Quand |
| --- | --- |
| `/nouveau-projet` | Repo vide, avant toute autre chose → interview de cadrage puis instanciation des fichiers |
| `/cadrer` | Le QUOI/POURQUOI n'est pas tranché → session de réflexion Opus bornée, sortie = une décision écrite |
| `/nouveau-plan` | Opus découpe un plan → crée `plans/P<n>/` (contient les squelettes et la règle de découpage) |
| `/verif-visuelle` | Après une tâche qui touche l'UI → N1 au navigateur in-app, ou checklist si VSCode |
| `/executer-vague` | Vague prête → voie headless (`claude -p`, verdicts par schéma) et/ou voie Desktop (pastilles `spawn_task`), ne garde que les verdicts |
| `/fin-de-tache` | Tâche/session terminée → statuts, contexte, rapport, commit en fin de plan |
| `/purge-contexte` | Un hook signale un plafond dépassé → archivage sans perte |
| `/reprendre` | Projet laissé de côté, « où j'en étais ? » → lecture bornée, écarts signalés, une prochaine action proposée |
| `/reprendre-echec` | Une session de plan a échoué → rapport de passation, état réel vérifié, correction, N0 reprouvé |
| `/migrer-projet` | Projet existant à rattacher, quel qu'en soit l'état → diagnostic qui route vers bascule (workflow v1) ou adoption (jamais outillé), puis vérification prouvée |
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
