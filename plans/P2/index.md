# Plan P2 — Plugin workflow, agents mécaniques, cadrage guidé   (rédigé par Fable)

> Ce plan concerne le repo `Templates/` lui-même (+ `~/.claude` en S9). Le dossier `plans/`
> n'est jamais copié dans les projets. Périmètre validé en conversation le 2026-08-22.
> **Particularité Templates** : `STATUS.md`/`TASKS.md` du repo sont des *templates* (contenu
> placeholder) — le suivi de ce plan vit ici, on n'écrit pas l'état du repo dans les templates.

## Objectif d'ensemble

Transformer `Templates/` en **plugin Claude Code** (skills + hooks + agents distribués via le repo
GitHub comme marketplace) pour fonctionner aussi en cloud, supprimer chemins absolus et jonctions.
Ajouter : agents mécaniques Haiku à délégation proactive, skill questionnaire `/nouveau-projet`,
skill `/choisir-mecanisme` (distillation du rapport capacités), `DESIGN_SPEC.md` aligné Design
Sync, permissions allowlist, enchaînement de sessions (pastille + orchestrateur headless), règle
tests systématiques, purge N2.

## Décisions structurantes (détail → docs/decisions/ en S8)

- **D-P2-1 — Plugin sans déplacement de fichier.** Le repo entier = marketplace `templates`
  (GitHub privé `kovuthecat/Templates`) contenant un plugin `workflow` dont la source est `./`.
  Le manifest pointe vers les emplacements EXISTANTS (`.claude/skills/`, `.claude/hooks/`) ;
  les hooks résolvent déjà leurs chemins via `import.meta.url` → portables tels quels. Les projets
  non migrés (chemins absolus) continuent de fonctionner — migration au fil de l'eau (MIGRATION §5).
- **D-P2-2 — CLAUDE-BASE injecté par hook.** L'import `@C:\...\CLAUDE-BASE.md` du CLAUDE.md projet
  est remplacé par une émission du contenu par `sessionstart-contexte.mjs` (la sortie d'un hook
  SessionStart est ajoutée au contexte). Source unique conservée, fonctionne en cloud. La migration
  d'un projet DOIT retirer l'import (sinon double chargement).
- **D-P2-3 — Le settings projet se réduit à** : `enabledPlugins` + `permissions` (allowlist) +
  `effortLevel`. Les hooks voyagent dans le plugin (`hooks.json`, chemins `${CLAUDE_PLUGIN_ROOT}`).
- **D-P2-4 — 4 agents mécaniques Haiku** (`explorateur`, `verificateur-n0`, `resumeur-git`,
  `lecteur-doc`), délégation rendue proactive par la rédaction de leur `description`
  (« Proactively… », « Use immediately after… ») + table de délégation dans CLAUDE-BASE.
- **D-P2-5 — Enchaînement de sessions** : pastille `spawn_task` en Desktop (1 clic = session neuve),
  orchestrateur `claude -p` pour les vagues sans N1. Jamais de `/clear` auto (impossible).
