# 2026-09-22 — Un geste par instruction : les flous du workflow

## Ce que ça change

Des exécutants qui suivent le workflow **à la lettre** font aujourd'hui des gestes différents au
même endroit : ce n'est pas un manque de compétence, c'est le texte qui autorise deux lectures. La
mesure de cette session (ci-dessous) l'a montré sur l'orchestrateur, et un balayage de tout le
plugin en a relevé dix-neuf (quelques doublons, un écarté), dont trois cassent à coup sûr :

- **Chaque lancement de session ou de reprise échoue au premier essai.** La skill dit
  `model: <modèle lu dans l'index>` ; l'index écrit `Sonnet`, l'outil `Agent` n'accepte que
  `sonnet|opus|haiku` (sondé : `InputValidationError`). Trois endroits.
- **Un agent retiré en 0.39 est toujours prescrit.** `verificateur-n0` est cité six fois — dans le
  prompt de chaque session lancée, dans la condition du canal court (qui ne peut donc jamais être
  remplie), dans l'étape « sonder » de `/nouveau-plan`, dans le gabarit `CLAUDE.md`.
- **Une migration correcte échoue sa propre vérification** : `/migrer-projet` attend `hooks: 4`,
  le gabarit en câble cinq.

Recommandation : **un chantier de corrections, en une version**, guidé par une règle — *ce qui est
mécanique va au script, ce qui reste au texte n'a qu'une lecture*. Concrètement :

- `prochaine-action.mjs` rend l'appel prêt à recopier (`subagent_type` **et** `model` en
  minuscules), et fait lui-même le contrôle d'arbre sale avant une vague. L'orchestrateur n'a plus
  à transformer une valeur ni à choisir entre déléguer et faire.
- Les règles qui se contredisent sont fusionnées en une ; les renvois morts sont retirés ; chaque
  condition reçoit son « sinon ».

Conséquences observables, si c'est fait :

- Un lancement de vague réussit du premier coup, et deux orchestrateurs sur le même état écrivent
  le même appel — vérifiable en rejouant les trois cas de mesure (§ Ce que ça oblige).
- Le canal court de remédiation redevient atteignable (il est mort aujourd'hui sans que personne
  l'ait remarqué).
- Ce qu'il faudra maintenir : le script grossit de deux responsabilités (appel prêt à l'emploi,
  arbre sale), avec leurs tests ; la table modèle → effort de `remediation.md` quitte le texte pour
  le script.

Ce que ça ne change pas : le modèle de l'orchestrateur (Sonnet, confirmé par la mesure), son effort
(voir « Hors de cette décision »), la voie de lancement (sous-agent unique, §5b).

## D'où ça vient — la mesure

Comparaison manuelle par `claude -p` (T19 de P6 restait bloquée faute de bac à sable) :

- **Haiku vs Sonnet en orchestrateur**, cas `orchestrateur-suit-le-script`, 2 essais × 3 efforts :
  Sonnet 6/6, Haiku 4/6 — et les deux échecs Haiku ont **attribué au script** une action qu'il
  n'avait pas rendue. Dans un contexte dégradé, Haiku 1/6 contre Sonnet 6/6. La règle « Sonnet,
  jamais Haiku » tient.
- **Sonnet low / medium / high**, trois gestes plus exigeants (lancer une vague à efforts mêlés,
  reprise à froid, question sur budget épuisé), 3 essais chacun : aucune différence imputable à
  l'effort ; `low` coûte ~30 % de moins et va deux fois plus vite. **La variance suivait le texte,
  pas l'effort** : c'est l'origine de cette décision.
- Piège de méthode, à ne pas refaire : un `claude -p` lancé depuis une session Desktop hérite de ses
  variables `CLAUDE_CODE_*` et compacte vers 20 k tokens. Nettoyer l'environnement,
  `--strict-mcp-config`, et `--tools` (pas seulement `--allowedTools`) pour restreindre vraiment.

## Les arbitrages

**D1 — Arbre sale avant une vague : au script.** Aujourd'hui « préflight : `resumeur-git` » ; la
moitié des exécutants lancent `git status` eux-mêmes, sans lien avec l'effort. `prochaine-action.mjs`
croise `git status --porcelain` avec les « Zone modifiée » de la vague et rend `question` (source
`arbre-sale`) au lieu de `lancer`. *Revers* : un rapprochement chemin ↔ zone à écrire et tester
(zones en chemins ou dossiers). Écarté : préciser le texte — c'est exactement l'état que C2 retire au
modèle.

**D2 — Appel d'agent prêt à recopier : au script.** Les actions `lancer`, `reprendre`, `enqueter`
portent `subagent_type` et `model` (minuscules) par session. Règle le flou de casse aux trois
endroits et supprime la table modèle → effort que le modèle applique à la main. *Revers* : forme de
sortie du script modifiée, tests et skill à suivre ensemble. Écarté : « en minuscules » dans le
texte — une transformation de plus laissée au modèle, alors que le script connaît déjà la valeur.

**D3 — Options d'une question : écrites au bon format à la source, relayées telles quelles.** Le
format imposé (`<option> — <coût> · débloque <…>`) contredit « mot pour mot » ; 8 réponses sur 9 ont
retouché la forme, une a ajouté une contre-vérité. Le gabarit d'enquête (`reprendre-echec`) écrit
désormais chaque ligne de `## Issues` au format de la question ; l'orchestrateur la recopie sans
rien reformuler. *Revers* : les `.echec.md` anciens gardent leur forme — relayés tels quels quand
même. Écarté : « fidèle sur le fond, libre sur la forme » — invérifiable.

