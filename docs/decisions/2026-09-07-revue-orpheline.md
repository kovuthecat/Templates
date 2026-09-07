# 2026-09-07 — La revue de session dépose son fichier elle-même, au premier plan

## Décision

La relecture de fin de session passe d'un **appel à `/code-review` en arrière-plan** à un **agent
`relecteur-session` lancé au premier plan, qui écrit lui-même `plans/P<n>/S<k>.revue.md`**. Trois
changements, un seul principe — *le livrable est le fichier, pas la notification* :

1. **Premier plan, jamais l'arrière-plan.** La règle du 2026-09-04 (les agents de délégation ne se
   lancent pas en arrière-plan) s'étend à la revue : elle devient le cinquième agent du plugin.
   Interdiction explicite de `/code-review` en `high`/`xhigh`/`max` à ce poste — à ces niveaux il
   part dans un agent d'arrière-plan.
2. **C'est le relecteur qui dépose.** La session ne fait plus « lancer, attendre, écrire » : elle
   lance et lit deux lignes. Le fichier existe avant que le tour se termine.
3. **Dépôt inconditionnel** (`Bloquant : 0` quand il n'y a rien à dire). Un `.revue.md` absent ne
   veut donc plus dire qu'une chose — la revue n'a pas tourné — ce qui rend le manque détectable :
   hook `Stop` (bloquant une fois) et `/orchestrer-plan` Étape 5 (`Revue S<k> : absente`).

Amende `2026-08-31-revue-plomberie.md` : le déclencheur (fin de session, si code produit), l'ordre
(clôture d'abord), les deux classes et le circuit de tri restent inchangés — seul le **porteur du
dépôt** change.

## Contexte

Sur un plan entier (P54), les revues **ont tourné à chaque session et produit du travail réel**, et
**aucune n'a déposé son `.revue.md`**. Une seule trouvaille a survécu, parce qu'un humain était
devant la conversation au moment du retour — un `.txt` enregistré en ANSI/UTF-16 par l'éditeur
Windows, qui provoquait une erreur 500 brute à l'import. Toutes les autres sont mortes avec leur
tour, donc ne sont jamais arrivées au tri de clôture.

Le mécanisme est exactement celui déjà écrit six semaines plus tôt pour les quatre agents de
délégation (`2026-09-04-delegation-au-premier-plan.md`) : *le harnais ne fait pas la différence
entre « cette session a fini » et « cette session attend une notification »*. La revue est le
**dernier** geste de la session ; une fois lancée en arrière-plan, il ne reste rien à faire, la
session rend la main, elle est close — et le retour arrive dans un tour que plus personne ne lit.
Pire dans la voie orchestrée : la session est elle-même un sous-agent ou un `claude -p`, qui
**disparaît** en rendant son résultat. Le dépôt y était structurellement impossible.

Cette décision-là avait explicitement écarté la revue de son périmètre (« aucun changement à
`/orchestrer-plan` ni `/fin-de-tache` »), parce que l'arrière-plan de `/code-review` avait été
choisi comme une **qualité** (2026-08-30 : « il ne prend pas la session »). Il l'était — tant que
la revue tournait AVANT les commits. Le réordonnancement du 2026-08-31 (clôture d'abord) a rendu
cette protection sans objet **et** l'a retournée en défaut, sans que personne ne rouvre la question.

Le manque était par construction invisible : un `.revue.md` absent se lisait aussi bien « rien
trouvé » que « jamais lancée » — la skill autorisait explicitement l'absence de fichier quand la
revue ne confirmait rien. Aucun des deux points de passage (hook `Stop`, orchestrateur) ne pouvait
donc s'en alarmer.

## Alternatives envisagées

- **Lancer la revue tôt (en arrière-plan) et la lire en dernier.** Garde l'effort `high` et donne
  à la session de quoi occuper son tour pendant que la revue tourne. Écarté : rétablit exactement
  le piège d'ordonnancement que le 2026-08-31 avait réparé (une session qui attend sa revue avant
  de committer), et reste suspendu à un timing — or c'est le timing qui échoue depuis le début.
- **Baisser `/code-review` à `medium`** (qui tourne dans le tour de l'appelant) sans rien d'autre.
  Corrige le canal de retour mais laisse la responsabilité coupée en deux : le relecteur trouve,
  l'appelant écrit. Toute interruption entre les deux reperd tout, et c'est le même mode d'échec
  qui reviendrait sous une autre forme.
- **Supprimer la revue.** Contredit par les faits : elle produit des trouvailles réelles à chaque
  session. Le défaut n'a jamais été la revue, seulement son canal de sortie.

## Raison du choix

Rendre le dépôt **atomique avec la revue** supprime la dépendance au timing au lieu de l'arranger.
Le relecteur écrit le fichier avant de répondre : que son parent lise ou non sa réponse ne change
plus rien. Et le dépôt inconditionnel transforme un silence ambigu en signal exploitable — c'est ce
qui permet enfin à un hook et à l'orchestrateur de dire « il manque une revue » au lieu de laisser
un plan entier se clore sans qu'aucune n'ait été déposée.

Le contrôle mécanique est délibérément partiel : le hook `Stop` couvre les sessions à la main et
`claude -p` (il compare `HEAD` au repère posé par `SessionStart`, et n'exige la revue que si des
commits portent un repère `Plan:` **et** du code) ; il ne se déclenche pas pour une session lancée
comme sous-agent, où c'est le relais d'Étape 5 de l'orchestrateur qui prend le relais. Fail-open
partout : repère absent ou `git` en échec → aucun signalement, jamais de faux positif.

## Conséquences

- Nouvel agent `plugin/agents/relecteur-session.md` (Sonnet — « juge le code », `WORKFLOW.md` §2) :
  porte le format du fichier, le seuil bloquant/backlog et l'interdit de modifier quoi que ce soit.
- `/fin-de-tache` : section « Relecture de session » réécrite autour de l'agent et du dépôt
  inconditionnel ; point 16 distingue « `Bloquant : 0` » de « revue absente ».
- `CLAUDE-BASE.md` et `WORKFLOW.md` §5 : quatre agents → cinq, règle du premier plan étendue avec
  sa raison propre (« après lui, aucun tour ne s'ouvrira »).
- `/orchestrer-plan` Étapes 5 et 6 : une revue absente se relaie comme un manque, non bloquant.
- `hooks/lib.mjs` : `repereSession()` (marqueur commun SessionStart/Stop) et `revuesManquantes()` ;
  `sessionstart-contexte.mjs` mémorise `HEAD` ; `stop-contexte.mjs` gagne sa troisième vérification.
