# CLAUDE.md

Instructions permanentes pour Claude Code. Seul fichier chargé automatiquement :
il pointe vers le reste, sans le recopier.

## Commandes

> Remplir avec les commandes réelles du projet. Section la plus utile : évite à Claude de deviner.

```bash
# Dev / serveur local
<commande dev>

# Build
<commande build>

# Tests (toute la suite)
<commande test>

# Test unitaire ciblé
<commande test fichier/cas précis>

# Lint / format
<commande lint>

# Typecheck
<commande typecheck>
```

- Variables d'environnement : `<emplacement .env / .env.example>`
- Ne jamais committer de secret (`.env`, clés, tokens).

## Règles générales

- Modifier le minimum de fichiers, garder le style existant. Simplicité > cosmétique.
- Pas de refactor global, changement de stack ou dépendance sans validation. Conventions : `CONVENTIONS.md`.
- **Cadrage uniquement** (pas de plan existant) : lire `PROJECT_BRIEF.md` (produit), `DECISIONS.md` (archi),
  `PROJECT_MAP.md` (localisation). Un exécutant qui a un `T<n>.md` ne lit QUE les fichiers listés dans sa tâche.

## Dépendances

Un exécutant n'ajoute **jamais** de dépendance de lui-même : si une tâche en requiert une, elle
est déjà tranchée dans « Modifier » de son plan. Sinon → **STOP**.

## Validation

- **Auto (bloque le commit)** : `build` + `typecheck` (+ tests unitaires si la logique est pure).
- **Visuel / UX (humain, non bloquant)** : Claude ne l'évalue pas — il consigne une checklist dans `VALIDATION.md`.
- **Jamais** de Playwright / navigateur / capture d'écran pour valider l'UI — les audits visuels sont le rôle de Codex (`AGENTS.md`).

En mode autonome : enchaîner les tâches (gate = Auto), accumuler `VALIDATION.md`, rendre la main en fin de lot.

## Avant de coder

Plan court (max 5 lignes) : objectif, fichiers concernés, 3-5 étapes, risques. Pas d'analyse longue.
Si les fichiers ne sont pas évidents : investiguer sans rien modifier (checklist : `WORKFLOW.md` §5).

**Une tâche = une session.** `/clear` (ou nouvelle session) entre deux tâches : le détail d'exécution
vit dans le seul `T<n>.md` de la tâche en cours — ne pas traîner le contexte d'une tâche dans la suivante.

## Plans & modèles

Backlog : `TASKS.md`. Un plan = un dossier `plans/P<n>/` : un `index.md` (liste des tâches) + un fichier
par tâche `T<n>.md`. Un exécutant repère sa tâche dans l'`index.md` puis travaille dans le seul `T<n>.md`.
Format des plans, grille modèle/effort, checklist d'investigation : `WORKFLOW.md`.

## Fin de tâche

Dérouler la skill `/fin-de-tache` (statuts, `STATUS.md`, rapport, commit atomique).
