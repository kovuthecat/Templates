# Revue externe du workflow — 2026-10-13

- Version examinée : plugin `0.65.0` (commit `dfdb79f`), Claude Code `2.1.296`.
- Auteur : Claude Code (session cloud), avec la confrontation de l'analyse de GPT astra.
- Méthode : lecture des skills, agents, hooks, scripts et mods. Les constats marqués **reproduit**
  ont été rejoués : commande soumise au hook comme donnée, synchronisation rejouée dans un dossier
  jetable, ou cas joué par le moteur. Tous les tests passent (hooks 83, scripts 107, renvois 9,
  mods 8, preuves).
- Statut : **recommandations**. Ce n'est ni une décision, ni un plan. Rien n'a été codé.

## En bref

Le workflow est bien conçu. Plusieurs choix sont à garder :

- le moteur d'état déterministe (`prochaine-action.mjs`) ;
- la preuve N0 ;
- la nature de l'échec qui décide de la reprise ;
- les reprises bornées ;
- la relecture par un agent indépendant ;
- les incidents qui remontent par fichier ;
- le vendoring.

Le problème principal est l'**accumulation de règles**. Le workflow en est à 65 versions, et la
plupart des 18 plans portent sur le workflow lui-même. Presque chaque incident a ajouté une
exception écrite. Cela a trois conséquences :

1. **Trop de cérémonie pour les petits changements.** P18 a remplacé « low » par « medium » à quatre
   endroits. Il a fallu une décision, un index, un `S1.md` de 10 Ko écrit par Opus, une
   orchestration, une relecture, une clôture et une session de publication.
2. **Des garde-fous tenus par le modèle lui-même.** Les compteurs de reprise et les budgets
   s'écrivent à la main, avec des consignes contradictoires.
3. **Des règles écrites qui ne disent plus la même chose que les contrôles.**

Le gain ne viendra pas de nouveaux agents, d'une mémoire ou d'une autre couche d'orchestration. Il
viendra de **règles supprimées ou transformées en scripts**. Le lot 3 ci-dessous retire même des
agents.

Ordre conseillé : lot 1 → lot 2 → lot 3 → lot 4 → lot 5. Le mode parallèle se décide après une
mesure.

---

## Lot 1 — Bugs confirmés, peu coûteux à corriger

### 1. `/maj-workflow` écrase une modification locale au troisième passage — **reproduit**

**Constat.** Une modification locale d'un fichier géré est d'abord signalée, puis écrasée :

1. Le fichier est modifié localement.
2. Au 2ᵉ passage, il est signalé `DÉRIVE` (conservé).
3. Au 3ᵉ passage, il est réécrit (`MAJ`) et la modification est perdue.

C'est l'inverse de la promesse du README (« jamais écrasée en silence »).

**Cause.** Le manifeste enregistre le hash du fichier *dérivé* (`sync-workflow.mjs:372-377`).
Au passage suivant, `hActuel === hConnu` : le fichier paraît sain, donc il est écrasé.

**Problèmes voisins :**
- un fichier obsolète est supprimé sans vérifier s'il a été modifié localement (`:370`) ;
- un manifeste corrompu fait planter le script, car `JSON.parse` n'est protégé par aucun try (`:297`) ;
- la liste `BINAIRES` est étroite (`:88`) : un pdf, un webp ou une police serait réécrit en utf8,
  donc corrompu.

**Proposition.** Garder dans le manifeste le hash de la *source*, plus un marqueur « dérive
conservée ». Ajouter un test sur trois passages.

### 2. Un historique git partiel fausse l'état du moteur

**Constat.** Une session cloud clone avec 50 commits d'historique par défaut. Les commits de tâche
plus anciens deviennent invisibles. Le moteur peut alors relancer une session déjà faite, boucler
sur `valider-n0` ou relancer une relecture inutile (`prochaine-action.mjs:259-275`,
`preuve-n0.mjs:283`). C'est constaté sur P16 dans ce conteneur, masqué uniquement parce que le plan
est clos.

