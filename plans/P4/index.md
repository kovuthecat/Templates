# Plan P4 — Conditions nommées et domicile unique   (rédigé par Opus)

## Objectif d'ensemble

Le workflow contraint aujourd'hui en interdisant une catégorie ; il contraindra en nommant la
condition sous laquelle la chose est sûre, avec **un seul domicile par invariant**. À la fin :
les cinq blocs de lancement de `plugin/` portent la même ligne de renvoi, au mot près, et
`publier.mjs` refuse de publier si l'un la perd ; une session *bloquée* mais saine se reprend par
`SendMessage` au lieu d'un démarrage à froid ; et douze points d'arrêt qui n'appelaient aucun
humain cessent de s'écrire `STOP`.

Décision d'entrée : [`docs/decisions/2026-09-14-conditions-nommees-domicile-unique.md`](../../docs/decisions/2026-09-14-conditions-nommees-domicile-unique.md)
(cadrage clos — **aucun de ses arbitrages n'est à rejuger**), avec son annexe
[`2026-09-14-inventaire-points-arret.md`](../../docs/decisions/2026-09-14-inventaire-points-arret.md)
qui porte les 60 points d'arrêt, leur `fichier:ligne` et leur classement.

## Sessions

| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | (a) La chaîne exacte, son domicile, les 5 blocs | Sonnet | **high** | headless | — | `plugin/WORKFLOW.md`, `plugin/EXECUTANT.md`, `plugin/skills/orchestrer-plan/`, `plugin/skills/nouveau-plan/references/squelette-session.md` | [ ] |
| [S2](S2.md) | T3-T4 | (a) Le contrôle de publication | Sonnet | medium | — | S1 | `tests/tester-renvois.mjs` (nouveau), `plugin/bin/publier.mjs` | [ ] |
| [S3](S3.md) | T5-T7 | (b) Le canal de reprise suit la nature | Sonnet | medium | — | S1 | `plugin/WORKFLOW.md` (§9a, §9c), `plugin/skills/reprendre-echec/`, `plugin/skills/orchestrer-plan/` | [ ] |
| [S4](S4.md) | T8-T9 | (c) Le STOP générique de l'exécutant | Sonnet | medium | — | S3 | `plugin/EXECUTANT.md`, `plugin/WORKFLOW.md`, `plugin/skills/nouveau-plan/references/squelette-session.md` | [ ] |
| [S5](S5.md) | T10-T12 | (c) Un mot par chose, dans les skills | Sonnet | medium | — | S2 | `plugin/skills/{fin-de-tache,verif-visuelle,migrer-projet,revue-de-conception,cadrer,nouveau-projet,orchestrer-plan}/SKILL.md`, `plugin/agents/verificateur-n0.md` | [ ] |
| [S6](S6.md) | T13-T14 | Clôture : version, CHANGELOG, publication | Haiku | low | — | S4, S5 | `plugin/.claude-plugin/plugin.json`, `CHANGELOG.md`, `plans/P4/index.md` | [ ] |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->
<!-- Vocabulaire complet : WORKFLOW.md §4a — ne pas inventer d'autre marque ici. -->

## Ordonnancement

- **Vague 1** : S1 seule.
  *Pourquoi maintenant* : la ligne de renvoi est une **chaîne exacte** ; tant qu'elle n'est pas
  arrêtée au mot près, tout ce qui la recopie ou la contrôle diverge dès le premier commit.
  - **S1** — la phrase qu'un bloc de lancement doit porter est fixée une fois, inscrite dans un
    seul endroit, et posée telle quelle dans les cinq blocs qui existent. À quoi on le verra : un
    `grep` de la ligne sur `plugin/` compte exactement 5.

- **Vague 2 — parallélisable** : S2 · S3 (zones disjointes, ne dépendent que de S1).
  *Pourquoi maintenant* : S2 rend la chaîne **impossible à oublier** avant que les sessions
  suivantes touchent des gabarits ; S3 est indépendante et n'attend que le vocabulaire de S1.
  - **S2** — `publier.mjs` gagne un cas de test : retirer le renvoi d'un bloc, ou citer une annexe
    qui n'existe pas, annule la publication. Il tourne à la publication, **jamais en session**.
  - **S3** — une session qui a fini son travail, l'a fait vérifier vert et n'a plus qu'un geste à
    poser se reprend par un message d'une ligne au lieu de repartir de zéro.

- **Vague 3 — parallélisable** : S4 · S5 (zones disjointes).
  *Pourquoi maintenant* : le critère et son domicile existent (S3 a touché §9c) ; il ne reste qu'à
  l'appliquer aux points d'arrêt, que l'inventaire nomme un par un.
  - **S4** — un exécutant cesse de s'arrêter « en cas de doute » : il s'arrête quand le geste
    suivant est un choix qu'il n'a pas reçu, et corrige ce qui est à sa portée.
  - **S5** — douze points d'arrêt qui n'appelaient aucun humain cessent de s'appeler `STOP`, trois
    contraintes d'outillage sont nommées comme telles, et les gates de cadrage citent le critère.

- **Vague 4 — clôture** : S6. Bump de version, `CHANGELOG.md`, statuts, publication vers le miroir
  public et synchronisation des projets vendorés. Pas de commits de code à rattraper : chaque
  session a commité les siens.

## Particularités de ce dépôt

- **Templates est la source, pas un projet vendoré** : pas de hooks git, pas de `.claude/workflow/`.
  Les règles de commit par session (staging explicite, repère `Plan: P4/S<k>/T<m>`) s'appliquent
  **sur discipline** — aucun hook ne les rattrapera.
- **Pas de `TASKS.md` ni de `STATUS.md`** : le suivi vit dans cet index uniquement.
- **N0 du dépôt** : `node tests/tester-hooks.mjs` puis `node plugin/bin/publier.mjs --dry-run`.
  Ni build ni typecheck — le `CLAUDE.md` racine est un gabarit non instancié, ses commandes sont
  des ellipses.
- **S1 est `high` et l'effort ne suit pas le modèle au lancement d'un sous-agent** : l'outil
  `Agent` pose le modèle, jamais l'effort. S1 se lance donc à la main —
  `claude -p "Ouvre plans/P4/S1.md et exécute-le." --model claude-sonnet-5 --effort high`.
  Les autres sessions sont `medium`/`low`, soit le défaut de leur modèle : orchestrables.

## Hors périmètre du plan

- **Écart 6** de la revue (classe C) : le plafond de `S<k>.echec.md` hors de `plafonds.json`, le
  plafond `150` recopié dans `WORKFLOW.md:457`, le repère `Plan: P<n>/S<k>/T<m>` absent de
  `CONVENTIONS.md`. La règle de domicile de (a) s'y applique telle quelle — backlog.
- **Écart 2** (prémisse comportementale) : session dédiée, déjà annoncée par la revue.
- Le hook `SessionStart` annonce un retard de `STATUS.md` dans un dépôt qui n'a pas de `STATUS.md`.
  Faux positif à verser à `docs/workflow/incidents/` — hors chantier.
- **Réécrire les 60 points d'arrêt** : 34 sont justes tels quels, 3 sont des tris différés
  (#24, #28, #33) qui restent des questions. Les toucher coûterait sans rien gagner.
