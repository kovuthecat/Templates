# 2026-09-14 — Preuve avant plan : une quatrième issue de `/cadrer`

## Ce que ça change

Un problème dont la réponse n'existe qu'à l'exécution ne reçoit plus de plan. `/cadrer` gagne une
quatrième issue : au lieu d'une décision, il rend un **protocole de preuve** — la question, la
mesure, la branche, et ce qui compterait comme réponse. Une session ouverte l'exécute sur une
branche jetable et revient avec un **résultat mesuré**. Ce résultat devient l'entrée de la vraie
décision, puis du plan.

Trois conséquences concrètes :

- **Le périmètre fermé reste la règle partout ailleurs.** Rien ne change pour les 85 plans existants.
  Cette issue est une sortie, pas un assouplissement.
- **Pendant une preuve, tout est contestable — y compris le juge.** Un écart trouvé dans
  l'instrument de mesure est un **résultat**, pas un `FAIL`.
- **Une preuve peut dégeler un « tranché ».** C'est la seule chose du workflow qui en a le droit.

Le code produit pendant une preuve est un **candidat**, pas un livrable : la décision qui suit dit
s'il fusionne, après une passe `relecteur-session` sur la branche. Ni jeté d'office, ni fusionné
d'office.

## Pourquoi

MYO, zone « maintien des pièces » : cinq plans (P30→P34), 156 commits en 5 jours dont 101 d'écrit,
pour **0 geste réalisable sur 79 pièces**. Chaque plan est mort à son premier contact avec
l'exécution, jamais sur un bug d'implémentation. Le même jour, la même question confiée à une
session sans plan, sur une branche d'expérimentation : bug du juge trouvé et corrigé, décision du
matin réfutée par prototype, mécanisme de re-pavage amenant les 4 modèles à zéro défaut en moins
d'une seconde — 109/109 tests, lint 0, en une matinée.

Trois mécaniques expliquent l'écart, et aucune n'est un défaut d'exécution :

1. **Le problème n'était pas spécifiable.** Une recherche sous contrainte globale : le bon geste ne
   se connaît qu'en exécutant. Le cadrage se fait en lecture, l'exécution en périmètre fermé —
   donc toute découverte devient un `FAIL` `prémisse`, donc un plan de plus.
2. **Le juge était dans la zone gelée.** Il comptait les piles flottantes par le bas : tous les
   chiffres de P32 à P34 étaient sous-comptés. Cinq plans ont optimisé contre un instrument cassé,
   et le périmètre fermé interdisait précisément d'aller le vérifier. La cible a changé sept fois
   (80 → 54 → 10 → 6 → 5 → 20 → 79) y compris après le gel de l'oracle, parce que le juge comptait
   en bbox et la réparation en cellules.
3. **Le cliquet.** Chaque plan gelait en « tranché » ce qui avait tué le précédent — grille,
   `bestSplit`, fusion, placeur, oracle, création et retrait de matière. Après P34, la zone
   écrivable ne contenait plus le geste qu'un humain fait : l'espace des solutions avait été vidé
   par accumulation.

Le défaut n'est donc pas « le périmètre était trop fermé ». C'est qu'**aucune sortie n'existait, et
que le workflow n'avait aucun moyen de reconnaître qu'il en fallait une**.

## Ce qui déclenche l'issue

Deux signaux, l'un ou l'autre suffit :

- **Répétition** — un deuxième plan sur la même zone dont la cause d'échec est `prémisse`. Détectable
  mécaniquement : les `.echec.md` portent la ligne `Nature :`.
- **Non-spécifiabilité, au cadrage** — le critère de succès ne s'énonce pas comme un nombre que le
  code d'aujourd'hui produit déjà de façon stable. Si la cible bouge quand on change la définition,
  il n'y a pas de plan à écrire : il y a une mesure à établir d'abord.

