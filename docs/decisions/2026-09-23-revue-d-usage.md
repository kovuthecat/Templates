# 2026-09-23 — Une revue d'usage par le navigateur in-app, cadrée par interview

## Ce que ça change

Une nouvelle skill, **`/revue-d-usage`**, parcourt une application en marche dans le navigateur
in-app de Desktop, à un jalon, et rend une revue de ce qu'un utilisateur vivrait : ce qui casse, ce
qui gêne, ce qui n'est pas accessible — et, si on le lui demande, ce qui pourrait être plus beau.

Concrètement, à quoi on le verra :

- **Une interview avant tout parcours.** La skill lit `PROJECT_BRIEF.md`, `ARCHITECTURE.md` (écrans)
  et `DESIGN_SPEC.md` s'il existe, puis **propose** un périmètre et attend un « go » explicite :
  toute l'app ou certaines pages ; la liste des parcours (5 à 8, dérivés des écrans — inscription,
  chemin de valeur, récupération d'erreur — amendables) ; les passes à dérouler parmi
  **fonctionnel · ergonomie (heuristiques de Nielsen) · accessibilité (WCAG 2.1 AA) · esthétique**.
  Rien ne se déroule avant le go. Même geste que l'interview de recalage de `/revue-de-conception`.
- **Trois sorties, trois domiciles.** Ce qui casse et ce qui contrevient à une grille publiée,
  classé par sévérité → `TASKS.md` (comme les constats confirmés de `/code-review`). Ce qui relève
  du goût, du ton ou d'un choix produit → `VALIDATION.md`, **une proposition par ligne, formulée
  pour être acceptée ou refusée** — jamais appliquée. Le rapport complet, avec les parcours joués
  et les mesures → `docs/revues/<date>-usage.md`, seul endroit qui garde le détail (le plafond de
  60 lignes de `VALIDATION.md` tient parce que le détail n'y va pas).
- **La grille de validation ne bouge pas.** N0 / N1 / N2 restent trois ; `/revue-d-usage` est une
  **étape de revue nommée, sans rang** (même statut que `/code-review`, décision du 2026-08-30).
  N2 reste humain **par défaut** ; l'exception est écrite : *quand l'interview l'a demandé, Claude
  propose sur le N2 — proposer, jamais trancher.* `WORKFLOW.md` §6 gagne cette ligne.
- **Ce que la skill ne fait pas.** Elle ne corrige pas de code (revue = constat, comme
  `/revue-de-conception`). Jamais de Playwright ni de capture scriptée (§6). Jamais d'action
  irréversible sur l'app (suppression, paiement, envoi) : serveur dev local, données locales. Hors
  Desktop : elle sort la liste des parcours et la checklist à dérouler à la main (mode B de
  `/verif-visuelle`).

Le revers, accepté en connaissance de cause (risque écrit le 2026-09-14) : une liste de propositions
esthétiques se valide plus facilement en bloc qu'une question à la fois. Deux garde-fous : la passe
esthétique est **opt-in à chaque revue**, et chaque proposition est une ligne fermée de
`VALIDATION.md` que l'humain coche ou supprime.

Ce qu'il faudra maintenir : une skill (~200 lignes) et ses `references/` (parcours-types, Nielsen 10,
WCAG AA court, gabarit de rapport), une ligne §6, deux lignes d'aiguillage (`/verif-visuelle` pour
le N2, `/revue-de-conception` dans sa table « la bonne porte »), l'en-tête du gabarit
`VALIDATION.md` (il accueille des propositions, pas seulement des critères), CHANGELOG et version
du plugin.

## Contexte

