# 2026-09-14 — Un domicile par invariant, et des conditions nommées à la place des interdits

## Ce que ça change

Le workflow contraignait en **interdisant une catégorie**. Il contraint désormais en **nommant la
condition** sous laquelle la chose est sûre — et chaque condition a un seul domicile, vérifié par
une machine à la publication.

Trois règles changent, et c'est la même règle à trois endroits de la chaîne.

- **Un invariant se range par destinataire, pas par sujet.** Ce qu'une session lancée doit
  respecter vit dans `EXECUTANT.md` ; ce que l'orchestrateur fait, dans `WORKFLOW.md`. Un gabarit
  de lancement n'en recopie plus rien : il porte **une ligne de renvoi fixe**, au mot près, et
  `publier.mjs` refuse de publier si elle manque. L'interdit d'arrière-plan existait en huit
  formulations distinctes de deux polarités contraires ; il devient une question : *quelqu'un
  attend-il ce verdict dans le tour courant ?*
- **La nature de l'échec décide aussi du canal de reprise.** Une session *bloquée* — reprenable,
  N0 vert, aucune fausse piste — se reprend par `SendMessage`, une ligne. Une session *trompée*
  repart à froid, comme aujourd'hui. `S<k>.echec.md` gagne une ligne mécanique `Blocage :` ;
  absente, c'est le démarrage à froid.
- **Un exécutant ne s'arrête plus « en cas de doute ».** Il s'arrête quand le geste suivant est un
  choix qu'il n'a pas reçu, et pas parce que quelque chose a cassé. Le workflow cesse d'écrire
  `STOP` pour trois choses différentes : une **gate** refuse, une **question** se pose à un humain,
  une **contrainte d'outillage** n'est ni l'un ni l'autre.

**À quoi on le verra** : les trois blocs `prompt:` de `remediation.md` deviennent un échec de
publication tant qu'ils ne portent pas le renvoi ; un `FAIL` de session dont le travail était vert
ne coûte plus un démarrage à froid ; et douze `STOP` qui n'appelaient aucun humain cessent de
s'appeler `STOP`.

**Ce qui ne change pas** : l'autonomie ne s'étend **que là où une gate existe**. Pas de gate ⇒ on
demande — une tâche dont le plan justifie un `—` (aucun test) garde le défaut ancien. Rien ne bouge
sur l'irréversible ni sur le jugement produit (N2).

## Pourquoi

Revue de conception du 2026-09-14 (`docs/revues/2026-09-14-workflow.md`), écarts 1, 3 et 4 — le
constat y est mesuré, il n'est pas refait ici. Étalon recalé :
`docs/decisions/2026-09-14-deux-regimes-et-frontiere-humaine.md`.

Les trois écarts sont **une seule dette**. Chaque interdit a été généralisé depuis un unique cas où
il était vrai : « jamais d'arrière-plan » l'est d'un agent dont le verdict conditionne la suite ;
« demander avant d'agir » l'est de l'irréversible ; « jamais de `SendMessage` » l'est d'un agent à
bout de tours qui a accumulé de fausses pistes. Les traiter séparément produirait trois correctifs
locaux pour une règle unique — le défaut qu'ils décrivent. Le churn le mesure : **4 des 6 `fix:` de
`WORKFLOW.md` portent sur un seul sujet**, étalés sur six semaines.

## La question tranchée

Comment le workflow énonce-t-il un invariant transverse pour qu'une modification ne puisse pas n'en
toucher qu'un seul exemplaire ?

Trois points, et rien de plus : **(a)** où vit un invariant et comment un gabarit y renvoie sans
qu'on puisse l'oublier ; **(b)** le discriminant du canal de reprise ; **(c)** l'application du
critère « demander quand il y a un choix, agir quand il y a une gate » aux points d'arrêt existants.

---

## (a) Où vit un invariant transverse, et comment un gabarit y renvoie

### Ce que ça change

Trois règles, dans cet ordre. Les deux premières disent où écrire, la troisième est celle qui fait
tenir les deux autres.

**1. Le domicile d'un invariant est choisi par son destinataire, jamais par son sujet.**

