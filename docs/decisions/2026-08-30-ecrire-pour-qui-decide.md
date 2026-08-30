# 2026-08-30 — Écrire pour qui décide : le plan explique, l'orchestrateur détaille

## Décision

Le workflow gagne un **registre d'écriture opposable**, dans `CLAUDE-BASE.md` (§ Écrire pour qui
décide) : tout ce qu'un humain lit — proposition, option, annonce de vague, rapport, décision — dit
d'abord **ce que ça change et à quoi il le verra**, ensuite comment ; un terme technique inévitable
est explicité une fois ; une recommandation énonce son revers. Trois skills l'appliquent là où un
humain lit vraiment :

- **`/nouveau-plan`** — l'`index.md` porte désormais, dans son Ordonnancement, un ***Pourquoi
  maintenant*** par vague et une ligne **« en clair »** par session (ce que la session change, à quoi
  on le constatera, sans jargon). Chaque tâche d'un `S<k>.md` gagne une section **`### Pourquoi`**
  distincte de l'objectif. Une étape dont l'intention n'est pas évidente porte sa raison en fin de
  ligne ; une étape qui réclame trois lignes de justification est une décision qui manque.
- **`/orchestrer-plan`** — l'annonce de vague (Étape 3) passe d'une ligne par session à une
  **strophe** : pourquoi cette vague maintenant, ce qui se passe en cas d'échec (reprise auto ou
  arrêt), ce qui se passe en fin de vague (gate ou enchaînement), puis par session son « en clair »
  relayé mot pour mot, ses tâches, modèle/effort, voie, fichiers touchés et dépendances — et enfin
  quoi ne pas toucher pendant l'exécution, et quoi retrouver commité après.
- **`/cadrer`** — une option se présente par ses conséquences observables avant tout détail
  technique ; la décision écrite s'ouvre par ce qu'elle change, en clair, avant toute justification.

## Contexte

Le workflow a été optimisé de bout en bout pour le **coût de contexte** : interdits de lecture,
verdicts d'une ligne, index réduit à une table. Ces choix restent justes, mais ils ont produit un
déroulé qu'un utilisateur non développeur ne peut pas suivre — il voit passer des chips et des
commits sans savoir ce qui change, ni pourquoi maintenant, ni ce qui l'attend si ça rate. Le manque
avait déjà été traité une fois (0.17.0, bloc d'annonce de vague), mais au format minimal : titre,
tâches, modèle, zone. C'est de la donnée de table, pas une explication.

## Alternatives envisagées

- **Laisser `/orchestrer-plan` ouvrir le `S<k>.md` pour en tirer un résumé.** Écarté sans hésiter :
  c'est l'interdit fondateur de la skill, ce qui l'empêche d'exploser son contexte à chaque vague —
  et l'orchestrateur tourne sur Haiku, donc il résumerait mal ce qu'Opus a rédigé.
- **Faire reformuler l'index par l'orchestrateur** (générer l'« en clair » depuis le titre). Écarté :
  même objection de modèle, et une reformulation par le relais est une réinterprétation. D'où la
  règle **relayer, jamais reformuler**, et le refus explicite d'inventer la ligne quand elle manque.
- **Un fichier de vulgarisation séparé par plan.** Écarté : un troisième document à tenir à jour, qui
  diverge du plan à la première modification — le défaut que le workflow combat partout ailleurs.
- **Ne toucher que `/orchestrer-plan`.** Impossible : il ne peut annoncer que ce que l'index contient.
  C'est ce qui rend les deux modifications indissociables.

## Raison du choix

L'explication est **produite une fois par Opus, au moment du découpage**, là où le jugement et le
contexte sont disponibles, puis relayée à coût nul par un orchestrateur qui a déjà l'index en
mémoire. Le registre vit dans `CLAUDE-BASE.md` — source unique chargée à chaque session — pour ne
pas être reformulé dans chaque skill, et parce qu'il gouverne aussi les échanges ordinaires, pas
seulement les plans.

## Conséquences

- Les plans **antérieurs** (P1-P3) n'ont pas de ligne « en clair ». `/orchestrer-plan` doit alors
  annoncer sans elle et le signaler une fois par vague — jamais ouvrir le `S<k>.md` ni l'inventer.
  Un index incomplet se corrige dans l'index.
- L'`index.md` grossit de deux à trois lignes par session ; il reste interdit d'y mettre du détail
  d'exécution. Les lignes « en clair » décrivent un **résultat**, jamais un moyen.
- `CLAUDE-BASE.md` est chargé à chaque session de chaque projet : le registre y est délibérément
  compact (deux paragraphes), avec une clause explicite qu'il porte sur la **manière de rédiger**,
  pas sur le volume — sans quoi il financerait exactement la verbosité que le reste du workflow
  combat.
- Une vague de remédiation (mode extension) porte ces lignes comme les autres : c'est le cas où
  elles comptent le plus, puisque l'utilisateur n'avait pas prévu de lire cette vague-là.
