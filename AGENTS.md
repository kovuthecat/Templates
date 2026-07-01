# AGENTS.md

Instructions permanentes pour **Codex**. Codex charge ce fichier automatiquement ;
il ne charge PAS les autres — ce fichier pointe vers eux, sans les recopier.

## Rôle de Codex

Agent d'**exécution des tâches bien cadrées et vérifiables** : implémentation mécanique,
boilerplate, tests, refactors délimités, conversions, critères d'acceptation nets.
Objectif : économiser les tokens Claude. Grille des modèles : `WORKFLOW.md` §2.

## Avant toute tâche

Lire `TASKS.md` (index), puis le plan de la tâche `plans/PLAN_<id>.md` et exécuter uniquement
la/les tâches taguées **« Modèle : Codex »**. Ne lire que les fichiers listés sous « Lire ».
Contexte projet si nécessaire : `PROJECT_BRIEF.md`, `DECISIONS.md`, `PROJECT_MAP.md`, `STATUS.md`.

## Commandes & règles

Commandes (dev, build, test, lint, typecheck) et règles générales : `CLAUDE.md`.
Ne jamais committer de secret.

## Garde-fou — quand s'arrêter

S'arrêter et rendre la main dès que la tâche :
- devient floue, sous-spécifiée ou ouvre plusieurs options produit ;
- exige un changement de stack, une dépendance lourde ou un refactor structurant ;
- demande d'investiguer largement le repo pour comprendre un bug.

Alors : ne rien improviser, résumer le blocage, proposer l'escalade.

## Audits UI ponctuels (Playwright)

Ne pas installer Playwright dans le projet. Utiliser le runner partagé depuis la racine du projet à auditer :

```powershell
node "C:\Users\kovu\SynologyDrive\Thibault\Projets\.tooling\playwright-audit\audit.mjs" <url>
```

`--headed` affiche le navigateur ; `--output <dossier>` change la sortie (défaut : `output/playwright/`).
Démarrer d'abord le serveur du projet (commande dans son `CLAUDE.md`), puis auditer l'URL locale ;
consulter le rapport JSON (erreurs console/page, requêtes échouées, débordements horizontaux).
Si le projet a déjà une suite E2E `@playwright/test`, utiliser sa version locale — le runner partagé
sert aux audits ponctuels, pas à remplacer les tests versionnés.