**Proposition.** Au démarrage du moteur et de `preuve-n0`, tester
`git rev-parse --is-shallow-repository`. Si l'historique est partiel : `git fetch --unshallow`, ou
une `question`.

### 3. Les garde-fous anti-boucle reposent sur la discipline du modèle — **en partie reproduit**

**Constat.**
- Les lignes `Tentatives :` et `Remédiation Opus :` sont écrites à la main. Les consignes se
  contredisent : `reprendre-echec/SKILL.md:47` contre `:150` et `:179`.
- Le budget « 2 enquêtes par plan » repart de zéro au PASS, puisque le `.echec.md` est supprimé.
- `verifier-premisse` n'a aucun budget.
- La clé est cherchée sans accent (`prochaine-action.mjs:303,343`). Une ligne
  `Prémisse : réfutée` fait boucler le moteur sur `verifier-premisse` (reproduit). C'est un risque
  réel avec un orchestrateur Haiku qui recopie.

**Proposition.**
- Calculer les compteurs à partir de l'historique git (`git log -- plans/P<n>/S<k>.echec.md`,
  commits d'enquête et de reprise), plutôt que de lignes éditées à la main.
- Normaliser les accents sur les *clés*, pas seulement sur les valeurs.
- Donner un budget à `verifier-premisse`.

**Gain.** L'autonomie devient sûre. Aujourd'hui, une seule erreur de recopie suffit à provoquer une
boucle ou un arrêt injustifié.

### 4. Une revue mal formée est lue comme complète

**Constat.** `lireRevue` met `complète` par défaut quand la ligne `Couverture :` manque
(`prochaine-action.mjs:362`). Une revue écrite sur une ligne, au format de la réponse du relecteur,
passe donc pour terminée.

**Proposition.** Ligne absente = `invalide`, ce qui déclenche une reprise de la relecture. Le
moteur lit aussi `[x]`, les `.echec.md` et les `.revue.md` dans l'arbre de travail, alors que son
en-tête dit « seuls fichiers commités » : aligner l'en-tête ou le code.

### 5. Trous du garde-fou git — **reproduit** (signalé aussi par GPT astra, élargi ici)

| Commande soumise au hook | Résultat |
| --- | --- |
| `git add .` | refusée |
| `git add src/a.ts .` | **passe** |
| `git add -- .` | **passe** |
| `git add :/` | **passe** |
| `git add -u` | **passe** |
| `git add *` | **passe** |
| `git commit -am msg` | refusée |
| `git commit -am msg --amend` | **passe** |
| `git commit --amend -a -m x` | **passe** |
| `git commit -m "fix: commit -a docs"` | passe (correct) |

**Cause.** Le motif exige que `.` suive immédiatement `add` (`pretooluse-git.mjs:598`). La présence
de `--amend` désactive le contrôle de `-a` (`:622`).

**Proposition.** Analyser chaque argument de `git add` et refuser `.`, `:/`, `-u`, `-A`, `--all` et
les jokers, quelle que soit leur position. Ne plus exempter `--amend`. Ajouter les cas de
non-régression, y compris les messages qui ressemblent à des options.

**Priorité moyenne.** C'est un filet contre l'accident, et ces formes sont rares chez Claude. Mais
la correction est peu coûteuse.

### 6. Le hook Stop bloque des skills qui ne poussent pas

**Constat.**
- `/purge-contexte` committe sans pousser (`SKILL.md:80`). C'est pourtant une purge déclenchée
  par un hook, que le hook Stop refuse ensuite pour « commits d'avance ».
- `/revue-de-conception` exige un commit (`:190`), mais n'a pas Bash (`disallowed-tools`).

**Proposition.** Une étape finale « commit + push » commune à toutes les skills qui écrivent. Bash
autorisé pour git seulement dans `/revue-de-conception`.

