# 2026-09-23 — Le brief est tenu par les décisions, la roadmap par la clôture de plan

## Ce que ça change

`PROJECT_BRIEF.md` cesse d'être un document écrit une fois et relu périmé. Il est mis à jour au
moment précis où quelque chose le périme : une décision. Concrètement, à quoi on le verra :

- **Chaque décision écrite porte une ligne obligatoire** `Brief : inchangé | <section> : <ce qui
  change>`, dans son fichier `docs/decisions/`. `/cadrer` (Étape 5) applique cette ligne au brief
  **dans le commit même de la décision** — la section nommée est réécrite, pas annotée. Une décision
  sans effet sur le brief écrit `inchangé` quand même : c'est la preuve que la question a été posée.
- **`verificateur-plan` contrôle la propagation** à l'ouverture d'un plan : toute décision plus
  récente que la dernière modification du brief (dates git) doit porter `Brief : inchangé` ; sinon
  il rend un écart nommé, et `/nouveau-plan` ne s'écrit pas contre un brief qu'une décision a
  contredit. Contrôle mécanique, sans jugement.
- **La clôture de plan coche la roadmap.** Le point « ranger le contexte » de la fin de plan
  passe à `[x]` les items MVP / v1 du brief que le plan a livrés. Rien d'autre du brief n'y est
  touché : la roadmap est un fait, le reste demande un jugement que la clôture n'a pas.
- **Le brief se lit « à confirmer », jamais « vrai ».** L'interview de `/revue-d-usage` (décision du
  même jour) le présente ainsi ; un écart constaté entre le brief et l'application devient une
  ligne du rapport orientée vers `/revue-de-conception`, la skill ne recadre pas elle-même.

Ce que ça ne change pas : `/revue-de-conception` reste la voie de rattrapage quand la dérive est
déjà installée (projet ancien, décisions prises hors workflow). Le mécanisme ci-dessus empêche la
dérive de se reformer, il ne la résorbe pas.

Le revers : une ligne de plus à chaque décision, et un contrôle de plus avant chaque plan. C'est le
prix pour que la mise à jour se fasse là où l'information naît, par celui qui a le contexte —
sinon elle ne se fait pas.

Ce qu'il faudra maintenir : le gabarit `plugin/templates/DECISIONS.md` (ligne `Brief :`),
`/cadrer` Étape 5 (application dans le commit), `plugin/agents/verificateur-plan.md` (un contrôle
de dates), `fin-de-tache/references/fin-de-plan.md` point 3 (roadmap), et l'interview de
`/revue-d-usage`.

## Contexte

Constat de l'utilisateur, 2026-09-23 : le brief « n'est quasiment jamais mis à jour au fil des
décisions et est souvent périmé ». Lecture du plugin : le brief est écrit par `/nouveau-projet` et
`/migrer-projet`, relu par `/cadrer`, `/nouveau-plan` et `/revue-de-conception`, réécrit par la
seule `/revue-de-conception` (sections Objectif et Hors périmètre). `/fin-de-tache` point 10 dit
« les autres fichiers seulement si leur contenu change », déclencheur que rien n'actionne ; la
fin de plan range `STATUS.md`, `TASKS.md`, `VALIDATION.md`, pas le brief. Les décisions
s'accumulent dans `docs/decisions/` sans conséquence écrite sur lui.

## Alternatives envisagées

- **B — relecture du brief à chaque clôture de plan, seule** : une ligne à écrire, mais le lecteur
  de clôture n'a pas le contexte du cadrage ; une case « brief relu » se coche sans lecture. Retenue
  pour sa seule part mécanique (roadmap), écartée pour le reste.
- **C — `/revue-de-conception` à jalon fixe, seule** : Opus et une interview à chaque fois, et le
  brief reste périmé entre deux revues. Gardée comme rattrapage, pas comme mécanisme courant.
- **Scinder le brief en durable / mobile** : deux fichiers de plus à tenir ; écartée, le marquage
  par section dans la ligne `Brief :` suffit.

## Raison du choix

Le brief dérive parce que l'événement qui le périme, la décision, n'avait aucune conséquence
écrite sur lui. Lier la mise à jour à cet événement, chez celui qui vient de trancher, est le
seul moment où l'information est fraîche et le contexte présent (principe du domicile unique,
décision du 2026-09-14). Le contrôle par `verificateur-plan` transforme la règle en gate
observable : ce n'est plus une consigne tenue par la vigilance de quelqu'un.

## Conséquences

- `plugin/templates/DECISIONS.md` : ligne `Brief :` obligatoire dans le gabarit de détail.
- `plugin/skills/cadrer/SKILL.md` Étape 5 : appliquer la ligne au brief dans le commit de la
  décision ; staging explicite de `PROJECT_BRIEF.md` avec `docs/decisions/` et le registre.
- `plugin/agents/verificateur-plan.md` : contrôle « décisions postérieures au brief sans
  `Brief : inchangé` » (comparaison de dates `git log -1 --format=%cI -- <fichier>`).
- `plugin/skills/fin-de-tache/references/fin-de-plan.md` point 3 : roadmap du brief cochée.
- `plugin/skills/revue-d-usage/` (à créer) : brief « à confirmer » dans l'interview, écart → rapport.
- Les décisions antérieures à ce jour ne portent pas la ligne : le contrôle ne regarde que les
  décisions postérieures à la dernière modification du brief, il ne réclame pas de rattrapage.

## Grille finale

| Dimension | État | Preuve |
| --- | --- | --- |
| problème concret | READY | constat de l'utilisateur ; aucune étape du plugin ne réécrit le brief hors `/revue-de-conception` (grep du 2026-09-23) |
| résultat visé | READY | A + roadmap en clôture, validé par l'utilisateur le 2026-09-23 |
| vérification | READY | contrôle mécanique de `verificateur-plan`, testable par un cas à deux dates dans `tests/` |
| périmètre | READY | cinq fichiers listés en Conséquences |
| cohérence | READY | aucune règle existante contredite ; `/revue-de-conception` inchangée |

## Impact IA

Une ligne de plus dans chaque décision lue en cadrage ; le contrôle de `verificateur-plan` est
un `git log` par fichier, sans lecture de contenu.

Brief : inchangé (dépôt source, pas de `PROJECT_BRIEF.md` de projet ici).
