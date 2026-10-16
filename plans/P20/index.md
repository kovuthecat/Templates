# Plan P20 — Simplification : moins de mécanismes, un moteur qui écrit, des sessions sans pastille   (rédigé par Opus)

Workflow : v0.66.0
Preuve N0 : requise

## Objectif d'ensemble
Le workflow fait aujourd'hui exécuter par un orchestrateur Haiku une quinzaine de gestes mécaniques
qu'il oublie parfois, entretient deux mécanismes que plus rien ne justifie (le parallèle, un agent par
effort), et fait lire aux modèles des textes deux fois trop longs. À la fin de P20 : le moteur fait
lui-même les écritures et les commits, une session qui s'arrête sur un choix reprend avec ta réponse
écrite sans pastille, les commandes des sessions d'arrière-plan passent sous les autorisations d'un
vrai projet, une voie express existe pour les petits changements, les textes lus sont réduits sous
des plafonds chiffrés, et une remesure compare le tout à la référence de P19. Publié en 0.67.0.
Décision : `docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md` (§ plan 2,
§ Sessions sans pastille, § Voie express) ; mesure : `docs/analyses/2026-10-14-mesure-de-reference.md`
(constats A, B, C) ; revue : `docs/revues/2026-10-13-revue-externe-workflow.md`.