- Ce qu'une **session lancée** doit respecter → `EXECUTANT.md`.
- Ce que l'**orchestrateur** fait → `WORKFLOW.md`.
- Ce qui n'est vrai que d'une skill → sa `SKILL.md`, et elle seule.

La question à se poser en écrivant n'est pas « de quoi ça parle ? » mais « **qui doit l'avoir en
tête au moment d'agir ?** ». C'est la bascule : l'interdit d'arrière-plan s'est éparpillé en huit
formulations précisément parce qu'il *parle* de délégation, donc il a été réécrit partout où une
délégation est mentionnée. Rangé par destinataire, il n'a qu'un domicile — `EXECUTANT.md`, qui
existe déjà pour ça et le porte déjà.

**2. Un appelant renvoie par une ligne fixe, jamais par une paraphrase.**

Tout bloc de lancement (`Agent({ … })`) porte, dans son `prompt:`, cette ligne **au mot près** :

```
Lis EXECUTANT.md en entier avant ton premier geste : il porte les invariants de lancement.
```

Une paraphrase est une copie qui dérivera : c'est ce qui a produit les huit variantes. Reformuler
le renvoi est donc interdit, et c'est un interdit tenable parce qu'il porte sur une chaîne exacte,
vérifiable par une machine — pas sur une intention.

**3. Le renvoi est vérifié à la publication, sinon il ne vaut rien.**

C'est le point qui manquait à A4, dont le risque était nommé (« une annexe mal désignée n'est
jamais lue ») sans être levé. Un contrôle nouveau, appelé par `plugin/bin/publier.mjs` au même
titre que `tests/tester-hooks.mjs` — **la gate existe déjà, on y branche un cas de plus** :

- tout bloc `Agent({` de `plugin/**` contient la ligne de renvoi, au mot près ;
- tout `references/<x>.md` cité par une `SKILL.md` existe ;
- tout `references/*.md` présent a au moins un appelant.

Rouge ⇒ pas de publication. C'est ça, « sans qu'on puisse l'oublier » : non pas une discipline de
rédaction, mais un refus mécanique. Les trois blocs `prompt:` de `remediation.md`, qui ne portent
aujourd'hui aucune trace de l'invariant, deviennent un échec de publication tant qu'ils ne sont pas
corrigés.

### La condition qui remplace l'interdit

L'invariant d'arrière-plan a **deux polarités opposées** aujourd'hui : interdit pour une délégation
interne, **obligatoire** pour le lancement d'une session par l'orchestrateur. Deux règles contraires
sous un même mot, c'est ce qui rend chaque réécriture locale plausible — et fausse.

Une seule condition les couvre :

> **Au premier plan si quelqu'un attend ce verdict dans le tour courant. En arrière-plan si ce qui
> attend est une notification, pas une réponse.**

Une délégation interne (`verificateur-n0`, `explorateur`, …) conditionne la suite de la même tâche :
premier plan. Une session entière lancée par l'orchestrateur est attendue par une boucle de
notification : arrière-plan. La règle cesse d'être deux interdits de catégorie et devient une
question à laquelle on répond sur place.

### Ce qui borne

- **Le renvoi ne remplace pas le contenu adressé à l'humain.** `WORKFLOW.md` garde ses règles
  d'orchestrateur ; on ne déplace pas tout dans `EXECUTANT.md` sous prétexte d'unifier.
- **Le contrôle porte sur la présence du renvoi, pas sur son sens.** Il ne saura jamais dire qu'un
  invariant est faux — seulement qu'il n'est pas atteignable. C'est exactement la garantie
  recherchée, et il ne faut pas lui en prêter une autre.
- **Un seul contrôle nouveau**, branché sur une gate existante. Phase de stabilisation (étalon
  recalé, point 9) : pas d'outillage neuf, un cas de test de plus.

### Écarté

- **Inliner le bloc d'invariants dans chaque gabarit à la publication** (génération). Ça supprime
  la dérive mais introduit une étape de build sur des fichiers édités à la main, dans un plugin qui
  est vendoré et recopié tel quel. Le coût de maintenance dépasse le gain.