Demande du 2026-09-23 : « une (ou plusieurs) skill de revue via serveur de dev via navigateur in-app
(fonctionnalité, ergonomie de l'UI, UX) ». État au moment du choix : `/verif-visuelle` = N1 par
écran, post-tâche, Desktop seul, « jamais N2 » ; `/revue-de-conception` = jalon, écrit vs code, sans
navigateur ; N2 = humain (`WORKFLOW.md` §6, `CLAUDE-BASE.md`, décisions du 2026-08-22 et du
2026-09-14) ; pas de N3 (2026-08-30). Aucune trace d'intention « parcours utilisateur » dans le dépôt.

Existant examiné (annexe « rechercher l'existant » de `/cadrer`) : aucun candidat, officiel
(`anthropics/skills` `webapp-testing`) ou communautaire (`gotalab/uxaudit`,
`EliaAlberti/ux-audit-skill`), ne pilote une app live avec les outils in-app — tous passent par
Playwright ou par des captures figées. Deux sources réutilisables : `design:accessibility-review`
(grille WCAG 2.1 AA, sévérités, sans dépendance Figma) et `design:design-critique` (cinq axes,
🔴🟡🟢, trois recommandations prioritaires) — plugin installé sur le poste, **non vendoré**, donc à
adapter en `references/`, pas à appeler. De `gotalab/uxaudit`, l'idée retenue : dériver les parcours
du code avant de parcourir.

Fiche de méthode ouverte : *séparation des contraintes*. Question que seule cette méthode pose :
« Claude revoit l'UX » et « Claude n'évalue pas le N2 » s'excluent-ils, ou s'appliquent-ils à des
gestes différents ? Angle mort : la frontière glisse dans la formulation (« bouton trop petit » est
un jugement, « bouton 24 px, seuil 44 px » est un constat) — la skill impose la forme. Abandon si :
l'utilisateur veut que Claude juge le goût par défaut — ce qu'il n'a pas demandé, l'interview le
rend opt-in.

## Alternatives envisagées

- **A — Claude constate, l'humain juge** : constats mesure + question, aucune sévérité, N2 intact.
  Écartée par l'utilisateur : il veut une revue qui classe et propose, pas une liste de questions.
- **B-étroit — grilles publiées seulement** : Nielsen et WCAG classés, goût exclu. Écartée : la
  passe esthétique manquerait ; l'interview la rend opt-in, ce qui suffit à contenir le risque.
- **C — étendre `/verif-visuelle`** : deux moments (post-tâche, jalon) dans une skill. Écartée :
  une skill qui sert deux moments finit par n'en servir aucun.
- **Deux skills** (parcours + critique-ux) : Étape 0 dupliquée, deux déroulés navigateur. Écartée.

## Raison du choix

Une grille publiée (Nielsen, WCAG) est vérifiable par un tiers : ce n'est pas du goût, et rien dans
les décisions antérieures n'interdit à Claude de la dérouler. Le goût, lui, reste ce qu'un tiers ne
peut pas vérifier — c'est la frontière du 2026-09-14. L'interview de périmètre permet de franchir
cette frontière **à la demande** sans la déplacer : la règle reste, l'exception est nommée et
choisie à chaque fois. Une seule skill parce que l'Étape 0 (gate Desktop, serveur, dérivation des
parcours, interview) est commune aux passes et coûteuse ; les grilles vivent en `references/` et ne
coûtent rien tant qu'elles ne sont pas ouvertes.

## Conséquences

- `plugin/skills/revue-d-usage/` : `SKILL.md` + `references/{parcours-types,nielsen,wcag-aa,rapport}.md`.
- `plugin/WORKFLOW.md` §6 : une ligne (étape de revue nommée, sans rang ; N2 proposé sur demande).
- `plugin/skills/verif-visuelle/SKILL.md` : le « point N2 à faire trancher » renvoie aussi à
  `/revue-d-usage` pour une revue d'ensemble ; `plugin/skills/revue-de-conception/SKILL.md` : une
  ligne dans « la bonne porte ».
- `plugin/templates/VALIDATION.md` : l'en-tête admet des propositions issues d'une revue, à cocher
  ou supprimer.
- `CHANGELOG.md`, `plugin/.claude-plugin/plugin.json` → 0.42.0 ; éval de déclenchement de la skill
  (gate `publier.mjs`, 2026-09-15).
- Une revue qui trouve un défaut ne le corrige pas ; elle l'écrit. Un défaut qui invalide une
  hypothèse du plan en cours retombe sur `/nouveau-plan` Étape 0 (extension).

## Grille finale

| Dimension | État | Preuve |
| --- | --- | --- |
| problème concret | READY | demande explicite ; aucune skill ne parcourt l'app live |
| résultat visé | READY | B-large + interview, tranché par l'utilisateur le 2026-09-23 (deux tours) |
| vérification | OPEN → tâche (plan) | (a) éval de déclenchement ; (b) **sonde** : la navigation clavier est-elle observable avec `computer key Tab` + `read_page` (focus) ? négatif attendu = la passe WCAG « clavier » devient checklist manuelle ; (c) un déroulé réel sur un projet Desktop de l'utilisateur, nommé dans le plan |
| périmètre | READY | liste « Conséquences » ci-dessus |
| cohérence | READY | pas de N3 ; frontière humaine conservée par défaut, exception écrite |

Validité : `plugin/` 0.41.0, `WORKFLOW.md` §6 et décisions citées telles que lues le 2026-09-23.

## Impact IA

Skill sans Opus (Sonnet suffit : elle applique des grilles, elle n'arbitre pas) ; coût dominé par
le nombre de parcours × passes, capture d'écran seulement sur constat à montrer.
