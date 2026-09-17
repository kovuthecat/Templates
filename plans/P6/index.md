# Plan P6 — Autonomie par défaut, état scripté, push par session   (rédigé par Fable, hors grille — relecture critique du 2026-09-17)

Workflow : v0.38.1

## Objectif d'ensemble

Une session qui rencontre un obstacle à sa portée le franchit et continue, au lieu de rendre la main
à un orchestrateur qui relance à froid ou à un humain qui valide l'évidence. À la fin : N0 et l'état
d'une orchestration sont calculés par des scripts testés, plus par des modèles ; tout travail rendu
est poussé et reprenable d'un autre poste ; l'exploration ouverte se lance sans attendre cinq plans ;
un projet vendoré sait qu'il est en retard ; et les textes que chaque session charge ont perdu leur
historique. Publication : plugin 0.39.0.

Décision d'entrée : [`docs/decisions/2026-09-17-autonomie-par-defaut-etat-scripte-push-par-session.md`](../../docs/decisions/2026-09-17-autonomie-par-defaut-etat-scripte-push-par-session.md)
(approuvée en bloc — **aucun de ses arbitrages n'est à rejuger**). Elle porte les contrats C1 à C7 ;
les `S<k>.md` y renvoient au lieu de les recopier.

**Risques du plan** :
- Sondes A à D de la décision (effort d'agent, `start_session`, hooks et push en cloud, `agent_id`) —
  S1 les tranche **avant** toute écriture ; S5 porte les deux branches de la sonde A, écrites d'avance.
- **Le plan s'exécute avec le workflow qu'il modifie.** Les sessions suivent la procédure de la
  version installée (0.38.1), pas celle qu'elles écrivent — *réfuté si* une session applique à
  elle-même une règle de P6 avant la publication. Et le cache plugin de ce poste est périmé (hook
  `SessionStart` ancien, skills manquantes) : S1/T2 le rafraîchit avant la vague 2.
- `WORKFLOW.md` sous 300 lignes sans perdre une règle — *réfuté si* `tests/tester-renvois.mjs`
  trouve un renvoi `§` orphelin après S4, ou si la relecture humaine de la vague 4 trouve un manque.

## Sessions

| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Sondes A-D et cache plugin du poste | Sonnet | medium | — | — | `docs/analyses/2026-09-17-sondes-p6.md` (nouveau) | [x]! (2026-09-17) |
| [S2](S2.md) | T3-T4 | `n0.mjs`, et le parseur de `prochaine-action.mjs` | Sonnet | **high** | — | S1 | `plugin/bin/n0.mjs` (nouveau), `plugin/bin/prochaine-action.mjs` (nouveau), `.claude/n0.json` (nouveau), `tests/tester-scripts.mjs` (nouveau), `tests/fixtures/` (nouveau) | [x] (2026-09-17) |
| [S3](S3.md) | T5-T7 | Hooks : gate de push, version vendorée ; tag de publication | Sonnet | medium | — | S1 | `plugin/hooks/stop-contexte.mjs`, `plugin/hooks/sessionstart-contexte.mjs`, `plugin/hooks/lib.mjs`, `plugin/bin/publier.mjs`, `tests/tester-hooks.mjs`, `.claude/settings.json` | [x]! (2026-09-17) |
| [S4](S4.md) | T8-T9 | La norme : `WORKFLOW.md` réécrit, `EXECUTANT.md`, `CLAUDE-BASE.md` | Sonnet | **high** | — | S3, S10 | `plugin/WORKFLOW.md`, `plugin/EXECUTANT.md`, `plugin/CLAUDE-BASE.md`, `plugin/hooks/plafonds.json` | [x]! (2026-09-17) |
| [S5](S5.md) | T10-T11 | `/orchestrer-plan` autour du script d'état | Sonnet | **high** | — | S1, S10, S4 | `plugin/skills/orchestrer-plan/`, `plugin/agents/session-*.md` (nouveaux, si sonde A confirmée) | [ ] |
| [S6](S6.md) | T12-T14 | `/fin-de-tache` scindée, `/reprendre-echec`, revue par vague, retrait de `verificateur-n0` | Sonnet | medium | — | S4 | `plugin/skills/fin-de-tache/`, `plugin/skills/reprendre-echec/SKILL.md`, `plugin/agents/relecteur-session.md`, `plugin/agents/verificateur-n0.md` (supprimé), `plugin/skills/verif-visuelle/SKILL.md` | [ ] |
| [S7](S7.md) | T15-T17 | Cadrage : `/nouveau-plan`, `/cadrer`, `/maj-workflow`, `verificateur-plan` | Sonnet | medium | — | S4 | `plugin/skills/nouveau-plan/`, `plugin/skills/cadrer/SKILL.md`, `plugin/skills/maj-workflow/SKILL.md`, `plugin/agents/verificateur-plan.md` | [ ] |
| [S8](S8.md) | T18-T20 | Périphérie : gabarits, migration, README, évals | Sonnet | medium | — | S5, S6, S7 | `plugin/templates/`, `plugin/skills/nouveau-projet/SKILL.md`, `plugin/skills/migrer-projet/SKILL.md`, `plugin/MIGRATION.md`, `plugin/README.md`, `plugin/evals/`, `docs/analyses/2026-09-<jj>-evals-p6.md` (nouveau) | [ ] |
| [S10](S10.md) | T23 | Le moteur d'actions de `prochaine-action.mjs` | Sonnet | **high** | — | S2 | `plugin/bin/prochaine-action.mjs`, `tests/tester-scripts.mjs`, `tests/fixtures/plans/` | [x] (2026-09-17) |
| [S9](S9.md) | T21-T22 | Clôture : version, CHANGELOG, publication taguée | Haiku | low | — | S8 | `plugin/.claude-plugin/plugin.json`, `CHANGELOG.md`, `plans/P6/index.md` | [ ] |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->
<!-- Vocabulaire complet : WORKFLOW.md §4a — ne pas inventer d'autre marque ici. -->

Effort d'orchestration attendu : **high** (S2, S10, S4, S5 — le sous-agent hérite de l'effort ambiant).

## Ordonnancement

- **Vague 1** : S1.
  *Pourquoi maintenant* : quatre choix du plan dépendent de ce que le harnais fait réellement ; les
  écrire sur une supposition, c'est le mode d'échec dominant du workflow.
  - **S1** — `pastille` : à dérouler à la main en Desktop (deux sondes demandent `/tasks` et une
    session cloud). Tu obtiens un tableau « hypothèse → constat » dans `docs/analyses/`, et ce poste
    charge enfin le plugin à jour : l'avertissement fantôme « STATUS.md 136 commits de retard »
    disparaît au démarrage.
- **Vague 2 — parallélisable** : S2 · S3 (zones disjointes, aucune dépendance entre elles).
  *Pourquoi maintenant* : la norme de la vague 4 cite ces scripts et ces hooks par leur nom et leur
  sortie ; les écrire après reviendrait à documenter du code qui n'existe pas.
  - **S2** — `node plugin/bin/n0.mjs` rend « tester-hooks → PASS » en trois lignes sans lancer de
    sous-agent, et `prochaine-action.mjs P5 --etat` décrit en JSON les neuf sessions d'un plan réel.
    Tu le vérifies en lançant `node tests/tester-scripts.mjs`.
  - **S3** — une session qui rend la main avec des commits non poussés est refusée par le hook ;
    un projet vendoré en retard le dit en une ligne au démarrage ; chaque publication pose un tag
    `v<version>` sur le dépôt public.
- **Vague 3** : S10 (après S2).
  *Pourquoi maintenant* : le moteur s'écrit sur un parseur déjà éprouvé contre des index réels ;
  les deux d'un bloc dépassaient ce qu'une session tient sans se relire (critique du plan).
  - **S10** — `node plugin/bin/prochaine-action.mjs P<n>` répond en une ligne quoi faire ensuite
    sur un plan : lancer telle vague, reprendre telle session en tel modèle, pousser, poser une
    question. Onze situations rejouées par les tests.
- **Vague 4 — validation-humaine** : S4 (après S3 et S10).
  *Pourquoi maintenant* : toutes les skills de la vague 5 renvoient à `WORKFLOW.md` ; les réécrire
  avant lui ferait renvoyer vers des paragraphes qui vont disparaître.
  - **S4** — `WORKFLOW.md` passe de 709 à moins de 300 lignes et dit les nouvelles règles :
    autonomie par défaut, push à chaque fin de session, exploration orchestrable, séquentiel par
    défaut. **À juger par toi** : relire le fichier — une règle manque-t-elle, une formulation
    trahit-elle ce qui a été décidé ? C'est le texte dont tout le reste dépend.
- **Vague 5 — parallélisable** : S5 · S6 · S7 (après S4 ; zones disjointes).
  *Pourquoi maintenant* : la norme est relue ; les trois familles de skills s'y alignent sans se
  marcher dessus.
  - **S5** — l'orchestrateur ne décide plus : il appelle le script, exécute l'action rendue, pousse
    après chaque vague. La skill passe de 570 lignes (annexe comprise) à moins de 250.
  - **S6** — `/fin-de-tache` ne charge plus que ~60 lignes à chaque tâche ; la revue se fait une
    fois par vague ; une session peut tester trois hypothèses avant d'échouer ; l'agent
    `verificateur-n0` n'existe plus.
  - **S7** — un plan neuf naît avec une latitude par défaut, sa version de workflow, des sessions
    regroupées par lectures partagées et, si besoin, une session d'exploration ; `/cadrer` peut
    sonder ; `/maj-workflow` se déroule seule quand rien n'a dérivé.
- **Vague 6** : S8 (après S5, S6, S7).
  *Pourquoi maintenant* : gabarits, migration et évals décrivent le comportement final — ils ne
  peuvent s'écrire qu'une fois les skills stabilisées.
  - **S8** — un projet neuf ou migré reçoit son `.claude/n0.json` ; `MIGRATION.md` dit quoi faire en
    passant à 0.39.0 ; trois évals rejouent les deux pannes mesurées et comparent Haiku à Sonnet en
    orchestrateur — le résultat est un tableau dans `docs/analyses/`.
- **Vague 7 — clôture** : S9 (après S8).
  *Pourquoi maintenant* : tout est relu et testé, il reste à numéroter et publier.
  - **S9** — plugin 0.39.0 publié et tagué ; `CHANGELOG.md` à jour ; un seul push.
