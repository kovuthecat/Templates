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

## Format d'un fichier de détail

Gabarit dans `plugin/templates/DECISIONS.md` (Décision · Contexte · Alternatives · Raison ·
Conséquences · Impact IA) — pas recopié ici, ce registre est relu à chaque cadrage.

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
- 2026-08-30 — **Un échec de prémisse étend le plan, il ne crée pas le plan suivant** — `/nouveau-plan`
  gagne une Étape 0 (plan neuf vs extension de `P<n>`) ; plafond à deux vagues de remédiation, la
  troisième passe par `/cadrer` → [détail](docs/decisions/2026-08-30-extension-de-plan.md)
- 2026-08-30 — **Contexte d'un sous-agent : fork oui, mémoire non** — le `fork` est autorisé quand la
  tâche a besoin du contexte courant, interdit pour une session de plan, une reprise d'échec ou une
  restitution pure ; aucune mémoire sur les quatre agents mécaniques →
  [détail](docs/decisions/2026-08-30-contexte-des-sous-agents.md)
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
- 2026-09-04 — **Les quatre agents de délégation tournent au premier plan** — `explorateur`,
  `verificateur-n0`, `resumeur-git`, `lecteur-doc` ne se lancent jamais en arrière-plan
  (`run_in_background: true`) : leur verdict conditionne la suite immédiate de la tâche, à la
  différence de la voie sous-agent de session entière (`WORKFLOW.md` §5b) →
  [détail](docs/decisions/2026-09-04-delegation-au-premier-plan.md)
- 2026-09-05 — **Une revue a posteriori qui recale l'objectif avant de juger le code** — skill
  `/revue-de-conception` : constat écrit/code, **interview de recalage** avec gate explicite, puis
  7 écarts max pondérés par la phase ; sortie `docs/revues/` + `PROJECT_BRIEF.md` recalé →
  [détail](docs/decisions/2026-09-05-revue-de-conception.md)
- 2026-09-07 — **La revue de session dépose son fichier elle-même, au premier plan** — agent
  `relecteur-session` au lieu de `/code-review` en arrière-plan : il écrit `S<k>.revue.md` lui-même
  et **toujours** (`Bloquant : 0` inclus), donc un fichier absent ne peut plus vouloir dire que
  « la revue n'a rien trouvé » → [détail](docs/decisions/2026-09-07-revue-orpheline.md)
- 2026-09-09 — **La nature de l'échec décide de la reprise ; les incidents remontent par fichier** —
  une session nomme `Nature : environnement | exécution | prémisse` avant de conclure et corrige
  elle-même ce qui est à sa portée ; la reprise suit la nature ; hook `Stop` muet sous verrou ; un
  incident de workflow = un fichier `docs/workflow/incidents/` commité →
  [détail](docs/decisions/2026-09-09-nature-de-l-echec-et-incidents.md) — amende le 2026-08-30
- 2026-09-12 — **La revue dépose son fichier d'abord, l'orchestrateur attend ses enfants** — le
  relecteur écrit son `.revue.md` en premier geste (`Couverture : en cours → complète`), périmètre
  restreint au code ; repli `general-purpose` si l'agent manque ; `ListAgents` avant un `FAIL` sans
  verdict ; le filtre de contenu devient une nature d'échec sans reprise →
  [détail](docs/decisions/2026-09-12-revue-deposee-d-abord-et-collecte-patiente.md)
- 2026-09-12 — **Fable et Codex sortent du workflow ; socle scindé d'un fichier d'exécutant** —
  Fable hors grille/escalade/skill, lancé à la main ; Codex retiré, `AGENTS.md` central supprimé ;
  `CLAUDE-BASE.md` dédupliqué à 80 lignes, nouveau `EXECUTANT.md` pour les sessions de plan →
  [détail](docs/decisions/2026-09-12-fable-et-codex-hors-workflow-socle-et-executant.md)
