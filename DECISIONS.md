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

- 2026-08-22 — **`VALIDATION.md` = N2 en attente uniquement** — Item tranché = ligne supprimée
  (git reste l'archive), plafond abaissé de 120 à 60 lignes →
  [détail](docs/decisions/2026-08-22-design-spec-validation.md)
- 2026-08-22 — **`DESIGN_SPEC.md` sépare le brief UI de l'architecture technique** — Le brief
  Claude Design et l'état Design Sync vivent dans `DESIGN_SPEC.md` ; `ARCHITECTURE.md` redevient un
  document technique (découpage, état/persistance, entités) →
  [détail](docs/decisions/2026-08-22-design-spec-validation.md)
- 2026-08-24 — **Chaque session committe son propre travail** — renversement de §4b : le commit n'est
  plus reporté en fin de plan, chaque session prend le sien avant de rendre la main (repère
  `Plan: P<n>/S<k>/T<m>`) ; `index.md` garde un rédacteur unique, push toujours groupé →
  [détail](docs/decisions/2026-08-24-commit-par-session.md)
- 2026-08-30 — **Un échec de prémisse étend le plan, il ne crée pas le plan suivant** — `/nouveau-plan`
  gagne une Étape 0 (plan neuf vs extension de `P<n>`) ; plafond à deux vagues de remédiation, la
  troisième passe par `/cadrer` → [détail](docs/decisions/2026-08-30-extension-de-plan.md)
- 2026-08-30 — **Contexte d'un sous-agent : fork oui, mémoire non** — le `fork` est autorisé quand la
  tâche a besoin du contexte courant, interdit pour une session de plan, une reprise d'échec ou une
  restitution pure ; aucune mémoire sur les quatre agents mécaniques →
  [détail](docs/decisions/2026-08-30-contexte-des-sous-agents.md)
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
- 2026-09-14 — **Preuve avant plan** — un problème dont la réponse n'existe qu'à l'exécution ne
  reçoit plus de plan : 4ᵉ issue de `/cadrer` (protocole de preuve, branche jetable, livrable =
  résultat mesuré) ; le juge n'est jamais gelé ; une preuve peut dégeler un « tranché » ; le code
  produit est un candidat → [détail](docs/decisions/2026-09-14-preuve-avant-plan.md)
- 2026-09-14 — **Deux régimes de travail, et une frontière humaine écrite** — régime fixé pour le
  travail spécifiable, régime ouvert pour la recherche (branche jetable, budget, N0 final, livrable =
  preuve) ; et « demander quand il y a un choix, agir quand il y a une gate » →
  [détail](docs/decisions/2026-09-14-deux-regimes-et-frontiere-humaine.md)
- 2026-09-14 — **Un domicile par invariant, et des conditions nommées** — un invariant se range par
  destinataire (`EXECUTANT.md` / `WORKFLOW.md`), un gabarit y renvoie par une ligne fixe vérifiée par
  `publier.mjs` ; le canal de reprise suit la nature (bloqué → `SendMessage`, trompé → à froid, ligne
  `Blocage :`) ; un exécutant s'arrête sur un choix, pas sur une casse — `gate` / `question` /
  `contrainte d'outillage` cessent de s'écrire `STOP` →
  [détail](docs/decisions/2026-09-14-conditions-nommees-domicile-unique.md)
- 2026-09-15 — **Réflexion outillée : préparation prouvée, critique avant approbation, flux lu par
  un agent** — `allowed-tools` corrigé ; gabarits sans stack ; annexes de réflexion dans
  `cadrer/references/` (grille, six fiches, `NONE`, rechercher l'existant) ; prémisse comportementale
  sondée avant le plan ; agents `critique-plan` (Opus, plan architectural) et `analyste-flux`
  (Sonnet) ; gates de publication étendues, évals de déclenchement (≥ 2.1.269) →
  [détail](docs/decisions/2026-09-15-reflexion-outillee-critique-et-flux.md)
- 2026-09-17 — **Arrêts sans jugement retirés, correctif localisé** — `gate` retiré (seul
  `validation-humaine` arrête un `PASS`), défaut mesuré et petit corrigé dans la session, bloc de
  relance obligatoire → [détail](docs/decisions/2026-09-17-gates-sans-arret-et-correctif-localise.md)
- 2026-09-17 — **Autonomie par défaut, état scripté, push par session** — arrêt sur quatre critères
  nommés seulement (latitude par défaut, lecture ouverte, budget en hypothèses, amendement de
  session) ; N0 et état d'orchestration par scripts (`n0.mjs`, `prochaine-action.mjs`),
  `verificateur-n0` retiré ; push à chaque fin de session, `.revue.md` commité ; exploration
  orchestrable ; contrôle de version du vendoré ; `WORKFLOW.md` < 300 lignes. Remontée d'incidents
  partagée : reportée → [détail](docs/decisions/2026-09-17-autonomie-par-defaut-etat-scripte-push-par-session.md)
- 2026-09-18 — **L'effort d'une session vient de son agent** — cadrage : cinq agents
  `session-<effort>` portant `effort:` en frontmatter, lancés par `subagent_type` composé depuis
  l'index ; l'action `regler-effort` se retire. Neutre sur les outils (filtres identiques pour agent
  nommé et générique) et hors garde de K5 — applique l'effort déjà décidé, n'en décide aucun. Reste
  ouvert : effort de l'orchestrateur, `Agent` en sous-agent d'arrière-plan
  → [détail](docs/decisions/2026-09-18-effort-porte-par-l-agent-de-session.md)
- 2026-09-22 — **Un geste par instruction** — mesure : Sonnet reste l'orchestrateur, l'effort ne
  change rien, le texte si. Le script rend l'appel d'agent prêt (casse `model`) et le contrôle
  d'arbre sale ; règles contradictoires fusionnées, `verificateur-n0` purgé, `hooks: 5`, replis
  d'agent partout → [détail](docs/decisions/2026-09-22-flous-du-workflow.md)
- 2026-09-23 — **Revue d'usage par le navigateur in-app, cadrée par interview** — skill
  `/revue-d-usage` : interview de périmètre, puis parcours en trois passes (fonctionnel, Nielsen,
  WCAG AA) classés → `TASKS.md` ; passe esthétique **opt-in** → propositions dans `VALIDATION.md` ;
  étape de revue nommée, sans rang (pas de N3), N2 humain par défaut →
  [détail](docs/decisions/2026-09-23-revue-d-usage.md)
- 2026-09-23 — **Le brief est tenu par les décisions, la roadmap par la clôture de plan** — chaque
  décision porte `Brief : inchangé | <section> : <changement>`, appliqué au brief dans son commit par
  `/cadrer` ; `verificateur-plan` vérifie la propagation par dates ; la fin de plan coche la roadmap ;
  `/revue-de-conception` reste le rattrapage →
  [détail](docs/decisions/2026-09-23-brief-tenu-par-les-decisions.md)
- 2026-09-24 — **Une idée neuve entre par `/cadrer`** — dépliée en question par une annexe d'interview ;
  issue « Idée reportée » vers le brief ; `model: opus` ; pas de skill dédiée → [détail](docs/decisions/2026-09-24-idee-neuve-par-cadrer.md)

## Archives

> Décisions caduques ou remplacées : sorties du registre pour ne plus peser à chaque cadrage.
> On archive, on ne supprime pas → [docs/decisions/archives.md](docs/decisions/archives.md)
