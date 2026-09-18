# 2026-09-18 — L'effort d'une session vient de son agent, pas de la conversation

## Ce que ça change

Aujourd'hui, une vague de plan tourne **entièrement à l'effort de la conversation qui l'orchestre**.
La colonne « Effort » de `plans/P<n>/index.md` est lue (`prochaine-action.mjs:110`), affichée dans le
bandeau de vague, écrite dans chaque `S<k>.md` — et **jamais appliquée** : le bloc de lancement
(`orchestrer-plan/SKILL.md:96-113`) passe `model:`, jamais l'effort. À la place, le workflow demande à
l'humain de régler sa conversation avant la première vague (action `regler-effort`).

Recommandation : **créer cinq agents `session-<effort>` dans `plugin/agents/`**, chacun portant son
`effort:` en frontmatter, et faire lancer par l'orchestrateur `subagent_type: "session-<effort lu dans
l'index>"` au lieu de `"claude"`. L'effort d'une session devient alors un **mécanisme**, comme le
modèle l'est déjà, au lieu d'une consigne tenue par la vigilance de l'humain.

Conséquences observables, si c'est fait :

- Une vague peut mélanger les efforts : une session `low` et une session `high` lancées ensemble
  tournent chacune au sien. Aujourd'hui elles tournent toutes deux au même.
- Le geste humain « règle ton effort avant que je lance » disparaît — avec l'action `regler-effort`,
  son message et ses deux tests.
- Ce qui est écrit dans l'index devient vrai. C'est la seule façon de le vérifier qui ne repose pas
  sur la mémoire de quelqu'un.
- Ce qu'il faudra maintenir en plus : cinq fichiers d'agent quasi vides, et la règle qu'ils ne sont
  **pas** des agents de délégation (voir « Ce que ça oblige »).

Ce que ça ne change pas : la voie de lancement reste le sous-agent unique (§5b), les outils
disponibles pour une session restent identiques, et le modèle continue d'être posé par le paramètre
`model:` de l'appel `Agent`.

## Le problème, précisément

L'écart n'est pas une erreur de raisonnement, c'est un trou de plomberie. L'effort traverse tout le
workflow comme **donnée affichée**, et s'arrête juste avant le seul endroit qui compte :

| Étape | Ce qui se passe | Chemin |
| --- | --- | --- |
| Écriture du plan | `/nouveau-plan` remplit la colonne Effort par session | `squelette-index.md:18` |
| Dérivation d'état | le moteur lit l'effort et le ressort dans `lancer` | `prochaine-action.mjs:110`, `:331` |
| Annonce | l'orchestrateur l'affiche au bandeau : `T1-T3 · Sonnet/medium` | `orchestrer-plan/SKILL.md:76` |
| **Lancement** | **l'effort n'apparaît nulle part dans le bloc `Agent({…})`** | `orchestrer-plan/SKILL.md:96-113` |
| Exécution | la session hérite de l'effort ambiant de l'orchestrateur | `WORKFLOW.md:155` |

**Le mode de défaillance actuel est une surdépense, pas une perte de qualité.** §5b prescrit de régler
la conversation à l'effort *le plus haut* de la vague : chaque session tourne donc à un effort
supérieur ou égal à celui qu'elle demandait. Une session déclarée `low` dans une vague qui contient
un `high` tourne en `high`. Rien ne casse, tout coûte plus cher — et la ligne d'index ment.

Un second écart, indépendant de cette décision mais qui touche la même donnée : l'effort a **un seul
usage décisionnel** dans tout le workflow — `relecteur-session` n'écrit pas de `.revue.md` pour une
session `low` (C7, `relecteur-session.md:20-22`). Or il reçoit cet effort par le prompt de son parent,
et le bloc qui le lance (`orchestrer-plan/SKILL.md:132-139`) **ne le lui passe pas**. L'exemption `low`
repose donc aujourd'hui sur une transmission qui n'a pas lieu. C'est un défaut à corriger dans le même
mouvement, sans quoi rendre l'effort réel le rendra aussi réellement consultable par le relecteur —
qui, lui, ne le verra toujours pas.

## Les options

