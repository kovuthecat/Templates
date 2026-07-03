# WORKFLOW.md — Répartition modèles/effort et format des plans

Source unique pour la répartition du travail entre les modèles Claude et Codex, et pour le
format des plans. Les autres fichiers y renvoient au lieu de le paraphraser.
Modèles actuels : Fable 5 · Opus 4.8 · Sonnet 5 · Haiku 4.5.

## 1. Principe directeur

**Opus pense, les autres font.**

- **Opus** (cher) : design, cadrage, écrit les plans.
- **Fable** (2× Opus, rare) : uniquement les problèmes qu'Opus n'arrive pas à résoudre.
- **Sonnet** : exécute les tâches cadrées de complexité moyenne, juge le code.
- **Haiku** (rapide) : exécute les tâches cadrées et mécaniques.
- **Codex** (hors budget Claude) : audits visuels — UI, rendu, parcours utilisateur — via Playwright (`AGENTS.md`).

Une fois le plan écrit, chaque exécutant lit **UNIQUEMENT** les fichiers listés dans sa tâche et ne reconçoit pas — le design est fixé.

## 2. Choix du modèle

| Nature de la tâche | Modèle | Exemples |
| --- | --- | --- |
| Problème que même Opus n'a pas résolu (rare, cher) | **Fable** | Bug retors resté sans cause après un passage Opus, conception très longue haleine |
| Design, bug non localisé, scope flou, transverse, arbitrage produit | **Opus** | Architecture, stratégie, cadrage neuf, plan multi-tâche |
| Cadré, jugement de code, localisé, complexité moyenne | **Sonnet** | Bug isolé, refactor limité, feature moyenne, code review, gros lot mécanique |
| Cadré, mécanique, peu de jugement, petit | **Haiku** | Suppression/renommage, simplification, alléger la doc, petit boilerplate |
| Audit visuel : UI, rendu, parcours utilisateur | **Codex** | Audit Playwright d'un écran ou d'un parcours, régression visuelle, rapport JSON |

**Départage une fois le périmètre clair :**

- **Sonnet** si jugement de code, analyse transverse, risque à peser, complexité moyenne, ou gros volume répétitif.
- **Haiku** si mécanique/simple, petit périmètre (1-2 fichiers), résultat évident.
- **Codex** dès que la validation exige de *voir* l'app (UI, parcours, régressions visuelles) — jamais Claude pour ça.
- **Escalade vers Opus** si la cause d'un bug n'est pas localisée, le scope est flou/large, ou il reste des choix produit.

## 3. Effort

Chaque tâche de `TASKS.md` porte une suggestion **`effort: X`** (échelle `low · medium · high · xhigh · max`),
à **vérifier manuellement avant de lancer la session** — aucun routing automatique.

Repère : `low` = mécanique, résultat quasi certain · `medium` = implémentation courante ·
`high` = raisonnement soutenu, arbitrages · `xhigh` = défaut Claude Code, code agentique complexe,
bug non localisé · `max` = la justesse prime sur le coût (rare). Un effort élevé consomme plus de
tokens : ne le réserver qu'aux tâches qui le justifient.

## 4. Format d'un plan (un plan = un dossier, une tâche = un fichier)

Le backlog vit dans `TASKS.md` (index global). Quand Opus cadre un plan (ex. `P1`), il crée **un dossier
`plans/P1/`** contenant :

- **`plans/P1/index.md`** — l'index du plan : objectif d'ensemble, liste ordonnée des tâches (`T1`, `T2`, …)
  avec pour chacune une ligne (titre + modèle + effort + statut) et les dépendances entre tâches. **Rien de plus** :
  l'index ne contient pas le détail d'exécution, il pointe vers les fichiers de tâche.
- **un fichier par tâche** : `plans/P1/T1.md`, `plans/P1/T2.md`, … — **une seule tâche par fichier, scope ~30 min**,
  rédigé d'après le squelette ci-dessous. Contenu = décision finale + chemins de fichiers + étapes ; **pas** les
  alternatives ni la justification longue (celles-ci vont dans `DECISIONS.md`).

