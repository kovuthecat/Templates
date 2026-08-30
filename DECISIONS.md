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
- 2026-08-24 — **Hook `SessionStart` de bootstrap dans `project-settings.json`** — Exception au
  principe « aucun hook dans le settings projet » : une session cloud ne clone jamais la
  marketplace au démarrage, donc `enabledPlugins` seul n'y active rien →
  [détail](docs/decisions/2026-08-24-sessionstart-bootstrap-hook.md)
- 2026-08-24 — **`/executer-vague` : deux voies, trois verdicts** — Première exécution réelle
  (MYO/P1) : 7 blocages, vague jamais démarrée. La colonne `Env.` décide de la voie (headless
  `claude -p` / pastilles `spawn_task`), plus du droit d'orchestrer ; `PANNE` distingue une panne
  d'environnement d'un échec de tâche que le fail-closed confondait ; préflight du binaire `claude` ;
  verrou posé après le préflight et retiré si rien n'a démarré ; arbre sale tranché par zones ; hook
  `Stop` rendu muet pendant une vague via `vagueParallele()` →
  [détail](docs/decisions/2026-08-24-executer-vague-deux-voies.md)
- 2026-08-24 — **Bootstrap cloud : `--yes` et timeout** — Le hook de 0.10.0 comblait le trou du
  cloud mais appelait `claude plugin install` sans `--yes`, documenté « required when stdin or
  stdout is not a TTY » : un hook n'en a jamais. Plus un `timeout: 90` (clone réseau) et une garde
  `command -v claude`. Corollaire consigné : settings **et** hook doivent être versionnés en 100755,
  le cloud ne voit que le clone. Vocabulaire d'environnement élargi au cloud/mobile — la distinction
  reste binaire, Desktop étant le seul à avoir navigateur in-app et `spawn_task`.
- 2026-08-24 — **`/migrer-projet` couvre le projet jamais outillé** — Trou entre `/nouveau-projet`
  (repo vide, interview complète) et `/migrer-projet` (workflow v1 déjà en place) : le projet qui a
  du code mais n'a jamais été outillé. D'abord écrit en skill séparée `/adopter-projet`, **fusionné
  le jour même** : choisir entre les deux exigeait de l'utilisateur un diagnostic que la Phase A des
  deux skills faisait déjà, et la séparée devait porter une trappe « arrête-toi et lance l'autre » —
  signe que la coupure était au mauvais endroit. Un seul point d'entrée, un diagnostic qui classe en
  4 états, deux voies (bascule / adoption) encadrées par une gate et une Phase D communes. Principe
  de la voie adoption : le contexte se **dérive du code** (inventaire délégué à `explorateur` et
  `resumeur-git`), l'interview est réduite aux 6 choses qu'aucune lecture ne donne — pourquoi le
  projet existe, où il en est, la suite.

- 2026-08-24 — **Chaque session committe son propre travail** — Renversement de §4b : les commits
  ne sont plus reportés en fin de plan, chaque session prend le sien avant de rendre la main (repère
  `Plan: P<n>/S<k>/T<m>`, qui sert aussi de verdict à la voie Desktop). Motif : l attribution était
  reconstituée après coup, dans un arbre où trois sessions avaient déposé leurs fichiers, par le
  modèle le moins cher du plan. `wave.lock` réduit au parallélisme réel ; `index.md` garde un
  rédacteur unique (proposition « chaque session coche la sienne » écartée) ; push toujours groupé →
  [détail](docs/decisions/2026-08-24-commit-par-session.md)

- 2026-08-24 — **Orchestration par sous-agents : une vague sans intervention** — Objectif : dérouler
  une vague, voire un plan, sans clic. Deux mesures : `claude -p` n a effectivement aucun outil
  navigateur, mais un **sous-agent hérite des 18** depuis une session Desktop. La voie Desktop passe
  donc de la pastille `spawn_task` (un clic par session) à l outil `Agent` en arrière-plan ; la
  pastille devient un repli hors Desktop. Verdict = ligne imposée **recoupée par les commits**.
  Coûts assumés : l effort n est pas réglable par `Agent`, et la session d orchestration doit rester
  ouverte. `SendMessage` écarté (aucune session ne peut s identifier elle-même, et un message est
  éphémère) →
  [détail](docs/decisions/2026-08-24-orchestration-par-sous-agents.md)

- 2026-08-25 — **Sous-agent par défaut, headless en exception déclarée (option C)** — le sous-agent
  devient la voie normale de TOUTES les sessions orchestrées ; `Env. = headless` ne se déclare que
  pour un effort `high`/`xhigh` à appliquer réellement ou une vague à lancer fenêtre fermée. Verdict
  = commits ; le lecteur JSON se réduit à l extraction du motif →
  [détail](docs/decisions/2026-08-25-cadrage-voie-unique-orchestration.md)

- 2026-08-30 — **Un échec de prémisse étend le plan, il ne crée pas le plan suivant** — `/nouveau-plan`
  gagne une Étape 0 (plan neuf vs extension de `P<n>`), critère unique = la correction débloque-t-elle
  une session restante sans changer l'objectif d'ensemble. Évite la récursion `P20` pour finir `P19`
  pour finir `P16` ; plafond à deux vagues de remédiation, la troisième passe par `/cadrer` →
  [détail](docs/decisions/2026-08-30-extension-de-plan.md)

---

## Archives

> Décisions caduques ou remplacées. Même format, avec ` — remplacée par <date/titre>`.
> On archive, on ne supprime pas.
