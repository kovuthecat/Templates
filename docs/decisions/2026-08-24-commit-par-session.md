# 2026-08-24 — Chaque session committe son propre travail

Plugin `workflow` 0.13.0. Renversement de `WORKFLOW.md` §4b, qui reportait tous les commits d'un
plan à une consolidation finale. Déclencheur : la vague 1 du plan P1 de MYO, où trois bugs enchaînés
ont fini par rendre visible que le problème n'était pas dans les bugs.

## Ce qui s'est passé

Trois pannes, dans l'ordre où elles sont tombées :

1. **Un verdict que personne ne pouvait écrire.** `/executer-vague` lisait le verdict des sessions
   Desktop dans la colonne Statut de l'`index.md`, « cochée par son propre `/fin-de-tache` ». Or
   `/fin-de-tache`, mode vague parallèle, interdit explicitement de toucher `index.md`. Aucune
   session Desktop ne pouvait se déclarer finie ; l'orchestrateur redemandait indéfiniment, puis
   rabattait sur une confirmation verbale qu'il refusait ensuite — à juste titre.
2. **Des garde-fous inertes là où ils comptaient.** `vagueParallele()` cherchait `.claude/wave.lock`
   dans le répertoire courant. Le verrou étant gitignoré, il n'existe que dans l'arbre principal :
   depuis un worktree, aucun hook de vague ne se déclenchait. Et « Démarrer avec worktree » est le
   choix **par défaut** de la pastille `spawn_task`, qui crée l'arbre avant le premier tour de la
   session — hors de portée de tout `PreToolUse`.
3. **Un blocage sans issue.** S2 et S3 avaient donc travaillé dans des worktrees, diffs non commités,
   invisibles depuis `main`. S4 (vague 2) dépendait du code de S2. Le seul moyen de le rapatrier
   était un commit, que §4b interdisait avant la fin du plan. Impasse structurelle.

Les correctifs 0.12.2 et 0.12.3 ont traité ces trois points. Ce qui a déclenché la présente décision
est arrivé après : l'orchestrateur, devant un `git status` où trois sessions avaient déposé leurs
fichiers, a dû déléguer à `resumeur-git` pour seulement **lire** l'état du dépôt.

## La décision

Le modèle demandait de reconstituer à la fin une attribution qui était gratuite au moment où le code
s'écrivait. La session qui vient d'écrire sait quels fichiers sont les siens ; la faire deviner plus
tard par un autre modèle — le moins cher du plan, `Haiku low` — coûte plus et se trompe.

**Chaque session committe ses tâches avant de rendre la main.** Staging explicite, message du `T<n>`,
et un repère obligatoire en dernière ligne :

```
Plan: P<n>/S<k>/T<m>
```

Ce repère fait trois choses d'un coup : il rend la tâche retrouvable (`git log --grep`), il sert de
**verdict** pour une session Desktop (des commits, ou rien), et il supprime le besoin d'un artefact
de signalisation dédié — les fichiers `.claude/vague/S<k>.verdict` introduits en 0.12.2 auront vécu
quelques heures.

### Ce qui a été refusé

Thibault proposait aussi que chaque session coche sa ligne dans `index.md`. Refusé : c'est le seul
fichier que toutes les sessions touchent. Un rédacteur unique coûte trois lignes à l'orchestrateur ;
plusieurs rédacteurs, c'est un conflit à chaque vague. La règle « un statut, un seul endroit » (§4a)
n'a de valeur que si elle a aussi une seule main. Donc : la session hors vague, l'orchestrateur en
vague.

### L'exception qui reste

`wave.lock` ne sert plus qu'au **parallélisme réel** : plusieurs sessions headless simultanées
partagent un seul index git, donc `git commit` y emporterait le travail en cours des voisines. Pour
celles-là, les commits sont reportés à l'orchestrateur — **en fin de vague**, pas de plan. Une vague
Desktop est sérialisée par l'humain qui clique : elle ne prend plus de verrou.

Le push, lui, reste groupé et n'a jamais lieu depuis une session.

## Ce que ça supprime

- la table d'arbitrage par zones de l'Étape 2d (elle servait à rendre attribuable, après coup, un
  diff que plus personne ne savait rattacher) ;
- la session de consolidation de fin de plan ;
- les fichiers `.claude/vague/S<k>.verdict` ;
- le blocage inter-vagues : la vague N+1 part d'un arbre qui contient déjà la vague N.

Le filet de sécurité intra-plan devient git lui-même. `/rewind` reste utile **dans** une session ; il
n'a jamais rien pu pour ce qui se passe entre deux conversations parallèles, ce qui était pourtant
l'argument qui justifiait de se passer de commits.

## Portée

Applicable à partir du plan suivant. **MYO P1 se termine sous les règles précédentes** (0.12.3) :
changer les règles au milieu d'un plan en cours ferait committer les sessions restantes pendant que
l'orchestrateur attendrait encore des `.verdict`.
