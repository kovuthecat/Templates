# DECISIONS.md — registre

**Une décision = une ligne ici, le détail dans `docs/decisions/`.** Ce fichier est relu à chaque
cadrage : il doit tenir sous **150 lignes** (plafond appliqué par hook). Le raisonnement complet
n'a aucune raison d'être en contexte tant que la décision n'est pas remise en jeu.

- **Racine = transverse.** Ce registre ne porte que les décisions **transverses / architecturales**
  (stack, moteur, navigation, organisation des fichiers). Les décisions propres à un **sous-domaine**
  (un thème, un module, un espace fonctionnel) vont dans `docs/<sous-domaine>/`, pas ici — sinon la
  racine gonfle proportionnellement au nombre de sous-domaines.
- **Ne pas créer un `DECISIONS.md` par module** : ça casserait la découvrabilité. Router le détail
  dans `docs/`, garder un seul registre.
- Un plan ou une tâche pointe vers **le fichier de détail**, jamais vers « `DECISIONS.md` » en bloc.

## Format d'une ligne

`- YYYY-MM-DD — **<titre>** — <verdict en une phrase> → [détail](docs/decisions/YYYY-MM-DD-<slug>.md)`

## Format d'un fichier de détail (`docs/decisions/YYYY-MM-DD-<slug>.md`)

```md
# YYYY-MM-DD — <titre>

## Décision
<le verdict, sans détour>

## Contexte
<le problème posé, l'état au moment du choix>

## Alternatives envisagées
- Option A : <et pourquoi écartée>
- Option B :

## Raison du choix
...

## Conséquences
<ce que ça oblige ou interdit désormais>

## Impact IA _(optionnel)_
<une ligne si la décision change la complexité, le contexte nécessaire ou `PROJECT_MAP.md`>
```

---

## Décisions

- 2026-08-22 — **Plugin sans déplacement de fichier** — Le repo devient la marketplace Claude Code
  `templates` exposant le plugin `workflow` (skills, hooks, agents) sur les emplacements existants,
  sans rien déplacer ; les projets non migrés continuent de fonctionner tels quels →
  [détail](docs/decisions/2026-08-22-plugin-workflow.md)
- 2026-08-22 — **CLAUDE-BASE injecté par hook** — L'import `@...CLAUDE-BASE.md` du `CLAUDE.md`
  projet est remplacé par une injection du contenu via le hook `SessionStart` du plugin →
  [détail](docs/decisions/2026-08-22-plugin-workflow.md)
- 2026-08-22 — **Settings projet réduits** — `.claude/settings.json` d'un projet se limite à
  `enabledPlugins` + `permissions` + `effortLevel` ; les hooks voyagent désormais dans le plugin →
  [détail](docs/decisions/2026-08-22-plugin-workflow.md)
- 2026-08-22 — **Agents mécaniques Haiku** — Quatre agents (`explorateur`, `verificateur-n0`,
  `resumeur-git`, `lecteur-doc`) à délégation proactive remplacent l'exécution directe des tâches
  mécaniques dans la conversation principale →
  [détail](docs/decisions/2026-08-22-agents-mecaniques.md)
- 2026-08-22 — **Enchaînement de sessions** — Pastille `spawn_task` en Desktop et orchestrateur
  headless `claude -p` pour les vagues sans validation N1, jamais de `/clear` automatique →
  [détail](docs/decisions/2026-08-22-agents-mecaniques.md)
- 2026-08-22 — **`VALIDATION.md` = N2 en attente uniquement** — Item tranché = ligne supprimée
  (git reste l'archive), plafond abaissé de 120 à 60 lignes →
  [détail](docs/decisions/2026-08-22-design-spec-validation.md)
- 2026-08-22 — **`DESIGN_SPEC.md` sépare le brief UI de l'architecture technique** — Le brief
  Claude Design et l'état Design Sync vivent dans `DESIGN_SPEC.md` ; `ARCHITECTURE.md` redevient un
  document technique (découpage, état/persistance, entités) →
  [détail](docs/decisions/2026-08-22-design-spec-validation.md)
- 2026-08-22 — **Rapport capacités archivé et distillé** — Le rapport de capacités Claude Code est
  archivé daté dans `docs/references/` et distillé en skill `/choisir-mecanisme` →
  [détail](docs/decisions/2026-08-22-design-spec-validation.md)

---

## Archives

> Décisions caduques ou remplacées. Même format, avec ` — remplacée par <date/titre>`.
> On archive, on ne supprime pas.
