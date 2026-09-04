# 2026-09-04 — Les quatre agents de délégation tournent au premier plan

## Décision

`explorateur`, `verificateur-n0`, `resumeur-git` et `lecteur-doc` se lancent **au premier plan**,
jamais avec `run_in_background: true` sur l'outil `Agent`. Réparé aux deux domiciles qui les
décrivent (`CLAUDE-BASE.md` §Avant de coder, détaillé ; `WORKFLOW.md` §5, résumé) et signalé au
site où l'échec s'est produit trois fois (`/reprendre-echec` Étape 4, le N0 qui décide du commit).

## Contexte

Troisième échec d'affilée du même type, constaté sur des reprises automatiques (`/orchestrer-plan`
Étape 5c) : la session lance `verificateur-n0` pour le N0 qui gate son commit, puis rend la main en
attendant le retour — comportement par défaut de l'outil `Agent`, qui tourne en arrière-plan sauf
mention contraire. Rien dans les skills ni dans `CLAUDE-BASE.md` ne disait le contraire pour ces
quatre agents.

Le harnais ne fait pas la différence entre « cette session a fini » et « cette session attend une
notification » : dès qu'elle rend la main sans enfant actif au premier plan, elle est considérée
terminée. Une notification qui arrive ensuite ne rouvre personne qui la lise — la session est déjà
close, sans avoir commité. Ce n'est pas un défaut du travail produit : le diagnostic ou la
correction sont corrects, seul le retour se perd.

C'est distinct de la voie sous-agent de **session entière** (`WORKFLOW.md` §5b) : là,
`run_in_background: true` est correct, parce que c'est la conversation d'orchestration —
l'utilisateur, ou une session qui ne fait que ça — qui reste ouverte pour attendre la notification.
La confusion venait d'appliquer ce même réflexe (« un agent, ça se lance en arrière-plan ») à une
délégation de sous-étape, à l'intérieur d'une tâche qui doit continuer dans le même tour.

## Alternatives envisagées

- **Documenter uniquement dans `/reprendre-echec`** (le site observé) : aurait laissé le même
  risque sur toute autre skill qui délègue N0 avant de committer — `/fin-de-tache` point 1, toute
  session de plan. Le premier plan est une propriété des quatre agents, pas du contexte
  `reprendre-echec` en particulier.
- **Interdire `run_in_background` sur ces quatre agents au niveau outil** : pas de mécanisme pour
  ça ici — la garantie ne peut être que documentaire, comme le reste des invariants du workflow.

## Raison du choix

Domicilier la règle où elle est lue au bon moment : `CLAUDE-BASE.md` est chargé à chaque session
(hook `SessionStart`), donc toute session qui délègue à l'un des quatre agents l'a déjà en
contexte, y compris hors cadrage. `WORKFLOW.md` §5 reste le résumé qui introduit les quatre agents.
Le rappel dans `/reprendre-echec` cible le point précis où le N0 décide d'un commit — la reprise
étant elle-même une correction d'échec, elle ne doit pas en produire un nouveau par le même
mécanisme.

## Conséquences

- `CLAUDE-BASE.md` : la liste des quatre agents gagne la règle premier-plan, avec sa justification.
- `WORKFLOW.md` §5 : une ligne de rappel, sans reformuler.
- `/reprendre-echec` Étape 4 : le point N0 cite la règle et son enjeu local (deuxième échec
  silencieux).
- Aucun changement à `/orchestrer-plan` ni `/fin-de-tache` : leur délégation de **session entière**
  en arrière-plan (§5b) reste correcte telle quelle — c'est la distinction que cette décision
  rend explicite, pas une remise en cause.