- **Un renvoi en prose comme aujourd'hui** (« ouvrir `references/x.md`, à côté de cette skill »).
  C'est le mécanisme A4, et son risque est déjà constaté : trois appelants, aucun contrôle, et un
  trou complet dans `remediation.md`. Le garder reviendrait à re-décider ce qui a déjà échoué.
- **Traiter l'écart 6 ici** (le plafond de `S<k>.echec.md` hors de `plafonds.json`, le plafond 150
  recopié dans `WORKFLOW.md:457`). C'est la même maladie et la règle ci-dessus s'y applique telle
  quelle, mais c'est classe C : ça part au backlog, pas dans ce chantier.


---

## (b) Le canal de reprise suit la nature de l'échec

### Ce que ça change

Aujourd'hui la nature de l'échec décide du **modèle** de la reprise, jamais du **canal** : les cinq
lignes de la table de remédiation lancent toutes le même `Agent(run_in_background: true)` qui
déroule `/reprendre-echec` à froid. Désormais elle décide aussi du canal, et une session *bloquée*
se reprend par `SendMessage` — une ligne, contexte intact — au lieu d'un démarrage à froid complet.

`S<k>.echec.md` gagne **une troisième ligne mécanique**, à côté de `Nature :` et `Tentatives :` :

```
Blocage : <le geste précis qui manque, en une ligne>
```

**Absente ⇒ démarrage à froid**, comme aujourd'hui. C'est le défaut sûr, et il reprend la
convention déjà en place (`Nature :` absente ⇒ `exécution`).

### Le discriminant, écrit serré

Le discriminant n'est **pas** « l'agent se déclare bloqué ». Une session remplit ses champs sur ce
qu'elle *croit* — c'est exactement pour ça que `prémisse` est déjà le seul champ qu'un tiers
vérifie (`/reprendre-echec`, règle « vérifier ce qui se déclare soi-même », 2026-09-13). Un
`Blocage :` auto-déclaré rapatrierait un contexte pollué, et c'est le risque que la revue nomme.

L'orchestrateur reprend par `SendMessage` **si et seulement si les trois conditions tiennent**,
toutes observables de l'extérieur :

1. **L'agent est reprenable** — il apparaît dans `ListAgents`. Un agent absent n'a pas de contexte
   à réutiliser : le reprendre *est* un démarrage à froid, sans le bénéfice.
2. **N0 est vert sur son périmètre** — constaté par un `verificateur-n0` que **l'orchestrateur**
   lance, jamais par la déclaration de la session. C'est la gate, et c'est elle qui autorise le
   canal court (étalon recalé, point 4).
3. **Aucune fausse piste accumulée** — `Tentatives : reprise=0`, et `Blocage :` nomme un **geste**
   (un commit à prendre, un statut à poser, un fichier à écrire), pas une hypothèse à tester.

Une seule condition qui manque → démarrage à froid. Il n'y a pas de cas limite à juger : les trois
se lisent sans ouvrir le contexte de l'agent.

### Ce qui borne

- **`SendMessage` consomme une `reprise` du budget** comme n'importe quelle reprise. Deux reprises
  par session, une enquête : inchangé. Un `SendMessage` qui échoue ne se retente pas — la reprise
  suivante est un démarrage à froid, et plus jamais un `SendMessage` sur cette session.
- **L'interdit reste entier là où il était vrai.** Un agent à bout de tours, une hypothèse fausse,
  un retour `partial` : démarrage à froid, motif inchangé — continuer l'agent rapatrierait ses
  fausses pistes. Ce qui change n'est pas la règle, c'est qu'elle cesse de s'appliquer au cas où
  elle est fausse.
- **L'interdit `SendMessage` de `/fin-de-tache` n'est pas touché.** Il porte sur autre chose :
  prévenir l'orchestrateur, où le problème est l'auto-identification d'une session et le caractère
  éphémère d'un message. La pastille `spawn_task` y reste la réponse. Deux interdits homonymes,
  deux conditions distinctes — les confondre serait refaire la faute qu'on corrige.

### Ce qu'on paie sans ça

