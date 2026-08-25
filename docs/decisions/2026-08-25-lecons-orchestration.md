# 2026-08-25 — Leçons d'orchestration (extraites d'`executer-vague`)

Narratif retiré de `plugin/skills/executer-vague/SKILL.md` (492 lignes) au moment de sa réécriture
en `orchestrer-plan` (plan P3/S2). Une skill est une procédure relue à chaque orchestration ; le
*pourquoi* de chaque garde-fou — l'incident qui l'a produit — n'a pas à se payer à chaque lecture.
Il vit ici. Recoupe `docs/decisions/2026-08-24-executer-vague-deux-voies.md`,
`2026-08-24-commit-par-session.md` et `2026-08-24-orchestration-par-sous-agents.md`, qui détaillent
les mêmes incidents sous l'angle de la décision prise plutôt que de la leçon retenue.

## Arrêt-au-FAIL structurel plutôt qu'en consigne

2026-08-24, `/executer-vague` deux voies (point 6). Le hook `Stop` avait la condition
`vagueParallele()` disponible dans `lib.mjs` mais laissait un orchestrateur Haiku `low` plaider sa
cause en prose contre le blocage plutôt que de tester la condition mécaniquement. La même leçon a
été appliquée en amont à la boucle de lancement headless : l'arrêt au premier `FAIL` n'est pas écrit
comme une consigne que l'orchestrateur devrait se rappeler d'appliquer, il est le `break` de la
boucle elle-même — rien à oublier, rien à plaider.

## Pièges du lecteur JSON : tabulation IFS, contenu vs chemin

Leçon du 2026-08-23. Deux pièges indépendants dans le passage verdict/motif/rapport entre un
processus headless et l'orchestrateur : découper une ligne sur une tabulation utilisée comme
séparateur de champs échoue dès que deux tabulations se suivent (IFS whitespace les effondre en
une, décalant tous les champs qui suivent) ; et passer le **contenu** d'un rapport en argument de
commande plutôt que son **chemin** dépasse la taille maximale d'un argument dès que le rapport est
un peu long. Les deux ont fini par forcer un lecteur en Node plutôt qu'en bash pur.

## « Verdict perdu en route » et le recoupement par les commits

Constaté sur MYO P2/S9 puis P3/S1, 2026-08-24 et 2026-08-25 : bilan de session écrit, N0 vert, et
pourtant un JSON illisible ou absent à l'arrivée. Le canal JSON meurt plus souvent que la session
qui l'écrit — processus tué après la fin du travail mais avant l'émission du JSON, refus de
permission sur le tout dernier outil, timeout du harnais sur un appel trop long. Depuis 0.13.0
(`docs/decisions/2026-08-24-commit-par-session.md`), les commits sont la vérité et le JSON n'est que
le messager : un `FAIL` à motif « sortie non conforme » ou un `PANNE` se recoupe donc contre
`git log --grep`, tâche par tâche, avant d'être pris pour argent comptant.

## Trust indexé sur la chaîne du chemin

Trouvé en marge de MYO, 2026-08-24 (`docs/decisions/2026-08-24-orchestration-par-sous-agents.md`).
`hasTrustDialogAccepted` de `~/.claude.json` est indexé sur la **chaîne littérale** du chemin de
projet, pas sur le dossier qu'elle désigne : l'entrée `C:\Users\...\MYO` ne couvre pas
`C:/Users/.../MYO` bien qu'ils pointent vers le même répertoire. Un shell qui résout la seconde
forme fait perdre l'allowlist en silence — aucune erreur, juste des outils refusés sans personne
pour les autoriser.

## Allowlist ignorée en silence

Même incident, leçon distincte : la présence de `permissions.allow` dans `.claude/settings.json` ne
garantit pas qu'elle s'applique. `claude -p` loggue `Ignoring N permissions.allow entries: this
workspace has not been trusted` sur stderr sans faire échouer le lancement — la session démarre,
tourne, et bute sur chaque outil refusé, en headless, où personne n'est là pour confirmer. Seul un
lancement canari et une lecture du stderr des deux premières lignes révèle le problème avant qu'il
ne coûte une vague entière.

## Worktree par défaut de la pastille

2026-08-24 (`docs/decisions/2026-08-24-commit-par-session.md`, point 2). « Démarrer avec worktree »
est le choix par défaut de la pastille `spawn_task`, et l'arbre est créé avant le premier tour de la
session — donc hors de portée de tout hook `PreToolUse`. Combiné à `wave.lock` gitignoré (donc
absent de tout worktree lié), deux sessions d'une même vague ont travaillé dans des arbres séparés,
invisibles l'une de l'autre et de `main` : leurs commits n'existaient nulle part que git puisse
recouper, et la vague suivante, qui dépendait de ce code, n'avait rien à lire.
