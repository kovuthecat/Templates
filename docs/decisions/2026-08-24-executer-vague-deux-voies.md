# 2026-08-24 — `/executer-vague` : deux voies, trois verdicts

Plugin `workflow` 0.11.0. Déclencheur : première exécution réelle de la skill, sur la vague 1 du
plan P1 de MYO. Sept blocages constatés en une seule séance, dont deux fatals.

## Ce qui s'est passé

La vague n'a jamais démarré. Dans l'ordre où les blocages sont tombés :

1. la vague contenait des sessions `Desktop` → refus en bloc de la skill ;
2. l'arbre git portait 383 fichiers untracked (bibliothèque LDraw) **sans intersection** avec les
   zones de la vague → refus ;
3. après commit de ces fichiers pour débloquer, les deux lancements `claude -p` sont morts en
   `command not found` (exit 127) : **le CLI `claude` n'est pas sur le PATH de cette machine**.

Le `wave.lock` était déjà posé. Aucune session n'ayant tourné, aucun `/fin-de-tache` ne serait jamais
venu le retirer : le dépôt restait gelé pour commit et push. Le hook `Stop` a par-dessus réclamé un
`/purge-contexte` sur des fichiers que la skill interdit explicitement à l'orchestrateur de toucher.

## Décisions

### 1. Deux voies, pas un refus

Une session `Desktop` n'était pas orchestrable ; elle l'est désormais, par une voie distincte. La
colonne `Env.` décide du **comment**, plus du **droit** :

| | Voie headless (`—`) | Voie Desktop |
| --- | --- | --- |
| Lancement | `claude -p`, un processus | pastille `spawn_task`, un clic = une session neuve |
| Verdict | schéma JSON | statut `[x]` dans `index.md`, posé par `/fin-de-tache` |
| Fin de vague | dans le tour | plus tard — l'orchestrateur rend la main |

Une vague mixte déroule les deux. Conséquence pour `/nouveau-plan` : la contrainte « une vague
orchestrable ne contient aucune session `Desktop` » est **retirée** ; reste un conseil de découpage
(grouper les `Desktop` donne des vagues qui se closent franchement).

### 2. Trois verdicts : `PASS` / `FAIL` / `PANNE`

Le plus profond des sept blocages. Le fail-closed convertissait `command not found` en
`FAIL · sortie non conforme` — **indiscernable d'une session qui a lu son `S<k>.md`, travaillé et
échoué**. L'orchestrateur aurait annoncé un échec de tâche et renvoyé vers un rapport de passation
inexistant, pour du code jamais ouvert.

`PANNE` = JSON illisible **et** exit ≠ 0. Elle route vers une remédiation d'environnement, jamais
vers `/reprendre-echec`. Le fail-closed est maintenu partout ailleurs.

Cela impose de capturer ce que le gabarit jetait : `2> S<k>.stderr.log` et `echo $? > S<k>.exit`.
Le `.exit` sert deux fois — il distingue panne et échec, et il marque la fin du processus pour qui
attend. Exception ajoutée aux Interdits : le `.stderr.log` d'une PANNE est le seul log que
l'orchestrateur ait le droit de lire (il ne contient aucun contexte de tâche).

### 3. Préflight du binaire, avant tout le reste

L'Étape 2 vérifiait quatre choses et pas celle dont dépend tout le mécanisme. Ajout de
`command -v claude`, plus un contrôle des flags supposés (`--session-id`, `--output-format`,
`--json-schema`, `--model`, `--effort`) via `claude --help` : un CLI trop ancien les ignore
silencieusement.

### 4. Le verrou se pose après le préflight, et se retire si rien n'a démarré

Ordre inversé : `wave.lock` était posé avant le lancement, donc avant de savoir si le lancement
était possible. Unique exception à « ne jamais retirer le verrou » : **aucune session n'a démarré**
(toutes en PANNE) — il n'y a pas de vague à clore, et le laisser gèle git pour rien.

### 5. Arbre sale : trancher par les zones

Le but de la règle est que le diff post-vague soit **attribuable**, pas que le dépôt soit immaculé.
Intersection avec les colonnes `Zone modifiée` non vide → STOP. Vide → référence
(`git status --porcelain > .claude/vague/avant-vague.txt`) et confirmation, puis on continue.

Écarté : supprimer le contrôle. La référence préserve l'attribution sans imposer un commit sans
rapport avec le plan — ce qu'on a dû faire ici, pour un lancement qui a ensuite échoué.

### 6. Hook `Stop` : `vagueParallele()` au lieu d'un plaidoyer en prose

`lib.mjs` exportait déjà le helper ; `pretooluse-git` et `sessionstart-contexte` l'utilisaient,
`stop-contexte` non. Le message de sortie prévoyait le cas (« si c'est volontaire — vague parallèle
en cours — dis-le »), mais **à la charge du modèle**, alors que la condition est mécaniquement
testable. Demander à un orchestrateur Haiku `low`, conçu pour ne rien improviser, de plaider sa cause
contre un hook était incohérent. Lock présent → les deux vérifications passent en `systemMessage`
non bloquant.

### 7. Attente : sonder les `.exit`, ne pas bloquer sur `wait`

Un `wait` tient dans un seul appel shell, or les harnais plafonnent la durée d'un appel (10 min pour
l'outil Bash de Claude Code). Une session plus longue aurait été tuée en vol et aurait rendu un JSON
vide — donc, avant la décision 2, un faux « sortie non conforme ». Lancement détaché + sondage des
`.exit`.

## Non corrigé, documenté

`model: haiku` dans le frontmatter ne s'est pas appliqué (la skill a tourné sur Sonnet). C'est un
comportement du harnais, pas du plugin. La skill le dit désormais : les interdits ne dépendent pas
du modèle, mais l'économie annoncée, si.
