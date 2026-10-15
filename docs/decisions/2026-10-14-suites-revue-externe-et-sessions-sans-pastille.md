# 2026-10-14 — Suites de la revue externe : deux plans, parallèle retiré, sessions sans pastille

> Issue de `/cadrer` : **Chantier à mener** (deux plans) **+ Décision structurante** (autonomie).
> Lit : `docs/revues/2026-10-13-revue-externe-workflow.md` (les numéros ci-dessous sont les siens).
> Remplace, pour les sessions orchestrées, « la pastille reste » de
> `docs/decisions/2026-10-06-apres-p15.md` : l'idée de session neuve y devient sans objet.
> Brief : inchangé (pas de `PROJECT_BRIEF.md` dans ce dépôt).

## Ce qui change, en clair

- **La revue du 2026-10-13 est retenue presque entière**, en **deux plans** : le plan 1
  (fondations : bugs, CI, mesure de référence) puis le plan 2 (simplification), écrit seulement
  une fois la mesure et la sonde du point 9 connues. Un seul plan aurait écrit d'avance des fiches
  de session contre un code que le plan lui-même réécrit.
- **Le mode parallèle disparaît.** Avec le quota Pro, des sessions lancées ensemble se font couper
  ensemble par la limite ; le parallèle ne gagne que du temps. Les plans s'exécutent vague par
  vague, une session à la fois.
- **Plus aucune session ne demande de clic pour se lancer.** Le mot `pastille` sort des plans :
  - la validation d'écran **n'arrête plus** le plan — le N1 se fait dans la session, ton jugement
    (N2) se note dans `VALIDATION.md`, non bloquant ;
  - un **choix** arrête toujours la session, mais tu y réponds **par écrit**, et la session reprend
    **avec tout ce qu'elle avait lu** (arrêt relayé).

  Ce que tu verras : un plan comme P14 d'EBM-MSP v2 (deux arrêts par session pour la liste commune
  et la relecture du pivot) se déroule depuis ton téléphone, en Remote Control. Revers : tu ne
  suis plus une session en direct, et tu relis un pivot dans un fichier envoyé, pas à l'écran.
- **Une voie express** remplace plan et orchestration pour les petits changements, bornée par un
  script et non par la discipline du modèle.
- **« Toute nouvelle règle en retire une » (point 23) est une orientation**, jugée au cas par cas :
  aucun plafond ne l'applique.

## Arbitrages, point par point