- 2026-09-12 — **Une seule voie d'orchestration ; hooks testés ; `.git` hors synchro** — voie
  headless retirée (sous-agent seul) ; `tests/tester-hooks.mjs` gate `publier.mjs` ; témoin
  `.git/info/synchro-exclue` signalé par `SessionStart` ; mot `pastille` par session →
  [détail](docs/decisions/2026-09-12-une-seule-voie-d-orchestration-et-hooks-testes.md)
- 2026-09-13 — **Les réglages du plan tiennent ; la passation s'écrit ; le modèle laisse une trace**
  — `modelSettings` vendoré (l'effort suit le modèle, et reprend la main sur un `/effort`
  utilisateur) ; `SessionStart` compare le modèle courant au plan ; 5ᵉ hook `PostModelSwitch` en
  journal, jamais bloquant ; bloc de passation sans `S<k>.md` ; §3b réécrite, vague lancée en
  décalé → [détail](docs/decisions/2026-09-13-reglages-qui-tiennent-passation-journal-modele.md)
- 2026-09-13 — **Vérifier ce qui se déclare soi-même** — ligne `Anti-raccourci` dans la Validation
  d'une tâche (le cadreur nomme le faux-vert, le relecteur le vérifie) ; 6ᵉ agent
  `verificateur-plan` entre l'écriture et le commit d'un plan ; statut `[x]!` pour une session
  `PASS` dont la revue a trouvé un bloquant ; repères mécaniques ajoutés au §Compactage →
  [détail](docs/decisions/2026-09-13-verifier-ce-qui-se-declare-soi-meme.md)
- 2026-09-13 — **L'orchestrateur enquête avant de demander** — `ARBITRAGE` scindé en `ENQUETE`
  (manque d'information → enquête en lecture seule, Étape 5d) et `DECISION` (choix → question à
  options) ; 7ᵉ agent `verificateur-premisse` ; budget `Tentatives :` — §9c →
  [détail](docs/decisions/2026-09-13-enqueter-avant-de-demander.md)

---

- 2026-09-14 — **Preuve avant plan** — un problème dont la réponse n'existe qu'à l'exécution ne
  reçoit plus de plan : 4ᵉ issue de `/cadrer` (protocole de preuve, branche jetable, livrable =
  résultat mesuré) ; le juge n'est jamais gelé ; une preuve peut dégeler un « tranché » ; le code
  produit est un candidat → [détail](docs/decisions/2026-09-14-preuve-avant-plan.md)

- 2026-09-14 — **Deux régimes de travail, et une frontière humaine écrite** — régime fixé pour le
  travail spécifiable, régime ouvert pour la recherche (branche jetable, budget, N0 final, livrable =
  preuve) ; et « demander quand il y a un choix, agir quand il y a une gate » →
  [détail](docs/decisions/2026-09-14-deux-regimes-et-frontiere-humaine.md)

## Archives

> Décisions caduques ou remplacées. Même format, avec ` — remplacée par <date/titre>`.
> On archive, on ne supprime pas.

- 2026-08-22 — **Enchaînement de sessions** — pastille + orchestrateur headless →
  [détail](docs/decisions/2026-08-22-agents-mecaniques.md) — remplacée par 2026-09-12 (voie unique)
- 2026-08-24 — **Hook `SessionStart` de bootstrap** →
  [détail](docs/decisions/2026-08-24-sessionstart-bootstrap-hook.md) — caduque : workflow vendoré
- 2026-08-24 — **`/executer-vague` : deux voies, trois verdicts** →
  [détail](docs/decisions/2026-08-24-executer-vague-deux-voies.md) — remplacée par `/orchestrer-plan`
- 2026-08-24 — **Bootstrap cloud : `--yes` et timeout** →
  [détail](docs/decisions/2026-08-24-bootstrap-cloud-yes-timeout.md) — caduque : workflow vendoré
- 2026-08-25 — **Sous-agent par défaut, headless en exception déclarée** →
  [détail](docs/decisions/2026-08-25-cadrage-voie-unique-orchestration.md) — remplacée par 2026-09-12
- 2026-08-30 — **Relecture qualité par `/code-review` en arrière-plan** →
  [détail](docs/decisions/2026-08-30-branchement-code-review.md) — remplacée par 2026-09-07