---

## Lot 2 — Faire dire la même chose aux règles et aux contrôles

### 7. Une formulation unique pour chaque règle de déroulement — *apport de GPT astra, vérifié*

**Constat.**
- `WORKFLOW.md:237` annonce une reprise « un cran au-dessus » après un échec d'exécution. Le moteur
  et `remediation.md:29` gardent le même modèle à la 1re reprise et n'escaladent qu'à la 2ᵉ.
- `EXECUTANT.md` dit « **une** correction » dans sa table, puis « jusqu'à 3 hypothèses » quelques
  lignes plus bas, sans dire comment les deux s'articulent. Celle-ci change directement le
  comportement d'une session : c'est la plus grave des deux.
- Le format écrit d'un `.echec.md`, d'une revue, de `Clos :` ou de `Remédiation Opus :` peut
  diverger du format lu par le moteur sans qu'aucun test ne le voie. Seuls le squelette d'index et
  le gabarit d'échec sont confrontés à leur source (`tester-scripts.mjs:995-1004`).

**Proposition.**
- Une passe ciblée sur les règles qui décident du déroulement (reprises, budgets, clôture,
  relecture, parallèle) : une formulation normative unique, ailleurs un renvoi.
- Un test qui confronte les tables écrites aux constantes du moteur (`tester-renvois.mjs` s'y
  prête).

**Restes de mécanismes retirés, à nettoyer dans la même passe :**
- colonne `Env.` (`verif-visuelle:110`, `WORKFLOW.md:189`) ;
- statut `[~]` (`reprendre`) ;
- « headless » au présent (`maj-workflow:90`, `nouveau-projet:124`, commentaire de
  `.claude/settings.json`) ;
- `_comment_echec` de `plafonds.json`, qui dit le motif non appliqué alors qu'il l'est ;
- commentaire `Revues:` dans `stop-contexte.mjs:72` ;
- « importée par le CLAUDE.md » (`CLAUDE-BASE.md:3`) ;
- effort « à vérifier à la main » (`templates/TASKS.md:21`) ;
- chemin `plugin/…` en dur dans `/verif-visuelle:106`, qui casse une fois vendoré.

**Contradiction sur la place des écrans :**
- le gabarit `ARCHITECTURE.md` renvoie l'UI et les écrans vers `DESIGN_SPEC.md` ;
- mais `CLAUDE-BASE.md:10-11`, `/revue-d-usage:44`, `parcours-types.md` et `nouveau-projet:47` les
  cherchent dans `ARCHITECTURE.md`.

Conséquence : des parcours construits sur un fichier vide.

**Contrôles de `/migrer-projet` qui donnent un vert sans rien prouver :**
- D3 ne détecte que les chemins Windows (`:163`) ;
- D4 annonce un contrôle de plafonds qu'il ne lance pas (`:166`) ;
- `/maj-workflow` annonce « trois cas » pour deux lignes de table (`:50`).

### 8. Relecture déclenchée par le risque, pas par l'effort — *apport de GPT astra, vérifié*

**Constat.** Le relecteur saute toute session `low` et tout commit qui ne touche que du `.md`, des
données ou des fixtures (`relecteur-session.md:21,72-73`). Or, dans ce dépôt, un `SKILL.md`, un
agent ou un hook *sont* le comportement du système. Une session `low` peut aussi poser un correctif
localisé hors de son périmètre.

**Problème voisin : la preuve N0 vérifie l'intégrité, pas l'honnêteté.** Une session qui remplace
une commande de `.claude/n0.json` par `echo ok` obtient une preuve valide. La configuration n'est
comparée qu'à la preuve elle-même (`preuve-n0.mjs:295-299`). C'est précisément le raccourci qu'un
modèle sous pression peut prendre.

**Proposition.**
- Une liste de chemins sensibles : `.claude/**`, `plugin/**` dans le dépôt source, `CLAUDE.md`,
  `n0.json`, réglages, fixtures qui définissent les résultats attendus.