| Point | Décision |
| --- | --- |
| 1 · `/maj-workflow` écrase une dérive | retenu, avec ses voisins (obsolète supprimé sans contrôle, manifeste corrompu, `BINAIRES`) ; test sur trois passages |
| 2 · historique tronqué | retenu : détection `--is-shallow-repository`, `git fetch --unshallow`, sinon `question` |
| 3 · garde-fous anti-boucle | retenu en entier : clés normalisées (accents), budget pour `verifier-premisse`, **compteurs calculés depuis git** |
| 4 · revue sans `Couverture :` | retenu : ligne absente = `invalide` ; vérifier qu'aucun plan ouvert n'a d'ancienne revue sans ce champ ; aligner l'en-tête du moteur |
| 5 · trous du garde-fou git | retenu : analyse argument par argument, `--amend` plus exempté, cas de non-régression |
| 6 · Stop contre les skills sans push | retenu : `push` dans `/purge-contexte` ; `/revue-de-conception` reçoit `Bash(git add/commit/push)` au lieu de perdre `Bash` |
| 7 · une formulation par règle | retenu, limité aux règles de déroulement (reprises, budgets, clôture, relecture) ; **7a** le texte suit le moteur (1re reprise même modèle) ; **7b** = **trois hypothèses distinctes, une correction chacune, N0 juge chacune** ; 7c test de concordance gabarits/moteur ; 7d restes nettoyés ; 7e écrans lus dans `DESIGN_SPEC.md`, `ARCHITECTURE.md` en secours ; 7f contrôles de `/migrer-projet` rendus réels ou retirés |
| 8 · relecture selon le risque | retenu : chemins sensibles relus même en `low` ou en Markdown (accepté : presque tout est relu dans ce dépôt) ; `n0.json` modifié hors zone = bloquant, par contrôle du moteur |
| 9 · `effort` de l'outil `Agent` | sonde d'abord (plan 1) ; positive → les agents `session-<effort>` et leur repli **disparaissent** (tous les postes sont à jour) |
| 10 · le moteur écrit | retenu, **10a** (textes finaux) puis **10b** (`--appliquer`, écritures et commits) |
| 11 · un lecteur d'index | retenu, préalable au 10 ; vérifier que les mods peuvent l'importer, sinon copie générée |
| 12 · voie express, plans courts | retenu : express élargie (ci-dessous) ; bandeau `S<k>.md` réduit aux écarts, plafond fixé après mesure sur P16-P18 ; messages de commit à un seul endroit |
| 13 · `EXECUTANT.md` hors exécutants | retenu, plus essai d'`omitClaudeMd` sur les agents de lecture |
| 14 · codes internes | retenu : **noms explicites**, pas de glossaire |
| 15 · historique hors des documents lus | retenu, **fusionné avec le 7** (même passe sur `WORKFLOW.md`) ; une demi-ligne de « pourquoi » reste quand elle change l'application |
| 16 · `disable-model-invocation` | retenu, revers accepté : ces skills ne se lancent plus que par `/nom` |
| 17 · `/nouveau-plan` allégé | retenu, une ligne de renvoi à la place de chaque cas déplacé |
| 18 · `model:` d'une skill | vérifier la doc ; `/nouveau-plan` lance `sync-workflow.mjs` directement au lieu de `/maj-workflow` |
| 19 · CI et N0 | retenu : `publier --sans-tests` dans la N0, fuite du dossier temporaire corrigée, suites déterministes en CI (déclencheur `tests/**`) |
| 20 · scénarios de bout en bout | retenu, **avant les simplifications** : mesure de référence au plan 1, remesure en fin de plan 2 ; ils remplacent `plugin/evals/` |
| 21 · parallèle | **retiré** (option B) |
| 22 · mods | retenu : O1 impose le modèle calculé par le moteur (escalade comprise), affichage rafraîchi sur changement de `HEAD`, `/incidents` appelle le script, tests des mods non copiés, sortie machine de `claude plugin list` si elle existe |
| 23 · gouvernance | orientation, pas règle |

### Voie express

- Mention `Express : <cause en une ligne>` dans le commit ; le hook Stop l'accepte à la place d'un
  fichier de suivi touché.
- Le hook refuse la mention si le diff dépasse **150 lignes ou 8 fichiers**, ou touche les
  dépendances (manifeste, *lockfile*), `n0.json`, ou la zone d'un plan ouvert. Refusée → réduire,
  ou ouvrir un plan à partir du diff.
