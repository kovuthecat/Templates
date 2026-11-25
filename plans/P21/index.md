# Plan P21 — Corrections des incidents du 2026-11-25 et vagues parallèles au choix   (rédigé par Opus)

Workflow : v0.68.0
Preuve N0 : requise

## Objectif d'ensemble
Deux défauts du moteur font aujourd'hui sauter un arrêt humain ou relancer une session déjà faite, et dix
autres incidents gênent les projets. À la fin de P21 : ces douze corrections sont publiées. Chaque
`/nouveau-plan` te demande si le plan tourne en parallèle. Dans un plan en parallèle, toutes les sessions
d'une vague partent ensemble, chacune dans sa propre copie du dépôt, et sont fusionnées dans `main` à la
collecte. Un script ramène dans leur dossier les `.git` déplacés, sans quoi la copie isolée est refusée
(17 projets sur 38). Publié en 0.69.0.
Décision : `docs/decisions/2026-11-25-vagues-paralleles-au-choix-et-incidents.md` (dont « Constat du
cadrage de P21 ») ; incidents : `docs/incidents/2026-11-25-synthese.md`.

**Risques du plan** : H1 — la preuve N0 d'une session reste vérifiable après la fusion de sa branche
(`merge --no-ff`, message sans `Plan:`). Ce qui la réfuterait : la mesure M1 de S5 ; alors S5 rend
`FAIL prémisse` et le plan s'arrête avant d'écrire le parallèle. H2 — une session sous-agent qui délègue
est réveillée par la notification de son agent. Ce qui la réfuterait : M4 de S5 restée « NON constaté » ;
alors S6 interdit la délégation en session au lieu de la réécrire. Déjà sondé au cadrage : copie créée,
commit accepté par nos hooks, branche conservée après l'agent (dépôt rapatrié).

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T4 | Moteur : arrêt humain, sessions faites, push | Sonnet | high | — | — | `plugin/bin/lire-index.mjs` · `plugin/bin/prochaine-action.mjs` · `plugin/bin/verifier-plan.mjs` · `plugin/mods/` · `tests/tester-scripts.mjs` · `tests/fixtures/plans/` | [x] 2026-11-25 |
| [S2](S2.md) | T5-T6 | Lever un bloquant, en-tête d'incident | Sonnet | high | — | S1 | `plugin/bin/prochaine-action.mjs` · `plugin/bin/incident.mjs` · `plugin/skills/orchestrer-plan/SKILL.md` · `plugin/skills/fin-de-tache/SKILL.md` · `plugin/WORKFLOW.md` · `tests/tester-scripts.mjs` · `tests/fixtures/plans/` | [ ] |
| [S3](S3.md) | T7-T10 | Corrections de textes : coupure, lint, maquettes, preview | Sonnet | medium | — | — | `plugin/skills/orchestrer-plan/SKILL.md` · `plugin/skills/nouveau-projet/SKILL.md` · `plugin/skills/migrer-projet/SKILL.md` · `plugin/templates/DESIGN_SPEC.md` · `plugin/skills/verif-visuelle/SKILL.md` | [x] 2026-11-25 |
| [S4](S4.md) | T11 | Ramener les .git dans les projets | Sonnet | medium | — | — | `plugin/bin/rapatrier-git.mjs` · `tests/tester-scripts.mjs` | [x] 2026-11-25 |
| [S5](S5.md) | T12 | Sonde : preuve après fusion, dépendances, réveil | Sonnet | high | — | — | `docs/analyses/2026-11-26-sonde-worktree.md` | [x] 2026-11-25 |
| [S6](S6.md) | T13-T14 | Agents en arrière-plan, sessions sans autorisation | Sonnet | high | — | S2, S3, S5 | `plugin/CLAUDE-BASE.md` · `plugin/WORKFLOW.md` · `plugin/EXECUTANT.md` · `plugin/skills/` · `plugin/bin/prochaine-action.mjs` · `plugin/mods/garde-fous/` · `plugin/templates/project-settings.json` · `tests/` | [ ] |
| [S7](S7.md) | T15-T16 | Le moteur lance et collecte une vague parallèle | Opus | high | — | S4, S6 | `plugin/bin/lire-index.mjs` · `plugin/bin/prochaine-action.mjs` · `plugin/bin/verifier-plan.mjs` · `plugin/mods/` · `tests/tester-scripts.mjs` · `tests/scenarios/` · `tests/fixtures/plans/` · `tests/fixtures/scenarios/` | [ ] |
| [S8](S8.md) | T17-T18 | Textes du parallèle | Sonnet | medium | — | S7 | `plugin/skills/nouveau-plan/SKILL.md` · `plugin/skills/nouveau-plan/references/squelette-index.md` · `plugin/skills/orchestrer-plan/SKILL.md` · `plugin/EXECUTANT.md` · `plugin/skills/fin-de-tache/SKILL.md` · `plugin/WORKFLOW.md` · `docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md` · `tests/tester-renvois.mjs` | [ ] |
| [S9](S9.md) | T19 | Publication 0.69.0 | Haiku | medium | — | S8 | `plugin/.claude-plugin/plugin.json` · `plugin/mods/garde-fous/.claude-plugin/plugin.json` · `plugin/mods/affichage/.claude-plugin/plugin.json` · `CHANGELOG.md` · `plugin/MIGRATION.md` · `docs/decisions/2026-11-25-vagues-paralleles-au-choix-et-incidents.md` | [ ] |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->