- Lue par le moteur, elle exige la relecture même pour une session `low` ou un diff en Markdown.
- Une modification de `n0.json` hors de la zone du plan devient un bloquant.
- Les changements vraiment mécaniques gardent leur exemption.

---

## Lot 3 — Simplifier

### 9. Le paramètre `effort` de l'outil `Agent` remplace les agents `session-<effort>`

**Constat.** Selon la doc des sous-agents (§ *Choose an effort level*), l'outil `Agent` accepte un
paramètre `effort` à chaque appel depuis Claude Code 2.1.292. Ce paramètre prime sur le `effort:` du
frontmatter. `WORKFLOW.md` §3 et §5b reposent sur l'affirmation inverse (« l'outil `Agent` règle le
modèle, pas l'effort »). Elle justifie aujourd'hui :
- la famille de quatre agents `session-low` à `session-xhigh` ;
- le repli en trois crans (`session-<effort>`, puis `workflow:session-<effort>`, puis `claude`) ;
- le préflight qui vérifie que ces agents résolvent ;
- plusieurs paragraphes de documentation.

**Proposition.**
- **Sonder d'abord** que l'effort est réellement appliqué, comme en P15 : la doc dit que le
  paramètre existe, pas qu'il marche dans tous les environnements.
- Le moteur rend ensuite `effort` directement dans le champ `agent`, et cette machinerie disparaît.
- Garder le repli tant que des postes tournent sous 2.1.292.

**À ne pas mal interpréter.** Le frontmatter `background` n'accepte que `true` : il est impossible
de forcer le premier plan par définition d'agent. La règle « `run_in_background: false` à chaque
appel » et le garde-fou O3 restent donc justifiés.

### 10. Le moteur fait aussi les écritures mécaniques de l'orchestrateur

**Constat.** L'orchestrateur tourne sur Haiku. Ses erreurs restantes sur le banc sont des erreurs
de forme. Pourtant, il doit encore faire lui-même :
- calculer « reste lançable », dépendances transitives comprises ;
- rédiger le bloc `question` et recopier les options de `## Issues` ;
- écrire le `.echec.md` d'une coupure par quota ;
- incrémenter `Remédiation Opus :` et ajouter la ligne `Premisse : refutee` ;
- passer `[x]` à `[x]!`, ajouter « · validée » ;
- committer tâche par tâche en fin de vague verrouillée.

**Proposition.**
- Le moteur rend le texte final (question, rapport, sessions encore lançables).
- Un mode `--appliquer <action> <résultat>` fait les écritures et les commits.

**Gain.** `/orchestrer-plan` passe d'environ 5 000 à environ 1 500 tokens. L'orchestrateur Haiku
devient fiable par construction, et le « premier geste inventé » qui ferait revenir à Sonnet
devient moins probable.

### 11. Un seul module de lecture de l'index

**Constat.** Cinq lecteurs différents : `prochaine-action.mjs:168-243`, `verifier-plan.mjs:20-62`,
`hooks/lib.mjs:395-409`, `garde-fous/register.ts:33-53` et `affichage/limites.ts`. Ils divergent
déjà. Un en-tête `**Vague 2 — parallélisable** (ajoutée…) : S2` est accepté par le moteur et refusé
par `verifier-plan` (reproduit).

**Proposition.** Un module unique, importé partout, testé contre les squelettes eux-mêmes.

**Autres duplications à résorber au passage :**
- le wrapper `claude()`, présent en trois copies au comportement différent ;
- `lireIncident`, présent en deux copies ;
- la regex de chemin personnel, différente entre la CI et `publier.mjs`.

### 12. Une voie express, et des plans plus courts

