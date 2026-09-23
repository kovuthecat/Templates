# Décisions archivées

> Sorties du registre `DECISIONS.md` pour ne plus être relues à chaque cadrage. Même format, avec
> ` — remplacée par <date/titre>`. **On archive, on ne supprime pas** : une décision caduque
> explique pourquoi la suivante existe.

- 2026-08-22 — **Enchaînement de sessions** — pastille + orchestrateur headless →
  [détail](2026-08-22-agents-mecaniques.md) — remplacée par 2026-09-12 (voie unique)
- 2026-08-22 — **Plugin sans déplacement de fichier** — le repo devient la marketplace `templates`
  exposant le plugin `workflow` sur les emplacements existants →
  [détail](2026-08-22-plugin-workflow.md) — caduque : workflow vendoré
- 2026-08-22 — **CLAUDE-BASE injecté par hook** — l'import `@...CLAUDE-BASE.md` remplacé par une
  injection via le hook `SessionStart` du plugin →
  [détail](2026-08-22-plugin-workflow.md) — caduque : workflow vendoré
- 2026-08-22 — **Settings projet réduits** — `.claude/settings.json` limité à `enabledPlugins` +
  `permissions` + `effortLevel`, hooks dans le plugin →
  [détail](2026-08-22-plugin-workflow.md) — caduque : workflow vendoré
- 2026-08-24 — **Hook `SessionStart` de bootstrap** →
  [détail](2026-08-24-sessionstart-bootstrap-hook.md) — caduque : workflow vendoré
- 2026-08-24 — **`/executer-vague` : deux voies, trois verdicts** →
  [détail](2026-08-24-executer-vague-deux-voies.md) — remplacée par `/orchestrer-plan`
- 2026-08-24 — **Bootstrap cloud : `--yes` et timeout** →
  [détail](2026-08-24-bootstrap-cloud-yes-timeout.md) — caduque : workflow vendoré
- 2026-08-25 — **Sous-agent par défaut, headless en exception déclarée** →
  [détail](2026-08-25-cadrage-voie-unique-orchestration.md) — remplacée par 2026-09-12
- 2026-08-30 — **Relecture qualité par `/code-review` en arrière-plan** →
  [détail](2026-08-30-branchement-code-review.md) — remplacée par 2026-09-07
- 2026-08-22 — **Agents mécaniques Haiku** — Quatre agents (`explorateur`, `verificateur-n0`,
  `resumeur-git`, `lecteur-doc`) à délégation proactive remplacent l'exécution directe des tâches
  mécaniques dans la conversation principale →
  [détail](2026-08-22-agents-mecaniques.md) — remplacée par 2026-09-17 (`verificateur-n0` retiré), 2026-09-04 (premier plan) et 2026-09-15 (`analyste-flux`)
- 2026-08-24 — **Orchestration par sous-agents : une vague sans intervention** — la voie Desktop passe
  de la pastille `spawn_task` (un clic par session) à l'outil `Agent` en arrière-plan, qui hérite des
  outils navigateur là où `claude -p` n'en a aucun ; la pastille devient un repli hors Desktop →
  [détail](2026-08-24-orchestration-par-sous-agents.md) — remplacée par 2026-09-12 (une seule voie : sous-agent)
- 2026-08-30 — **Reprise automatique d'un échec dans l'orchestration** — après un `FAIL`, une reprise à
  froid automatique (sous-agent frais, un cran au-dessus) ; 2e échec consécutif ou gate `ARBITRAGE` →
  arbitrage humain → [détail](2026-08-30-reprise-automatique-echec.md) — remplacée par 2026-09-09 (la nature décide) puis 2026-09-17 (état scripté)
- 2026-09-07 — **La revue de session dépose son fichier elle-même, au premier plan** — agent
  `relecteur-session` au lieu de `/code-review` en arrière-plan : il écrit `S<k>.revue.md` lui-même
  et **toujours** (`Bloquant : 0` inclus), donc un fichier absent ne peut plus vouloir dire que
  « la revue n'a rien trouvé » → [détail](2026-09-07-revue-orpheline.md) — remplacée par 2026-09-12 (la revue dépose son fichier d'abord)
- 2026-09-18 — **Effort par sous-agent** — `effort` en frontmatter d'agent nommé est documenté et
  honoré (`critique-plan` s'en sert) ; le couplage restant vient de `subagent_type: "claude"`, sans
  fichier donc sans frontmatter. §3/§5b corrigés ; agents `session-<effort>` et orchestrateur en
  `low` ouverts, non tranchés — l'éval qui les garde est bloquée
  → [détail](2026-09-18-effort-par-sous-agent.md) — remplacée par 2026-09-18 (l'effort d'une session vient de son agent)
- 2026-08-22 — **Rapport capacités archivé et distillé** — Le rapport de capacités Claude Code est
  archivé daté dans `docs/references/` et distillé en skill `/choisir-mecanisme` →
  [détail](2026-08-22-design-spec-validation.md) — accomplie : skill `/choisir-mecanisme` en place
- 2026-08-24 — **`/migrer-projet` couvre le projet jamais outillé** — Fusion avec l'ébauche
  `/adopter-projet` en un point d'entrée unique, diagnostic à 4 états →
  [détail](2026-08-24-migrer-projet-jamais-outille.md) — accomplie : skill en place, diagnostic à 4 états documenté dans la skill
