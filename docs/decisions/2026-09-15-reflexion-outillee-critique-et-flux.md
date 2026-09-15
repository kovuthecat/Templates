# 2026-09-15 — Réflexion outillée : préparation prouvée, critique avant approbation, flux lu par un agent

## Ce que ça change

Le cadrage décidait sur ce qu'il avait en tête ; le plan était approuvé avant d'être contredit ;
l'exploration rendait une carte de fichiers là où le plan demandait un flux. Sept choses changent,
toutes chargées **à la demande** — rien de nouveau n'entre dans le contexte d'une session qui n'en
a pas besoin.

1. **Les garanties décrites sont exactes.** `allowed-tools` pré-autorise, il ne retire rien ;
   `disallowed-tools` retire, mais pour le seul tour qui invoque la skill. `/cadrer` et
   `/revue-de-conception` cessent d'annoncer une « impossibilité » que le runtime ne tient pas : le
   garde-fou est le Plan Mode, et « ne rien lancer » est une règle tenue à la main. L'exemple de
   `/nouveau-plan` 4b qui tolérait une dépendance dans la **même** vague dit désormais « vague
   antérieure », comme le contrôle 4 de `verificateur-plan` l'exige.
2. **Les gabarits ne portent plus de stack.** Les chemins d'exemple web du squelette d'index
   deviennent des champs (`<fichiers réellement modifiés>`), les exemples TypeScript de
   `verificateur-plan` sont contextualisés, et `/nouveau-projet` recueille les **contraintes avant
   la stack**, la stack familière restant le candidat privilégié à condition de satisfaire le besoin.
3. **La réflexion est outillée.** Trois annexes dans `plugin/skills/cadrer/references/`, partagées
   par `/cadrer`, `/nouveau-projet` et `/nouveau-plan` : une **grille de préparation** à cinq
   dimensions binaires avec preuve en une phrase ; six **fiches de méthode** derrière un aiguillage
   dont `NONE` est l'issue normale ; un protocole **rechercher l'existant** avant de développer sur
   mesure. Une inconnue porte qui la résout : recherche, expérience, choix humain, tâche humaine.
4. **Une prémisse comportementale se sonde avant le plan.** Chaque hypothèse racine de
   `/nouveau-plan` est typée *lisible* ou *comportementale* ; une comportementale se mesure (sonde)
   ou s'écrit comme **risque du plan** dans l'index, ou s'isole derrière une couture nommée.
   `verificateur-premisse` rend `INDECIDABLE · comportementale` au lieu d'un `INDECIDABLE` muet, et
   l'orchestrateur saute la vérification quand le rapport d'échec joint une **mesure commitée**.
5. **Un critique confronte le plan avant son approbation.** Nouvel agent `critique-plan` (Opus,
   lecture seule), lancé par `/nouveau-plan` en fin d'Étape 1 sur un plan classé **architectural**
   ou qui touche un déclencheur nommé — jamais sur un plan borné sans déclencheur. Il vérifie contre
   le dépôt, rend `PASS` ou des constats `DÉFAUT` / `À VÉRIFIER` avec cible et correction, et clôt
   par sa liste de choix non résolus. Une passe, pas de boucle. `verificateur-plan` ne bouge pas.
6. **Un agent lit un flux.** Nouvel agent `analyste-flux` (Sonnet, lecture seule) : entrée,
   transformations, état, sortie, erreurs, consommateurs, avec `fichier:ligne` pour chaque fait,
   faits séparés des inférences et des inconnues. `explorateur` reste tel quel — Haiku, vingt
   lignes, appelants inchangés.
7. **Les gates de publication s'étendent, et les évals commencent.** `tester-renvois` vérifie que
   tout agent cité existe, que les frontmatters se parsent, que les citations croisées d'annexes se
   résolvent et qu'une annexe n'en cite pas une autre ; `tester-hooks` couvre le marqueur de fin non
   inscriptible. Trois cas d'évals de déclenchement (`claude plugin eval`) sur `fin-de-tache` et
   `orchestrer-plan`, en dernière vague, sous prérequis Claude Code ≥ 2.1.269.