**A — Cinq agents `session-<effort>` (recommandée).** `session-low` … `session-max`, frontmatter
`effort:` seul, sans `model:` ni `tools:` — le modèle reste passé à l'appel, les outils restent ceux
de tout sous-agent. L'orchestrateur compose `subagent_type` depuis la colonne d'index.
*Devient possible* : une vague à efforts mélangés ; un `low` qui coûte ce qu'un `low` coûte.
*Devient impossible* : lancer une session dont l'index porte une valeur d'effort inconnue — à
condition d'ajouter la validation de la colonne, aujourd'hui absente (`prochaine-action.mjs` ne
valide rien). Sans elle, une faute de frappe rendrait un `subagent_type` inexistant et ferait échouer
le lancement au lieu de le dégrader en silence : échec bruyant, acceptable, mais à préférer explicite.
*Ce qu'il faut maintenir* : cinq fichiers, et la discipline de ne pas les faire entrer dans la table
de délégation.

**A′ — Trois agents seulement (`low`/`medium`/`high`).** Moins de fichiers. Mais l'échelle du workflow
en compte cinq (`WORKFLOW.md:41`) et l'index autorise déjà `xhigh` (`squelette-session.md:9`) : trois
agents laisseraient deux valeurs légales non lançables. Écartée — elle rouvre exactement le trou
qu'on vient boucher, deux crans plus haut.

**C — Homogénéiser l'effort par vague.** Ne rien ajouter ; contraindre `/nouveau-plan` à ce que toutes
les sessions d'une vague partagent un effort, et garder le geste humain, qui devient alors exact.
*Devient possible* : la même honnêteté, à coût nul en fichiers.
*Devient impossible* : grouper dans une vague des sessions de poids différents — or les vagues se
constituent par lectures partagées et zones disjointes, pas par effort. Le rédacteur de plan
arbitrerait entre casser une vague et gonfler l'effort d'une session, c'est-à-dire entre deux
manières de repayer le problème. Écartée pour ça, pas pour son coût.

**D — Passer l'effort dans le prompt** (« travaille à effort high »). Écartée en une ligne : l'effort
est un réglage du harnais, pas une instruction ; un modèle ne peut pas se l'appliquer à lui-même.

**B — Statu quo.** Retenue comme référence : ne coûte rien aujourd'hui, laisse la colonne mentir et
l'exemption `low` du relecteur sans support. C'est la seule option qui ne demande aucun travail, et la
seule qui garantit que le sujet reviendra.

## Pourquoi A, et pourquoi maintenant

Trois raisons, dans l'ordre de poids.

**Ce n'est pas un arbitrage qualité/coût, donc la garde qui bloque K5 ne s'applique pas.** K5 (« tout
lancer un cran en dessous », écartée le 2026-09-13) proposait de *décider moins d'effort* que ce que le
plan demandait : ça s'échange contre de la qualité, et ça exige une éval — bloquée depuis
(`2026-09-17-sandbox-windows-absent-claude-plugin-eval.md`). A ne décide rien à la place du rédacteur
de plan : elle **applique ce qu'il a déjà écrit**. Aucune session ne tournera plus bas que ce que son
`S<k>.md` demande. Ce qui disparaît est un excédent non voulu, pas une marge de sécurité. Rien à
mesurer avant de le faire.

**C'est la direction que 0.39 a prise partout ailleurs.** La version a sorti des modèles ce qui est
déterministe — N0 par `n0.mjs`, l'état d'orchestration par `prochaine-action.mjs`, « il exécute, ne
décide plus ». L'action `regler-effort` est exactement ce que cette version a passé son temps à
retirer : une règle tenue par un message à l'humain. Elle est d'ailleurs déjà datée dans son propre
texte — elle s'explique en invoquant une sonde non concluante, corrigée ce matin.

