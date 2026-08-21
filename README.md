# Templates — création d'un nouveau projet

Templates des fichiers de contexte à copier dans chaque nouveau projet.
**Ce README reste ici** — ne pas le copier dans le projet.

## Copiés dans le projet

`PROJECT_BRIEF.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PROJECT_MAP.md`, `STATUS.md`, `TASKS.md`,
`VALIDATION.md`, `CLAUDE.md` (squelette), et `project-settings.json` → **renommé
`.claude/settings.json`** (effort par défaut + les 3 hooks du workflow).

## Référencés — ne jamais copier

`CLAUDE-BASE.md`, `WORKFLOW.md`, `CONVENTIONS.md`, `AGENTS.md`, `MIGRATION.md`, `CHANGELOG.md`,
`README.md`, `plans/`, `.claude/hooks/`, `.claude/skills/`.

Les hooks sont **pointés par chemin absolu** depuis `.claude/settings.json` du projet : les corriger
ici les corrige partout. Les skills sont exposées via la jonction `~/.claude/skills/<nom>` →
`Templates/.claude/skills/<nom>` (une skill locale de même nom dans un projet **masquerait** celle-ci).

## Skills du workflow

| Skill | Quand |
| --- | --- |
| `/nouveau-plan` | Opus cadre un plan → crée `plans/P<n>/` (contient les squelettes et la règle de découpage) |
| `/verif-visuelle` | Après une tâche qui touche l'UI → N1 au navigateur in-app, ou checklist si VSCode |
| `/fin-de-tache` | Tâche/session terminée → statuts, contexte, rapport, commit en fin de plan |
| `/purge-contexte` | Un hook signale un plafond dépassé → archivage sans perte |

## Séquence de création

1. **Instancier** : copier la liste « Copiés dans le projet » ci-dessus dans le nouveau repo,
   placer `project-settings.json` en `.claude/settings.json`, écrire le stub `AGENTS.md`
   (3 lignes, bloc ci-dessous), `git init`, premier commit.

   ```md
   # AGENTS.md
   Lire et appliquer `C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\AGENTS.md`
   (rôle Codex : régression visuelle scriptée). Commandes du projet : `CLAUDE.md`.
   ```

2. **Réflexion produit** (avec Opus) : remplir `PROJECT_BRIEF.md` — objectif, fonctionnalités
   MVP, hors périmètre, stack. Supprimer les sections non pertinentes.
3. **Réflexion architecture** (avec Opus) : remplir `ARCHITECTURE.md` — écrans, navigation,
   données affichées, découpage feature-first. Arbitrages structurants → une ligne dans
   `DECISIONS.md` + un fichier `docs/decisions/`.
4. **Maquette UI — Claude Design** : envoyer `ARCHITECTURE.md` tel quel à Claude Design
   (claude.ai) ; Thibault y dessine la maquette écran par écran. Exporter les écrans dans
   `design/maquettes/` du projet et mettre à jour `ARCHITECTURE.md` §Maquette (statut, écarts).
5. **Câblage — Claude Code** : Opus déroule `/nouveau-plan` pour cadrer `P1` à partir du brief, de
   l'architecture et de la maquette ; les sessions listent les fichiers de `design/maquettes/` dans
   « Lire ». Le design est fixé — on câble sur la maquette, on ne redessine pas en codant.
6. **Finaliser le contexte** : `CLAUDE.md` (commandes réelles du projet), `.claude/launch.json` si
   le projet a un serveur dev (nécessaire au N1), purger les sections vides restantes.

Projet sans UI (script, pipeline, CLI) : sauter l'étape 4 et la partie écrans d'`ARCHITECTURE.md`.

## Coût & fiabilité — les règles qui tiennent le workflow

- **Un statut vit à un seul endroit** : l'`index.md` du plan (`WORKFLOW.md` §4a).
- **Plafonds de lignes** sur les fichiers de contexte, appliqués par hook (`WORKFLOW.md` §7).
- **Le détail des décisions** vit dans `docs/decisions/`, pas dans le registre.
- **Modèle = capacité, effort = quantité de travail** — ne pas monter l'un pour l'autre (§3).
- **N0/N1/N2** : ne mettre dans `VALIDATION.md` que ce qu'un humain seul peut juger (§6).

Workflow modifié ? → une ligne dans `CHANGELOG.md` ; projets existants : `MIGRATION.md`, au fil
de l'eau.
