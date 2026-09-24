# 2026-09-24 — Une idée neuve entre par `/cadrer`, dépliée avant d'être tranchée

## Ce que ça change

Arriver avec une idée pour son projet (« et si l'app faisait X ? ») a désormais une porte, et une
seule : `/cadrer`. Jusqu'ici, la skill exigeait d'écrire d'emblée la question à trancher, ce
qu'une idée brute n'a pas encore. Et rien dans le workflow n'orientait une idée neuve :
`WORKFLOW.md` §4 envoyait une « question non identifiée » vers `/revue-de-conception`, qui revoit
un existant qui a dérivé.

À quoi on le verra :

- **L'idée est dépliée avant d'être jugée.** Une annexe, `cadrer/references/deplier-une-idee.md`,
  ne s'ouvre que quand l'entrée est une idée. Elle lit d'abord le brief et le registre, puis mène
  une interview de cinq questions au plus, une à la fois : le déclencheur, pour qui, le critère de
  réussite, la place dans le projet, ce qui la rendrait inutile. Elle rend la question et le
  critère de fin de l'Étape 1, et les variantes à examiner.
- **« Ne pas le faire » et la version minimale font toujours partie des options** d'une idée
  (Étape 3).
- **Une idée bonne mais pas pour maintenant a sa place**, avec la nouvelle issue « Idée
  reportée » : une ligne dans « Version 2 / idées futures » de `PROJECT_BRIEF.md`, avec le signal
  qui la rouvrira. Une idée écartée reste une ligne du registre, pour qu'on ne la rejuge pas.
  L'Étape 0 relit les deux avant d'ouvrir la session.
- **`/cadrer` bascule sur Opus** (`model: opus`), mais seulement pour le tour qui l'invoque : la
  doc indique que la session reprend son modèle au message suivant. La skill le dit, et garde la
  règle d'ouvrir la session sur Opus pour les tours d'interview et d'arbitrage.
- **Les aiguillages le disent** : description de `/cadrer`, `WORKFLOW.md` §4, table de
  `/revue-de-conception`, `README.md`.

Ce qui ne change pas :

- aucune nouvelle skill ;
- `/cadrer` écrit toujours sa question avant de délibérer, sous Plan Mode ;
- une question déjà posée entre directement à l'Étape 1, sans interview ;
- `/revue-de-conception` reste la porte d'un existant qui a dérivé.

Le revers :

- une annexe de plus à maintenir et une issue de plus dans la table de l'Étape 5 ;
- une description de skill un peu plus longue, payée à chaque session ;
- une bascule de modèle qui repaie un préfixe de cache complet quand `/cadrer` est invoqué en
  cours de conversation sur un autre modèle (§3b).

## Contexte

Question de l'utilisateur, 2026-09-24 : `/cadrer` permet-il d'explorer une nouvelle idée à intégrer
dans un projet, ou faut-il l'améliorer, voire créer une skill d'exploration guidée dédiée ? Lecture
du plugin 0.43.0 :

- **Étape 1** : « Deux lignes, en clair, avant toute autre chose » (question et critère de fin).
  Rien n'aide à les obtenir d'une idée brute. `/nouveau-projet` (Phase A) et `/revue-de-conception`
  (Étape 3) ont une interview encadrée, `/cadrer` n'en a pas.
- **Étape 3** : « Assez d'options pour trancher, pas un panorama ». C'est juste pour une question,
  mais les options d'une idée sont ses variantes, et rien ne demandait de les poser.
- **Brief** : le gabarit porte « Hors périmètre v1 », « Critères avant ajout de feature » et
  « Version 2 / idées futures ». `/cadrer` ne les citait pas.
- **Étape 5** : l'issue « Rien à faire » menait au registre, « le sujet attend » compris. Une idée
  reportée y aurait gonflé un fichier plafonné à 150 lignes et réservé au transverse.
- **Aiguillage** : ni `WORKFLOW.md` §4 ni la table de `/revue-de-conception` n'avaient d'entrée
  pour une idée neuve.
- **Modèle** : `/cadrer` se disait « avec Opus » sans `model:` en frontmatter, contrairement à
  `/nouveau-plan` et `/revue-de-conception`.

## Alternatives envisagées

- **Skill dédiée (`/explorer`, « réflexion guidée »)** — écartée.
  - Tout serait identique à `/cadrer` : même modèle (§2 : scope flou, arbitrage produit → Opus),
    mêmes outils, même Plan Mode, mêmes issues. On aurait deux points d'entrée à la frontière
    floue, donc un risque d'aiguillage que les évals auraient à tenir.
  - Une skill paie sa description à chaque session ; une annexe ne coûte rien tant qu'elle n'est
    pas ouverte (décision du 2026-09-15 : annexes à la demande, aucune nouvelle skill).
  - Le principe de `/cadrer` s'appliquerait à elle : « une réflexion sans question écrite ne se
    termine pas ». Bornée pour aboutir à une question, elle devient l'Étape 1 de `/cadrer`.
- **Exploration libre à la manière de Superpowers `brainstorming`** — écartée. Lue le 2026-09-15,
  seule sa profondeur adaptée au changement avait été retenue. Un panorama d'idées sans question n'a
  pas de critère de fin.
- **Laisser `/cadrer` tel quel et documenter l'usage** — écartée : le manque est dans la procédure
  (pas d'interview, pas de variantes, pas d'issue « reportée »), pas dans la découvrabilité.
- **Interview dans le corps de `SKILL.md`** — écartée : une quarantaine de lignes seraient chargées
  à chaque cadrage d'une question déjà posée, qui n'en a pas besoin.

## Raison du choix

Le manque se situe en amont de l'Étape 1, pas à côté de `/cadrer`. Une idée doit être dépliée
jusqu'à sa question ; ensuite, tout le reste de la skill s'applique tel quel : grille, délégation,
options, issues, et protocole de preuve pour ce qui ne se juge qu'en essayant. Une annexe chargée
à la demande ajoute exactement ce qui manque, au moment où ça manque, sans rien coûter aux cadrages
de questions déjà posées. L'interview reprend des règles déjà éprouvées (`/revue-de-conception`
Étape 3) au lieu d'en inventer.