**Constat.**
- Rien n'existe entre « je code directement » et « décision + plan + orchestration ».
- Le hook Stop exige qu'un fichier de suivi soit touché, même pour un correctif de trois lignes.
- Les `S<k>.md` font 10 à 14 Ko, écrits en sortie Opus, le poste le plus cher. Leur bandeau répète
  des règles qu'`EXECUTANT.md` porte déjà (« UNIQUEMENT… », « ne reconçois pas », latitude par
  défaut).
- Les messages de commit sont recopiés des `S<k>.md` vers l'index.

**Proposition.**
- **Une voie express aux critères écrits** : ≤ 2 fichiers, aucun contrat ni dépendance touché,
  cause connue. Le travail se fait directement, N0 sert de gate, le commit porte un repère
  `Express :` que le hook Stop accepte, et la relecture suit la règle de risque du point 8.
- **Un bandeau de `S<k>.md` réduit aux écarts au défaut**, avec un plafond de taille contrôlé par
  `verifier-plan.mjs`.
- **Un seul endroit pour les messages de commit.**

**Gain.** C'est le plus gros levier d'économie, à chiffrer avec la mesure du point 20.

---

## Lot 4 — Économie de tokens

### 13. `EXECUTANT.md` réservé aux exécutants, `omitClaudeMd` sur les agents de lecture — *GPT astra, vérifié*

**Constat.**
- `critique-plan`, **qui tourne sur Opus**, reçoit l'ordre de lire `EXECUTANT.md` en entier
  (`nouveau-plan/SKILL.md:144`), puis `CLAUDE-BASE.md` par renvoi. Soit environ 3 000 tokens au
  tarif Opus, pour un agent qui ne committe rien et ne lance pas N0.
- Même chose pour chaque `parcoureur-usage` (`revue-d-usage/SKILL.md:97`), lancé 5 à 8 fois par
  revue, alors que `WORKFLOW.md` §5b dit que cette lecture n'est pas exigée hors sessions.
- `omitClaudeMd: true` existe bien (doc des sous-agents, Claude Code ≥ 2.1.271).

**Proposition.**
- Retirer cette ligne des lancements d'agents auxiliaires, et leur transmettre seulement leurs
  contraintes utiles.
- Essayer `omitClaudeMd: true` sur les agents de lecture seule appelés souvent : `explorateur`,
  `resumeur-git`, `verificateur-premisse`, `lecteur-doc`.
