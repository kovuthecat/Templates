# Plan P17 — Les règles d'un projet validées à sa création, l'outillage N0 complet dès le départ   (rédigé par Opus)

Workflow : v0.60.0
Preuve N0 : requise

## Objectif d'ensemble
Aujourd'hui, `/nouveau-projet` pose seul des interdits et des chiffres qui bloquent ensuite les
plans (51 blocages dans 21 projets), et laisse `n0.json` et les permissions à plus tard. À la fin de
P17, l'interview te soumet chaque règle avant de l'écrire, avec son motif et sa condition de levée.
Les règles vivent dans un seul fichier, `CLAUDE.md`, et une décision qui en change une doit le
mettre à jour, sinon le `/nouveau-plan` suivant le signale. Un projet naît avec ses commandes N0 et
des permissions qui suivent sa stack. Un projet sans aucune commande écrit `Preuve N0 : non requise`
au lieu de buter sur N0 (J14). Le tout est publié en 0.61.0.
Décision : `docs/decisions/2026-10-08-regles-de-projet-validees.md` (points 1 à 5) ; inventaire :
`docs/analyses/2026-10-08-regles-projets-inventaire.md` § 2.

**Choix pris au cadrage, validés par toi le 2026-10-08.**
- Le contrôle du point 5 (une décision qui amende une règle met `CLAUDE.md` à jour) est fait par le
  script `brief-a-jour.mjs`, lancé à chaque `/nouveau-plan`, et non par le relecteur. Le relecteur
  ne voit ni les commits de `/cadrer` ni les commits sans code, donc il ne verrait presque jamais
  ces décisions. Revers : l'écart n'apparaît qu'au plan suivant.
- Un projet « sans commande » doit l'écrire, avec son motif, dans `.claude/n0.json`
  (`"sansCommande"`). Une liste vide seule ne suffit pas. Revers : une clé de plus à remplir pour un
  projet documentaire.

**Risques du plan** : `—` (aucune hypothèse comportementale : les cinq sessions modifient des
textes et des scripts testés en isolation).

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Preuve N0 non requise pour un projet sans commande (J14) | Sonnet | high | — | — | `plugin/bin/n0.mjs` · `plugin/bin/verifier-plan.mjs` · `plugin/skills/nouveau-plan/SKILL.md` · `plugin/skills/nouveau-plan/references/squelette-index.md` · `plugin/skills/nouveau-plan/references/squelette-session.md` · `plugin/EXECUTANT.md` · `plugin/CLAUDE-BASE.md` · `plugin/skills/fin-de-tache/SKILL.md` · `plugin/skills/reprendre-echec/SKILL.md` · `tests/tester-preuves.mjs` · `tests/tester-scripts.mjs` | [x] 2026-10-08 | — |
| [S2](S2.md) | T3 | Permissions dérivées de la stack, allow en retard signalé | Sonnet | medium | — | S1 | `plugin/templates/project-settings.json` · `plugin/bin/sync-workflow.mjs` · `plugin/skills/maj-workflow/SKILL.md` · `tests/tester-scripts.mjs` | [ ] | — |
| [S3](S3.md) | T4-T5 | Interview : règles validées une à une, commandes et n0.json à l'instanciation, gabarits | Sonnet | high | — | S2 | `plugin/skills/nouveau-projet/SKILL.md` · `plugin/templates/PROJECT_BRIEF.md` · `plugin/templates/CLAUDE.md` · `plugin/templates/ARCHITECTURE.md` · `plugin/templates/DESIGN_SPEC.md` · `plugin/skills/cadrer/references/deplier-une-idee.md` | [x] 2026-10-08 | — |
| [S4](S4.md) | T6 | Une règle, un fichier : ligne `Règles :` des décisions contrôlée | Sonnet | medium | — | S3 | `plugin/templates/DECISIONS.md` · `plugin/bin/brief-a-jour.mjs` · `plugin/skills/cadrer/SKILL.md` · `plugin/skills/nouveau-plan/SKILL.md` · `plugin/agents/verificateur-plan.md` · `tests/tester-scripts.mjs` | [ ] | — |
| [S5](S5.md) | T7 | Publication 0.61.0 | Sonnet | medium | — | S4 | `plugin/.claude-plugin/plugin.json` · `plugin/mods/garde-fous/.claude-plugin/plugin.json` · `plugin/mods/affichage/.claude-plugin/plugin.json` · `CHANGELOG.md` | [ ] | — |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->

## Ordonnancement
Une session par vague : S1, S3 et S4 modifient tous `/nouveau-plan` ou ses tests, et S3 s'appuie
sur ce que S1 et S2 définissent (séquentiel par défaut).

- **Vague 1** : S1.
  *Pourquoi maintenant* : S3 fait écrire `n0.json` à l'instanciation, y compris sa forme « sans
  commande » ; ce contrat doit exister et être accepté par les scripts avant que l'interview ne le
  produise.
  - **S1** — Un plan de projet sans aucune commande peut porter `Preuve N0 : non requise`, à
    condition que `.claude/n0.json` dise pourquoi. Ses tâches ne lancent plus N0 en fin de tâche.
    Un plan de projet de code qui l'écrirait est refusé par la vérification du plan. Tu le verras
    aux nouveaux cas de test verts.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : S3 renvoie au gabarit de permissions réécrit ici ; l'interview ne peut
  pas citer une règle qui n'existe pas encore.
  - **S2** — Le gabarit de permissions ne dit plus « jamais par précaution » : les commandes de la
    stack, runner de tests compris, s'y écrivent dès la création. `/maj-workflow` signale, dans un
    projet existant, les permissions du workflow qui manquent (`git push`, `n0.mjs`…), sans rien
    écrire seul.
- **Vague 3** : S3 (après S2).
  *Pourquoi maintenant* : c'est le cœur de la décision ; il s'écrit sur les contrats posés par S1
  et S2.
  - **S3** — `/nouveau-projet` pose la question des interdits, puis te soumet chaque règle une par
    une (garder, assouplir, retirer) avant d'écrire quoi que ce soit. Les règles vont dans
    `CLAUDE.md`, que le brief, l'architecture et le design citent sans recopier. Les commandes et
    `n0.json` s'écrivent ensemble à la création. Le bloc « Critères avant ajout de feature »
    disparaît du gabarit du brief.
- **Vague 4** : S4 (après S3).
  *Pourquoi maintenant* : le contrôle porte sur la section de `CLAUDE.md` dont S3 fait la source
  unique des règles.
  - **S4** — Une décision annonce, par une ligne `Règles :`, si elle change une règle. Si oui, et
    que `CLAUDE.md` n'a pas suivi, le prochain `/nouveau-plan` le signale comme un écart à
    corriger avant d'écrire le plan. Les anciennes décisions, sans cette ligne, ne sont pas
    signalées.
- **Vague 5** : S5 (après S4).
  *Pourquoi maintenant* : la publication emporte les quatre sessions ensemble ; les projets la
  reçoivent au prochain `/maj-workflow`.
  - **S5** — Le workflow 0.61.0 est publié et installé sur ce poste. Les projets le reçoivent au
    prochain `/maj-workflow`, qui signalera alors leurs permissions en retard.
- **Vague 6 — clôture** : contexte (`TASKS.md`, ligne « Plugin » de la revue des règles cochée) et
  push. Pas de commits de code à rattraper : chaque session a commité les siens.
