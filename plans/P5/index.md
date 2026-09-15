# Plan P5 — Réflexion outillée, critique avant approbation, flux lu par un agent   (rédigé par Opus)

## Objectif d'ensemble

Le cadrage décide sur ce qu'il a en tête, le plan est approuvé avant d'être contredit, et
l'exploration rend une carte de fichiers là où le plan demande un flux. À la fin : les garanties
décrites par les skills sont celles que le runtime tient ; un cadrage écrit sa grille de préparation
et ses inconnues typées avant de délibérer ; un plan architectural reçoit un `PASS` ou des constats
**avant** que l'utilisateur ne l'approuve ; une hypothèse comportementale se sonde ou s'écrit comme
risque au lieu de tuer un plan ; un flux se lit par un agent qui sépare faits, inférences et
inconnues ; et une publication échoue si une skill cite un agent absent.

Décision d'entrée : [`docs/decisions/2026-09-15-reflexion-outillee-critique-et-flux.md`](../../docs/decisions/2026-09-15-reflexion-outillee-critique-et-flux.md)
(cadrage clos — **aucun de ses arbitrages n'est à rejuger**). Elle porte le contrat de chaque
annexe, agent et assertion ; les `S<k>.md` y renvoient au lieu de le recopier.

**Risques du plan** (hypothèses comportementales non sondées — décision (d), appliquée à ce plan) :
- `effort:` en frontmatter d'agent est honoré sur la version installée — *réfuté si* `/tasks`
  n'affiche pas l'effort sur la ligne de `critique-plan` (S5 le sonde, T14). **Toujours ouvert après
  S5** : la sonde demandait une session interactive (`/tasks`), indisponible en sous-agent orchestré
  (`claude --version` constaté 2.1.270, ≥ 2.1.242 documenté, mais non exploitable sans `/tasks`).
  `effort: high` conservé sur `critique-plan.md` par prudence. À sonder à la main par le
  mainteneur avant de s'y fier.
- Claude Code ≥ 2.1.269 sur le poste au moment de S8 — *réfuté si* `claude --version` dit moins ;
  S8 s'arrête alors sur une contrainte d'outillage, sans rien écrire.

## Sessions

| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T3 | (a) Garanties exactes et référence de compatibilité | Sonnet | medium | — | — | `plugin/skills/cadrer/SKILL.md`, `plugin/skills/revue-de-conception/SKILL.md`, `docs/analyses/2026-09-12-conseils-anthropic-contexte-skills-verification.md`, `docs/references/claude-code-capabilities-2026-08.md` | [x] (2026-09-15) |
| [S2](S2.md) | T4-T6 | (b) Gabarits sans stack, contraintes avant stack | Sonnet | medium | — | — | `plugin/skills/nouveau-plan/references/squelette-index.md`, `plugin/agents/verificateur-plan.md`, `plugin/skills/nouveau-projet/SKILL.md` | [x] (2026-09-15) |
| [S3](S3.md) | T7-T9 | (g) Gates de publication étendues, agnix en rapport | Sonnet | medium | — | — | `tests/tester-renvois.mjs`, `tests/tester-hooks.mjs`, `docs/analyses/2026-09-<jj>-agnix-rapport.md` (nouveau) | [x] (2026-09-15) |
| [S4](S4.md) | T10-T13 | (c) Annexes de réflexion, appels dans `/cadrer` et `/nouveau-projet` | Sonnet | **high** | — | S1, S2 | `plugin/skills/cadrer/references/` (nouveau), `plugin/skills/cadrer/SKILL.md`, `plugin/skills/nouveau-projet/SKILL.md` | [x] (2026-09-15) |
| [S5](S5.md) | T14-T16 | (e)(f) Deux agents : `critique-plan` et `analyste-flux` | Sonnet | **high** | — | S1, S3 | `plugin/agents/critique-plan.md` (nouveau), `plugin/agents/analyste-flux.md` (nouveau), `plugin/WORKFLOW.md` §5, `plugin/README.md`, `plugin/skills/revue-de-conception/SKILL.md` | [x] (2026-09-15) |
| [S6](S6.md) | T17-T21 | (c)(d)(e)(f) `/nouveau-plan` : grille, existant, hypothèses typées, critique, flux | Sonnet | medium | — | S2, S4, S5 | `plugin/skills/nouveau-plan/SKILL.md`, `plugin/skills/nouveau-plan/references/squelette-index.md` | [ ] |
| [S7](S7.md) | T22-T25 | (d) L'échec côté prémisse comportementale | Sonnet | medium | — | S5 | `plugin/agents/verificateur-premisse.md`, `plugin/skills/reprendre-echec/SKILL.md`, `plugin/skills/orchestrer-plan/references/remediation.md`, `plugin/WORKFLOW.md` §9c | [ ] |
| [S8](S8.md) | T26-T27 | (g) Trois évals de déclenchement | Sonnet | medium | — | S6, S7 | `plugin/evals/` (nouveau), `docs/analyses/2026-09-<jj>-evals-premiere-passe.md` (nouveau) | [ ] |
| [S9](S9.md) | T28-T29 | Clôture : version, CHANGELOG, publication | Haiku | low | — | S8 | `plugin/.claude-plugin/plugin.json`, `CHANGELOG.md`, `plans/P5/index.md` | [ ] |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->
<!-- Vocabulaire complet : WORKFLOW.md §4a — ne pas inventer d'autre marque ici. -->

## Ordonnancement

- **Vague 1 — parallélisable** : S1 · S2 · S3 (zones disjointes, aucune dépendance).
  *Pourquoi maintenant* : ce sont des corrections de prémisses fausses et des gates ; tout ce qui
  suit cite un fichier que l'une d'elles touche, ou passe par une assertion que S3 pose.
  - **S1** — `/cadrer` et `/revue-de-conception` cessent d'annoncer qu'un shell est impossible ;
    la référence de compatibilité porte, datées, les cinq vérifications du 2026-09-15. À quoi on le
    verra : la note sous le frontmatter dit « un tour », et `disallowed-tools` y figure.
  - **S2** — le squelette d'index ne montre plus `css/` ni `index.html` ; `/nouveau-projet` demande
    les contraintes avant la stack, et rappelle d'adapter l'allowlist au langage retenu.
  - **S3** — retirer un agent cité, casser un frontmatter ou citer une annexe d'une autre skill qui
    n'existe pas fait échouer `node tests/tester-renvois.mjs`, donc la publication. Un rapport agnix
    trié dit ce qui mérite de devenir une assertion.

- **Vague 2 — parallélisable** : S4 · S5 (zones disjointes ; S4 attend S1 et S2, S5 attend S1 et S3).
  *Pourquoi maintenant* : S6 cite les annexes de S4 et les agents de S5 ; les écrire avant, c'est ce
  qui permet à S6 de passer l'assertion « ce qui est cité existe ».
  - **S4** — trois annexes lisibles à la demande : une grille de cinq lignes qu'un cadrage remplit
    avant de délibérer, six fiches de méthode derrière un `NONE` normal, et le protocole
    « chercher l'existant avant de développer ». `/cadrer` et `/nouveau-projet` les appellent.
  - **S5** — deux agents de plus dans `plugin/agents/` : le critique (Opus) qui rend `PASS` ou des
    constats avec cible et correction, et l'analyste de flux (Sonnet) qui sépare faits, inférences
    et inconnues. `WORKFLOW.md` §5 en compte neuf.

- **Vague 3 — parallélisable** : S6 · S7 (zones disjointes ; S6 attend S2, S4, S5 ; S7 attend S5).
  *Pourquoi maintenant* : `/nouveau-plan` est le point d'intégration de tout ce qui précède ; le
  côté échec (S7) touche `WORKFLOW.md` §9c que S5 a laissé libre.
  - **S6** — `/nouveau-plan` relit la grille de la décision, cherche l'existant sur les inconnues
    techniques, type ses hypothèses, classe le plan borné ou architectural, et lance le critique
    avant l'approbation. À quoi on le verra : un plan architectural affiche un `PASS` ou des
    constats numérotés avant la question « on écrit ? ».
  - **S7** — un rapport d'échec qui joint une mesure commitée ne repasse plus par la vérification de
    prémisse ; `verificateur-premisse` distingue « indécidable en lecture » de « comportemental ».

- **Vague 4** : S8 (après S6 et S7).
  *Pourquoi maintenant* : les évals mesurent le déclenchement des skills dans leur état final.
  - **S8** — trois cas d'évals tournent en vrai (`claude plugin eval`), plafonnés en coût ; le
    résultat est consigné, positif ou non. **Prérequis** : Claude Code ≥ 2.1.269 sur le poste.

- **Vague 5 — clôture** : S9. Bump `0.37.0`, `CHANGELOG.md`, statuts, publication vers le miroir
  public. Pas de commits de code à rattraper : chaque session a commité les siens.

## Particularités de ce dépôt

- **Templates est la source, pas un projet vendoré** : pas de hooks git, pas de `.claude/workflow/`.
  Les règles de commit par session (staging explicite, repère `Plan: P5/S<k>/T<m>`) s'appliquent
  **sur discipline** — aucun hook ne les rattrapera.
- **Pas de `TASKS.md` ni de `STATUS.md`** : le suivi vit dans cet index uniquement.
- **N0 du dépôt** : `node tests/tester-hooks.mjs && node tests/tester-renvois.mjs` (les deux doivent
  finir par `Tous les cas sont OK.`), puis `node plugin/bin/publier.mjs --dry-run` — qui fait un
  `git fetch origin` avant de construire le payload. Ni build ni typecheck.
- **S4 et S5 sont `high`, et l'effort ne suit pas le modèle au lancement d'un sous-agent** : l'outil
  `Agent` pose le modèle, jamais l'effort. Elles se lancent à la main —
  `claude -p "Ouvre plans/P5/S4.md et exécute-le." --model claude-sonnet-5 --effort high` — comme
  P4/S1. Les autres sessions sont au défaut de leur modèle : orchestrables.
- **Chaque `S<k>.md` renvoie à la décision d'entrée** pour le contrat détaillé de ce qu'il écrit.
  Une session qui trouve la décision et son `S<k>.md` en désaccord suit la décision et le signale
  dans son bilan.

## Hors périmètre du plan

- Tout ce que la décision écarte (R4, R8, R9, R11, RTK, Serena, Repomix, ccusage, corpus
  multi-dépôts, `plugin/references/` partagé, mode dans `explorateur`, appel du critique depuis
  `/cadrer`). Ne pas rouvrir.
- La synchronisation des projets vendorés après publication (`/maj-workflow`, geste du mainteneur).
- Le rapport `rapport-amelioration-workflow-claude-code.md` reste tel quel à la racine : c'est une
  entrée d'analyse, pas un fichier du workflow.
