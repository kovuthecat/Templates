# Plan P1 — Centralisation du workflow (générique référencé, spécifique copié)   (rédigé par Fable)

> Ce plan concerne le repo `Templates/` lui-même et `~/.claude`. Le dossier `plans/` de Templates
> n'est **jamais** copié dans les projets.

## Objectif d'ensemble

Faire de `Templates/` la source unique et vivante du workflow : les projets **référencent** les
fichiers génériques (règles CLAUDE, WORKFLOW, CONVENTIONS, AGENTS, skill `fin-de-tache`) au lieu
d'en porter des copies. Ajuster le workflow = éditer Templates, sans re-synchronisation.
Les projets existants migrent **au fil de l'eau** (au moment où on y retravaille), par sessions
modèle guidées par `MIGRATION.md` — les contextes anciens sont hétérogènes, un script ne peut pas
le faire.

## Décisions structurantes

- **D1 — Générique référencé, spécifique copié.** Copiés : PROJECT_BRIEF, ARCHITECTURE, DECISIONS,
  PROJECT_MAP, STATUS, TASKS, VALIDATION, CLAUDE.md (squelette) + stub AGENTS.md. Référencés (jamais
  copiés) : CLAUDE-BASE.md (via import `@`), WORKFLOW.md, CONVENTIONS.md, AGENTS.md central,
  MIGRATION.md, CHANGELOG.md, README.md, plans/.
- **D2 — Règles génériques via import.** Le CLAUDE.md projet importe
  `@C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\CLAUDE-BASE.md` : chargé à chaque
  session (même coût token qu'aujourd'hui), maintenu à un seul endroit. Repli si l'import absolu
  ne fonctionne pas (à vérifier en S4) : recopier les règles critiques inline + pointeur lazy.
- **D3 — Skill au niveau utilisateur.** `~/.claude/skills/fin-de-tache` = jonction NTFS vers
  `Templates/.claude/skills/fin-de-tache` (source versionnée git, disponible partout). Les copies
  locales dans les projets doivent être supprimées à la migration (une skill projet masque la
  skill utilisateur de même nom).
- **D4 — Migration paresseuse, jamais en masse.** Un projet migre à la prochaine session de
  travail dessus, via `MIGRATION.md`. Sonnet `medium` par défaut (jugement sur fichiers
  hétérogènes). `CHANGELOG.md` (une ligne datée par évolution du workflow) sert de référence
  des deltas pour les cas ambigus.

## Sessions

| Session | Tâches | Titre | Modèle | Effort | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T3 | Refonte Templates : CLAUDE-BASE, README, CHANGELOG | Sonnet | medium | — | racine `Templates/` | [ ] |
| [S2](S2.md) | T4 | Rédiger MIGRATION.md | Sonnet | high | S1 | `Templates/MIGRATION.md` | [x] |
| [S3](S3.md) | T5-T6 | Skill niveau utilisateur + permission globale | Haiku | low | — | `~/.claude/` | [ ] |
| [S4](S4.md) | T7 | Migration pilote (1er projet retravaillé) | Sonnet | medium | S1-S3 | repo du projet pilote | [x] |

## Ordonnancement

- **Vague 1 — parallélisable** : S1 · S3 (zones disjointes : Templates vs `~/.claude`).
- **Vague 2** : S2 (après S1 — MIGRATION.md décrit l'état cible fixé en S1).
- **Vague 3** : S4 + **gate humaine** : relire le diff du projet pilote, corriger `MIGRATION.md`
  avec les cas rencontrés (annexe « Cas particuliers ») avant toute autre migration.
- **Vague finale — fil de l'eau** (pas de fichier de session) : à chaque reprise d'un projet
  non migré, lancer Sonnet `medium` avec le prompt standard :
  « Lis `C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\MIGRATION.md` et applique-la à ce
  projet. » Puis consolidation habituelle (statuts, commit) et mise à jour de l'annexe de
  MIGRATION.md si un cas nouveau est apparu.

## Projets candidats à la migration (ordre = prochaine reprise probable)

~~ETP interactif~~ · ~~Chords~~ · ~~S&C (ex-app-rectte-course-md, `fichierscontexte/`)~~ — migrés
2026-07-07 (voir `MIGRATION.md` §Annexe pour le détail par projet).

Restants : cosme-diy · FermentLab (`CONTEXTE/fermentlab-context/`) · DoxUploader ·
Outils/motif-layout · Outils/laser-tools (SPEC.md) · MYO/Vscode (méta my-ai-workflow 2026-05).
