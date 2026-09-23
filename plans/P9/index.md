# Plan P9 — Revue d'usage par le navigateur in-app, brief tenu par les décisions   (rédigé par Opus)

Workflow : v0.41.0

## Objectif d'ensemble
Aujourd'hui, rien ne parcourt une application en marche comme le ferait un utilisateur, et le brief
d'un projet se périme en silence au fil des décisions. À la fin : `/revue-d-usage` a tourné pour de
vrai sur Chords. Elle a rendu, après une interview, ce qui casse, ce qui gêne et ce qui n'est pas
accessible, et elle ne propose de l'esthétique que si on le lui demande. Chaque décision dit ce
qu'elle change dans le brief, et `/nouveau-plan` refuse de s'écrire contre un brief qu'une décision a
contredit. La version 0.42.0 est publiée.
Décisions : `docs/decisions/2026-09-23-revue-d-usage.md` ·
`docs/decisions/2026-09-23-brief-tenu-par-les-decisions.md`.

**Risques du plan** :
- L'agent nommé `parcoureur-usage` garde les outils du navigateur in-app. La sonde du 2026-09-23 l'a
  vérifié avec l'agent `general-purpose`, pas avec un agent au frontmatter restreint. Réfuté si,
  lancé depuis la skill, il ne voit pas `mcp__Claude_Browser__*` : le repli déjà écrit dans la
  skill s'applique (parcours joués dans la session principale).
- La description de la skill ne capte pas les demandes de `/verif-visuelle`. Réfuté si le cas
  négatif de l'éval (S3) déclenche `/revue-d-usage` : la description est à reprendre avant de
  publier.

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T3 | La skill complète, ses grilles et son agent de parcours | Opus | high | — | — | `plugin/skills/revue-d-usage/` (nouveau) · `plugin/agents/parcoureur-usage.md` (nouveau) | [x] (2026-09-23) | T1 `feat(revue-d-usage): grilles Nielsen et WCAG AA observables au navigateur in-app` · T2 `feat(revue-d-usage): skill, parcours-types et gabarit de rapport` · T3 `feat(agents): parcoureur-usage, un parcours joué, constats rendus` |
| [S2](S2.md) | T4-T6 | Le brief suit les décisions | Sonnet | high | — | — | `plugin/bin/brief-a-jour.mjs` (nouveau) · `tests/tester-scripts.mjs` · `plugin/templates/DECISIONS.md` · `plugin/skills/cadrer/SKILL.md` · `plugin/skills/fin-de-tache/references/fin-de-plan.md` · `plugin/agents/verificateur-plan.md` · `plugin/skills/nouveau-plan/SKILL.md` | [x] (2026-09-23) | T4 `feat(bin): brief-a-jour, décisions non reportées dans le brief` · T5 `feat(cadrer): ligne Brief appliquée dans le commit de la décision` · T6 `feat(verificateur-plan): onzième contrôle, brief à jour des décisions` |
| [S3](S3.md) | T7-T8 | Aiguillages et éval de déclenchement | Sonnet | medium | — | S1 | `plugin/WORKFLOW.md` · `plugin/CLAUDE-BASE.md` · `plugin/skills/verif-visuelle/SKILL.md` · `plugin/skills/revue-de-conception/SKILL.md` · `plugin/templates/VALIDATION.md` · `README.md` · `plugin/evals/revue-d-usage-jalon/` (nouveau) · `plugin/evals/verif-visuelle-pas-revue-d-usage/` (nouveau) · `docs/analyses/2026-09-23-eval-revue-d-usage.md` (nouveau) · `docs/analyses/evals-23.json` (nouveau) · `description` de `plugin/skills/revue-d-usage/SKILL.md` si l'éval l'exige | [x] (2026-09-23) | T7 `docs(workflow): /revue-d-usage aiguillée, exception N2 écrite` · T8 `test(evals): déclenchement de /revue-d-usage, cas positif et négatif` |
| [S4](S4.md) | T9 | Publier 0.42.0 | Sonnet | low | — | S1, S2, S3 | `plugin/.claude-plugin/plugin.json` · `CHANGELOG.md` · `plugin/MIGRATION.md` · `plugin/skills/fin-de-tache/references/fin-de-plan.md` · `TASKS.md` | [ ] | — |
| [S5](S5.md) | T10 | Déroulé réel sur Chords | Sonnet | medium | — | S4 | dépôt Chords (workflow vendoré, sorties de la revue) · `plans/P9/S5.md` (bilan) | [ ] | — |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->
<!-- Vocabulaire complet : WORKFLOW.md §4a — ne pas inventer d'autre marque ici. -->