**Risques du plan** : H1 — une session arrêtée sur une question reprend par `SendMessage` avec tout
son contexte, même après une longue attente. Ce qui la réfuterait : le scénario `arret-relaye` joué en
deux temps par S6 (session persistée, réponse après `--attente`) ne retrouve pas le contexte ou
l'agent. Alors le repli (réponse écrite dans un fichier, reprise à froid) devient la voie principale,
et S11-S12 écrivent les textes sur ce repli. Signal à surveiller : deux harnais de mesure ont déjà été
tués sur une prémisse (P8/S5, P19/S6) ; la remesure (S13) compare des faits, sans critère « abouti ».

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Retrait du mode parallèle | Sonnet | high | — | — | `plugin/bin/prochaine-action.mjs` · `plugin/bin/verifier-plan.mjs` · `plugin/bin/preuve-n0.mjs` · `plugin/hooks/lib.mjs` · `plugin/hooks/pretooluse-git.mjs` · `plugin/hooks/stop-contexte.mjs` · `plugin/hooks/sessionstart-contexte.mjs` · `plugin/WORKFLOW.md` · `plugin/EXECUTANT.md` · `plugin/skills/` · `plugin/agents/relecteur-session.md` · `plugin/agents/verificateur-plan.md` · `plugin/mods/affichage/` · `tests/` | [x] 2026-10-15 | — |
| [S2](S2.md) | T3 | Retrait des agents par effort | Sonnet | high | — | S1 | `plugin/agents/session-low.md` · `plugin/agents/session-medium.md` · `plugin/agents/session-high.md` · `plugin/agents/session-xhigh.md` · `plugin/bin/prochaine-action.mjs` · `plugin/WORKFLOW.md` · `plugin/MIGRATION.md` · `plugin/templates/project-settings.json` · `plugin/skills/orchestrer-plan/` · `plugin/skills/nouveau-plan/SKILL.md` · `plugin/mods/` · `tests/` | [x] 2026-10-15 | — |
| [S3](S3.md) | T4-T5 | Sessions d'arrière-plan : commandes et autorisations | Sonnet | high | — | S2 | `plugin/templates/project-settings.json` · `plugin/EXECUTANT.md` · `plugin/bin/prochaine-action.mjs` · `plugin/skills/reprendre-echec/` · `tests/scenarios/` · `tests/tester-scripts.mjs` · `tests/fixtures/plans/` | [x]! | — |
| [S4](S4.md) | T6-T7 | Un seul lecteur d'index | Sonnet | high | — | S3 | `plugin/bin/lire-index.mjs` · `plugin/bin/prochaine-action.mjs` · `plugin/bin/verifier-plan.mjs` · `plugin/bin/installer-mods.mjs` · `plugin/bin/publier.mjs` · `plugin/hooks/lib.mjs` · `plugin/mods/` · `tests/` | [x] 2026-10-15 | — |
| [S5](S5.md) | T8 | Le moteur rend les textes finaux | Sonnet | high | — | S4 | `plugin/bin/prochaine-action.mjs` · `tests/scenarios/noter.mjs` · `tests/tester-scripts.mjs` · `tests/fixtures/plans/` · `tests/fixtures/scenarios/` | [x] 2026-10-15 | — |
| [S6](S6.md) | T9-T10 | Arrêt relayé : une session reprend avec ta réponse | Sonnet | high | — | S5 | `plugin/bin/prochaine-action.mjs` · `plugin/skills/orchestrer-plan/SKILL.md` · `plugin/EXECUTANT.md` · `plugin/skills/reprendre-echec/references/gabarit-question.md` · `tests/scenarios/` · `tests/tester-scripts.mjs` · `tests/fixtures/plans/` · `tests/fixtures/scenarios/` | [x] 2026-10-15 | — |
| [S7](S7.md) | T11 | Le moteur écrit et committe | Sonnet | high | — | S6 | `plugin/bin/prochaine-action.mjs` · `tests/scenarios/noter.mjs` · `tests/tester-scripts.mjs` · `tests/fixtures/plans/` · `tests/fixtures/scenarios/` | [x] 2026-10-15 | — |
| [S8](S8.md) | T12 | Relecture selon le risque | Sonnet | medium | — | S7 | `plugin/agents/relecteur-session.md` · `plugin/bin/prochaine-action.mjs` · `plugin/bin/preuve-n0.mjs` · `tests/tester-scripts.mjs` · `tests/tester-preuves.mjs` · `tests/fixtures/plans/` | [x] 2026-10-16 | — |
| [S9](S9.md) | T13-T14 | Voie express et plans courts | Sonnet | high | — | S8 | `plugin/hooks/stop-contexte.mjs` · `plugin/hooks/pretooluse-git.mjs` · `plugin/hooks/lib.mjs` · `plugin/bin/bilan-express.mjs` · `plugin/bin/verifier-plan.mjs` · `plugin/skills/nouveau-plan/references/` · `tests/tester-hooks.mjs` · `tests/tester-scripts.mjs` · `tests/fixtures/plans/` | [x] 2026-10-15 | — |
| [S10](S10.md) | T15 | Mods : ils suivent le moteur | Sonnet | medium | — | S9 | `plugin/mods/garde-fous/` · `plugin/mods/affichage/` · `plugin/bin/collecter-incidents.mjs` · `plugin/bin/sync-workflow.mjs` · `plugin/bin/installer-mods.mjs` · `tests/tester-mods.mjs` · `tests/tester-scripts.mjs` | [x] 2026-10-16 | — |
| [S11](S11.md) | T16-T17 | Passe texte : WORKFLOW, EXECUTANT, CLAUDE-BASE | Sonnet | high | — | S10 | `plugin/WORKFLOW.md` · `plugin/EXECUTANT.md` · `plugin/CLAUDE-BASE.md` · `plugin/CONVENTIONS.md` · `plugin/hooks/plafonds.json` · `plugin/hooks/stop-contexte.mjs` · `plugin/templates/` · `docs/decisions/2026-10-15-justifications-sorties-du-workflow.md` · `tests/tester-renvois.mjs` | [x] 2026-10-16 | — |
| [S12](S12.md) | T18-T19 | Passe skills | Sonnet | high | — | S11 | `plugin/skills/` · `plugin/agents/` · `tests/tester-renvois.mjs` | [x] 2026-10-16 | — |
| [S13](S13.md) | T20 | Remesure | Sonnet | high | — | S12 | `docs/analyses/2026-10-15-remesure-plan-2.md` | [ ] | — |
| [S14](S14.md) | T21 | Publication 0.67.0 | Haiku | medium | — | S13 | `plugin/.claude-plugin/plugin.json` · `plugin/mods/garde-fous/.claude-plugin/plugin.json` · `plugin/mods/affichage/.claude-plugin/plugin.json` · `CHANGELOG.md` · `plugin/MIGRATION.md` · `docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md` | [x] 2026-10-16 | — |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : chaque session suivante touche le moteur et les textes ; sans ce retrait,
  elles réécriraient des branches et des paragraphes voués à disparaître.
  - **S1** — Le mode parallèle disparaît : plus de verrou de vague, plus de mot « parallélisable »
    dans les plans, une seule voie d'exécution, une session après l'autre. Le seul garde-fou que le
    verrou portait aussi (dépôt dont la racine est introuvable) reste, sous son vrai nom. Tu le
    verras à un `grep` vide sur `wave.lock` et aux tests du garde-fou toujours verts.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : le moteur va se mettre à rédiger les appels d'agent (S5, S7) ; il doit le
  faire dans leur forme finale, sans les quatre agents intermédiaires.
  - **S2** — Une session se lance avec son effort passé directement à l'outil d'agent (la sonde de
    P19 a montré qu'il est respecté). Les quatre agents `session-low/medium/high/xhigh` et leur repli
    en trois crans disparaissent. Tu le verras à l'appel rendu par le moteur, qui porte l'effort.
- **Vague 3** : S3 (après S2).
  *Pourquoi maintenant* : les scénarios joués en S6, S7 et S13 doivent tourner sous les autorisations
  d'un vrai projet, sans quoi la remesure passerait au vert pendant qu'un projet perd ses commits.
  - **S3** — Les sessions d'arrière-plan écrivent leurs commandes sans `cd`, relatives à la racine,
    et ces commandes passent les autorisations d'un projet vendoré : la reprise ne perd plus Bash.
    Une panne d'environnement n'a plus droit qu'à une reprise, puis te pose une question avec options.
    Tu le verras au scénario « échec puis reprise » rejoué sous les autorisations d'un projet, sans
    refus.
- **Vague 4** : S4 (après S3).
  *Pourquoi maintenant* : le moteur va écrire dans l'index (S7) ; il faut d'abord que tout le monde
  lise l'index de la même façon (point 11 avant point 10, décision du 2026-10-14).
  - **S4** — Un seul module lit les index de plan, utilisé par le moteur, le vérificateur et les
    hooks ; les mods en reçoivent une copie générée, contrôlée identique. Un test confronte les
    squelettes de `/nouveau-plan` à ce lecteur. Tu le verras à la disparition de quatre lectures qui
    divergeaient.
- **Vague 5** : S5 (après S4).
  *Pourquoi maintenant* : l'arrêt relayé (S6) rend une question à l'utilisateur ; elle doit déjà être
  rédigée par le moteur, avec ses options.
  - **S5** — Le moteur rédige lui-même la question avec ses options, l'annonce de vague, la liste de
    ce qui reste lançable et le rapport final ; l'orchestrateur les relaie tels quels. Tu le verras
    à des questions et des rapports identiques d'une orchestration à l'autre.
- **Vague 6** : S6 (après S5).
  *Pourquoi maintenant* : c'est la demande de départ (piloter un plan depuis ton téléphone) et
  l'hypothèse la plus risquée du plan ; la sonder tôt évite d'écrire S11-S12 sur une voie fausse.
  - **S6** — Une session qui tombe sur un choix s'arrête, te pose la question par écrit, et reprend
    **avec tout ce qu'elle avait lu** quand tu as répondu ; si elle ne peut pas reprendre, ta réponse
    est relue par une reprise à froid. Le mot `pastille` n'arrête plus rien : il est signalé. Tu le
    verras au scénario « arrêt relayé », joué avec une vraie attente avant la réponse.
- **Vague 7** : S7 (après S6).
  *Pourquoi maintenant* : les écritures du moteur s'appuient sur le lecteur (S4), les textes (S5) et
  le nouvel état d'arrêt (S6).
  - **S7** — (dette de S3, décision utilisateur du 2026-10-15 : rejouer « échec puis reprise » sous autorisations projet pour la preuve « zéro refus » ; le moteur supprime lui-même le rapport d'échec.) Le moteur coche les sessions, committe les revues, les preuves et les rapports, pousse et
    clôt le plan lui-même ; l'orchestrateur n'a plus qu'à lancer des agents et te transmettre des
    questions. Le plan finit toujours sur `fini`, même quand le modèle oublie de rappeler le moteur.
    Tu le verras aux scénarios qui finissent le plan.
- **Vague 8** : S8 (après S7).
  *Pourquoi maintenant* : le moteur sait désormais bloquer une session ; on lui confie le contrôle
  de `n0.json` sur un moteur stabilisé.
  - **S8** — Les fichiers sensibles sont relus même dans une session courte ou de pur texte, et une
    configuration N0 modifiée hors de la zone d'une session devient un bloquant. Tu le verras dans les
    fichiers de relecture des prochains plans.
- **Vague 9** : S9 (après S8).
  *Pourquoi maintenant* : la voie express s'appuie sur le lecteur d'index (zone d'un plan ouvert) et
  sur le Stop, désormais sans branche parallèle.
  - **S9** — Un petit changement (moins de 150 lignes et 8 fichiers, hors dépendances, `n0.json` et
    zone d'un plan ouvert) se committe sans plan, avec la mention `Express :`, et un script en tient
    le bilan. Les fiches de session raccourcissent : bandeau réduit aux écarts, messages de commit à
    un seul endroit. Tu le verras au premier commit express accepté par le hook.
- **Vague 10** : S10 (après S9).
  *Pourquoi maintenant* : les mods affichent et contrôlent ce que le moteur rend ; ils doivent suivre
  ses nouvelles sorties (S5-S7).
  - **S10** — Le panneau du plan affiche le texte rendu par le moteur et se rafraîchit quand un commit
    arrive, le garde-fou de modèle cède au modèle calculé par le moteur (escalade comprise), et les
    tests des mods ne sont plus copiés dans les projets. Tu le verras dans le panneau latéral.
- **Vague 11** : S11 (après S10).
  *Pourquoi maintenant* : le texte suit le moteur ; réécrit maintenant, il ne l'est qu'une fois.
  - **S11** — `WORKFLOW.md` passe sous 200 lignes, sans codes internes : une formulation par règle,
    les justifications rangées dans une décision d'archive, et les contradictions relevées par la
    revue levées. Tu le verras à la taille du fichier et à un `grep` vide sur les codes C1-C7.
- **Vague 12** : S12 (après S11).
  *Pourquoi maintenant* : les skills renvoient aux règles de `WORKFLOW.md` ; réécrites après lui,
  elles renvoient au texte final.
  - **S12** — L'orchestrateur lit moins de 220 lignes au lieu de 446, `/nouveau-plan` moins de 250 au
    lieu de 387 ; les skills lancées par toi seul ne se déclenchent plus par erreur ; les agents de
    lecture ne chargent plus les consignes d'exécutant. Tu le verras au coût du prochain plan.
- **Vague 13** : S13 (après S12).
  *Pourquoi maintenant* : la mesure se prend une fois toute la simplification en place, avant de la
  publier.
  - **S13** — Les scénarios de la référence sont rejoués, plus l'arrêt relayé et l'échec sous les
    autorisations d'un projet. Le fichier `docs/analyses/2026-10-15-remesure-plan-2.md` compare coût,
    tours, durée, questions et refus, colonne par colonne, et dit ce qui a gagné, perdu ou ne se
    distingue pas de la variance.
- **Vague 14** : S14 (après S13).
  *Pourquoi maintenant* : les projets ne reçoivent la simplification qu'à la publication.
  - **S14** — Le workflow 0.67.0 est publié et installé sur ce poste ; la note de migration dit aux
    projets ce qui change, dont le plan P14 d'EBM-MSP v2, seul plan ouvert encore marqué `pastille`.
- **Vague 15 — clôture** : contexte (`TASKS.md`) et push. Pas de commits de code à rattraper :
  chaque session a commité les siens.