- **D-P2-6 — VALIDATION.md = N2 en attente uniquement** ; item tranché supprimé (git = archive) ;
  plafond 120 → 60. Pas de scission registre/détail (pas d'asymétrie de relecture).
- **D-P2-7 — DESIGN_SPEC.md** porte le brief Claude Design (envoyé tel quel) + l'état Design Sync
  (kit de composants HTML `@dsCard`, id projet claude.ai) ; `ARCHITECTURE.md` redevient technique.
- **D-P2-8 — Rapport capacités** : archivé daté dans `docs/references/`, distillé en skill
  `/choisir-mecanisme` (arbre de décision + audit + URLs doc + règle de fraîcheur). Les questions
  pointues vont à l'agent `claude-code-guide`, pas à du texte figé.

## Sessions

| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T4 | Structure plugin & marketplace | Sonnet | high | — | — | `.claude-plugin/`, `.claude/hooks/`, chemins dans skills + CLAUDE-BASE | [x] |
| [S2](S2.md) | T5-T8 | Agents mécaniques | Sonnet | medium | — | S1 | `agents/` | [x] |
| [S3](S3.md) | T9-T10 | DESIGN_SPEC & ARCHITECTURE | Sonnet | medium | — | — | `DESIGN_SPEC.md`, `ARCHITECTURE.md` | [x] |
| [S4](S4.md) | T11 | Skill /nouveau-projet (questionnaire) | Sonnet | high | — | S1 | `.claude/skills/nouveau-projet/` | [x] |
| [S5](S5.md) | T12-T13 | Skill /choisir-mecanisme + archive rapport | Sonnet | high | — | — | `.claude/skills/choisir-mecanisme/`, `docs/references/` | [x] |
| [S6](S6.md) | T14-T16 | Skills existantes : délégation, enchaînement, tests, purge | Sonnet | medium | — | S1 | `.claude/skills/{fin-de-tache,nouveau-plan,purge-contexte}/` | [x] |
| [S7](S7.md) | T17-T20 | Docs de référence, plafonds, settings projet | Sonnet | medium | — | S1 | `WORKFLOW.md`, `CLAUDE-BASE.md`, `CONVENTIONS.md`, `CLAUDE.md`, `VALIDATION.md`, `TASKS.md`, `plafonds.json`, `project-settings.json` | [x] |
| [S8](S8.md) | T21-T23 | README, CHANGELOG, MIGRATION, décisions | Sonnet | medium | — | S3-S7 | `README.md`, `CHANGELOG.md`, `MIGRATION.md`, `DECISIONS.md`, `docs/decisions/` | [x] |
| [S9](S9.md) | T24-T26 | Installation locale, jonctions, validation bout en bout | Sonnet | medium | — | toutes | `~/.claude/` (install plugin, jonctions) | [x] |

## Bilan d'exécution (2026-08-22)

Toutes sessions PASS. Écarts constatés en cours d'exécution :
- **T1** : le champ `agents` de `plugin.json` était rejeté par `claude plugin validate` — retiré (`agents/` est l'emplacement par défaut auto-découvert). `author` + description marketplace ajoutés pour lever les 2 derniers warnings. **Précisé le 2026-08-22 (CLI 2.1.237)** : le champ n'accepte **que des chemins de fichiers** (`["./agents/x.md", …]`), jamais un répertoire — ni `"./agents/"` ni `["./agents/"]`. Un chemin contenant `..` est refusé séparément (path traversal). **L'auto-découverte fonctionne** : testée en session headless, les 4 agents ressortent en `workflow:<nom>` sans aucun champ `agents`. Ne pas « corriger » ce manifeste en croyant l'inverse.
- **T18** (CLAUDE-BASE.md) et **T4** (chemins) ainsi que **T14/T15/T16** et **T4** (skills fin-de-tache/nouveau-plan/purge-contexte) portent sur les mêmes fichiers — squashés en un seul commit chacun à la consolidation (historique non atomique par tâche sur ces 4 fichiers, assumé).
- **T24-T26** : validés en direct (CLI non déléguée) — 6 skills/4 agents/4 hooks confirmés, coût always-on ~1050 tok/session, 4 jonctions NTFS retirées proprement, re-test sans doublon.

## Ordonnancement

- **Vague 1 — parallélisable** : S1 · S3 · S5 (zones disjointes, aucune dépendance). Poser
  `.claude/wave.lock`.
- **Vague 2 — parallélisable** : S2 · S4 (après S1 — conventions de chemins fixées).
- **Vague 3 — parallélisable** : S6 · S7 (après S1 ; zones disjointes skills/ vs racine).
- **Vague 4** : S8 (après S3-S7 — documente l'état final).
- **Vague 5** : S9 (après tout) + **gate humaine** : relire le rapport S9 avant suppression des
  jonctions ; c'est S9 qui valide que plugin, hooks, skills et agents chargent réellement.
- **Vague 6 — consolidation** : supprimer `wave.lock`, commits tâche par tâche, statuts, un push
  (humain ou session Haiku `low`).
- **Post-plan (humain, après push)** : ouvrir une session cloud sur un projet migré et vérifier
  que le plugin se charge depuis la marketplace GitHub **privée**. Si l'auth échoue en cloud :
  décision à prendre (repo public vs route sync claude.ai) — ne pas trancher avant d'avoir le
  constat.
