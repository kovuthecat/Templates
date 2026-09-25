# Plan P7 — L'effort d'une session vient de son agent   (rédigé par Opus)

Workflow : v0.39.1

Clos : 2026-09-24

Revues S2-S4 non faites, plan publié en 0.40.0.

## Objectif d'ensemble

Aujourd'hui, la colonne « Effort » de l'index est lue, affichée, recopiée dans chaque `S<k>.md` — et
jamais appliquée : toutes les sessions d'une vague tournent à l'effort de la conversation qui les
orchestre. À la fin de ce plan, chaque session tourne à l'effort écrit sur sa ligne, sans qu'aucun
humain n'ait à régler quoi que ce soit avant une vague — et un effort qui n'existe pas arrête la
vague en le disant, au lieu de se dégrader en silence.

**Risques du plan** :
- *L'`effort:` du frontmatter d'un agent nommé s'applique-t-il bien à une session d'**arrière-plan**
  lancée par `subagent_type` ?* Documenté (`model-config` § *Set the effort level* : le frontmatter
  prime le niveau de session, lequel se résout via `modelSettings`) et déjà utilisé par
  `critique-plan`, mais jamais observé ici. **Réfuté si** `/tasks` affiche, pour un `session-low`
  lancé depuis une conversation réglée `medium`, l'effort de la conversation. C'est le N2 de S1.
- *`CLAUDE_CODE_EFFORT_LEVEL` bat le frontmatter* (seule source qui le batte). Le gabarit ne pose que
  `CLAUDE_CODE_SUBAGENT_MODEL` — **réfuté si** un projet aval exporte cette variable ; le mécanisme y
  serait inopérant, sans erreur.
- *Le corps d'un agent nommé au corps minimal ne restreint pas la session par rapport au générique
  `claude`.* Mitigation intégrée : corps volontairement vide de tout rôle, tout le pilotage restant
  dans le prompt de lancement, inchangé. **Réfuté si** une session lancée en `session-<effort>` se
  comporte autrement qu'une session lancée en `claude` à périmètre égal.

## Sessions

| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1 | Les quatre agents de session | Haiku | low | — | — | `plugin/agents/` (4 fichiers créés) | [x] | `feat(agents): quatre agents de session porteurs d'effort` |
| [S2](S2.md) | T2-T4 | Le moteur : effort normalisé, validé, transmis | Sonnet | high | — | S1 | `plugin/bin/prochaine-action.mjs` · `tests/tester-scripts.mjs` · `tests/fixtures/plans/` | [x] (2026-09-18) | — |
| [S3](S3.md) | T5-T7 | Le lancement compose le `subagent_type` | Sonnet | medium | — | S2 | `plugin/skills/orchestrer-plan/SKILL.md` · `plugin/skills/orchestrer-plan/references/remediation.md` | [x] (2026-09-18) | — |
| [S4](S4.md) | T8-T10 | Les textes disent ce que le code fait | Sonnet | medium | — | S1 | `plugin/WORKFLOW.md` · `plugin/skills/nouveau-plan/SKILL.md` · `plugin/templates/project-settings.json` · `plugin/README.md` | [x] (2026-09-18) | — |
| [S5](S5.md) | T11 | Version, CHANGELOG, publication | Haiku | low | — | S2, S3, S4 | `plugin/.claude-plugin/plugin.json` · `CHANGELOG.md` · `plugin/MIGRATION.md` | [x] 2026-09-24 | — |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->

## Ordonnancement

- **Vague 1 — `validation-humaine`** : S1.
  *Pourquoi maintenant* : les agents doivent exister **et être commités** avant tout le reste, parce
  que rien ne peut s'en servir dans la session qui les crée — la liste des agents est chargée au
  démarrage d'une session, jamais relue à chaud (`docs/analyses/2026-09-17-sondes-p6.md:24-26`). La
  vague s'arrête ensuite pour de bon : la conversation qui orchestre P7 a elle aussi chargé sa liste
  avant S1, et c'est dans une conversation **neuve** que la sonde du N2 se fait, puis que la vague 2
  se lance.
  - **S1** — quatre nouveaux agents apparaissent dans `plugin/agents/`, un par niveau d'effort. Rien
    ne change encore dans le comportement du workflow : ce sont des porteurs de réglage, inertes tant
    que personne ne les lance. Vous saurez que ça marche en lançant `session-low` depuis une
    conversation réglée autrement et en lisant l'effort dans `/tasks`.

- **Vague 2** : S2, puis S3, puis S4 (séquentiel).
  *Pourquoi maintenant* : S2 change la charge utile que S3 consomme (l'action `relire` doit porter
  l'effort avant que le lancement puisse le transmettre au relecteur) ; S4 ne dépend que de S1 mais
  décrit ce que S2 et S3 viennent de faire, et le décrire avant serait écrire une norme sur du code
  qui n'existe pas. **À relancer depuis une conversation neuve** (voir vague 1).
  - **S2** — le moteur cesse de rendre « règle ton effort », valide la colonne Effort au lieu de la
    recopier telle quelle, et transmet l'effort de chaque session à la revue. Vous le verrez à un
    index portant un effort inconnu : la vague ne se lance plus, elle vous le dit.
  - **S3** — l'orchestrateur lance chaque session sur l'agent correspondant à son effort, remédiation
    comprise. Là où les agents du plugin ne sont pas chargés, il replie sur le comportement
    d'aujourd'hui **en l'annonçant**, au lieu de rester muet.
  - **S4** — `WORKFLOW.md`, `/nouveau-plan` et les gabarits cessent d'expliquer comment contourner un
    héritage qui n'existe plus, et le décompte des agents redevient juste.

- **Vague 3 — clôture** : S5. Contexte et publication. Pas de commits de code à rattraper : chaque
  session a commité les siens.