**À quoi on le verra** : une session `/cadrer` écrit sa grille avant de délibérer et sa décision
porte ses inconnues typées ; un plan architectural reçoit un `PASS` ou des constats **avant** que
l'utilisateur ne l'approuve ; un plan écrit sur une hypothèse comportementale porte une ligne
« Risques du plan » ou la mesure qui l'a sondée ; une publication échoue si une skill cite un agent
absent. Version cible : plugin `0.37.0`, plan `P5`.

**Ce qui ne change pas** : « Opus pense, les autres font » ; un exécutant ne lit que son `S<k>.md` ;
les trois niveaux de validation ; le régime ouvert et le protocole de preuve (décision du
2026-09-14) ; `verificateur-plan` et ses quatre contrôles ; la reprise et son budget (§9c) ; la
phase de **stabilisation** — les volets 3, 5, 6 et 7 sont des ajouts assumés par le mainteneur, les
autres sont des corrections.

## Pourquoi

Le rapport `rapport-amelioration-workflow-claude-code.md` (révision du 2026-09-15, sur le commit
`d7c6896`) a été lu en entier, puis confronté au dépôt et à la documentation officielle. Ses
constats locaux D1, D2, D3, D4, D8, D9 et D10 sont **vérifiés** ; ses trois angles morts sont
la phase de stabilisation arrêtée le 2026-09-14, l'existence de `/revue-de-conception`, et
l'écart 2 de la revue du 2026-09-14 (prémisse comportementale) qui porte déjà l'appui par incident
que R2 et R3 n'ont pas. Le catalogue a donc été filtré : ce qui corrige une prémisse fausse ou
répond à un incident entre d'office ; ce qui ajoute une capacité entre sur décision explicite du
mainteneur (volets 3, 5, 6, 7) ; le reste est écarté ci-dessous.

Preuves qui pèsent le plus :

- **D1** — la doc des skills : « It does not restrict which tools are available: every tool remains
  callable » ; `disallowed-tools` « clears when you send your next message ». Une règle du workflow
  reposait sur une garantie inexistante depuis la v0.7.
- **Écart 2** — `prémisse` = 10 des 12 échecs classés ; MYO a payé cinq plans pour une hypothèse
  qu'une sonde d'une minute aurait tranchée.
- **G8** (Chords) — une allowlist npm sur un projet Python : le biais de stack des gabarits a déjà
  produit un incident.
- **D3** — l'approbation du plan précède `verificateur-plan` (Étape 4b) ; aucune contradiction ne
  peut peser sur l'arbitrage humain au moment où il a lieu.

## La question tranchée

Comment relier intention, preuve, exécution et vérification sans allonger la voie courte ni ajouter
un registre ? Réponse : par des **annexes chargées à la demande**, des **agents à déclencheur
nommé**, et des **lignes mécaniques** dans les artefacts qui existent déjà — jamais par une étape
obligatoire de plus.

## Les volets, un par un

### (a) Garanties exactes — corrections

- `/cadrer` et `/revue-de-conception` : la note sous le frontmatter dit ce que `allowed-tools` fait
  (pré-autoriser pour le tour), ajoute `disallowed-tools: Bash, PowerShell` **en disant qu'il ne
  tient qu'un tour**, et nomme le vrai garde-fou (Plan Mode) et la règle tenue à la main.
- `docs/analyses/2026-09-12-…` lignes 42 et 77 : note de rectification datée, sans réécrire l'analyse.
- `docs/references/claude-code-capabilities-2026-08.md` : entrées datées du 2026-09-15 pour
  `allowed-tools`, `disallowed-tools`, `effort` en frontmatter d'agent, `claude plugin eval`
  (≥ 2.1.269), `/skill-doctor` (≥ 2.1.252).
