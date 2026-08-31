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
- 2026-08-24 — **`/executer-vague` : deux voies, trois verdicts** — la colonne `Env.` décide de la
  voie d'exécution (headless / pastilles), plus du droit d'orchestrer ; `PANNE` distingue une panne
  d'environnement d'un échec de tâche, que le fail-closed confondait →
  [détail](docs/decisions/2026-08-24-executer-vague-deux-voies.md)
- 2026-08-24 — **Bootstrap cloud : `--yes` et timeout** — `claude plugin install` appelé avec
  `--yes` (requis hors TTY), `timeout: 90` et garde `command -v claude` →
  [détail](docs/decisions/2026-08-24-bootstrap-cloud-yes-timeout.md)
- 2026-08-24 — **`/migrer-projet` couvre le projet jamais outillé** — Fusion avec l'ébauche
  `/adopter-projet` en un point d'entrée unique, diagnostic à 4 états →
  [détail](docs/decisions/2026-08-24-migrer-projet-jamais-outille.md)
- 2026-08-24 — **Chaque session committe son propre travail** — renversement de §4b : le commit n'est
  plus reporté en fin de plan, chaque session prend le sien avant de rendre la main (repère
  `Plan: P<n>/S<k>/T<m>`) ; `index.md` garde un rédacteur unique, push toujours groupé →
  [détail](docs/decisions/2026-08-24-commit-par-session.md)
- 2026-08-24 — **Orchestration par sous-agents : une vague sans intervention** — la voie Desktop passe
  de la pastille `spawn_task` (un clic par session) à l'outil `Agent` en arrière-plan, qui hérite des
  outils navigateur là où `claude -p` n'en a aucun ; la pastille devient un repli hors Desktop →
  [détail](docs/decisions/2026-08-24-orchestration-par-sous-agents.md)
- 2026-08-25 — **Sous-agent par défaut, headless en exception déclarée (option C)** — le sous-agent
  devient la voie normale de TOUTES les sessions orchestrées ; `Env. = headless` ne se déclare que pour
  un effort `high`/`xhigh` à appliquer réellement, ou une vague à lancer fenêtre fermée →
  [détail](docs/decisions/2026-08-25-cadrage-voie-unique-orchestration.md)
- 2026-08-30 — **Un échec de prémisse étend le plan, il ne crée pas le plan suivant** — `/nouveau-plan`
  gagne une Étape 0 (plan neuf vs extension de `P<n>`) ; plafond à deux vagues de remédiation, la
  troisième passe par `/cadrer` → [détail](docs/decisions/2026-08-30-extension-de-plan.md)
- 2026-08-30 — **Contexte d'un sous-agent : fork oui, mémoire non** — le `fork` est autorisé quand la
  tâche a besoin du contexte courant, interdit pour une session de plan, une reprise d'échec ou une
  restitution pure ; aucune mémoire sur les quatre agents mécaniques →
  [détail](docs/decisions/2026-08-30-contexte-des-sous-agents.md)
- 2026-08-30 — **Relecture qualité en fin de session** — `/code-review` effort `high` (arrière-plan) sur
  le diff de chaque session ayant produit du code ; résultats non corrigés → `TASKS.md`, jamais
  `VALIDATION.md` → [détail](docs/decisions/2026-08-30-branchement-code-review.md) — plomberie
  amendée le 2026-08-31
- 2026-08-30 — **Reprise automatique d'un échec dans l'orchestration** — après un `FAIL`, une reprise à
  froid automatique (sous-agent frais, un cran au-dessus) ; 2e échec consécutif ou gate `ARBITRAGE` →
  arbitrage humain → [détail](docs/decisions/2026-08-30-reprise-automatique-echec.md)
- 2026-08-30 — **Écrire pour qui décide** — registre d'écriture opposable dans `CLAUDE-BASE.md` : ce
  qu'un humain lit dit d'abord ce que ça change et à quoi il le verra ; appliqué par `/nouveau-plan`
  (index et `S<k>.md`), `/orchestrer-plan` et `/cadrer` →
  [détail](docs/decisions/2026-08-30-ecrire-pour-qui-decide.md)
- 2026-08-31 — **Relecture de session : clôture d'abord, fichier ensuite** — la revue se lance après
  commits et statuts (elle ne peut plus coûter la session) ; résultats dans `S<k>.revue.md` classés
  bloquant/backlog, une ligne par vague relayée par l'orchestrateur, tri en clôture de plan →
  [détail](docs/decisions/2026-08-31-revue-plomberie.md)

---

## Archives

> Décisions caduques ou remplacées. Même format, avec ` — remplacée par <date/titre>`.
> On archive, on ne supprime pas.