**But : limiter le contexte chargé.** Un exécutant ouvre `index.md` uniquement pour repérer sa tâche, puis
travaille dans le seul fichier `T<n>.md` correspondant — jamais un plan global qui empile toutes les tâches.
Ne jamais fusionner plusieurs tâches dans un même fichier.

Squelette de l'index (`plans/P1/index.md`) :

```md
# Plan P1 — <titre du plan>   (rédigé par Opus)

## Objectif d'ensemble
<2-3 lignes : le but global du plan>

## Tâches
| Tâche | Titre | Modèle | Effort | Dépend de | Statut |
| --- | --- | --- | --- | --- | --- |
| [T1](T1.md) | … | Haiku | low | — | [ ] |
| [T2](T2.md) | … | Sonnet | medium | T1 | [ ] |
```

Squelette d'un fichier de tâche (`plans/P1/T<n>.md`) :

```md
# P1 · T<n> — <titre>   (rédigé par Opus)

> Exécutant : UNIQUEMENT cette tâche, les fichiers sous « Lire », les modifications sous « Modifier ».
> Design fixé — ne reconçois pas. Doute ou blocage → STOP, signale, rends la main.

- Date : YYYY-MM-DD · Modèle : <Sonnet/Haiku/Codex> · effort : <…> · Branche : <ou —>

## Objectif
<1-2 lignes : le quoi>

## Décision clé
<ce qu'il faut savoir sans relire le repo ; pointer une section précise, ex. « DECISIONS.md §Auth »>

## Lire
<fichiers + portée précise (section / fonction / lignes) — RIEN d'autre>

## Modifier
<fichiers à modifier / créer — liste exhaustive>

## Hors périmètre
<ce qu'il ne faut PAS toucher / faire>

## Étapes
1. …
2. …

## Validation
- Auto (bloque le commit) : `<commande>` → <résultat attendu>
- Humain (visuel/UX, non bloquant) : <checklist ou —> → reporter dans `VALIDATION.md`

## Si bloqué
<condition d'arrêt SPÉCIFIQUE → STOP + quoi signaler>

## Commit
`<type(scope): message>`

## Statut
[ ] à faire · exécuté par : — · le : — · commit : —
```

Principes :

- **« Lire » est restrictif et porté** : que ces fichiers, à la section/fonction près.
- **« Étapes » = le comment**, ordonné. Plus le modèle est faible, plus elles sont fines ; si une tâche demande trop de jugement pour le modèle visé → la **découper**.
- **« Validation » = critères vérifiables** (commande + résultat, ou visuel), jamais « ça marche ».
- **« Si bloqué » = condition spécifique** à la tâche, pas le générique du bandeau.
- **Fin de tâche** : dérouler la skill `/fin-de-tache` (statuts, `STATUS.md`, rapport, commit atomique).

## 5. Checklist d'investigation Opus (avant d'écrire un plan)

1. **Flux** : chemin complet du problème/feature, où il commence et se termine.
2. **Fichiers probables** sans tout ouvrir : READMEs, `PROJECT_MAP.md`, `DECISIONS.md` d'abord.
3. **Rôle** de chaque fichier clé : pourquoi il est pertinent.
4. **Dépendances directes** utiles.
5. **1-2 hypothèses racines** (bug : ce qui peut mal tourner ; feature : choix archi critiques).
6. **Modèle + effort** de l'exécutant (§2-3).
7. **Verdict** : plan rédigeable maintenant, ou ambiguïté à lever avec l'utilisateur d'abord ?

S'applique même si on délègue l'investigation à Claude Code : Opus pense toujours d'abord.

## 6. Anti-patterns

- Lancer Opus sur une tâche déjà cadrée (le signaler à la place) ; lancer Fable sans passage Opus préalable.
- Envoyer à Sonnet/Haiku un scope flou ou trop large → dérive.
- Enchaîner plusieurs tâches dans une même session (contexte accumulé payé à chaque tour) — une tâche = une session.
- Refactor global sans gain clair ni plan.
- Recopier du texte au lieu de pointer vers la source (`WORKFLOW.md`, `DECISIONS.md`…).
- Faire explorer le repo sans objectif précis.
