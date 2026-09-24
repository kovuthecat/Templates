# Plan P10 — Fins de session à propriétaire unique, verrou réparé, régime économe pour Pro   (rédigé par Opus)

Workflow : v0.44.0

## Objectif d'ensemble
Aujourd'hui, dans tous tes projets, le verrou de vague ne protège rien. Une session orchestrée
peut perdre son verdict, ou supprimer les revues avant la fin du plan. Une coupure par quota
laisse le plan dans un état que personne ne sait reprendre.

À la fin du plan :
- un `git commit` sous `.claude/wave.lock` est refusé, y compris dans un dépôt dont le `.git` a
  été déplacé ;
- chaque geste de fin (verdict, commit des revues, clôture) n'a qu'un seul auteur ;
- une session coupée par le quota repart d'elle-même quand le quota revient ;
- la remédiation ne fait plus qu'une passe Opus par plan ;
- les consignes floues relevées par la revue sont réécrites ;
- 0.45.0 (le lot critique) puis 0.46.0 (le reste) sont publiées.

Décision : `docs/decisions/2026-09-24-revue-finale-et-regime-pro.md`. Détail des constats :
`docs/revues/2026-09-24-revue-finale-workflow.md` · `docs/incidents/2026-09-24-synthese.md`.

**Risques du plan** :
- `git worktree list` pourrait ne pas retrouver l'arbre principal d'un dépôt à `.git` déplacé,
  vu depuis un worktree lié. Réfuté si la sonde de S1 le retrouve. Sinon, le hook refuse par
  défaut, comme décidé.