**Le risque principal a été levé en lecture, pas supposé.** L'inquiétude légitime était qu'un agent
nommé reçoive moins d'outils que le `claude` générique. La documentation tranche : les deux filtres
qui réduisent les outils d'un sous-agent s'appliquent « whether inherited or listed in the `tools`
field », donc indépendamment du fait que l'agent soit nommé ou générique
(<https://code.claude.com/docs/en/sub-agents>). Un `session-high` reçoit exactement ce que reçoit le
`claude` lancé aujourd'hui. Le changement est neutre sur la surface d'outils.

Aiguillage des protocoles de méthode (`/cadrer` Étape 2) : **`NONE`**. La cause est démontrée par
lecture, l'option satisfait les contraintes obligatoires, et revenir en arrière coûte un commit —
aucune fiche n'améliorerait l'arbitrage.

## Ce que ça oblige

- **Les `session-<effort>` ne sont pas des agents de délégation.** Ils ne rendent pas une conclusion à
  un parent : ils *sont* la session. Ils n'entrent donc ni dans la table §5 de `WORKFLOW.md`, ni dans
  son décompte — lequel devra cesser de dire « Huit agents » en toutes lettres (`WORKFLOW.md:124`,
  `:126-131`, `:134`), puisque `plugin/agents/` en contiendra treize. Distinguer les deux familles
  dans le texte fait partie du travail, pas après.
- **L'action `regler-effort` se retire**, avec sa branche (`prochaine-action.mjs:328`), son rendu
  (`:393-394`), sa ligne de table et son en-tête (`orchestrer-plan/SKILL.md:8-9`, `:37`) et ses deux
  cas de test (`tester-scripts.mjs:323-331`). Un retrait, pas une mise en commentaire.
- **La transmission de l'effort au `relecteur-session` se répare dans le même plan** — sinon
  l'exemption `low` (C7) reste sans support, et le seul usage décisionnel de l'effort reste cassé.
- **`WORKFLOW.md` §3 et §5b se réécrivent une seconde fois** : le chantier qu'ils annoncent comme
  ouvert sera clos. De même `nouveau-plan/SKILL.md:231-234`, qui explique aujourd'hui comment
  contourner l'héritage.
- **Neuf premières colonnes de l'index, ordre inchangé** (`squelette-index.md:23-27`) : elles sont lues
  par position. Rien dans cette décision ne les touche, et rien ne doit les toucher.
- **Publication** : ajout de fichiers sous `plugin/` ⇒ bump de version et `publier.mjs`.

## État final de la grille

| Dimension | État | Preuve | Si OPEN — résolution |
| --- | --- | --- | --- |
| problème concret | READY | l'effort est lu (`prochaine-action.mjs:110`) et jamais transmis (`orchestrer-plan/SKILL.md:96-113`) | — |
| résultat visé | READY | « chaque session tourne à l'effort de sa ligne d'index, sans geste humain » — demande explicite du mainteneur | — |
| vérification | **OPEN** | aucun test ne porte sur l'effort *effectif* ; `/tasks` l'affiche (≥ 2.1.242) mais aucune session interactive ne le lit pendant une vague ; l'éval qui mesurerait le gain est bloquée | **expérience** — sonde bornée en première tâche du plan : lancer un `session-low`, lire `/tasks`, comparer au modèle affiché. Geste humain hors dépôt (Desktop). |
| périmètre | READY | sept zones nommées ci-dessus, toutes avec chemin:ligne | — |
| cohérence | READY | tranché ici : les `session-<effort>` restent hors de la table de délégation §5 et hors du décompte | — |

**Validité** : plugin `workflow` 0.39.1 ; `prochaine-action.mjs` lisant l'index par position ;
documentation Claude Code des sous-agents au 2026-09-18 ; huit agents dans `plugin/agents/`.

**Ce qui reste hors de cette décision** — deux sujets ouverts, à ne pas absorber dans le plan qui
suivra :

1. **L'orchestrateur à effort réduit.** Une fois A faite, son effort ne se propage plus : la question
   devient posable, et seulement alors. Mais elle, c'est bien un arbitrage qualité/coût — elle reste
   gardée par l'éval bloquée, comme K5.
2. **`Agent` dans un sous-agent d'arrière-plan.** La documentation liste les outils intégrés que garde
   un sous-agent lancé en arrière-plan, et `Agent` n'y figure pas — alors que §5b décrit une session de
   plan qui délègue à `explorateur`, `resumeur-git` et `lecteur-doc`. Si c'est exact, une part du
   modèle de délégation du workflow ne fonctionne pas en vague. Constat de lecture non vérifié, sans
   rapport avec l'effort : à sonder pour lui-même.
