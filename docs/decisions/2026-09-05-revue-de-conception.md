# 2026-09-05 — Une revue a posteriori qui recale l'objectif avant de juger le code

## Décision

Nouvelle skill **`/revue-de-conception`** (plugin `workflow` 0.24.0), en trois temps : **constater**
(l'intention écrite, puis l'état réel du code) · **recaler l'objectif avec l'utilisateur, en
interview** · **en déduire les écarts**. Elle ne modifie pas de code et ne découpe pas de plan.

**L'interview est la colonne vertébrale, pas un repli.** Après des mois d'empilement, ce n'est pas
toujours le code qui a dérivé de l'objectif : c'est souvent l'objectif qui a bougé sans que l'écrit
suive. Les deux produisent le même symptôme et appellent des réponses opposées — aligner le code,
ou mettre l'écrit à jour — et la différence **ne se déduit pas du dépôt**. Une revue qui la devine
mesure tout contre un étalon périmé et propose de « réparer » ce qui était devenu le vrai but.

Six contraintes la tiennent :

1. **L'étalon d'Étape 1 est provisoire ; c'est l'interview qui l'arrête**, par une gate explicite
   (dix lignes restituées, validation attendue, pas d'accord implicite).
2. **L'intention s'écrit avant que le code soit lu.** Le code lu en premier devient sa propre
   référence : il ne reste plus rien à mesurer.
3. **L'interview n'est pas un questionnaire** : une question à la fois ; aucune question dont la
   réponse est dans les fichiers ; chaque question s'ouvre par le constat qui l'a produite et
   propose 2-3 issues avec une recommandation ; sept questions au maximum.
4. **Pas de coût observable, pas d'écart.** Un constat sans prix payé aujourd'hui est une
   préférence, pas une dette.
5. **Sept écarts maximum**, classés A/B/C/D et **pondérés par la phase du projet** (ajout,
   stabilisation, fin de vie) — la même dette se corrige en phase d'ajout et se garde en fin de vie.
   Une seule prochaine action en sortie.
6. **Sans humain disponible, pas de classement** : lancée en sous-agent, en `claude -p` ou en tâche
   planifiée, la revue s'arrête au constat et le dit.

Sortie : `docs/revues/<date>-<perimetre>.md`, sans plafond. Les idées écartées y sont écrites aussi
— c'est ce qui empêche la revue suivante de les réévaluer au prix fort.

**Une seule écriture hors rapport, après la gate** : si l'interview a déplacé l'objectif, les
sections *Objectif* et *Hors périmètre* de `PROJECT_BRIEF.md` sont mises à jour dans la foulée, plus
une décision écrite si le déplacement contraint le code. C'est le point de la skill : un étalon
périmé est la cause racine de la dérive ; le laisser périmé garantit que la revue suivante retrouvera
exactement la même chose.

## Contexte

Les projets ont atteint la taille où les correctifs, améliorations et ajouts s'empilent. Le workflow
couvrait le *défaut ponctuel* (`/code-review` sur le diff d'une session) et la *question déjà posée*
(`/cadrer`), mais rien ne couvrait l'**accumulation** — ni le fait qu'un `PROJECT_BRIEF.md` écrit au
jour 1 cesse d'être vrai sans que personne ne le remarque.

## Alternatives envisagées

- **Une revue purement automatique**, l'objectif lu dans les fichiers et jamais rediscuté (première
  version de cette skill) — écartée : elle classe « dérive » ce qui est en réalité un objectif qui a
  bougé, et recommande de défaire du travail voulu. C'est l'erreur exacte que l'interview supprime.
- **Étendre `/cadrer` d'une entrée « audit »** — écartée : `/cadrer` part d'une question déjà posée
  et son Étape 1 l'exige. Fusionner allonge la skill la plus chère du workflow et supprime le
  garde-fou qui compte ici (« ne pas trancher »).
- **Une routine périodique** (revue tous les N commits) — écartée : sans symptôme observé, une revue
  trouve tout donc rien ; et l'interview suppose quelqu'un en face, ce qu'un cron n'a jamais.
- **Étendre `/code-review` au projet entier** — écartée : `/code-review` mesure un diff contre la
  correction, la revue mesure une accumulation contre une intention. Ni le même étalon, ni la même
  sortie.

## Raison du choix

Une skill de plus coûte sa description à chaque session de chaque projet (`/choisir-mecanisme`).
C'est accepté : la procédure fait plusieurs étapes, se répète sur tous les projets, porte son propre
schéma de délégation (quatre agents) et son propre format de sortie. L'interview, elle, reprend le
patron éprouvé de `/nouveau-projet` — une question à la fois, reformulation en une ligne, gate de
restitution avant d'écrire quoi que ce soit.

## Conséquences

- Nouveau dossier `docs/revues/` dans les projets, non plafonné.
- La revue **ne peut pas** corriger de code : son frontmatter retire `Bash`, comme `/cadrer`. Ce
  n'est plus une consigne mais une impossibilité.
- `PROJECT_BRIEF.md` cesse d'être un document figé au jour 1 : c'est la revue qui le rattrape, et
  seulement après validation explicite de l'utilisateur.
- Le rapport devient une entrée à froid de `/cadrer` ou `/nouveau-plan` — jamais enchaînés dans la
  même conversation.
