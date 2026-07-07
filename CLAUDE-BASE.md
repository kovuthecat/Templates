# CLAUDE-BASE.md

Règles communes à tous les projets — source unique, importée par le CLAUDE.md de chaque
projet ; ne pas copier.

## Règles générales

- Modifier le minimum de fichiers, garder le style existant. Simplicité > cosmétique.
- Pas de refactor global, changement de stack ou dépendance sans validation. Conventions :
  `C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\CONVENTIONS.md`.
- **Cadrage uniquement** (pas de plan existant) : lire `PROJECT_BRIEF.md` (produit), `ARCHITECTURE.md`
  (écrans, maquette UI), `DECISIONS.md` (arbitrages), `PROJECT_MAP.md` (localisation). Un exécutant qui a un `S<k>.md` ne lit QUE les fichiers listés dans sa session.

## Dépendances

Un exécutant n'ajoute **jamais** de dépendance de lui-même : si une tâche en requiert une, elle
est déjà tranchée dans « Modifier » de son plan. Sinon → **STOP**.

## Validation

- **Auto (bloque le commit)** : `build` + `typecheck` (+ tests unitaires si la logique est pure).
- **Visuel / UX (humain, non bloquant)** : Claude ne l'évalue pas — il consigne une checklist dans `VALIDATION.md`.
- **Jamais** de Playwright / navigateur / capture d'écran pour valider l'UI — les audits visuels
  sont le rôle de Codex (`C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\AGENTS.md`).

En mode autonome : enchaîner les tâches (gate = Auto), accumuler `VALIDATION.md`, rendre la main en fin de lot.

## Avant de coder

Plan court (max 5 lignes) : objectif, fichiers concernés, 3-5 étapes, risques. Pas d'analyse longue.
Si les fichiers ne sont pas évidents : investiguer sans rien modifier (checklist :
`C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\WORKFLOW.md` §5).

**Une session = un fichier `S<k>.md`** (1 à n tâches, découpage par Opus selon
`C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\WORKFLOW.md` §4a).
`/clear` (ou nouvelle session) entre deux sessions : le détail d'exécution vit dans le seul `S<k>.md`
en cours — ne pas traîner le contexte d'une session dans la suivante, ni improviser des tâches hors plan.

## Plans & modèles

Backlog : `TASKS.md`. Un plan = un dossier `plans/P<n>/` : un `index.md` (guide d'orchestration :
sessions + vagues parallélisables) + un fichier par session `S<k>.md` (bandeau modèle/effort/vague,
1 à n tâches). Un exécutant travaille dans le seul `S<k>.md` qu'on lui donne.
Format des plans, grille modèle/effort, règles de commit en parallèle :
`C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\WORKFLOW.md`.

## Fin de tâche

Dérouler la skill `/fin-de-tache` (statuts, `STATUS.md`, rapport, commit atomique).
