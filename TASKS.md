# TASKS.md — bloquants et tâches en cours

## Bloquants de revue (à corriger avant prochaine vague)

- aucun (P20/S3 : bloquant « `options.liste` non lue » soldé par S5, le moteur rédige la question avec ses options)

## Revue des règles des projets (`docs/decisions/2026-10-08-regles-de-projet-validees.md`)

- [ ] ETP interactif · Tuto-onshape (dépôt git invalide d'abord) · torrent-uploader · annuaire-msp ·
  claude-mods · MYO · Lunii Studio upgrade · S&C · vostfr-CLI · EBM-perso
- [ ] Sans blocage, suspectes seules : cosme-diy · trieur-plex · extension-firefox · Veilleur · DrumsTraining
- Blocs clos (projets revus, P17) archivés : `docs/archives/TASKS-2026-10-16.md`

## Suites de la revue externe — plans 1 et 2 (`plans/P19/index.md`, `plans/P20/index.md`)
- [x] Plan 1 clos 2026-10-15, publié en 0.66.0 ; mesure de référence : `docs/analyses/2026-10-14-mesure-de-reference.md`
- [x] Plan 2 (P20, 14 sessions) clos 2026-10-16, publié en 0.67.0 ; remesure : `docs/analyses/2026-10-15-remesure-plan-2.md`
  (H1 confirmée ; critères A et B non tenus à la lettre : `cd` de l'orchestrateur et du relecteur)
- [ ] À faire par l'utilisateur : retirer de `~/.claude/plugins/installed_plugins.json` l'entrée
  `workflow@templates` v0.55.0 (`projectPath` `C:\Users\kovu\Projets\Templates`), doublon dû à la casse du chemin
- [ ] Constats de la remesure, pour un plan suivant (analyse §8) : `cd` de l'orchestrateur et du relecteur ; avis
  « mods non installés » qui arrête l'orchestrateur Haiku (1 passage sur 13) ; `Plan: P<n>/S<k>/` sans `T<m>` lu comme
  commit de tâche (invalide la preuve N0) ; l'orchestrateur invente un identifiant d'agent pour `SendMessage` ;
  écart entre le protocole documenté (réponse committée) et le comportement observé de l'orchestrateur Haiku
- [ ] P14 d'EBM-MSP v2 : seul plan ouvert encore marqué `pastille` (voir `plugin/MIGRATION.md`, 0.67.0)

## Backlog de revue (non bloquant)

- Backlog ancien P9 à P16 : `docs/archives/TASKS-2026-10-16.md`.
- **P17/S2** — `plugin/bin/sync-workflow.mjs` : le filtre du socle (hors `Bash(npm ` / `Bash(npx `) est codé en dur —
  une autre stack dans le gabarit obligerait à toucher au script.
- **P17/S4** — `plugin/bin/brief-a-jour.mjs:~66` : le message « SANS OBJET — pas de PROJECT_BRIEF.md »
  ne dit pas que le contrôle porte aussi sur `CLAUDE.md` ; docs (skills, gabarit, agent) non relues.
- **P18** — `plugin/mods/garde-fous/tests/fixture-index.ts:9` : reste « Haiku | low » (fixture d'un mod, hors périmètre).
- **P19/S2** — `plugin/bin/publier.mjs:85` : la regex BINAIRES n'a pas l'extension élargie de `sync-workflow.mjs`
  (pdf, webp, ttf, mp4…) ; règle dupliquée et divergente, côté publier sans test.
- **P19/S3** — `prochaine-action.mjs:enquetesDuPlan` : un `git show` par commit de `S*.echec.md` à chaque appel.
- **P19/S4** — `pretooluse-git.mjs` : `git --no-pager add .` échappe encore à l'analyse ; `sessionstart-contexte.mjs:206`
  et `:290` dupliquent la résolution de `CLAUDE_CONFIG_DIR` ; `publier.mjs` ne met à jour que l'entrée de la casse courante.
- **P19/S5-S6** — `publier.mjs:290-395` : corps de `publierPayload()` non réindenté ; `tests/scenarios/lancer.mjs:87` :
  `etatDepot` avale toute erreur git et rend `inconnu`.
- **P20/S2-S3** — `plugin/README.md:40` décrit encore « 4 agents de session » ; `WORKFLOW.md` §3 garde une digression sur
  le frontmatter d'agent ; `questionBudget`/`questionEnvironnement` dupliquent leur structure ; `Bash(ls:*)` mal rangé
  dans `project-settings.json:95`.
- **P20/S4-S5** — cinquième lecteur d'index dans `tests/scenarios/noter.mjs:63` ; en-tête périmé `prochaine-action.mjs:11` ;
  doublons dans `verifier-plan.mjs:21,38` ; `formaterTexte` garde un bloc « données » à retirer ; `lireProse` second balayage.
- **P20/S6-S8** — `questionConsommee` : `transmettre` rendu deux fois renvoie la réponse, trois appels git par passage ;
  `appliquerPlan()` ~140 lignes à factoriser ; `cloturer` appelle `ranger()` à chaque appel ; `gesteEtat` (saut de ligne
  final), `estRelue(s)` à unifier, liste des sensibles dite en prose ET en constante.
- **P20/S9-S10** — `nouveau-plan/SKILL.md:295` contredit le bandeau réduit ; `pretooluse-git.mjs` cherche `Express :`
  dans toute la commande ; `garde-fous/hooks/lire-index.mjs` code mort ; `lireHead` sans cache.
- **P20/S11-S13** — budget 7b dit deux fois dans `EXECUTANT.md` ; `fin-de-plan.md:9` « ils faits » ; pile orchestrer-plan à
  220 lignes (plafond exact) ; analyse de remesure : attribution des refus du critère B (4, pas 3), généralisation sur `cd`,
  décompte du critère C, phrase sur `mot.txt` ; `reprendre-echec/SKILL.md:179-183` contredit `fin-de-plan.md:30-33` ;
  `ACTION_MOTEUR` recopié en dur dans `noter.mjs:76`.