- `/nouveau-plan` 4b : « vague antérieure ».

*Écarté* : une garantie durable par frontmatter — impossible, le retrait ne tient qu'un tour.

### (b) Gabarits neutres et contraintes avant stack — corrections

- `squelette-index.md` : `<fichiers réellement modifiés>` à la place de `css/`, `index.html`,
  `js/edit/`.
- `verificateur-plan.md` : les exemples restent, précédés de « exemples sur un projet TypeScript —
  les chemins viennent toujours du plan ».
- `/nouveau-projet` Phase A : Contraintes (ex-Q10) passe avant Données et Stack ; la question Stack
  demande des candidats **au regard des contraintes** ; Phase C : « adapter `permissions.allow` à
  la stack retenue, jamais laisser l'allowlist JavaScript sur un autre langage » (G8).

*Écarté* : le corpus multi-dépôts du rapport (R1e tests) — c'est le backlog des évals, pas P5 ;
l'étape « acheter ou construire » — les projets du mainteneur sont des outils personnels construits.

### (c) La réflexion outillée — ajout

**Domicile** : `plugin/skills/cadrer/references/`, cité par `/nouveau-projet` et `/nouveau-plan`
avec le chemin complet `${CLAUDE_PLUGIN_ROOT}/skills/cadrer/references/<x>.md` (vendoré en
`.claude/skills/cadrer/references/`, substitution vérifiée dans `sync-workflow.mjs`). Aucun nouveau
répertoire, aucune entrée de vendoring, une assertion de test pour les citations croisées.