## Ordonnancement
- **Vague 1 — parallélisable** : S1 · S2 (zones disjointes, aucune dépendance).
  *Pourquoi maintenant* : S3 aiguille vers une skill qui doit exister, S4 publie les deux chantiers.
  S2 ne touche rien de ce qu'écrit S1 et prend moins de temps : elle tourne pendant S1, qui est la
  plus longue, et le plan y gagne une session d'horloge.
  - **S1** — La skill `/revue-d-usage` existe. On la lance à un jalon, elle propose un périmètre et
    attend ton « go », puis elle joue chaque parcours dans le navigateur de Desktop. Elle écrit ce
    qu'elle trouve au fil de l'eau dans un rapport, et dans `TASKS.md` / `VALIDATION.md` selon la
    nature du constat. Visible en lisant `plugin/skills/revue-d-usage/`. Le vrai essai se fait en S5.
  - **S2** — Toute décision porte désormais une ligne `Brief :`. `/cadrer` l'applique au brief dans
    le même commit, et un nouveau contrôle arrête `/nouveau-plan` quand une décision n'a pas été
    reportée. La clôture d'un plan coche aussi la roadmap du brief. Visible dans
    `node tests/tester-scripts.mjs` : cinq cas nouveaux, sur de vrais dépôts git jetables.
- **Vague 2** : S3 (après S1).
  *Pourquoi maintenant* : les aiguillages nomment ce que S1 a réellement écrit, et l'éval mesure la
  description de la skill telle qu'elle est. Écrits avant, ils décriraient une skill supposée.
  - **S3** — Les portes d'entrée renvoient à la nouvelle skill : les règles de validation (qui
    admettent qu'on te propose, à ta demande, un avis sur le N2), `/verif-visuelle`,
    `/revue-de-conception`, `VALIDATION.md` et le README. Une éval montre que « fais une revue
    d'usage » déclenche la skill, et que « vérifie cet écran » ne la déclenche pas. Résultat écrit
    dans `docs/analyses/`.
- **Vague 3** : S4 (après toutes).
  *Pourquoi maintenant* : on ne publie qu'une fois l'éval écrite et positive. Sans ça, les projets
  recevraient une skill qui capte les demandes de `/verif-visuelle`.
  - **S4** — La version 0.42.0 est publiée et installée sur ce poste. `CHANGELOG.md` dit ce qui
    change pour un projet.
- **Vague 4 — `validation-humaine` · `reprise-manuelle`** : S5 (après S4). **À lancer toi-même, une
  fois clos le plan en cours sur Chords.**
  *Pourquoi maintenant* : c'est la preuve demandée par la décision, sur une vraie application et
  avec la version publiée. Elle ne peut venir qu'en dernier, et seulement avec toi présent pour
  l'interview.
  - **S5** — **pastille** — Chords passe en 0.42.0, puis `/revue-d-usage` s'y déroule avec toi. Chords
    y gagne un rapport dans `docs/revues/`, ses défauts dans son `TASKS.md` et, si tu choisis la
    passe esthétique, des propositions dans son `VALIDATION.md`. Le bilan vérifie cinq points de
    forme, et tu juges si la revue t'a servi.
- **Vague 5 — clôture** : contexte (`STATUS.md`, `TASKS.md`, `VALIDATION.md`) et push. Pas de
  commits de code à rattraper : chaque session a commité les siens.
