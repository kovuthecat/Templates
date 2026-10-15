# Plan P19 — Fondations : bugs de la revue externe, tests en CI, mesure de référence   (rédigé par Opus)

Workflow : v0.65.0
Preuve N0 : requise

## Objectif d'ensemble
La revue du 2026-10-13 a reproduit des bugs qui peuvent effacer une modification locale, faire
boucler ou relancer à tort l'orchestration, ou laisser passer un staging global. À la fin de P19,
ces bugs sont corrigés avec un test chacun, chaque suite de tests tourne une seule fois en N0 et
toutes tournent en CI, le poste signale un plugin installé en retard, et une **mesure de référence**
du coût d'un plan joué de bout en bout existe : c'est sur elle que le plan 2 (simplification) sera
écrit, puis jugé. Le tout est publié en 0.66.0.
Décision : `docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md` (§ Les
deux plans, plan 1) ; constats numérotés : `docs/revues/2026-10-13-revue-externe-workflow.md`.
Remédiation Opus : 1
Clos : 2026-10-15

**Risques du plan** : H1 — un `claude -p` qui déroule `/orchestrer-plan` sur un mini-projet jetable
va jusqu'au bout sans humain (outil `Agent` disponible, agents du plugin résolus par
`--plugin-dir`, push vers un dépôt nu local). Ce qui le réfuterait : le scénario nominal de S6
s'arrête sur un outil refusé, un agent introuvable ou un push impossible, après une mise au point.
H2 — le coût rendu par `claude -p` (`total_cost_usd`) inclut les sous-agents. Ce qui le
réfuterait : le `modelUsage` du résultat ne contient que le modèle de l'orchestrateur alors que des
sessions ont tourné sur un autre.

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1 | Purge de DECISIONS.md | Haiku | medium | — | — | `DECISIONS.md` · `docs/decisions/archives.md` | [x] 2026-10-14 | — |
| [S2](S2.md) | T2 | /maj-workflow n'écrase plus une dérive | Sonnet | medium | — | S1 | `plugin/bin/sync-workflow.mjs` · `plugin/bin/publier.mjs` · `plugin/skills/maj-workflow/SKILL.md` · `tests/tester-scripts.mjs` | [x] 2026-10-14 | — |
| [S3](S3.md) | T3-T5 | Moteur : historique partiel, compteurs depuis git, revue sans couverture | Sonnet | high | — | S2 | `plugin/bin/prochaine-action.mjs` · `plugin/bin/preuve-n0.mjs` · `plugin/skills/reprendre-echec/SKILL.md` · `plugin/skills/orchestrer-plan/references/remediation.md` · `tests/tester-scripts.mjs` · `tests/fixtures/plans/` | [x] 2026-10-14 | — |
| [S4](S4.md) | T6-T8 | Garde-fou git, skills qui poussent, plugin en retard signalé | Sonnet | medium | — | S3 | `plugin/hooks/pretooluse-git.mjs` · `plugin/hooks/sessionstart-contexte.mjs` · `plugin/skills/purge-contexte/SKILL.md` · `plugin/skills/revue-de-conception/SKILL.md` · `tests/tester-hooks.mjs` | [x] 2026-10-14 | — |
| [S5](S5.md) | T9-T10 | N0 sans doublon, tests en CI | Sonnet | medium | — | S4 | `plugin/bin/publier.mjs` · `.claude/n0.json` · `.github/workflows/plugin.yml` · `tests/tester-scripts.mjs` · `tests/tester-hooks.mjs` · `tests/tester-renvois.mjs` · `tests/tester-preuves.mjs` · `tests/tester-mods.mjs` | [x] 2026-10-14 | — |
| [S6](S6.md) | T11-T13 | Scénarios de bout en bout et mesure de référence | Sonnet | high | — | S5 | `tests/scenarios/` · `docs/analyses/2026-10-14-mesure-de-reference.md` · `plugin/evals/` | [x] 2026-10-15 | — |
| [S7](S7.md) | T14 | Publication 0.66.0 | Haiku | medium | — | S6 | `plugin/.claude-plugin/plugin.json` · `plugin/mods/garde-fous/.claude-plugin/plugin.json` · `plugin/mods/affichage/.claude-plugin/plugin.json` · `CHANGELOG.md` · `docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md` | [x] 2026-10-15 | — |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : tant que le registre dépasse son plafond, chaque session du plan démarre
  avec l'alerte d'archivage dans son contexte.
  - **S1** — Le registre des décisions repasse sous 150 lignes ; les décisions anciennes sont
    déplacées dans les archives, rien n'est supprimé. L'alerte « DECISIONS.md : 162/150 » disparaît
    du démarrage des sessions.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : les correctifs passent avant la mesure de S6 — sinon le plan 2 serait
  jugé contre des bugs plutôt que contre sa simplification ; celui-ci d'abord, parce qu'il fait
  perdre du travail dans les projets à chaque mise à jour.
  - **S2** — Une modification locale d'un fichier du workflow, dans un projet, reste signalée à
    chaque mise à jour au lieu d'être écrasée au troisième passage ; un manifeste abîmé arrête la
    mise à jour avec un message au lieu de la faire planter. Tu le verras à un nouveau test qui
    joue trois passages.