**D4 — Vague parallèle en décalé : « message suivant ».** Le gain est mesuré (§3b : part partagée
~5,0× → 1,55×), mais « une fois qu'il produit » n'est pas observable par l'orchestrateur. Règle :
la première session seule dans un message, les autres dans le message suivant, sans attendre sa
notification. *Revers* : le hit de cache n'est plus garanti, seulement probable. Écarté : lancer
tout d'un coup (perd le gain mesuré) ; attendre une notification (bloque l'orchestrateur).

**D5 — Condition (2) du canal court : `n0.mjs` au premier plan, code de sortie seul.** Remplace
« `verificateur-n0` lancé par l'orchestrateur ». Lire un code de sortie n'est pas lire une sortie
de build : l'interdit tient. *Revers* : l'orchestrateur attend un build. Écarté : supprimer la
condition (canal court trop large).

**D6 — `Auto : oui` sur une prémisse non vérifiée : le script garde la priorité, le texte cesse
de nier le cas.** `remedier()` fait passer `Auto : oui · option <m>` avant la nature (C5, voulu) ;
`reprendre-echec` affirme que la ligne « n'arrive jamais ». Il le dira : prémisse non vérifiée,
option appliquée, jamais présumée réfutée. Et `Auto : oui` n'est permis qu'avec une `## Issues`
numérotée (sinon `Auto : non`) — la reprise ne pointe plus vers une section absente.

## Corrections sans choix

Un seul geste possible une fois le flou nommé — le plan les exécute sans rouvrir :

1. `verificateur-n0` : retiré des six endroits ; `/nouveau-plan` « sonder » → script jetable par
   `n0.mjs` ; le prompt de session garde « aucun appel Agent en arrière-plan » sans le nom mort.
2. `hooks: 4` → `5` (`migrer-projet` ×3, `nouveau-projet`, commentaire de `publier.mjs`).
3. `critique-plan` (et tout `subagent_type` d'agent du plugin appelé sans repli) : repli à trois
   crans comme `orchestrer-plan` — nom nu → `workflow:<nom>` → `general-purpose` tenant le rôle.
4. `EXECUTANT.md` : `analyste-flux` ajouté aux agents qu'une session peut lancer (lecture seule,
   comme `WORKFLOW.md:126` le range déjà).
5. `/nouveau-plan` Étape 3 → 4 : un retour sur l'index remplit « Message de commit » des vagues
   parallèles après écriture des sessions (le `verificateur-plan` contrôle déjà son absence).
6. `/fin-de-tache` : un seul bloc « Bilan de session », réécrit à chaque tâche, et sa place dans
   `squelette-session.md`.
7. `/fin-de-tache` : « un défaut N1 se corrige maintenant » vaut avec navigateur in-app ; sans
   (mode checklist de `/verif-visuelle`), N1 se consigne `à faire — <écran>`.
8. `/reprendre` : diff non commité → `/fin-de-tache` de la session interrompue, pas la fin de plan.
9. `/nouveau-projet` avec manifeste existant → dérouler `/maj-workflow`, comme `/maj-workflow`
   l'annonce déjà.
10. `/nouveau-plan` Étape 0 dans le dépôt source (pas de manifeste, `plugin/` présent) →
    `claude plugin update workflow@templates` au lieu de `/maj-workflow`.
11. `/nouveau-projet` : Q2 → « Usage prévu » du brief ; Q7 et Q9 → `ARCHITECTURE.md` (Phase D).

## Écarté

- **Ordre « retirer le verrou, puis committer » en fin de vague** (signalé par le balayage) : imposé
  par le hook, qui refuse tout commit sous `.claude/wave.lock` (`WORKFLOW.md:180`). La fenêtre
  d'interruption entre les deux gestes est de quelques secondes ; rien à changer.

## Ce que ça oblige

- **Validation du chantier** : rejouer les trois cas de mesure (lancer, reprise, question) en
  Sonnet `low`, 3 essais, par la méthode ci-dessus. Attendu : 9/9 sur l'appel exact (casse,
  `subagent_type`), 0 préflight délégué, options recopiées à l'identique. Un écart restant se lit
  comme un flou non levé, pas comme un défaut de modèle.
- **Consigner la mesure** dans `docs/analyses/2026-09-22-evals-orchestrateur.md` (ce que T19 de P6
  devait produire), méthode et commandes comprises — le harnais de cette session vit dans un scratch
  qui disparaîtra.
- **Version mineure** (forme de sortie du script modifiée) + `MIGRATION.md`.

## Hors de cette décision

- **Orchestrateur en Sonnet `low`** : défendable d'après la mesure, pas tranché — elle ne couvre ni
  un plan long à plusieurs vagues (là où Haiku décroche), ni les arbitrages d'escalade. À reprendre
  **après** ce chantier : mesurer sur un texte encore ambigu confondrait les deux causes.
- **K5** (sessions d'exécution un cran d'effort en dessous) : non mesuré ici.

## État final de la grille

| Dimension | État | Preuve |
| --- | --- | --- |
| problème concret | READY | 4 flous mesurés (27 + 36 exécutions), 19 relevés par balayage, les plus lourds revérifiés |
| résultat visé | READY | un geste par instruction, rejouable — demande explicite |
| vérification | READY | rejouer les trois cas, attendus écrits ci-dessus |
| périmètre | READY | liste close : D1–D6 + 11 corrections ; un balayage de trois agents, pas une preuve d'exhaustivité |
| cohérence | READY | casse `model` sondée ; ordre verrou/commit vérifié contre le hook |

Aucune `OPEN` : le plan peut s'écrire.