Un démarrage à froid complet pour P34/S6 : tâche finie, vérifiée verte, un commit manquant.

### Écarté

- **Dériver le canal de `Nature :`** (`environnement` → bloqué, `prémisse` → trompé). Séduisant et
  faux : c'est re-généraliser depuis les cas où ça marche. `exécution` est indécidable par cette
  voie, et c'est la valeur par défaut quand la ligne manque.
- **Laisser la session choisir son canal.** Elle n'a pas l'information : savoir si son contexte est
  sain est précisément ce qu'un agent trompé ne sait pas.


---

## (c) « Demander quand il y a un choix, agir quand il y a une gate » appliqué aux points d'arrêt

Le workflow compte **60 points d'arrêt**. Relus au critère : 34 sont justes tels quels (arbitrage
produit, irréversible, changement de périmètre), 12 sont déjà des gates qui n'appellent aucun
humain, 13 sont à reprendre. Le critère ne produit donc pas une réécriture générale — il produit
trois gestes précis.

### 1. Un mot par chose : `gate`, `question`, `contrainte d'outillage`

Le workflow écrit **`STOP`** pour trois choses différentes : un hook qui refuse, une question posée
à un humain, et un blocage d'outillage. C'est la même faute que l'arrière-plan — un mot unique sur
des règles de polarités différentes — et elle enseigne que s'arrêter est le défaut.

- **Gate** — une condition qu'une machine juge (hook, N0, contrôle de publication). Elle **refuse**,
  elle ne demande pas ; ce qui la franchit se rapporte après. Les 12 points classés « oui » sont des
  gates mal nommées : les renommer ne change aucun comportement, et retire douze occurrences de
  `STOP` qui entretiennent le réflexe.