`prémisse` est le mode d'échec dominant du workflow — 10 des 12 rapports d'échec classés, sur deux
projets (MYO 6, Chords 4). Une prémisse fausse **une fois** est le système qui fonctionne : on l'a
su au premier contact avec l'exécution plutôt qu'après trois jours de code. C'est la **répétition
sur une même zone** qui est le signal, pas l'échec lui-même.

## Ce qui borne une preuve

Le périmètre fermé ne contient plus rien ; trois choses le remplacent :

- **Une branche jetable**, jamais `main`. C'est le confinement réel.
- **Un budget annoncé d'avance** (tours ou temps), écrit dans le protocole.
- **N0 s'applique quand même**, mais à la fin et sur le résultat — pas par tâche sur une spec figée.
  Une preuve qui ne passe pas N0 n'est pas une preuve.

Le protocole de preuve écrit par `/cadrer` porte au minimum : la question, la mesure qui y répond,
ce qui compterait comme réponse positive **et** négative, la branche, le budget. Une preuve dont le
résultat négatif n'était pas écrit d'avance ne conclut rien — elle se relit comme un échec.

## Ce qui revient

Le livrable est le **résultat mesuré**, pas le commit. Il revient sous trois formes, dans cet ordre :

1. **La mesure** — le chiffre, et la commande qui le reproduit.
2. **Ce qui a été réfuté** — décisions, hypothèses, ou l'instrument de mesure lui-même. C'est la
   partie qui a le plus de valeur, et celle qu'un plan fermé ne peut pas produire.
3. **Le code candidat**, sur sa branche. La décision qui suit tranche : fusion après passe
   `relecteur-session`, ou réécriture sous plan. Le fait qu'il soit vert ne suffit pas à le faire
   entrer — il a été écrit sans périmètre et sans revue par tâche.

## Ce que ça ne fait pas

- **Pas un quatrième type de session, pas de skill `/spike`.** Ce qui a marché n'avait besoin
  d'aucune machinerie : une conversation au premier plan, un humain dans la boucle, une branche.
  Une skill dédiée ajouterait une surface et une porte de sortie commode — « c'est dur, on spike ».
- **Pas orchestrable en vague.** Une preuve se mène au premier plan, avec un humain qui la lit.
  `/orchestrer-plan` n'en connaît pas l'existence.
- **Pas une latitude générale.** Un exécutant de plan ne « passe pas en mode preuve » de lui-même :
  l'issue se décide au cadrage, jamais en session.

## Écarté

- **Geler le juge pendant la preuve** — proposé par l'incident d'origine, et réfuté par sa propre
  contre-épreuve : la session qui a réussi tournait sans juge gelé, et son premier résultat a été
  de trouver le bug du juge. Geler la cible est juste ; geler le thermomètre est ce qui a produit
  cinq plans de sous-comptage.
- **Assouplir `prémisse` → STOP** pour laisser une session ajuster son plan. Coûterait partout pour
  réparer une zone, et rouvre la dérive silencieuse. La version contrôlée de cette porte existe
  déjà : la ligne « Écarts au plan » sous `Latitude` déclarée.
- **Ne rien ajouter** (état actuel). La sortie manuelle existait et a fini par être prise — après
  cinq plans. Le défaut n'était pas l'absence de sortie, c'était l'absence de signal.

## Source

`MYO/docs/workflow/incidents/2026-09-14-cinq-plans-sur-un-probleme-de-recherche.md`, groupe G7 de
`docs/incidents/2026-09-14-synthese.md`.

## Mise en œuvre

`plugin/skills/cadrer/SKILL.md` (Étape 5, quatrième ligne du tableau + section « protocole de
preuve »), `plugin/skills/nouveau-plan/SKILL.md` (Étape 0 : détecteur de répétition `prémisse`),
`plugin/WORKFLOW.md` (§9a : un écart trouvé dans le juge est un résultat ; le juge n'est jamais
dans la zone gelée).