`model: opus` a été ajouté à la demande de l'utilisateur. Sa limite (un tour) est écrite dans la
skill, pour ne pas annoncer une garantie que le runtime ne tient pas. C'est l'erreur corrigée le
2026-09-15 pour `allowed-tools`.

## Conséquences

- `plugin/skills/cadrer/SKILL.md` :
  - description élargie ;
  - `model: opus` et sa note ;
  - Étape 0 : idée écartée ou reportée ;
  - Étape 1 : renvoi à l'annexe ;
  - Étape 3 : deux options toujours présentes ;
  - Étape 5 : issue « Idée reportée », staging du brief.
- `plugin/skills/cadrer/references/deplier-une-idee.md` : nouvelle annexe. Elle ne cite aucune
  autre annexe (assertion 6 de `tests/tester-renvois.mjs`).
- `plugin/WORKFLOW.md` §4, `plugin/skills/revue-de-conception/SKILL.md` (table d'aiguillage),
  `README.md` (table des skills).
- Évals `plugin/evals/idee-neuve-cadrer/` et `plugin/evals/feature-decidee-pas-cadrer/` : 3/3
  chacune, et `coquille-sans-skill` rejouée 3/3 (`docs/analyses/2026-09-24-eval-cadrer-idee.md`).
- Plugin `0.44.0`. Les projets vendorés se resynchronisent (`/maj-workflow`) à leur prochaine
  frontière de plan.
- Registre à 150 lignes après cette entrée, pile au plafond : la prochaine décision passera par
  `/purge-contexte`.

## Signal de réouverture

Une skill dédiée redevient une option si les cadrages d'idées réels montrent l'un de ces signes :

- ils aboutissent surtout à un inventaire d'idées pour la roadmap plutôt qu'à l'évaluation d'une
  idée : c'est un autre livrable, avec un autre domicile ;
- l'interview dépasse régulièrement ses cinq questions ;
- ils demandent des outils que le Plan Mode interdit (maquette Claude Design, prototype hors
  protocole de preuve).

## Grille finale

| Dimension | État | Preuve |
| --- | --- | --- |
| problème concret | READY | lecture de `/cadrer` 0.43.0 (Étapes 1, 3, 5) et de `WORKFLOW.md` §4, section Contexte |
| résultat visé | READY | « améliorer `/cadrer` » et `model: opus`, demande explicite de l'utilisateur le 2026-09-24 |
| vérification | READY | `tester-renvois.mjs` (annexe appelée, sans chaîne, frontmatter parsé) ; évals positive, négative et `coquille-sans-skill` 3/3 |
| périmètre | READY | fichiers listés en Conséquences |
| cohérence | READY | aucune décision contredite ; « aucune nouvelle skill » (2026-09-15) tenu |

`OPEN` restantes : aucune.

## Impact IA

Un cadrage de question déjà posée ne charge qu'une ligne de renvoi de plus. Un cadrage d'idée
charge une annexe d'environ 55 lignes.

Brief : inchangé (dépôt source, pas de `PROJECT_BRIEF.md` de projet ici).
