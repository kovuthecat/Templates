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

- Avant une tâche importante : `PROJECT_BRIEF.md` (produit), `DECISIONS.md` (archi), `PROJECT_MAP.md` (localisation).
- Modifier le minimum de fichiers, garder le style existant. Simplicité > cosmétique.
- Pas de refactor global, changement de stack ou dépendance sans validation. Conventions : `CONVENTIONS.md`.

## Dépendances

Un exécutant n'ajoute **jamais** de dépendance de lui-même : si une tâche en requiert une, elle
est déjà tranchée dans « Modifier » de son plan. Sinon → **STOP**. Barème complet : `WORKFLOW.md`.

## Validation

- **Auto (bloque le commit)** : `build` + `typecheck` (+ tests unitaires si la logique est pure).
- **Visuel / UX (humain, non bloquant)** : Claude ne l'évalue pas — il consigne une checklist dans `VALIDATION.md`.
- **Jamais** de Playwright / navigateur / capture d'écran pour valider l'UI.

En mode autonome : enchaîner les tâches (gate = Auto), accumuler `VALIDATION.md`, rendre la main en fin de lot.

## Avant de coder

Plan court (max 5 lignes) : objectif, fichiers concernés, 3-5 étapes, risques. Pas d'analyse longue.
Si les fichiers ne sont pas évidents : investiguer sans rien modifier (checklist : `WORKFLOW.md` §5).

## Modèles, tâches & plans

- **Opus** conçoit et rédige les plans ; les autres exécutent. Grille modèle/effort : `WORKFLOW.md` §1-3.
- Backlog et tâches : `TASKS.md` (index). Chaque tâche active a son plan dans `plans/PLAN_<id>.md`
  (format : `WORKFLOW.md` §4). Un exécutant ne lit que les fichiers listés dans sa tâche.
- **Codex** : instructions dans `AGENTS.md`.

## Après modification

1. Mettre à jour `STATUS.md` ; les autres fichiers de contexte **seulement si leur contenu change**
   (un fichier de contexte faux est pire qu'absent). Passer la tâche à `[x]` dans `TASKS.md`.
2. Fin de session : `git status`, commit atomique, push.

## Rapport de fin de tâche

Fichiers modifiés · Résumé · Tests lancés · À valider visuellement (→ `VALIDATION.md`) · Prochaine action.