- Ne pas l'appliquer aux exécutants, ni aux agents qui ont besoin des conventions du projet. Gain
  modeste par appel (le `CLAUDE.md` d'un projet tient sous 200 lignes), mais récurrent.

### 14. Remplacer les codes internes par des noms

**Constat.** C1 à C7 apparaissent 62 fois dans les skills, les agents, `WORKFLOW.md`,
`EXECUTANT.md` et `CLAUDE-BASE.md`. S'y ajoutent J14, O1/O3, A1/A7, D4, T5/P10/S2. Ils ne sont
définis que dans `docs/` du dépôt source, que les projets n'ont pas. Pire, « C2 » a deux sens :
`/compact` dans `cadrer:110`, le moteur dans `WORKFLOW.md`.

**Proposition.** Des noms explicites, ou un glossaire en tête de `WORKFLOW.md`, qui en a déjà un.

### 15. Sortir l'historique des documents lus pendant le travail

**Constat.** `WORKFLOW.md` fait 30 Ko (environ 8 000 tokens) et il est référencé 92 fois depuis les
skills et les agents. Une bonne part est de la justification : « constat du 2026-10-05 »,
« décision du… », « Pourquoi ».

**Proposition.** La règle reste dans le document lu ; sa raison va dans `docs/decisions/`, qui
existe pour ça. Un gain de 30 à 40 % paraît atteignable.

### 16. `disable-model-invocation` sur les skills lancées par l'humain

**Concerne :** `/nouveau-projet`, `/creer-projet`, `/migrer-projet`, `/revue-de-conception`,
`/revue-d-usage`.

**Gain.** Leurs descriptions ne sont plus chargées à chaque session, et aucun déclenchement par
erreur au tarif Opus.

### 17. `/nouveau-plan` : sortir les cas rares dans ses fichiers de référence

**Constat.** Environ 9 500 tokens Opus par appel, corps et références lues d'office.

**Proposition.** Déplacer dans `references/` ce qui sert rarement :
- le mode extension (`:270-293`) ;
- le seuil unique (`:69-86`) ;
- l'écart n°11 (`:359-368`) ;
- la colonne Env. héritée (`:258-264`).

Même chose pour le protocole de preuve de `/cadrer` (`:136-173`).

### 18. Le `model:` d'une skill ne tient que le temps d'un tour

**Constat.**
- `/nouveau-plan` et `/revue-de-conception` croient tourner sur Opus pendant tout leur déroulé.
  Seule `/cadrer` traite le problème (`:24-29`).
- `/nouveau-plan` appelle `/maj-workflow` (`model: haiku`) en premier geste. Risque, non vérifié :
  un changement de modèle en cours de tour, qui fait repayer le cache.
- Contradiction interne de `/nouveau-plan:9-12` : l'écriture serait « mécanique » et faite sur le
  modèle actif, alors que les squelettes disent « rédigé par Opus ».

**Proposition.**
- Chaque skill sur plusieurs tours vérifie le modèle courant à son premier geste, comme `/cadrer`.
- Aucune skill n'en appelle une autre qui change de modèle.

---

## Lot 5 — Filets de sécurité

### 19. CI qui lance les tests, N0 sans doublons — *signalé aussi par GPT astra*

**Constat.**
- La CI (`.github/workflows/plugin.yml`) ne vérifie que la syntaxe, le manifeste et l'inventaire :
  aucune suite de comportement n'y tourne.
- La N0 du dépôt dure environ 123 s, dont environ 67 s en double, parce que `publier --dry-run`
  relance hooks, renvois, scripts et preuves. Elle dépend aussi du réseau (`git fetch`).
- Elle laisse une copie de `plugin/` dans le dossier temporaire à chaque passage :
  `process.exit(0)` en dry-run (`publier.mjs:323`) court-circuite le `finally` (`:363`).

**Proposition.**
- Chaque suite tourne une fois par validation.
- La publication reste capable de tout vérifier quand elle est lancée seule.
- Les suites déterministes tournent en CI, avec des déclencheurs qui couvrent `tests/`.

### 20. Quelques petits plans exécutés de bout en bout — *GPT astra, élargi*

**Constat.** Le banc de l'orchestrateur Haiku ne note que le **premier geste** sur un état préparé
(`docs/analyses/2026-10-12-orchestrateur-haiku-5-5.md:20`). Les évals `plugin/evals/` sont lancées
à la main ; la dernière date du 2026-09-24, et leurs fixtures sont figées en `v0.39.0`.

**Proposition.** Garder le banc rapide et ajouter quatre ou cinq scénarios réels courts, joués à
chaque changement de modèle ou d'orchestration :
- parcours nominal ;
- échec puis reprise ;
- interruption puis relance ;
- revue incomplète ;
- vague parallèle, si ce mode reste.

Mesurer pour chacun : **coût total par plan terminé**, interventions humaines, relances inutiles,
validité des preuves. C'est cette mesure qui permettra de chiffrer les gains des points 9, 10 et
12. Sans elle, toutes les économies annoncées restent des estimations.

---

## Conditionnel

### 21. Mode parallèle : mesurer, puis retirer ou stabiliser

**Constat.** Le verrou `.claude/wave.lock` pèse 42 mentions dans 20 fichiers : exceptions du hook
Stop, refus du hook git, commits faits par l'orchestrateur, relecture sur l'arbre de travail non
commité. `WORKFLOW.md` §3b recommande déjà le séquentiel sous quota Pro.

**Risque relevé par GPT astra, plausible mais non reproduit.** N0 échoue si les fichiers changent
pendant son exécution (`n0.mjs:198`), et le journal `.claude/n0/dernier.log` est partagé. Une
session qui écrit peut donc faire échouer à tort le N0 d'une session sœur, et la reprise consomme
alors du budget.

**Proposition.**
- Compter l'usage réel du parallèle dans les projets.
- S'il est marginal : le retirer, et toute cette branche de règles et de tests avec.
- Sinon : sous verrou, tests ciblés seulement pendant le travail, un N0 unique lancé par
  l'orchestrateur une fois toutes les écritures terminées, et des correctifs localisés interdits
  dans la zone d'une session encore active.

### 22. Mods : garder O3 et le titre de session, corriger le reste

**Constat.**
- **O1** impose le modèle de l'index dès que l'appel n'en précise pas (`garde-fous/register.ts:59-63`).
  Sur une reprise escaladée où l'orchestrateur aurait omis `model`, il annule en silence
  l'escalade décidée par le moteur.
- **L'affichage** lance le moteur deux fois toutes les 20 s (`register.tsx:114-135`).
- `/incidents` duplique `collecter-incidents.mjs`.
- Les tests des mods sont copiés dans chaque projet.
- L'installeur lit la sortie humaine de `claude plugin list`, qui n'est pas un format garanti.

**Proposition.**
- O1 supprimé, ou qui cède au champ `agent` rendu par le moteur.
- Affichage rafraîchi seulement quand `HEAD` change.
- `mods/*/tests` exclus de la copie vers les projets.

**Position sur l'architecture.** La séparation entre affichage et garde-fous est bonne (accord avec
GPT astra). C'est le comportement d'O1 qui pose problème, pas le découpage.

