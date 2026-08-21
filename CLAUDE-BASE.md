# CLAUDE-BASE.md

Règles communes à tous les projets — source unique, importée par le CLAUDE.md de chaque
projet ; ne pas copier. Chargé à **chaque** session : rester court.

## Règles générales

- Modifier le minimum de fichiers, garder le style existant. Simplicité > cosmétique.
- Pas de refactor global, changement de stack ou dépendance sans validation. Conventions :
  `C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\CONVENTIONS.md`.
- **Cadrage uniquement** (pas de plan existant) : lire `PROJECT_BRIEF.md` (produit), `ARCHITECTURE.md`
  (écrans, maquette UI), `DECISIONS.md` (registre — le détail est dans `docs/decisions/`, à n'ouvrir
  que si la décision est en jeu), `PROJECT_MAP.md` (localisation). Un exécutant qui a un `S<k>.md`
  ne lit QUE les fichiers listés dans sa session.

## Dépendances

Un exécutant n'ajoute **jamais** de dépendance de lui-même : si une tâche en requiert une, elle
est déjà tranchée dans « Modifier » de son plan. Sinon → **STOP**.

## Validation — trois niveaux

- **N0 auto (bloque le commit)** : `build` + `typecheck` (+ tests unitaires si la logique est pure).
  Un `typecheck` qui ne compile **aucun** fichier rend un vert vide et ne bloque plus rien : le
  vérifier une fois par projet (`--listFiles | wc -l` non nul) — cf. le gabarit `CLAUDE.md`.
- **N1 visuel auto (non bloquant)** : erreurs console, contenu présent, 4xx/5xx, responsive —
  **uniquement** via le navigateur in-app de Claude Code Desktop, en déroulant `/verif-visuelle`.
  Indisponible en VSCode/terminal : la skill sort alors la checklist à dérouler à la main.
- **N2 humain (non bloquant)** : jugement esthétique / UX / ton. Claude ne l'évalue pas, il le
  consigne dans `VALIDATION.md` — et **rien d'autre** n'y va.

Jamais de Playwright, de script de capture ni d'automatisation de navigateur hors outils in-app :
la régression visuelle scriptée est le rôle de Codex
(`C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\AGENTS.md`).

En mode autonome : enchaîner les tâches (gate = N0), accumuler les points N2, rendre la main en fin de lot.

## Avant de coder

Plan court (max 5 lignes) : objectif, fichiers concernés, 3-5 étapes, risques. Pas d'analyse longue.
Si les fichiers ne sont pas évidents : **faire chercher par un subagent `Explore`** plutôt que
d'explorer soi-même (le contexte accumulé se paie à chaque tour).

**Une session = un fichier `S<k>.md`** (1 à n tâches). `/clear` (ou nouvelle session) entre deux
sessions : ne pas traîner le contexte d'une session dans la suivante, ni improviser hors plan.

## Plans, modèles, garde-fous

Backlog : `TASKS.md`. Un plan = un dossier `plans/P<n>/` : un `index.md` (orchestration **et seul
porteur des statuts**) + un `S<k>.md` par session. Cadrage : skill `/nouveau-plan`.
Grille modèle/effort, niveaux de validation, règles de commit, plafonds de lignes :
`C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\WORKFLOW.md`.

Trois hooks appliquent ces règles (git, contexte à jour, plafonds) : ce ne sont pas des conseils,
ils refusent l'action. Un plafond dépassé → `/purge-contexte` avant de continuer.

## Fin de tâche

Dérouler la skill `/fin-de-tache`.
