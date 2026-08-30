# 2026-08-30 — Où se déclenche une relecture qualité indépendante

## Décision

**Option B.** `/code-review` en effort `high` (agent d'arrière-plan) à la **fin de chaque session**,
sur le diff de la session, et seulement si elle a produit du code. Ce qui est confirmé et non corrigé
sur place va dans `TASKS.md`, **jamais** dans `VALIDATION.md`. **Pas de niveau N3** : la revue est une
étape nommée de `/fin-de-tache`, non bloquante, sans rang dans la grille N0/N1/N2.

Validé par Thibault le 2026-08-30.

## Question

Entre **N0** (build/typecheck/tests — mécanique, bloquant) et **N2** (jugement esthétique/UX —
humain), rien ne relit le code produit pour la correction et la simplicité. Où brancher une
relecture indépendante, maintenant qu'elle ne coûte plus qu'un appel ?

**Critère de fin** : un déclencheur nommé, une destination écrite pour ses résultats, et la réponse
à « est-ce que ça crée un quatrième niveau de validation ? ».

## Fait qui change l'arbitrage

Depuis 2.1.232, `/code-review` en effort `high` / `xhigh` / `max` tourne **dans un agent
d'arrière-plan et ne prend pas la session**. La brique existe donc déjà : il n'y a **aucun agent à
écrire**, seulement un déclencheur à choisir. (Le service hébergé est Team/Enterprise ; la revue
locale, non.)

Ça vaut aussi comme version outillée de la pratique citée par la lettre du 29/08 — faire attaquer un
changement par un sous-agent qui n'a pas vu la conversation, donc n'en partage pas les angles morts.

## Options

- **A. À chaque fin de tâche** (`/fin-de-tache`, après N0). Coût : une passe sur des tâches parfois
  triviales — un renommage, un déplacement de fichier. Le vrai coût n'est pas les tokens, c'est
  qu'une gate qui se déclenche sans discernement finit désactivée au bout de trois vagues.
- **B. À chaque fin de session, sur le diff de la session (recommandé).** Déclenché seulement si la
  session a produit du code — une session dont la « Zone modifiée » est `aucune` (mesure, audit) n'a
  pas de diff à relire. Le diff d'une session est encore assez petit pour qu'une revue soit précise,
  et assez gros pour qu'elle ait quelque chose à dire.
- **C. Une fois par plan, avant le push.** Coût : le diff cumulé de 5 à 9 sessions ; la revue perd en
  précision, et les corrections arrivent après que tout a été construit dessus.

**Recommandation : B.** Critère : c'est la plus grosse unité de travail dont on tient encore le
détail — et c'est déjà l'unité de commit, donc le diff se délimite sans effort (`git log --grep
"P<n>/S<k>/"`).

## Deux points à trancher avec l'option

1. **Destination des résultats.** Ce qui est confirmé et non corrigé sur place devient une ligne
   dans `TASKS.md`. **Jamais dans `VALIDATION.md`** — ce fichier ne porte que le N2 humain, règle
   déjà écrite. Sans destination nommée, la revue produit un texte que personne ne relit.
2. **Est-ce un nouveau niveau ?** La revue est automatique et non bloquante : elle ressemble à un
   N1 sans être visuelle. **Recommandation : ne pas créer de niveau N3.** La grille N0/N1/N2 est
   citée dans une dizaine de fichiers ; l'élargir se paie partout. La revue reste une **étape
   nommée de `/fin-de-tache`**, non bloquante, sans rang dans la grille.

## Conséquences si adopté

- `/fin-de-tache` gagne une étape conditionnelle (« la session a produit du code ») et la règle de
  destination.
- Une revue qui découvre un défaut **hors périmètre** de la session ne le corrige pas : `TASKS.md`,
  comme toute correction qui déborde.
- Un défaut qui invalide une hypothèse du plan retombe sur `/nouveau-plan` Étape 0 (extension),
  décidé le même jour.