---

## Gouvernance

**23. Toute nouvelle règle écrite en retire une, ou devient un script ou un hook.**

Le workflow l'a déjà constaté : ce qui tient, c'est ce qui s'exécute (N0, moteur, hooks), pas ce
qui s'écrit. Cette règle freine l'accumulation, qui nourrit à la fois le coût en tokens et les
contradictions du lot 2.

---

## Annexe — Confrontation avec l'analyse de GPT astra

| Proposition GPT astra | Vérification | Suite donnée |
| --- | --- | --- |
| 1. Relecture selon le risque | confirmé (`relecteur-session.md:21,72-73`) | retenue, point 8, élargie à `n0.json` |
| 2. Contradictions entre la doc et le moteur | confirmé (`WORKFLOW.md:237` contre `remediation.md:29` ; une correction contre 3 hypothèses) | retenue, point 7, avec un test de concordance |
| 3. Trous du hook git | confirmé et élargi (`-- .`, `:/`, `-u`, `*`, `--amend -a`) | retenue, point 5, priorité moyenne |
| 4. Stabilisation avant le N0 parallèle | plausible, non reproduit | fusionnée au point 21, conditionnelle |
| 5. Tests en double, CI | confirmé | retenue, point 19 |
| 6. `EXECUTANT.md` hors exécutants, `omitClaudeMd` | confirmé (`critique-plan` sur Opus ; option documentée ≥ 2.1.271) | retenue, point 13 |
| 7. Petits plans de bout en bout | confirmé (le banc mesure le premier geste) | retenue, point 20, avec le coût par plan |

**Désaccords :**
- « Détection des modifications locales : base solide » : c'est contredit par la reproduction du
  point 1.
- « Conserver l'architecture des mods » : d'accord sur le découpage, mais O1 peut annuler une
  escalade (point 22).

**Sujets absents de son analyse :**
- les points 1, 2, 3, 4, 6, 9, 10, 11 et 12 ;
- les points 14 et 15 ;
- le coût de la cérémonie.

**Convergence :** ni nouvel agent, ni mémoire, ni couche d'orchestration supplémentaire. Garder le
moteur déterministe, les preuves N0, les reprises bornées et le vendoring.