- Le message d'une session coupée par le quota a été vu une seule fois (« session limit »,
  « Agent terminated early »). Réfuté si une vraie coupure produit un autre texte : le motif de
  détection est à élargir, et l'incident le dira.

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T3 | Racine du dépôt et garde du verrou | Sonnet | high | — | — | `plugin/hooks/` · `plugin/bin/collecter-incidents.mjs` · `plugin/bin/prochaine-action.mjs` (fonction `racineDepot` seulement) · `tests/tester-hooks.mjs` · `tests/tester-scripts.mjs` | [x] 2026-09-24 | — |
| [S2](S2.md) | T4-T6 | Contrat du script d'orchestration | Sonnet | high | — | S1 | `plugin/bin/prochaine-action.mjs` · `tests/tester-scripts.mjs` · `tests/fixtures/` · `plugin/skills/nouveau-plan/references/squelette-index.md` · `plugin/skills/nouveau-plan/references/squelette-session.md` · `plugin/skills/nouveau-plan/SKILL.md` (format de vague ajoutée) · `plugin/skills/reprendre-echec/SKILL.md` (gabarit) · `plugin/skills/orchestrer-plan/references/remediation.md` (natures, REFUTEE, escalade) | [x]! 2026-09-24 | — |
| [S3](S3.md) | T7-T8 | Fin de session orchestrée et relecture | Sonnet | high | — | S2 | `plugin/EXECUTANT.md` · `plugin/CLAUDE-BASE.md` · `plugin/skills/fin-de-tache/SKILL.md` · `plugin/skills/fin-de-tache/references/bloc-de-relance.md` · `plugin/skills/fin-de-tache/references/vague-parallele.md` · `plugin/agents/relecteur-session.md` · `plugin/agents/session-low.md` · `plugin/agents/session-medium.md` · `plugin/agents/session-high.md` · `plugin/agents/session-xhigh.md` · `plugin/skills/maj-workflow/SKILL.md` · `plugin/skills/verif-visuelle/SKILL.md` · `plugin/bin/publier.mjs` · `tests/tester-renvois.mjs` | [x] 2026-09-24 | — |
| [S4](S4.md) | T9-T12 | Orchestrateur, WORKFLOW, publication 0.45.0 | Sonnet | high | — | S3 | `plugin/skills/orchestrer-plan/` · `plugin/skills/fin-de-tache/references/fin-de-plan.md` · `plugin/WORKFLOW.md` · `plugin/.claude-plugin/plugin.json` · `CHANGELOG.md` · `plugin/MIGRATION.md` | [x] 2026-09-24 | — |
| [S5](S5.md) | T13-T14 | Clarté des skills de plan | Sonnet | medium | — | S4 | `plugin/skills/nouveau-plan/` · `plugin/skills/cadrer/` · `plugin/skills/reprendre-echec/` · `plugin/skills/revue-de-conception/` · `plugin/skills/migrer-projet/` · `tests/tester-renvois.mjs` · `tests/tester-scripts.mjs` (chemin du gabarit s'il déménage) | [ ] | — |
| [S6](S6.md) | T15-T16 | Clarté des agents et des petites skills | Sonnet | medium | — | S5 | `plugin/agents/verificateur-premisse.md` · `plugin/agents/verificateur-plan.md` · `plugin/agents/analyste-flux.md` · `plugin/agents/parcoureur-usage.md` · `plugin/skills/maj-workflow/SKILL.md` · `plugin/skills/nouveau-projet/SKILL.md` · `plugin/skills/purge-contexte/SKILL.md` · `plugin/skills/reprendre/SKILL.md` · `plugin/skills/revue-d-usage/` · `plugin/skills/nouveau-plan/SKILL.md` (décompte des contrôles, Étape 4b) · `plugin/WORKFLOW.md` (en-tête, glossaire, décomptes) | [ ] | — |
| [S7](S7.md) | T17-T18 | Ménage et publication 0.46.0 | Sonnet | low | — | S6 | `TASKS.md` · `plans/P6/S1.md` · `plans/P7/index.md` · `plans/P8/index.md` · `plans/P9/index.md` · `plugin/.claude-plugin/plugin.json` · `CHANGELOG.md` · `plugin/MIGRATION.md` | [ ] | — |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->
<!-- Vocabulaire complet : WORKFLOW.md §4a — ne pas inventer d'autre marque ici. -->

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : tant que la racine du dépôt est fausse, aucun verrou ni aucun signal de
  démarrage ne fonctionne. Le script de S2 en dépend, et tout test écrit avant serait vert pour de
  mauvaises raisons.
  - **S1** — Sous `.claude/wave.lock`, `git commit` et `git push` sont de nouveau refusés, `.git`
    déplacé compris. Les signaux de démarrage (version en retard, modèle hors plan, revues
    manquantes) se remettent à parler. Le collecteur d'incidents ne signale plus d'en-têtes
    incomplets à tort. Visible dans `node tests/tester-hooks.mjs` : des cas nouveaux sur un dépôt
    dont le `.git` est un fichier.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : les textes de S3 et S4 nomment des actions et des formats que seul ce
  script définit. Écrits avant, ils décriraient un script supposé.
  - **S2** — Le script d'orchestration lit les plans tels que les squelettes les écrivent, et un
    test le prouve sur les squelettes eux-mêmes. Il sait désormais quatre choses :
    - clore un plan ;
    - relancer une session coupée par le quota ;
    - refuser une deuxième passe Opus de remédiation dans le même plan ;
    - poser une question sur un filtre de contenu, un rebase en cours ou une session oubliée
      par les vagues.
- **Vague 3** : S3 (après S2).
  *Pourquoi maintenant* : S4 renvoie au bloc « session orchestrée » que S3 écrit. C'est lui que
  l'orchestrateur citera dans son prompt de lancement.
  - **S3** — Une session lancée par l'orchestrateur termine toujours par sa ligne `VERDICT:`, sans
    rien supprimer. Sous verrou, elle ne committe rien. Une session lancée à la main fait
    relire son travail et committe la revue. Le relecteur écrit son fichier dès son premier geste,
    en une seule passe.
- **Vague 4 — `validation-humaine`** : S4 (après S3).
  *Pourquoi maintenant* : la publication de 0.45.0 met le verrou réparé entre les mains des
  projets, et ebm-msp a une vague verrouillée en cours. L'arrêt qui suit est une contrainte
  d'outillage, pas un jugement : l'orchestrateur de cette conversation tourne sur le texte 0.44.0
  et ne connaît pas les actions ajoutées par S2. Ton geste :
  1. `claude plugin update workflow@templates --scope local` (S4 le lance, vérifie-le) ;
  2. `/clear` ;
  3. `/orchestrer-plan P10`, et réponds « oui » à la question de validation.
  - **S4** — L'orchestrateur committe lui-même les revues et clôt le plan. Il relance une session
    coupée par le quota, et il ne lance pas une deuxième passe Opus de remédiation dans le même
    plan. `WORKFLOW.md` le dit une seule fois. La version 0.45.0 est publiée et installée sur ce
    poste. À toi ensuite de lancer `/maj-workflow` dans ebm-msp.
- **Vague 5** : S5 (après S4).
  *Pourquoi maintenant* : ces réécritures s'appuient sur les noms d'actions et d'étapes que S2 et
  S4 viennent de fixer. Faites avant, elles renverraient encore dans le vide.
  - **S5** — Les skills de plan ne renvoient plus à des étapes qui n'existent plus, et un test
    l'empêche de revenir. Le seuil « encore un plan, ou `/cadrer` ? » tient en une seule règle.
    « gate » ne veut plus dire « attendre ton oui ».
- **Vague 6** : S6 (après S5).
  *Pourquoi maintenant* : même raison, et S6 écrit le glossaire des mots à double sens une fois
  les textes stabilisés.
  - **S6** — Les exemples du vérificateur de prémisse concluent enfin sur l'affirmation.
    `verificateur-plan` signale une tâche orchestrée qui modifierait les réglages de Claude Code.
    Les petites skills perdent leurs contradictions internes. `WORKFLOW.md` gagne un glossaire
    court.
- **Vague 7** : S7 (après S6).
  *Pourquoi maintenant* : on publie une fois tout écrit, et le ménage des plans précédents ne
  touche à rien que S1 à S6 modifient.
  - **S7** — `TASKS.md` ne porte plus que ce qui reste vraiment à faire, bloquants oubliés de
    P8 et P9 compris. P6, P7, P8 et P9 ont leurs statuts justes. La version 0.46.0 est publiée
    et installée.
- **Vague 8 — clôture** : contexte (`TASKS.md`) et push. Pas de commits de code à rattraper :
  chaque session a commité les siens.