- Chemins sensibles (point 8) admis, relecture obligatoire. N0 reste le gate.
- Fiabilité suivie par un script de bilan (commit express suivi d'un bloquant de relecture, d'un N0
  rouge, ou d'une correction qui le cite) : **plus de 1 sur 10 rattrapé → resserrer** ; **0 sur 20 →
  élargir**.

## Les deux plans

- **Plan 1 — fondations** : points 1 à 6 ; 19 ; 20 (scénarios : nominal, échec puis reprise,
  interruption puis relance, revue incomplète — et mesure de référence) ; sonde du 9 ; purge de
  `DECISIONS.md` (162 lignes pour 150) ; **dans le dépôt source, `SessionStart` signale un plugin
  installé plus ancien que `plugin/.claude-plugin/plugin.json`** (constat du 2026-10-14 : poste
  resté en 0.55.0 pendant que le dépôt passait à 0.65.0, sans aucun signal) — fait en 0.66.0 (P19) ; mesure :
  `docs/analyses/2026-10-14-mesure-de-reference.md` ; sonde du 9 positive.
- **Plan 2 — simplification** : points 7 (avec 15 et 14), 8, 9 (suite), 11 → 10a → 10b, 12, 13,
  16, 17, 18, 21 (retrait), 22, sessions sans pastille (ci-dessous), puis remesure.
  Écrit après le plan 1, sur la mesure et le résultat de la sonde.

## Sessions sans pastille

### Faits établis

- Une session reçoit `pastille` par choix de conception (« N1 structurant, déroulé surveillé »,
  `/nouveau-plan`), ou, dans P14 d'EBM-MSP v2, parce qu'elle s'arrête pour l'utilisateur et lance
  ses propres sous-agents (« conversation principale », bandeau de `plans/P14/S2.md`).
- En sous-agent orchestré, `preview_start` ouvre le navigateur in-app ; seul `navigate` vers
  `localhost` est parfois refusé, avec un repli déjà écrit (mode B, « N1 à faire »,
  `/verif-visuelle`).
- **Sonde du 2026-10-14** (sous-agent Haiku, scratch, hors dépôt) : un sous-agent **lance son propre
  sous-agent** ; arrêté sur une question, il **reprend par `SendMessage` avec son contexte** (mot
  retenu avant l'arrêt restitué, réponse reçue). Non testé : la reprise après plusieurs heures.
- Le « repli pastille hors Desktop » (`WORKFLOW.md` §5b) contredit la même section (« sous-agent
  quel que soit l'environnement ») ; `spawn_task` est un outil de Desktop.

### Tranché

- **Validation d'écran (option B')** : la session part en sous-agent comme les autres ; N1 par
  `/verif-visuelle` dans la session ; N2 dans `VALIDATION.md`, sans arrêt du plan.
- **Arrêt en cours de session (option A)** : la session rend la question (et le fichier à relire) au
  lieu de finir ; l'orchestrateur te la pose par écrit, joint le fichier, puis transmet ta réponse à
  **la même** session par `SendMessage`. Un arrêt n'est ni une reprise ni une enquête : hors budget.
  Reprise impossible (agent introuvable, session fermée) → ta réponse écrite dans un fichier du
  plan, reprise à froid qui la lit. Format et action du moteur : au plan 2.
- **Le mot `pastille` sort de `/nouveau-plan`** ; le repli hors Desktop est retiré. Les anciennes
  marques (`pastille`, « conversation principale ») des plans ouverts dans les projets sont
  traduites ou signalées : la voie se choisit au plan 2.
- Le chaînage **à la main** (`/fin-de-tache` pose une pastille pour la session suivante) n'est pas
  touché : il est hors orchestration.

## Écarté

- **Un seul plan** : fiches périmées en fin de plan. **Cinq plans** : arrêts sans décision à prendre.
- **Parallèle stabilisé (21 A)** : coûte une refonte de la preuve N0 pour un gain de temps seul.
- **Pastille inchangée** : bloque le pilotage à distance. **Arrêt de relecture après chaque session
  d'écran (B)** : un arrêt de plus pour un jugement que tu rends presque toujours sans rien
  redemander. **Choix selon ta présence (C)** : deux voies à maintenir.
- **Couper les sessions à chaque arrêt** : chaque morceau repart à froid et relit son corpus en Opus ;
  P14 passerait d'environ 13 à 35 sessions.

## Grille de préparation — état final

| Dimension | État | Preuve |
| --- | --- | --- |
| problème concret | READY | demande explicite (Remote Control, pastille non cliquable) ; P14 d'EBM-MSP v2, douze sessions `pastille` |
| résultat visé | READY | P14 se déroule à distance, choix répondus par écrit ; validation d'écran non bloquante — demande explicite |
| vérification | OPEN | reprise par `SendMessage` après une longue attente non testée → **expérience** : scénario du point 20 au plan 2 |
| périmètre | READY | `/nouveau-plan`, `/orchestrer-plan` (+ `remediation.md`), `prochaine-action.mjs`, `EXECUTANT.md`, `WORKFLOW.md` §5b, `/verif-visuelle`, `/fin-de-tache` |
| cohérence | OPEN | plans ouverts des projets qui portent encore `pastille` → **recherche** (`explorateur`) au plan 2, qui choisit traduction ou signalement |
