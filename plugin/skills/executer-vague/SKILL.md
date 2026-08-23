---
name: executer-vague
description: Orchestre une vague de sessions d'un plan — lance chaque session dans un processus séparé, ne garde que les verdicts, tient les statuts. À dérouler quand une vague de `plans/P<n>/index.md` est prête et ne contient aucune session `Desktop`. Pendant exécutif de `/nouveau-plan`.
model: haiku
---

# Exécuter une vague

L'orchestrateur ne fait que deux choses : **lancer des sessions** et **collecter des verdicts**.
Tout ce qu'il lit en plus, il le retraîne à chaque tour jusqu'à la fin de la vague — c'est ce qui
fait exploser un contexte d'orchestration.

Le frontmatter bascule sur Haiku pour ce tour, effort `low`. Le jugement vit dans les sessions
orchestrées (elles reçoivent leur propre modèle en argument `--model`), pas ici.

## Interdits — la raison d'être de cette skill

- **Ne jamais ouvrir un `S<k>.md`.** C'est la session exécutante qui le lit, dans son propre
  contexte. L'`index.md` suffit à l'orchestrateur.
- **Ne jamais lire un diff, une sortie de build ou un log.** Déléguer à `resumeur-git` et
  `verificateur-n0`, qui ne rendent que leur conclusion.
- **Ne jamais corriger soi-même.** Une session qui échoue rend la main à l'utilisateur ; l'orchestrateur
  n'implémente rien, ne relance rien.

## Étape 1 — Lire l'index, rien d'autre

Ouvrir `plans/P<n>/index.md` et en extraire, **pour la vague demandée uniquement** : sessions,
modèle, effort, colonne `Env.`, dépendances, zone modifiée.

## Étape 2 — Refuser ce qui ne s'orchestre pas

STOP, expliquer, rendre la main si l'un de ces cas se présente :

- une session de la vague porte **`Env. = Desktop`** → validation visuelle N1, lancement manuel
  obligatoire par l'utilisateur (`WORKFLOW.md` §5b) ;
- une **dépendance** n'est pas `[x]` dans l'`index.md` ;
- l'**arbre git n'est pas propre** (demander à `resumeur-git`) ;
- `.claude/settings.json` n'a pas d'**allowlist `permissions.allow`** → en headless personne ne peut
  confirmer un outil, la session resterait bloquée sans fin.

## Étape 3 — Poser le verrou si la vague est parallèle

Parallèle **seulement si** les zones modifiées sont disjointes. Au moindre doute : séquentiel.

Si parallèle, créer `.claude/wave.lock` **avant** tout lancement — il bloque commit et push pendant
la vague (hook). **Ne pas le retirer** en fin de vague : c'est `/fin-de-tache` qui le fait en fin de
plan.

## Étape 4 — Lancer

Une session = un processus. Jamais deux sessions dans une même conversation (`WORKFLOW.md` §5b) :

```bash
claude -p "Ouvre plans/P<n>/S<k>.md et exécute-le." --model <modèle> --effort <effort>
```

Modèle et effort viennent de l'`index.md` — identiques au bandeau du `S<k>.md`. Séquentiel par
défaut ; en parallèle, lancer les sessions de la vague ensemble puis attendre l'ensemble.

## Étape 5 — Collecter les verdicts

De chaque session, ne conserver que : **session · PASS/FAIL · une ligne de motif si FAIL**.
Jeter le reste de la sortie sans le relire.

**Arrêt au premier FAIL** : ne pas lancer la suite de la vague. En parallèle, laisser les sessions
déjà lancées se terminer, puis s'arrêter.

## Étape 6 — Rendre la main

1. Passer à `[x]` dans l'`index.md` les sessions PASS, avec la date (statut = source unique,
   `WORKFLOW.md` §4a). En vague parallèle les sessions n'y touchent pas (`/fin-de-tache`) : c'est
   l'orchestrateur qui le fait, une fois la vague finie.
2. **Rapport final** : une ligne par session, puis la vague suivante prête, ou le blocage rencontré.
3. **Ni commit ni push** — ils ont lieu en fin de plan, via `/fin-de-tache`.