## Ordonnancement
- **Vague 1** : S1 · S3 · S4 · S5 (aucune dépendance).
  *Pourquoi maintenant* : les deux défauts qui font sauter un arrêt humain ou relancer une session faite
  pèsent sur tous les projets dès aujourd'hui ; et la sonde doit dire, avant qu'on écrive le parallèle,
  si la preuve N0 survit à une fusion.
  - **S1** — Un arrêt humain écrit après les deux-points n'est plus sauté, une session aux tâches `T-063`
    n'est plus relancée après son PASS, et le journal des modèles ne bloque plus le push. Tu le verras aux
    fixtures tirées de nova et d'EBM-MSPv2, rejouées en test.
  - **S3** — Un agent figé coupé par le watchdog est relancé comme une interruption, les preuves N0 ne
    cassent plus le lint d'un projet, les maquettes passent par l'outil Artifact, et `/verif-visuelle`
    explique un `launch.json` lu dans le mauvais dossier. Tu le verras à la relecture des quatre textes.
  - **S4** — Un script liste tes projets dont le `.git` est déplacé et les ramène un par un, en vérifiant
    que rien n'a bougé ; l'original reste en sauvegarde. Tu le verras à la liste des 16 projets restants
    au bilan (Templates est déjà fait).
  - **S5** — Une mesure dit si la preuve N0 d'une session reste valide après la fusion de sa copie,
    combien coûte la réinstallation des dépendances dans une copie, et si une session est réveillée
    quand l'agent qu'elle a lancé finit. Tu le verras dans `docs/analyses/2026-11-26-sonde-worktree.md`.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : S2 modifie le même moteur que S1 ; elle part de ses corrections.
  - **S2** — Une question « prérequis bloqué » propose un geste qui lève le bloquant quand une décision
    écrite le justifie, et un incident s'écrit avec un en-tête complet rempli par un script. Tu le verras
    à la prochaine question `dependance-revue` et au prochain incident déposé.
- **Vague 3** : S6 (après S2, S3, S5).
  *Pourquoi maintenant* : avec plusieurs sessions en même temps, une session qui attend une autorisation
  ou qui finit avant son agent bloque toute la vague ; il faut le régler avant d'ouvrir le parallèle, et
  la règle dépend du résultat de la sonde.
  - **S6** — Plus aucune consigne ne parle d'un paramètre qui n'existe plus : on attend la notification
    de l'agent avant de s'en servir. Les sessions n'écrivent plus de commandes qui demandent ton
    autorisation. Tu le verras à moins de sessions d'arrière-plan figées.
- **Vague 4** : S7 (après S4, S6).
  *Pourquoi maintenant* : le moteur s'écrit sur les mesures de la sonde, la règle des agents et le
  script de rapatriement (qu'il cite quand il repasse une vague en série).
  - **S7** — Dans un plan `Parallèle : oui`, le moteur lance toutes les sessions d'une vague à la fois,
    chacune dans sa copie, ne relance pas celles qui tournent encore, fusionne chaque copie dans `main`
    et te pose une question en cas de conflit ; une vague aux fichiers partagés ou un projet au `.git`
    déplacé repasse en série, avec la raison. Tu le verras au scénario de vague parallèle : deux lignes
    cochées à la même collecte.
- **Vague 5** : S8 (après S7).
  *Pourquoi maintenant* : les textes décrivent les gestes exacts du moteur ; écrits après lui, ils ne
  le sont qu'une fois.
  - **S8** — `/nouveau-plan` te demande, avant chaque plan, si ses sessions tournent en parallèle, et
    l'orchestrateur sait lancer et collecter une vague entière. Tu le verras à ton prochain `/nouveau-plan`.
- **Vague 6** : S9 (après S8).
  *Pourquoi maintenant* : les projets ne reçoivent les changements qu'à la publication.
  - **S9** — Le workflow 0.69.0 est publié et installé ; la note de migration dit aux projets comment
    activer le parallèle, et quand lancer le script de rapatriement. Tu le verras à `claude plugin list`.
- **Vague 7 — clôture** : contexte (`TASKS.md`) et push. Pas de commits de code à rattraper : chaque
  session a commité les siens.