- **Question** — un choix soumis à un humain : options chiffrées, conséquences observables.
- **Contrainte d'outillage** — l'humain n'est sollicité que parce que rien ne peut poser le geste à
  sa place (régler modèle et effort, lancer une session hors Desktop : points #15, #29, #32). Ce
  n'est **pas** un point d'arrêt de conception. Le nommer ainsi empêche deux erreurs symétriques :
  le « corriger » en élargissant l'autonomie, et le confondre avec un contrôle qu'on perdrait en le
  levant. Il disparaît de lui-même si le harnais gagne la capacité.

### 2. Le seul changement de fond : le STOP générique de l'exécutant

`EXECUTANT.md:10` et le squelette de session (`:15`, `:69`) imposent un STOP sur « doute ou
blocage » — une catégorie, sans distinguer la nature. Or `WORKFLOW.md` §9a sait déjà trancher :
un `environnement` à portée se corrige et la session continue. C'est la duplication la plus coûteuse
de l'inventaire, et c'est un exécutant qui la paie à chaque session.

La catégorie est remplacée par la condition :

> **Tu t'arrêtes quand le geste suivant est un choix que tu n'as pas reçu. Tu ne t'arrêtes pas
> parce que quelque chose a cassé.**

Appliquée aux trois natures déjà écrites :

| Nature | Ce que fait l'exécutant |
| --- | --- |
| `environnement`, à ta portée | tu corriges, tu continues, tu le rapportes après |
| `exécution` (N0 rouge) | tu réessaies dans ton budget — **N0 est le juge, pas l'humain** |
| `prémisse` fausse | **tu t'arrêtes** : le périmètre change, et ça, c'est un choix |

C'est le même discriminant qu'en (b), à un autre endroit de la chaîne : *le geste suivant est-il un
choix, ou seulement un geste ?*

### 3. Les gates de cadrage amont citent le critère

`/cadrer`, `/nouveau-projet`, `/migrer-projet`, `/revue-de-conception` portent cinq « attendre le
oui » (#48, #52, #57 notamment). Ils sont **justes** — ce sont des jugements produit ou des
suppressions irréversibles — mais aucun ne renvoie au critère, donc rien ne garantit qu'ils y
restent. Chacun gagne le renvoi, par le mécanisme de (a).

### Ce qui borne — et c'est le point de sécurité

**L'autonomie s'étend là où une gate existe, et nulle part ailleurs.** Concrètement : **pas de
gate ⇒ on demande**. Une tâche dont le plan justifie un `—` (aucun test) n'a pas de N0 qui juge le
fond ; le défaut ancien y tient, et le critère ne s'y applique pas. C'est exactement le risque que
la revue nomme — élargir l'autonomie là où aucune gate ne juge réellement — et la seule protection
est de le dire dans la même phrase que la règle.

### Où vit le critère — et pourquoi ce n'est pas une duplication

Le critère a **un domicile** : `WORKFLOW.md` §9c, qui le porte déjà sous sa forme d'orchestration
(« un plan ne s'arrête que sur un choix »). Il y est généralisé au-delà de l'orchestration.

`EXECUTANT.md` reçoit la **table des trois natures** ci-dessus. Ce n'est pas une copie du critère :
c'est son application à des cas nommés, et l'application est un contenu différent de la règle.
La distinction est la règle d'usage de (a) : **appliquer n'est pas paraphraser.** Recopier
« demander quand il y a un choix » dans `EXECUTANT.md` serait la faute ; y écrire ce qu'un exécutant
fait de chacune des trois natures est ce qu'on lui doit.

### Ce que le contrôle de publication ne couvre pas

Le contrôle de (a) vérifie la présence d'un renvoi dans les blocs de lancement. Il **ne sait pas**
vérifier qu'un point d'arrêt rédigé en prose est du bon côté du critère. Cette partie-là reste une
relecture humaine, faite une fois ici. Le dire évite de croire le chantier auto-entretenu.

### Écarté

- **Réécrire les 60 points d'arrêt.** 34 sont justes ; les toucher coûterait sans rien gagner, et
  la phase est la stabilisation (étalon recalé, point 9).
- **Supprimer les points de relance manuelle** en laissant l'agent régler modèle et effort. Le
  harnais ne le permet pas ; les nommer `contrainte d'outillage` est tout ce qu'on peut faire
  aujourd'hui.
- **Appliquer le critère aux tris différés** (#24, #28, #33 — bloquant de revue, fichier géré
  modifié). Le *verdict* y est mécanique, mais l'arbitrage reste un choix. Ils restent des questions.

---

## Mise en œuvre

Rien n'est implémenté par cette décision : elle sort en **chantier**, à découper par
`/nouveau-plan` dans une conversation neuve qui repart de ce fichier.

À régler AVANT de lancer le plan :

- Le contrôle de publication est un **cas de test nouveau** appelé par `plugin/bin/publier.mjs`,
  pas un hook. Confirmer qu'il tourne bien avant publication et pas en session — un faux rouge en
  session bloquerait du travail sans rapport.
- La ligne de renvoi est une **chaîne exacte**. Elle doit être arrêtée au mot près avant d'écrire
  le contrôle, sinon le contrôle et les gabarits divergent dès le premier commit.

Périmètre attendu : `plugin/EXECUTANT.md`, `plugin/WORKFLOW.md` (§9a, §9c, et le domicile de
l'invariant de lancement), `plugin/skills/orchestrer-plan/SKILL.md` + `references/remediation.md`
(3 blocs `prompt:`), `plugin/skills/nouveau-plan/references/squelette-session.md`,
`plugin/skills/reprendre-echec/SKILL.md` (ligne `Blocage :`), `plugin/bin/publier.mjs` + `tests/`.

Reste au backlog, hors de ce chantier :

- **Écart 6** (classe C) — le plafond de `S<k>.echec.md` hors de `plafonds.json`, le plafond `150`
  recopié dans `WORKFLOW.md:457`, le repère `Plan: P<n>/S<k>/T<m>` absent de `CONVENTIONS.md`. La
  règle de domicile de (a) s'y applique telle quelle ; c'en est le premier client naturel.
- **Écart 2** (prémisse comportementale) — session dédiée, déjà annoncée par la revue.
- Le hook `SessionStart` annonce un retard de `STATUS.md` dans un dépôt qui n'a pas de `STATUS.md`.
  Faux positif à verser à `docs/workflow/incidents/`.
