# 2026-08-28 — Push par vague en cloud, pas par plan

Plugin `workflow` 0.17.3. Corrige `WORKFLOW.md` §4b (« push toujours groupé, jamais depuis une
session ») pour le cas qui ne s'était pas encore présenté : l'orchestrateur lui-même, seul, dans un
conteneur cloud éphémère.

## Ce qui s'est passé

MYO P15, vague 3 (S4) lancée. Deux vagues plus tôt closes et validées N0, quatre commits en tout,
tous locaux à ce conteneur — jamais poussés, puisque la règle groupée reporte le push à la fin du
plan (ou à un arrêt). Restaient une vague de validation puis une gate humaine avant la fin du plan.

L'orchestrateur a dû trancher en prose, dans la conversation, entre deux textes qui ne s'accordaient
pas : le rappel émis en session (« ni commit ni push, ils sont bloqués par hook ») d'un côté, la
règle de `/orchestrer-plan` (« push groupé une fois le plan fini ou arrêté ») de l'autre — ni l'un ni
l'autre ne couvrant explicitement le cas d'une gate à venir, qui n'est ni une fin de plan ni un arrêt.
Il a choisi de pousser, avec trois arguments : le motif de la règle groupée (éviter des pushes
concurrents depuis plusieurs sessions) ne s'applique pas à un orchestrateur seul ; la vague close est
déjà validée N0 ; et le conteneur cloud est éphémère — garder des commits validés uniquement en local
revient à risquer de les perdre pour de bon, sans le filet qu'offre un poste qui reste allumé entre
deux sessions.

Le choix était le bon. Le problème est qu'il fallait le refaire, en prose, sur des motifs qui
varieraient d'une session à l'autre — exactement le défaut nommé dans
`docs/decisions/2026-08-25-lecons-orchestration.md` (« Arrêt-au-FAIL structurel plutôt qu'en
consigne ») pour un hook qui laissait un orchestrateur Haiku plaider sa cause contre une condition
pourtant mécanique. Ici c'est l'inverse — une consigne qui aurait dû forcer un push ne le faisait
pas — mais le remède est le même : sortir la décision de la prose.

## La décision

**Un conteneur de session cloud (`CLAUDE_CODE_REMOTE=true`) pousse à chaque clôture de vague**, pas
seulement en fin de plan. Le point d'insertion est l'Étape 5 de `/orchestrer-plan`, immédiatement
après avoir commité pour la vague (verrouillée ou non) et coché les statuts — donc avant tout rendu
de main, gate comprise. La condition se lit sur une variable d'environnement déjà utilisée ailleurs
dans ce dépôt pour distinguer le cloud (`docs/decisions/2026-08-24-sessionstart-bootstrap-hook.md`) :
mécanique, jamais un jugement à porter par vague.

Hors cloud, rien ne change : un poste qui reste allumé entre deux sessions ne perd rien à attendre la
fin du plan, et le push groupé garde son intérêt (moins de bruit, un seul point de vérité réseau par
plan). L'exception est donc bien une exception — elle ne remplace pas la règle groupée, elle ajoute
une deuxième condition de déclenchement propre à un environnement qui, lui, peut disparaître entre
deux tours.

### Ce qui a été refusé

Détecter l'éphémérité au cas par cas (taille du conteneur, durée d'inactivité observée, nombre de
commits en attente) plutôt qu'un booléen d'environnement : aucun de ces signaux n'est disponible
depuis une skill, et un calcul approximatif serait justement le genre de règle qu'un modèle doit
replaider à chaque fois qu'elle donne un résultat limite — le problème qu'on corrige, pas une
solution.

Pousser à chaque **tâche** plutôt qu'à chaque **vague** : le grain existant (commit par tâche, push
par point de collecte) suffit — la fenêtre de perte se limite déjà à une vague en cours, jamais plus,
et un push par tâche multiplierait les appels réseau sans réduire l'exposition de façon perceptible
(une vague dure des minutes, pas des heures).

## Portée

Applicable immédiatement — ce n'est pas un renversement de règle en cours de plan (contrairement à
`2026-08-24-commit-par-session.md`), seulement l'ajout d'une condition de déclenchement supplémentaire
qui ne retire aucun push déjà prévu.
