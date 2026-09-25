# Templates — création d'un nouveau projet

Templates des fichiers de contexte à copier dans chaque nouveau projet.
**Ce README reste ici** — ne pas le copier dans le projet.

## Copiés dans le projet

Squelettes fournis par le plugin, dans `plugin/templates/` — **instanciés** (remplis, pas
seulement copiés) par `/nouveau-projet` ou `/migrer-projet` : `PROJECT_BRIEF.md`, `ARCHITECTURE.md`,
`DECISIONS.md`, `PROJECT_MAP.md`, `STATUS.md`, `TASKS.md`, `VALIDATION.md`, `CLAUDE.md`
(squelette), et — si le projet a une UI — `DESIGN_SPEC.md`.
`plugin/templates/project-settings.json` → copié tel quel en `.claude/settings.json` (effort par
défaut, permissions, 4 hooks câblés en chemins relatifs `$CLAUDE_PROJECT_DIR/.claude/workflow/hooks/`).

## Vendoré — jamais installé

Le reste de `plugin/` (`skills/`, `agents/`, `hooks/`, `CLAUDE-BASE.md`, `EXECUTANT.md`,
`WORKFLOW.md`, `CONVENTIONS.md`, `MIGRATION.md`, `bin/`) est **copié tel quel** sous
`.claude/skills/`, `.claude/agents/` et `.claude/workflow/` par `plugin/bin/sync-workflow.mjs`
(skills `/nouveau-projet`, `/migrer-projet`, `/maj-workflow`) — rien n'est installé à l'exécution,
tout voyage dans le clone. Un manifeste (`.claude/workflow/manifest.json`) garde un hash par
fichier géré (détail : §Distribution ci-dessous). Fichiers privés de ce dépôt, hors `plugin/`,
jamais distribués : `README.md`, `CHANGELOG.md`, `DECISIONS.md`, `plans/`, `docs/`.

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

Un projet n'« active » plus rien : le workflow est **vendoré** dans son `.claude/` par
`/nouveau-projet` ou `/migrer-projet`, et tenu à jour par `/maj-workflow`. Le dépôt public sert de
**source de secours** à cette synchronisation — le cas « ni clone du dépôt source, ni rien
d'installé » de `/maj-workflow` : un `git clone --depth 1` jetable, le temps de synchroniser.
C'est pourquoi il doit être republié à chaque version : un miroir en retard vendorise un workflow
périmé sur toute machine neuve.

### Publier une version

Depuis `main` à jour, après avoir bumpé `plugin/.claude-plugin/plugin.json` :

```bash
node plugin/bin/publier.mjs
```

Le script (`plugin/bin/publier.mjs`) se résout depuis son propre emplacement — la racine du
payload est son dossier parent (`plugin/`), quel que soit le dossier courant. Il construit le
payload dans un dossier jetable (`fs.mkdtempSync` sous le temp système, jamais l'arbre de dev),
lit la version dans `.claude-plugin/plugin.json`, applique le garde-fou de sécurité, puis pousse.

**Garde-fou intégré, bloquant** : aucun **vrai** chemin personnel ne doit sortir. Le script scanne
tout fichier texte du payload avec la même regex qu'avant (`[A-Za-z]:\\Users\\[A-Za-z0-9]|
/home/[a-z0-9]+/|/Users/[a-z0-9]+/`), qui ignore volontairement les exemples en ellipse de cette
doc (`C:\Users\…`) — l'ellipse ne fournit pas de segment alphanumérique après le séparateur, donc
pas de faux positif. Un hit affiche `fichier:ligne` et sort en code 1 **sans pousser** : contrairement
à un garde-fou en sous-shell shell, il ne peut pas être court-circuité par un `&&` qui continue
malgré l'alerte (constaté en publiant 0.12.0, avant que le script n'existe).

Après le push, le script vérifie via `git ls-remote` que le SHA distant correspond au SHA poussé,
et affiche un récapitulatif (version, SHA, nombre de fichiers). Le dossier temporaire est nettoyé
dans un `finally`, y compris en cas d'échec.

`--dry-run` fait tout sauf le push : construit le payload, scanne, affiche ce qui serait poussé,
nettoie. Utile pour valider une modification du script lui-même avant de l'exécuter pour de bon.

Le `--force` implicite au push est normal et voulu : le dépôt public est un **artefact de
distribution** à un seul commit, pas un historique à préserver. Sans bump de version, les projets
vendorés ne verront jamais la mise à jour — le manifeste compare les versions.

Projet existant à rattacher au workflow → `/migrer-projet`, quel que soit l'état de départ : son
diagnostic route vers la bonne voie (bascule d'un projet encore en workflow v1, ou adoption d'un
projet qui a du code mais n'a jamais été outillé). (`plugin/MIGRATION.md` n'est plus qu'un renvoi vers ces skills.)

## Skills du workflow

| Skill | Quand |
| --- | --- |
| `/nouveau-projet` | Repo vide, avant toute autre chose → interview de cadrage puis instanciation des fichiers |
| `/cadrer` | Le QUOI/POURQUOI n'est pas tranché, ou une idée neuve est à évaluer → session de réflexion Opus bornée (l'idée est d'abord dépliée en question), sortie = une décision écrite |
| `/revue-de-conception` | Les correctifs et ajouts se sont empilés → constat de l'écart écrit/code, **interview de recalage de l'objectif**, puis écarts classés A/B/C/D ; sortie = un rapport et l'écrit remis à jour, jamais une correction de code |
| `/nouveau-plan` | Opus découpe un plan → crée `plans/P<n>/` (contient les squelettes et la règle de découpage) |
| `/verif-visuelle` | Après une tâche qui touche l'UI → N1 au navigateur in-app, ou checklist si VSCode |
| `/revue-d-usage` | Revue d'ensemble d'une app à un jalon, par parcours joués (fonctionnel, ergonomie, accessibilité, esthétique sur demande) → une liste de constats classés, jamais une correction de code |
| `/orchestrer-plan` | `plans/P<n>/index.md` prêt → déroule le plan entier, vague après vague, sans rendre la main, jusqu'à épuisement, un échec ou une gate humaine |
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
- **Délégation** : recherche précise et sortie courte en direct ; exploration large, traces
  volumineuses et revues indépendantes via agents. N0 et contrôles mécaniques de plan par scripts
  (`WORKFLOW.md` §5), au premier plan.


Workflow modifié ? → une ligne dans `CHANGELOG.md` ; projets existants : `MIGRATION.md`, au fil
de l'eau.
