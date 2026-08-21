# CHANGELOG.md

Une ligne datée par évolution du workflow. Consulté par MIGRATION.md pour évaluer le retard
d'un projet.

- `2026-07-03` — Refonte quota : `plans/P<n>/` (index + `S<k>.md`), skill `/fin-de-tache`, Codex = audits Playwright uniquement.
- `2026-07-07` — Pipeline création : ARCHITECTURE.md → maquette Claude Design (`design/maquettes/`) → câblage.
- `2026-07-07` — Centralisation : générique référencé (CLAUDE-BASE importé, WORKFLOW/CONVENTIONS/AGENTS pointés), skill au niveau utilisateur, MIGRATION.md.
- `2026-07-07` — Migration pilote (S4) élargie à 3 projets (ETP interactif, Chords, S&C) : annexe MIGRATION.md enrichie (variante `Contexte/`, correction de renvois après déplacement, arbitrage ROADMAP.md séparé/fusionné).
- `2026-07-28` — **Refonte coût & fiabilité.** (1) Garde-fous appliqués : 3 hooks (`SessionStart`, `PreToolUse` git, `Stop`) câblés via `project-settings.json` → `.claude/settings.json` du projet ; les règles git de §4d et la mise à jour du contexte ne sont plus de simples consignes. (2) Plafonds de lignes chiffrés (`.claude/hooks/plafonds.json`) + skill `/purge-contexte`. (3) `DECISIONS.md` scindé : registre une-ligne-par-décision + détail dans `docs/decisions/`. (4) `STATUS.md` = photo stricte, sans section historique. (5) Statut des tâches à un seul endroit : l'`index.md` du plan (retiré des `S<k>.md` et de `TASKS.md`). (6) Validation à 3 niveaux N0/N1/N2 : le **navigateur in-app de Claude Code Desktop** fait le N1, `VALIDATION.md` ne garde que le N2 ; bandeau `Environnement` + colonne `Env.` pour le cas VSCode (skill `/verif-visuelle`). (7) Codex recentré sur la régression scriptée. (8) Squelettes de plan déplacés de `WORKFLOW.md` vers la skill `/nouveau-plan` ; exploration déléguée à un subagent `Explore`. (9) Effort : échelle corrigée (`low·medium·high·xhigh`, ni `max` ni `minimal`), défaut projet `medium`, critère modèle-vs-effort explicite.
