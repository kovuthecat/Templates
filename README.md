# Templates — création d'un nouveau projet

Templates des fichiers de contexte à copier dans chaque nouveau projet.
**Ce README reste ici** — ne pas le copier dans le projet.

## Copiés dans le projet

`PROJECT_BRIEF.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PROJECT_MAP.md`, `STATUS.md`, `TASKS.md`,
`VALIDATION.md`, `CLAUDE.md` (squelette).

## Référencés — ne jamais copier

`CLAUDE-BASE.md`, `WORKFLOW.md`, `CONVENTIONS.md`, `AGENTS.md`, `MIGRATION.md`, `CHANGELOG.md`,
`README.md`, `plans/`.

## Séquence de création

1. **Instancier** : copier la liste « Copiés dans le projet » ci-dessus dans le nouveau repo,
   écrire le stub `AGENTS.md` (3 lignes, bloc ci-dessous), `git init`, premier commit.

   ```md
   # AGENTS.md
   Lire et appliquer `C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\AGENTS.md`
   (rôle Codex : audits visuels uniquement). Commandes du projet : `CLAUDE.md`.
   ```

2. **Réflexion produit** (avec Opus) : remplir `PROJECT_BRIEF.md` — objectif, fonctionnalités
   MVP, hors périmètre, stack. Supprimer les sections non pertinentes.
3. **Réflexion architecture** (avec Opus) : remplir `ARCHITECTURE.md` — écrans, navigation,
   données affichées, découpage feature-first. Arbitrages structurants → `DECISIONS.md`.
4. **Maquette UI — Claude Design** : envoyer `ARCHITECTURE.md` tel quel à Claude Design
   (claude.ai) ; Thibault y dessine la maquette écran par écran. Exporter les écrans dans
   `design/maquettes/` du projet et mettre à jour `ARCHITECTURE.md` §Maquette (statut, écarts).
5. **Câblage — Claude Code** : Opus cadre le plan `P1` (format `WORKFLOW.md` §4) à partir du
   brief, de l'architecture et de la maquette ; les sessions listent les fichiers de
   `design/maquettes/` dans « Lire ». Le design est fixé — on câble sur la maquette, on ne
   redessine pas en codant.
6. **Finaliser le contexte** : `CLAUDE.md` (commandes réelles du projet), purger les sections
   vides restantes.

Projet sans UI (script, pipeline, CLI) : sauter l'étape 4 et la partie écrans d'`ARCHITECTURE.md`.

Workflow modifié ? → une ligne dans `CHANGELOG.md` ; projets existants : `MIGRATION.md`, au fil
de l'eau.