- **Vague 3** : S3 (après S2).
  *Pourquoi maintenant* : les scénarios de S6 jouent l'échec, la reprise et la relecture
  incomplète : ils doivent rencontrer le moteur corrigé, pas ses boucles.
  - **S3** — L'orchestration ne relance plus une session déjà faite sur un clone à historique
    partiel, ne boucle plus sur une ligne écrite avec un accent, ne remet plus ses budgets à zéro
    quand un échec est résolu, et traite une relecture mal formée comme à refaire. Tu le verras aux
    nouveaux cas de test du moteur, et à la liste des vieilles relectures des projets à surveiller.
- **Vague 4** : S4 (après S3).
  *Pourquoi maintenant* : le garde-fou git et le hook Stop tournent pendant les scénarios de S6 ;
  et ce poste doit savoir qu'il charge une vieille version avant qu'on y mesure quoi que ce soit.
  - **S4** — `git add` refuse toutes les formes de staging global (`-- .`, `:/`, `-u`, `*`…) et
    `git commit --amend -a` est refusé ; `/purge-contexte` pousse son commit ; au démarrage d'une
    session dans ce dépôt, un plugin installé plus ancien que la source est signalé, y compris le
    doublon dû à la casse du chemin (`kovu` / `Kovu`) qui a laissé ce poste en 0.55.0.
- **Vague 5** : S5 (après S4).
  *Pourquoi maintenant* : S5 touche les suites de tests que S2 à S4 viennent d'enrichir ; la CI les
  prend une fois complètes, et S6 profite d'une N0 deux fois plus courte.
  - **S5** — La N0 de ce dépôt ne lance plus chaque suite deux fois et ne laisse plus de copie du
    plugin dans le dossier temporaire ; sur GitHub, un test cassé fait passer la vérification au
    rouge. Tu le verras à la durée de la N0 et à un passage de CI rouge provoqué puis vert.
- **Vague 6** : S6 (après S5).
  *Pourquoi maintenant* : la référence se prend une fois les correctifs en place, et avant toute
  simplification — c'est elle qui chiffrera les gains du plan 2.
  - **S6** — Quatre petits plans réels (parcours normal, échec puis reprise, interruption puis
    relance, relecture incomplète) se jouent de bout en bout sur un projet jetable, par une seule
    commande. Le fichier `docs/analyses/2026-10-14-mesure-de-reference.md` donne pour chacun le coût,
    les interventions humaines, les relances inutiles et la validité des preuves. Les anciennes
    évaluations `plugin/evals/` sont retirées.
- **Vague 7** : S7 (après S6).
  *Pourquoi maintenant* : les projets ne reçoivent les correctifs qu'à la publication, au prochain
  `/maj-workflow`.
  - **S7** — Le workflow 0.66.0 est publié et installé sur ce poste ; la décision note le plan 1 fait
    et pointe la mesure de référence, prête pour l'écriture du plan 2.
- **Vague 8 — clôture** : contexte (`TASKS.md`) et push. Pas de commits de code à rattraper :
  chaque session a commité les siens.
