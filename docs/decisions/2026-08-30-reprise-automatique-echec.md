# 2026-08-30 — Reprise automatique d'un échec dans l'orchestration

> **Amendée le 2026-09-09** (`2026-09-09-nature-de-l-echec-et-incidents.md`) : le « cran
> au-dessus » ne vaut plus que pour un échec d'**exécution**. Un échec d'environnement se reprend
> au même modèle en sous-agent, une prémisse fausse ne se reprend pas (`ARBITRAGE` direct). Le
> reste — une reprise, à froid, trois verdicts, opt-out `reprise-manuelle` — est inchangé.

## Décision

`/orchestrer-plan` gagne une **Étape 5c** : après la clôture d'une vague contenant un `FAIL`,
l'orchestrateur lance **une** reprise automatique par session en échec — un sous-agent **frais**
(jamais `fork`, jamais `SendMessage` à l'agent échoué) qui déroule `/reprendre-echec` en « mode
orchestré » sur le seul `S<k>.echec.md`. Modèle : **un cran au-dessus** de celui de l'index,
plancher Sonnet (Haiku→Sonnet, Sonnet→Opus, Opus→Fable en le signalant ; Fable en échec →
arbitrage direct). La reprise rend trois verdicts :

- `PASS` → elle a commité, supprimé le `.echec.md`, coché `[x]` ; le plan **enchaîne** la vague
  suivante sans intervention humaine.
- `FAIL` → deuxième échec consécutif sur la même session : arrêt du plan, arbitrage humain,
  **jamais** de seconde reprise automatique.
- `ARBITRAGE` → une gate de `/reprendre-echec` exige une décision humaine dès la première reprise :
  annulation destructive, prémisse de plan fausse (→ `/nouveau-plan` extension), hypothèse épuisée.

Activée par défaut ; opt-out par le mot **`reprise-manuelle`** sur la ligne d'ordonnancement de la
vague (déclaré au cadrage, `/nouveau-plan`). Les vagues `gate` s'arrêtent toujours après collecte,
reprise comprise. Reprises séquentielles, jamais en parallèle — l'arbre est partagé et la vague
est déjà close (verrou retiré, commits faits) au moment où elles se lancent.

## Contexte

Tout `FAIL` arrêtait le plan et attendait qu'un humain relance `/reprendre-echec` — alors que la
latence humaine est le coût dominant d'une orchestration sans surveillance, et que l'architecture
avait déjà toutes les pièces : le rapport de passation est écrit **avant** le verdict, et
`/reprendre-echec` est conçue pour un démarrage à froid depuis ce seul rapport. L'interdit « ne
jamais relancer une session en échec » protégeait deux choses — pas de reprise de la *même
conversation* (fausses pistes rapatriées), pas de correction par l'orchestrateur lui-même — et une
reprise à froid lancée-collectée comme n'importe quelle session n'enfreint ni l'une ni l'autre.

## Alternatives envisagées

- **Deux échecs consécutifs → humain, comptés mécaniquement** (proposition initiale). Retenu comme
  plafond (une reprise max), mais insuffisant seul : trois gates de `/reprendre-echec` doivent
  remonter **dès la première reprise** (annulation destructive, prémisse fausse, hypothèse
  épuisée). D'où le verdict `ARBITRAGE`, troisième issue à côté de `PASS`/`FAIL`.
- **Opus systématique pour la reprise.** Écarté : l'échelle « un cran au-dessus » existe déjà
  (Étape 5b), coûte moins pour un échec Haiku trivial, et couvre le cas Opus-en-échec (→ Fable)
  qu'un Opus fixe ne couvre pas. Plancher Sonnet pour ne pas reprendre un échec avec le modèle qui
  vient d'échouer.
- **Opt-in (`reprise-auto` à déclarer) plutôt qu'opt-out.** Écarté : l'objectif est le déroulé sans
  intervention ; le cas particulier est la vague où l'humain doit voir l'échec d'abord, c'est donc
  elle qui se déclare.

## Raison du choix

Les invariants du workflow tiennent tels quels : l'orchestrateur reste lancer/collecter (il n'ouvre
ni `.echec.md` ni diff, il relaie un verdict), le jugement vit dans la session de reprise, le
démarrage à froid reste la seule entrée d'une réparation. Et même une reprise qui échoue paie : son
`.echec.md` mis à jour (« Déjà écarté » enrichie) fait démarrer l'arbitrage humain de plus haut.

## Conséquences

- `/reprendre-echec` gagne un « mode orchestré » : verdict final en une ligne
  (`VERDICT: PASS|FAIL|ARBITRAGE · MOTIF: … · RAPPORT: …`), gates rendues en `ARBITRAGE`, modèle
  imposé par l'orchestrateur (son frontmatter `model: sonnet` ne vaut qu'en manuel).
- Un plan ne s'arrête plus au premier `FAIL` mais au premier échec **non repris** ; le rapport
  final porte les deux verdicts d'une session reprise (`S<k> · FAIL → reprise PASS`).
- Plusieurs `FAIL` dans une vague : reprises une par une, arrêt à la première non-`PASS`.
- Coût assumé : une session escaladée (souvent Opus) par échec, sans validation humaine préalable —
  borné par « une reprise max » et par les gates `ARBITRAGE`.