**`preparation.md`** — cinq dimensions, inspirées d'Ideation : problème concret, résultat visé,
vérification, périmètre, cohérence. Chacune `READY` ou `OPEN`, **jamais un score**, avec une
**preuve en une phrase** (artefact consultable, ou manque nommé). Une `OPEN` porte sa résolution :
`recherche` (agent, jamais l'utilisateur), `expérience` (sonde ou protocole de preuve), `décision`
(question §9c), `tâche` (geste humain hors dépôt). Une dimension acquise en amont se réutilise par
référence et ne se rouvre que si sa preuve a changé. Règle de sortie, reprise d'Ideation : une
`OPEN` de type `décision` interdit d'écrire le plan.

**`protocoles.md`** — table d'aiguillage puis six fiches de douze lignes au plus : causalité,
carte–territoire, réversibilité, pré-mortem, séparation des contraintes, seuil d'arrêt. `NONE` en
première ligne, rendu dans les cinq cas du routeur `cc-thinking-skills` : réponse déjà évidente,
implémentation routinière sans inconnue, exécution d'un plan convenu, question hors catalogue,
aucune fiche n'améliore clairement le travail. Une fiche à la fois ; une deuxième seulement pour
une question distincte. Une fiche ouverte rend trois lignes obligatoires : la **question que seule
cette méthode pose**, son **angle mort**, son **seuil d'abandon**. Évaluer la décision produite,
jamais la conformité du vocabulaire.

**`rechercher-existant.md`** — déclencheur : mécanisme non trivial, dépendance envisagée, problème
courant, sous-système custom proposé. Sept pas : capacité et contraintes ; dépôt ; stack ;
candidats externes bornés (2-3, sans remplir le quota) ; qualification des preuves (documenté,
testé en amont, testé ici) ; coût total ; conclusion. Cinq issues : **réutiliser, configurer,
adapter, développer, isoler** — la cinquième, reprise d'AB Method, place l'inconnue derrière une
couture nommée pour que le reste se découpe. Format de sortie fixe. Critère d'arrêt : un candidat
satisfait les contraintes obligatoires, ou budget atteint — « aucun candidat adapté dans ce
périmètre », jamais « aucune solution n'existe ».

**Points d'appel** : `/cadrer` — grille après la question de l'Étape 1, aiguillage des fiches à
l'Étape 2, état final de la grille dans la décision écrite ; `/nouveau-projet` — grille avant la
synthèse de Phase B, recherche de l'existant quand les fondations sont ouvertes, inconnues dans la
synthèse, aucune seconde validation ; `/nouveau-plan` — relit la grille de la décision et ne
rouvre que ce qui a changé, recherche de l'existant sur les inconnues techniques restantes, et un
paragraphe qui distingue **direction structurante approuvée** (ne se rediscute pas) et **détails
techniques ouverts** (se comparent).

*Écarté* : `plugin/references/` partagé (deux changements d'infrastructure pour le même résultat) ;
le contrat JSON et le rendu HTML d'Ideation ; la matrice et la notation pondérée du routeur.

### (d) Prémisse comportementale — écart 2 de la revue du 2026-09-14

- `/nouveau-plan` Étape 1, point 5 : chaque hypothèse racine est typée `lisible` ou
  `comportementale`. Comportementale → **sonde** (une commande ou un script jetable, résultat
  écrit dans la décision ou le `S<k>.md`), ou **risque du plan** (ligne `Risques du plan :` sous
  l'objectif d'ensemble de l'index, avec ce qui le réfuterait), ou **isolement** derrière une
  couture (issue du protocole (c)).
- `verificateur-premisse` : `INDECIDABLE · comportementale` quand la réponse demande d'exécuter.
- `S<k>.echec.md` : ligne mécanique `Mesure : <commit> · <commande>` ; `remediation.md` la lit par
  `grep -m1 '^Mesure :'` et, présente, saute la vérification pour passer à la question ou à
  l'extension ; `WORKFLOW.md` §9c gagne la ligne de table correspondante.

*Écarté* : donner des outils d'exécution à `verificateur-premisse` — la sonde vit en amont, pas
dans le vérificateur.

### (e) Critique avant approbation — ajout

**Agent `critique-plan`** : `model: opus`, `effort: high`, `tools: Read, Grep, Glob`,
`maxTurns: 25`. Entrées dans son prompt : chemin de la décision, synthèse de l'Étape 1 recopiée
(flux, hypothèses typées, découpage envisagé, critères de réussite) — jamais la conversation. Cinq
questions, et seulement les angles que le plan touche : quel scénario ferait échouer l'objectif
malgré des tests verts ; quelle responsabilité ou dépendance reste implicite ; que deviennent
l'état et les effets après interruption, échec partiel ou appel répété ; les critères mesurent-ils
le comportement utile, invariants compris ; une solution nettement plus simple tient-elle.

**Sortie** : `PASS` explicite (un verdict propre est valide, reprise d'Ideation), ou une liste
numérotée : `<DÉFAUT|À VÉRIFIER> · <cible fichier:section> — <preuve> → <conséquence> → <correction
minimale>`. Tout constat nomme sa cible et sa correction, sinon il ne s'écrit pas. Pas de `nit`.
Toujours une dernière section `Choix non résolus :` — `aucun`, ou la liste qui devient une
question §9c. Critique le plan, pas la prose ; vérifie contre le dépôt ; aucune recommandation de
périmètre produit ; aucune écriture.

**Déclenchement, écrit dans `/nouveau-plan`** (Étape 1bis, avant l'approbation en Plan Mode) :
le verdict de l'Étape 1 classe le plan `borné` (un changement bien délimité sur du code existant)
ou `architectural` (nouveau sous-système, ou changement qui restructure l'assemblage ou modifie une
interface dont d'autres dépendent — Superpowers). Le critique tourne sur tout plan
`architectural` ; sur un plan `borné` seulement s'il touche un déclencheur : contrat partagé
modifié, migration ou schéma de données, concurrence, autorisation, performance annoncée, plan en
mode extension après un échec `prémisse`, demande explicite. Dans le doute, critique. Pas de
relance sur un reformulage : seulement si buts ou périmètre changent.

**Routage par le cadreur** : `PASS` → continuer. `DÉFAUT` corrigeable sans toucher une décision →
corriger la synthèse, revérifier la seule correction. `À VÉRIFIER` ou fait manquant → recherche,
sonde, ou protocole de preuve — aucune escalade humaine automatique. Choix durable non autorisé →
question §9c, avec la liste du critique. Une passe ; une seconde uniquement sur les corrections.

*Écarté* : quatre critiques parallèles par lentille (Ideation) — un seul, cinq questions ; revue
en quatre sections de huit constats (gstack) ; appel depuis `/cadrer` — on ne critique pas deux
fois la même décision ; Sonnet — le jugement de conception est le travail d'Opus (§2).

### (f) Flux lu par un agent — ajout

**Agent `analyste-flux`** : `model: sonnet`, `tools: Read, Grep, Glob`, `maxTurns: 25`. Méthode de
HumanLayer `codebase-analyzer` : points d'entrée et surface, puis suivi des appels avec chaque
transformation, puis logique clé sans l'évaluer. Sortie à sections fixes : question, révision ou
zone, **faits observés** (`fichier:ligne` pour chacun), flux (départ → transformation → effet →
contrôle), **inférences** (fondement, vérification manquante), **inconnues** (non inspecté ou non
observable statiquement), couverture (cherché, exclu). Interdits : deviner, recommander, qualifier
un bug, promouvoir une inférence en fait. Budget indicatif 600–900 tokens ; une réponse incomplète
dit ce qui manque au lieu de tenir dans le format.

**Appelants** : `/nouveau-plan` Étape 1 (« flux » → `analyste-flux` ; « fichiers » →
`explorateur`) ; `/cadrer` Étape 2 ; `/revue-de-conception` Étape 2 ; `WORKFLOW.md` §5 passe à
neuf agents. `explorateur` **inchangé**.

*Écarté* : un mode dans `explorateur` — un agent n'a qu'un modèle, et HumanLayer sépare
localisation (rapide) et analyse (Sonnet) pour cette raison ; un flux faux coûte un plan.
`cartographier-conception` attend un cas.

### (g) Gates de publication et évals

- `tests/tester-renvois.mjs` : assertion 4, tout agent nommé dans `plugin/**` sous la forme
  `subagent_type: "<x>"` ou `` `<x>` `` de la table §5 existe dans `plugin/agents/` ; assertion 5,
  chaque frontmatter de skill et d'agent se parse, `name` en kebab-case, `allowed-tools` côté skill
  et `tools` côté agent, aucune valeur non citée contenant `: ` (Trail of Bits — sinon tout le
  frontmatter tombe en silence) ; assertion 6, toute citation
  `${CLAUDE_PLUGIN_ROOT}/skills/<s>/references/<x>.md` se résout, et aucune annexe ne cite une
  annexe.
- `tests/tester-hooks.mjs` : `stop-contexte` avec marqueur de session non inscriptible → comportement
  borné, jamais une boucle.
- **agnix** : une passe en rapport seul (`--dry-run`) sur la révision figée, constats triés dans
  `docs/analyses/`, seuls les déterministes deviennent des assertions locales. Jamais une gate.
- **Évals** : `plugin/evals/` avec trois cas — `fin-de-tache` se déclenche sur une fin de session
  de plan, `orchestrer-plan` se déclenche sur « lance la vague 2 de P<n> », ni l'un ni l'autre sur
  une correction de coquille. Grader `tool_used` sur `Skill` avec `input_match`, `min: 0 max: 0`
  pour le négatif, `--max-cost-usd` plafonné. **Prérequis** : Claude Code ≥ 2.1.269, vérifié au
  lancement de la session, sinon la session s'arrête sur une contrainte d'outillage.

*Écarté* : agnix en gate ; Promptfoo (un adaptateur de sessions réelles serait à écrire, l'outil
natif le fait) ; le corpus de 32 cas du rapport — backlog des évals.

## Écarté — ne pas reproposer

- **R4, impact prévu contre réel** — « Écarts au plan » (v0.28.0), diff lu par `relecteur-session`,
  colonne « Zone modifiée » : déjà tenu ; un champ de plus n'apporte qu'une base Git explicite.
- **R8, delta ADDED / MODIFIED / REMOVED / PRESERVED** — « Conséquences » de la décision, objectif
  d'ensemble de l'index, « Hors périmètre » et « Anti-raccourci » du `S<k>.md` couvrent le besoin.
- **R9, reprise persistante** — P4/S3 a livré le canal `SendMessage`, le budget survit dans le
  rapport d'échec, le cas « effet produit non consigné » est corrigé en 0.34.0. Attend un incident.
- **R11, réconciliation d'une vague sur ses contrats** — aucun incident ; la version bon marché,
  si besoin, est un `verificateur-n0` sur l'arbre intégré à la clôture de vague.
- **RTK, Serena, Repomix, ccusage** — réponses à un poste de dépense non mesuré ; ccusage est un
  essai local du mainteneur, différé.
- **Pistes écartées par le rapport lui-même**, suivies : framework complet, agents par principe,
  skills forcées par mots-clés, index universel, mémoire parallèle de décisions, linter bloquant
  sur le style, veille runtime exhaustive.

## Sources consultées le 2026-09-15

Doc officielle : [Skills](https://code.claude.com/docs/en/skills) (`allowed-tools`,
`disallowed-tools`), [Subagents](https://code.claude.com/docs/en/subagents) (`effort`, `tools`,
`maxTurns`), [Plugin evals](https://code.claude.com/docs/en/plugin-evals) (format, graders,
version). Projets : Ideation (`references/confidence-rubric.md`, `skills/ideation/SKILL.md`,
`agents/plan-critic.md`), cc-thinking-skills (`thinking-model-router/SKILL.md` — les fiches
individuelles sont introuvables aux chemins publics), gstack (`plan-eng-review/SKILL.md`), AB
Method (README — `critique-plan` introuvable), HumanLayer (`research_codebase.md`,
`agents/codebase-analyzer.md`), Superpowers (`brainstorming/SKILL.md`), agnix (README), Trail of
Bits (`AGENTS.md`). Aucun n'a été installé ; aucune révision amont n'a été figée : on reprend des
idées, pas du code.

## Conséquences

- Plan `P5`, neuf sessions en cinq vagues ; plugin `0.37.0` à la clôture ; synchronisation des
  projets vendorés ensuite (`/maj-workflow`).
- Deux agents de plus (neuf) ; trois annexes de plus ; aucune nouvelle skill ; aucun nouveau
  domicile de statut ni de décision.
- Contexte par défaut d'une session : inchangé. Coût nouveau : une passe Opus par plan
  architectural, une passe Sonnet par flux demandé, une grille de cinq lignes par cadrage.
- **Risque assumé** : `effort:` en frontmatter d'agent n'a pas été sondé sur la version installée ;
  `/tasks` doit afficher l'effort du critique (doc ≥ 2.1.242). Sinon, le champ est retiré et la
  référence de compatibilité le note — le critique tourne alors à l'effort ambiant.
- Mesure de succès du pilote, à relire après cinq cadrages et trois plans : un plan sain reçoit un
  `PASS` sans décoration ; au moins un `DÉFAUT` réel trouvé avant approbation ; aucune question
  humaine nouvelle sur un plan borné ; fiches jamais ouvertes élaguées.

## Impact IA

Une session ordinaire ne charge rien de plus. `/cadrer` charge `preparation.md` (≈ 30 lignes) à
l'Étape 1 et une fiche de `protocoles.md` seulement si l'aiguillage ne rend pas `NONE`.
`/nouveau-plan` charge `rechercher-existant.md` seulement sur une inconnue technique. Le critique et
l'analyste tournent dans leur propre contexte et ne rendent que leur conclusion.
