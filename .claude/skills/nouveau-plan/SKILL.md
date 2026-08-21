---
name: nouveau-plan
description: Cadrer un plan et générer le dossier plans/P<n>/ (index d'orchestration + un fichier par session). À dérouler par Opus quand une tâche demande plusieurs sessions, ou quand le scope est flou. Contient la checklist d'investigation, les règles de découpage en sessions et les squelettes index.md / S<k>.md.
---

# Cadrer un plan

À dérouler **par Opus**, avant toute écriture de code. Sortie = un dossier `plans/P<n>/`.
Les squelettes vivent ici (et non dans `WORKFLOW.md`) : ils ne coûtent des tokens qu'au cadrage.

## Étape 1 — Investiguer (jamais modifier)

1. **Flux** : chemin complet du problème/feature, où il commence et se termine.
2. **Fichiers probables** sans tout ouvrir : `PROJECT_MAP.md`, `ARCHITECTURE.md`, registre `DECISIONS.md` d'abord.
3. **Rôle** de chaque fichier clé : pourquoi il est pertinent.
4. **Dépendances directes** utiles.
5. **1-2 hypothèses racines** (bug : ce qui peut mal tourner ; feature : choix archi critiques).
6. **Verdict** : plan rédigeable maintenant, ou ambiguïté à lever avec Thibault d'abord ?

**Déléguer la recherche des fichiers à un subagent `Explore`** dès que les points 2-3 demandent de
balayer le repo : il ne rend que sa conclusion, l'exploration ne pollue pas le contexte Opus (qui
est le plus cher). Garder pour soi les points 1, 5 et 6 — c'est le raisonnement, pas la recherche.

## Étape 2 — Découper en sessions (règle de coût)

Un démarrage froid a un prix fixe (prompt système + `CLAUDE.md` + lectures) ; enchaîner dans une
même session fait re-payer le contexte accumulé à chaque tour. Le découpage arbitre entre les deux.

**Regrouper** plusieurs tâches dans une même session si TOUT est vrai :

- même modèle **et** même effort ;
- tâches courtes (`low`) **ou** lectures/fichiers largement partagés ;
- aucune validation humaine requise entre elles ;
- le lot reste raisonnable (~3-5 tâches courtes, ou 2 moyennes liées).

**Séparer** dès qu'un critère tombe, et notamment : toute tâche `high`/`xhigh` est **seule dans sa
session** · changement de modèle ou d'effort · gate humaine entre deux tâches · la séparation
**débloque une parallélisation**.

Deux sessions sont **parallélisables** ssi aucune dépendance **et** zones modifiées disjointes
(fichiers de « Modifier »). La colonne « Zone modifiée » sert à ce contrôle : y mettre les
répertoires/fichiers réellement touchés, pas des généralités.

Modèle et effort : grille dans `C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\WORKFLOW.md` §2-3.

## Étape 3 — Écrire `plans/P<n>/index.md`

**Le statut des tâches vit ICI et nulle part ailleurs** (source unique — cf. `WORKFLOW.md` §4a).

```md
# Plan P<n> — <titre du plan>   (rédigé par Opus)

## Objectif d'ensemble
<2-3 lignes : le but global du plan>

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T3 | … | Haiku | low | — | — | `css/`, `index.html` | [ ] |
| [S2](S2.md) | T5 | … | Sonnet | high | Desktop | S1 | `js/edit/` | [ ] |

## Ordonnancement
- **Vague 1 — parallélisable** : S1 · S3 (zones disjointes, aucune dépendance).
- **Vague 2** : S2 (après S1) · S4 (après S3).
- **Vague 3 — consolidation** : commits tâche par tâche, statuts, `STATUS.md`, push (humain
  ou session Haiku `low`).
```

Colonne **Env.** : `Desktop` si la session exige la validation visuelle N1 (navigateur in-app),
`—` sinon. Une session `Desktop` ne se lance pas depuis VSCode (cf. `/verif-visuelle`).

L'index ne contient **rien d'autre** : pas de détail d'exécution, il pointe vers les sessions.

## Étape 4 — Écrire un `plans/P<n>/S<k>.md` par session

```md
# P<n> · S<k> — <titre>   (rédigé par Opus)

> **Modèle : <Sonnet/Haiku/Codex> · effort : <low|medium|high|xhigh> · Vague : <v> (parallèle : oui/non)**
> **Environnement : <Desktop (navigateur in-app requis) | indifférent>**
> Exécutant : UNIQUEMENT les tâches ci-dessous, dans l'ordre ; fichiers sous « Lire » / « Modifier ».
> Design fixé — ne reconçois pas. Doute ou blocage → STOP, signale, rends la main.

- Date : YYYY-MM-DD · Branche : <ou —>

## Lire (commun à la session)
<fichiers + portée précise (section / fonction / lignes) — RIEN d'autre>

## Hors périmètre
<ce qu'il ne faut PAS toucher / faire — vaut pour toute la session>

---

## T<n> — <titre>

### Objectif
<1-2 lignes : le quoi>

### Décision clé
<ce qu'il faut savoir sans relire le repo ; pointer une décision précise, ex. « docs/decisions/2026-07-12-auth.md »>

### Lire / Modifier
<en plus du commun : lectures spécifiques ; fichiers à modifier/créer — liste exhaustive>

### Étapes
1. …

### Validation
- **N0 auto (bloque le commit)** : `<commande>` → <résultat attendu>
- **N1 visuel auto** : <écran/parcours à vérifier au navigateur in-app, ou `—`> → `/verif-visuelle`
- **N2 humain (jugement esthétique/UX)** : <checklist ou `—`> → à consigner dans `VALIDATION.md`

### Si bloqué
<condition d'arrêt SPÉCIFIQUE → STOP + quoi signaler>

### Message de commit (appliqué en fin de plan)
`<type(scope): message>`

---

<répéter le bloc T<n> pour chaque tâche de la session>

## Fin de session
Dérouler `/fin-de-tache` (mode selon « parallèle : oui/non » du bandeau).
```

**Pas de bloc « Statut » dans le `S<k>.md`** : il vit dans l'`index.md`. Une information de suivi
écrite à deux endroits finit toujours par diverger.

Principes :

- **Le bandeau est auto-suffisant** : modèle, effort, environnement, mode parallèle — jamais besoin
  de retourner à l'index pour lancer la session.
- **« Lire » est restrictif et porté** : que ces fichiers, à la section/fonction près.
- **« Étapes » = le comment**, ordonné. Plus le modèle est faible, plus elles sont fines ; si une
  tâche demande trop de jugement pour le modèle visé → la **découper**.
- **« Validation » = critères vérifiables** (commande + résultat, ou écran + attendu), jamais « ça marche ».
- **N1 ≠ N2** : ce qu'un navigateur peut constater (erreur console, texte absent, 404, débordement)
  est N1 et ne va **jamais** dans `VALIDATION.md`. N2 = uniquement le jugement humain.

## Étape 5 — Reporter dans `TASKS.md`

Une ligne par tâche du plan, statut remplacé par le renvoi : `- T-012 — <titre> · → plans/P2/S1.md`.
Le suivi d'avancement se lit dans l'`index.md`.
