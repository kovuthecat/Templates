# 2026-10-15 — Justifications sorties de `WORKFLOW.md`

> Issue de P20/S11/T16 (points 7a, 14 et 15 de `docs/revues/2026-10-13-revue-externe-workflow.md`,
> arbitrés par `docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md`).
> **Que du « pourquoi »** : `plugin/WORKFLOW.md` garde chaque règle applicable, ce fichier garde les raisons,
> les constats et les mesures qu'il portait. Une entrée par passage retiré ; aucune règle n'est changée,
> sauf 7a (la première reprise d'un échec d'exécution reste sur le modèle de l'index : le texte suit le moteur).

## Codes remplacés par des noms (point 14)

« C2 » avait deux sens (le moteur dans `WORKFLOW.md`, `/compact` dans `cadrer`) ; les sept codes sont
remplacés par ce qu'ils désignent, sans glossaire :

| Ancien code | Nom explicite dans `WORKFLOW.md` |
| --- | --- |
| C1 | « N0 est un script, pas un agent » (§5) |
| C2 | « le moteur » (`prochaine-action.mjs`, §5b) |
| C3 | « fin de tour = arbre propre et poussé » (§4b) |
| C4 | « workflow vendoré ou plugin chargé en retard » (§7, `SessionStart`) |
| C5 | « la lecture reste ouverte, seule l'écriture est bornée », « budget en hypothèses », « amendement » (§1, §9a) |
| C6 | « régime ouvert » / « exploration ouverte » (§1, §9c) |
| C7 | « une session `low` n'est relue que si elle touche un chemin sensible » (§5) |

## Entrées par passage retiré

### Principe directeur (§1)

- **Régime ouvert « pas une exception »** — `docs/decisions/2026-09-14-preuve-avant-plan.md` : un problème dont
  la réponse n'existe qu'à l'exécution ne reçoit pas de plan ; une session ouverte l'exécute sur une branche
  jetable et revient avec un **résultat mesuré**, qui devient l'entrée de la décision puis du plan. Le
  périmètre fermé reste la règle partout ailleurs.
- **« Demander quand il y a un choix, agir quand il y a une gate »** (liste fermée de quatre) —
  `docs/decisions/2026-08-30-ecrire-pour-qui-decide.md` : tout ce qu'une gate juge se fait sans solliciter
  l'utilisateur et se rapporte après ; ne reste pour lui que ce qu'aucune gate ne peut trancher.
- **Glossaire réduit** (*clôture* retiré, le mot ne prête pas à confusion) ; **Claude Design** (entrée
  `ARCHITECTURE.md`, sortie `design/maquettes/`, « le câblage suit la maquette ») : la règle vit dans
  `templates/DESIGN_SPEC.md` et dans `/nouveau-projet`, la mention de `ARCHITECTURE.md` comme entrée était
  périmée (point 7e).

### Effort (§3, §3b)

- **`modelSettings.<modèle>.effortLevel` prime la clé racine, quel que soit le fichier** — un `/effort` écrit en
  settings **utilisateur** battrait sinon l'`effortLevel` du projet partout, en silence ;
  `docs/decisions/2026-10-12-generation-5-5.md` (clés `claude-*-5-5`, Haiku en `medium`, Opus `high`).
- **`xhigh` jamais permanent** — c'est le poste de dépense le plus silencieux du workflow.
- **Rappel « À régler AVANT de lancer »** — une pastille démarre avec les réglages **ambiants**, jamais ceux du
  plan (constat des incidents EBM-MSPv2 du 2026-10-05 et du 2026-10-06) ; la ligne exacte est lue par
  `sessionstart-contexte.mjs`.
- **Effort d'orchestration** — un `effort` en frontmatter d'agent **nommé** est documenté et honoré
  (`model-config` § *Set the effort level*, `sub-agents` § *Frontmatter reference*) ; une session de plan se
  lance sur `general-purpose` avec `model` **et** `effort` passés à l'outil `Agent`, qui prime sur le
  frontmatter et sur la conversation (sonde du 2026-10-14, `docs/analyses/2026-10-14-mesure-de-reference.md`
  §5) ; c'est ce qui a retiré les agents `session-<effort>`. `max` ne se règle pas depuis un index : le
  moteur refuse la valeur (décision 2026-09-18).
- **Orchestrateur sur Haiku · medium** — banc `tests/evals-orchestrateur/` du 2026-10-12 : 18/20 contre 20/20
  pour Sonnet, écarts de forme seule, 14× moins cher (`docs/analyses/2026-10-12-orchestrateur-haiku-5-5.md`) ;
  retour à Sonnet au premier geste inventé (action attribuée au script qu'il n'a pas rendue, option ajoutée),
  consigné en incident.
- **Cache (§3b)** — <https://code.claude.com/docs/en/prompt-caching.md> : un hit coûte 0,1× le prix d'entrée,
  TTL 5 min (1 h possible). Trois étages d'invalidation (✓ = survit) :

  | Changement | Outils | Système | Messages |
  | --- | :---: | :---: | :---: |
  | Modèle, outils, MCP ajouté/retiré | ✗ | ✗ | ✗ |
  | Prompt système | ✓ | ✗ | ✗ |
  | Effort, `thinking` | ✓ | selon modèle | ✗ |
  | Messages, images | ✓ | ✓ | ✗ |

  Seuls outils et modèle forcent une reconstruction complète. Minimum cacheable : 512 tokens sur Opus 5.5,
  Sonnet 5.5 et Haiku 5.5 (contre 4 096 sur Haiku 4.5 : plus de falaise sur Haiku) ; une entrée ne remonte
  que 20 positions. Conséquences gardées dans le texte : régler modèle et effort avant de lancer ;
  `/compact` avant un changement **délibéré**, jamais avant une escalade (le résumé perdrait les impasses qui
  la justifient) ; chaque sous-agent part à froid, payé plein tarif, d'où le socle court
  (`docs/decisions/2026-09-13-cout-du-contexte-cache-et-hooks-de-modele.md`).

### Plans, commits, statuts (§4, §4a, §4b)

- **Un seul `S<k>.md` par session, jamais les alternatives** — elles vont dans `docs/decisions/` (fiche allégée
  au bandeau réduit aux écarts : point 12 de la revue).
- **Chaque session committe son travail, tâche par tâche** — `docs/decisions/2026-08-24-commit-par-session.md` :
  reporter tous les commits d'un plan à une consolidation finale rendait le verdict impossible à écrire par
  une session (déclencheur : vague 1 du plan P1 de MYO).
- **Fin de tour = arbre propre et poussé** — `docs/decisions/2026-09-17-autonomie-par-defaut-etat-scripte-push-par-session.md` :
  un commit local n'existe pour aucune autre machine, cloud compris ; plus de push « groupé » de fin de vague
  ou de plan. `main` impossible (cloud) : nommer la branche en relance, pour que le premier geste suivant
  puisse vérifier le fait (`git merge-base --is-ancestor`).
- **Le repère `Revues:` disparaît** — git seul juge qu'une revue existe (`.revue.md` ajouté par un commit) :
  `docs/decisions/2026-09-07-revue-orpheline.md`, « le livrable est le fichier, pas la notification » ; le
  relecteur dépose le fichier lui-même, au premier plan.
- **Mode parallèle retiré** — `docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md` :
  avec le quota Pro, des sessions lancées ensemble se font couper ensemble ; le parallèle ne gagnait que du
  temps. Les sections « verrou de vague » et « sessions `low` exemptées » disparaissent du texte.

### Délégation (§5, §5b)

- **Agents de délégation au premier plan, `run_in_background: false` à chaque appel** — constat du
  2026-10-05 (l'outil `Agent` part en arrière-plan quand le paramètre manque) ;
  `docs/decisions/2026-09-04-delegation-au-premier-plan.md` : l'appel conditionne la suite immédiate de la
  même tâche ; l'arrière-plan est celui de la session entière, pas de ses délégations.
- **`fork` jamais pour une session de plan ni une reprise, pas de `memory:`** —
  `docs/decisions/2026-08-30-contexte-des-sous-agents.md` : `fork` rapatrie le contexte qu'une session de plan
  existe pour laisser derrière ; `memory:` n'est légitime que sans source de dépôt déjà existante.
- **« Personne ne relit son propre travail »** (découpe fausse, faille de plan, PASS vide, prémisse fausse) :
  raison d'être de `relecteur-session`, `verificateur-plan`, `verificateur-premisse` et `critique-plan`.
- **Invariant de lancement mot pour mot** — une paraphrase dérive ; `publier.mjs` vérifie la présence, jamais
  le sens ; les autres blocs (`relecteur-session`, `verificateur-*`, `critique-plan`…) peuvent porter la ligne
  sans y être tenus : `docs/decisions/2026-09-24-revue-finale-et-regime-pro.md`, point 9 (`EXECUTANT.md` n'est
  lu que par les agents qui exécutent).
- **Voie unique : le sous-agent** — `docs/decisions/2026-09-12-une-seule-voie-d-orchestration-et-hooks-testes.md` ;
  la voie headless est retirée (mot « headless » supprimé du texte, point 7d). Le repli « pastille hors
  Desktop » contredisait la même section (`spawn_task` est un outil de Desktop) :
  `docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md`.
- **Arrêt relayé** — même décision : la session rend la question et reprend avec **tout ce qu'elle avait lu**
  (couper à chaque arrêt ferait relire le corpus à froid, en Opus : P14 passerait d'environ 13 à 35
  sessions). Hypothèse H1 mesurée en S6 : après 30,0 min d'attente, `SendMessage` retrouve l'agent et la
  même session restitue le mot lu avant l'arrêt (`plans/P20/S6.md`, Bilan).
- **Le moteur écrit (`--appliquer`)** — mesure de référence, constat C
  (`docs/analyses/2026-10-14-mesure-de-reference.md`) : l'orchestrateur Haiku oubliait des gestes mécaniques ;
  `plans/P20/S7.md` (Bilan) liste ce que le moteur fait à sa place.
- **Commandes sans `cd`, relatives à la racine** — un agent d'arrière-plan ne peut pas approuver une
  commande : `cd <dir> && cat <relatif>` en demande une dès qu'une règle `Read()` deny existe, et `node C:/…`
  ne commence par aucun préfixe de `permissions.allow` (P20/S3).

### Validation (§6)

- **`/revue-d-usage` sans rang, grille à trois** — `docs/decisions/2026-08-30-branchement-code-review.md` et
  `docs/decisions/2026-09-23-revue-d-usage.md` : pas de niveau N3 ; la grille N0/N1/N2 ne bouge pas.
- **Colonne `Env.` retirée** (point 7d) — le N1 se joue dans la session ; seul le bandeau de la fiche porte
  `Environnement :` (`docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md`,
  « Sessions sans pastille », option B').

### Garde-fous (§7)

- **Détail des vérifications de `SessionStart` et de `Stop`** (retard `ls-remote --tags`, cache 24 h / 3 s,
  « muet hors ligne / à jour / sans manifeste » ; « bloque une fois, rappelle si la liste change ») : les
  en-têtes de `plugin/hooks/sessionstart-contexte.mjs` et `stop-contexte.mjs` en sont le domicile. Le rappel
  n'est émis que si la liste a changé : un orchestrateur enchaîne des dizaines de tours, et le même rappel à
  chacun n'informait plus personne. Une session planifiée n'est jamais bloquée (rappel seulement) : le
  blocage relançait la session pour un tour de plus après son verdict
  (`docs/decisions/2026-10-06-suite-des-preuves-mods.md`, leçon 5).
- **Valeurs des plafonds de lignes** : `plafonds.json` en est la source unique, lue par les hooks et par
  `/purge-contexte` ; les recopier dans `WORKFLOW.md` créait deux endroits à tenir à jour.

### Échecs et incidents (§9)

- **La nature de l'échec décide de la reprise** — `docs/decisions/2026-09-09-nature-de-l-echec-et-incidents.md` :
  la reprise suit la nature, pas un cran au-dessus par réflexe ; un modèle plus fort ne répare ni une
  permission manquante ni une prémisse fausse (§3 : monter de modèle n'aide que si le modèle est le problème).
- **7a — première reprise sur le modèle de l'index, escalade à la deuxième** : le texte disait « un cran au-dessus »
  dès la première ; le moteur (`prochaine-action.mjs`, table d'escalade) et `remediation.md` gardent le modèle
  à la première reprise (décision du 2026-09-24, points 4 et 6 : Opus économe en permanence).
- **Panne d'environnement : une seule reprise, puis question** — mesure du 2026-10-15 : la deuxième reprise
  brûlait le budget sur la même permission (P20/S3, constat B de la mesure de référence).
- **7b — trois hypothèses distinctes, une correction chacune, N0 juge chacune** — `EXECUTANT.md` disait à la
  fois « une correction » et « jusqu'à 3 hypothèses » sans les articuler ; la décision du 2026-10-14 tranche.
- **Correctif localisé, ceinture de fichiers dérivés, instrument de mesure faux** —
  `docs/decisions/2026-09-17-gates-sans-arret-et-correctif-localise.md` : les arrêts sans jugement sont
  retirés ; un défaut mesuré hors périmètre se corrige sur place quand le remède est petit, réversible et jugé
  par la gate et N0, au lieu d'arrêter le plan.
- **Le fichier d'incident est le seul canal qui remonte** — la conversation disparaît, `TASKS.md` et
  `STATUS.md` ne remontent pas au dépôt source ; faits bruts, 25 lignes.
- **Canal de reprise `SendMessage` : trois conditions** — `docs/decisions/2026-09-14-conditions-nommees-domicile-unique.md` ;
  un `SendMessage` qui échoue est un démarrage à froid sans nouvelle tentative ; l'exception de la coupure par
  quota existe parce que l'agent est coupé en pleine édition, ce que la condition « N0 vert » ne vérifie pas.
- **On ne s'arrête que sur un choix, sous forme de question à options** — un humain qui reçoit « ça a
  échoué » n'a aucune information de plus que l'orchestrateur ; décider à sa place dépasse le rôle de
  l'orchestrateur ; un renvoi fait refaire le diagnostic déjà payé (`docs/decisions/2026-08-30-ecrire-pour-qui-decide.md`).
- **Anti-patterns réduits à un renvoi** (§8) — chaque anti-pattern reformulait une règle déjà dite dans sa
  section ; une formulation par règle (point 7).
