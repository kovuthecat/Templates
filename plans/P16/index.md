# Plan P16 — Les mods du workflow : garde-fous et affichage, installés partout sans geste   (rédigé par Opus)

Workflow : v0.55.0
Preuve N0 : requise

Clos : 2026-10-08 — rendu validé par l’utilisateur

## Objectif d'ensemble
Aujourd'hui les mods prouvés en P13 (modèle de l'index imposé, agents au premier plan par défaut,
ligne d'état) ne vivent que sur une branche de preuve, et les quatre mods prévus par `claude-mods`
(limites, fichiers, plan, incidents) n'existent pas. À la fin de P16, deux mini-plugins vivent dans
la source du workflow : **garde-fous** et **affichage**. Ils sont publiés à la version du workflow
et s'installent seuls dans Templates et dans chaque projet vendoré, au prochain `/maj-workflow` ou
`/migrer-projet`. Tu verras sous la saisie une ligne avec le plan en cours et tes limites 5 h et 7 j
avec leur heure de reset. Un panneau, visible aussi sur le téléphone, montrera les fichiers modifiés,
l'état du plan et des boutons de relance. Une commande `/incidents` rassemblera ceux de tous les projets.
Décisions : `docs/decisions/2026-10-06-apres-p15.md` (« Les mods », « Périmètre élargi »),
`docs/decisions/2026-10-06-suite-des-preuves-mods.md` (« Distribution des mods ») ; donnée
d'entrée : `C:\Users\Kovu\Projets\claude-mods\PROJECT_BRIEF.md`.

**Choix pris au cadrage, à contester si besoin.** Quand l'installation des mods échoue pendant
`/maj-workflow` ou `/migrer-projet`, l'échec est **signalé sans bloquer** : la mise à jour du
workflow se fait quand même, et chaque nouvelle session te rappelle la commande à lancer. En session
cloud, ce rappel se tait. Revers : un poste peut tourner sans garde-fous tant que tu ignores le
rappel. C'est acceptable parce que le premier garde-fou n'est qu'un filet : `/orchestrer-plan`
transmet déjà le modèle.

**Risques du plan** :
- Installer `--scope local` depuis `.claude/workflow/mods/` d'un projet vendoré pourrait ne pas charger
  le module dans une session neuve (K n'a prouvé que la voie plugin, sur une fixture). Réfuté si S4
  observe O1 agir dans un projet fixture, avec un témoin négatif quand les mods sont désactivés.
- Un dossier `mods/` à l'intérieur du plugin `workflow` (source `./`) pourrait gêner son chargement.
  Réfuté si, après la publication de S4, `claude plugin list` rend `workflow@templates` enabled à
  0.56.0 et si les skills restent chargées.
- La ligne d'état (`$.ui.status`) pourrait ne pas s'afficher dans Desktop. Le panneau pourrait être
  mal placé sur le téléphone : ouvert sans geste, il ne se place qu'à partir de 144 colonnes. Seul
  ton œil tranche, en S7. La commande `/panneau` l'ouvre sur un geste, en repli.
- La session OAuth du `claude` en ligne de commande peut avoir expiré, comme pendant K. S4 le vérifie
  en premier geste. Si elle a expiré, la session échoue pour une cause d'environnement, et
  `claude auth login` la lève.

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1 | Mini-plugin garde-fous (O1 filet de modèle, O3 premier plan par défaut) | Sonnet | medium | — | — | `plugin/mods/garde-fous/` | [x] 2026-10-07 | — |
| [S2](S2.md) | T2-T3 | Distribution : installeur, vendoring, publication, contrôle des mods | Sonnet | high | — | S1 | `plugin/bin/installer-mods.mjs` · `plugin/bin/sync-workflow.mjs` · `plugin/bin/publier.mjs` · `plugin/.claude-plugin/marketplace.json` · `plugin/mods/.gitignore` · `tests/tester-scripts.mjs` · `tests/tester-mods.mjs` · `.claude/n0.json` | [x] 2026-10-07 | — |
| [S3](S3.md) | T4-T5 | Mise en place par les skills, rappel au démarrage de session | Sonnet | medium | — | S2 | `plugin/skills/maj-workflow/SKILL.md` · `plugin/skills/migrer-projet/` · `plugin/hooks/sessionstart-contexte.mjs` · `tests/tester-hooks.mjs` · `plugin/skills/nouveau-plan/SKILL.md` · `plugin/skills/fin-de-tache/references/fin-de-plan.md` · `CLAUDE.md` | [x] 2026-10-07 | — |
| [S4](S4.md) | T6-T7 | Publication 0.56.0 et preuve de bout en bout | Sonnet | high | — | S3 | `plugin/.claude-plugin/plugin.json` · `plugin/mods/garde-fous/.claude-plugin/plugin.json` · `CHANGELOG.md` · `docs/analyses/2026-10-06-mods-distribution-preuve.md` | [x] 2026-10-07 | — |
| [S5](S5.md) | T8-T9 | Mini-plugin affichage : ligne d'état, limites, panneau fichiers | Sonnet | high | — | S4 | `plugin/mods/affichage/` · `plugin/.claude-plugin/marketplace.json` | [x] 2026-10-07 | — |
| [S6](S6.md) | T10-T11 | Panneau plan avec boutons de relance, commande `/incidents` | Sonnet | high | — | S5 | `plugin/mods/affichage/` | [x] 2026-10-07 | — |
| [S7](S7.md) | T12 | Publication 0.57.0 et rendu réel | Sonnet | medium | — | S6 | `plugin/.claude-plugin/plugin.json` · `plugin/mods/garde-fous/.claude-plugin/plugin.json` · `plugin/mods/affichage/.claude-plugin/plugin.json` · `CHANGELOG.md` | [x] 2026-10-07 | — |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->

## Ordonnancement
Une session par vague : chacune s'appuie sur la précédente (séquentiel par défaut).

- **Vague 1** : S1.
  *Pourquoi maintenant* : la distribution doit marcher avant qu'un mod d'affichage, qui évolue
  souvent, n'en dépende ; les garde-fous sont le plus petit mod réel pour l'éprouver, alors qu'un
  mod d'affichage cassé ne se verrait qu'à l'œil.
  - **S1** — Le mod des garde-fous existe dans la source : un agent lancé sur une session de plan
    sans modèle explicite prend celui de l'index, et un agent part au premier plan sauf demande
    contraire. Tu le verras à ses tests verts. Rien n'est encore installé.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : le script d'installation et le contrôle des mods ont besoin d'un mod réel
  à installer et à valider.
  - **S2** — Un script installe les mods sur le poste, dans Templates comme dans un projet vendoré,
    et vérifie qu'ils sont actifs. La synchronisation copie les mods dans chaque projet. La
    publication refuse un mod invalide ou dont la version diffère de celle du workflow. Tu le
    verras au N0, qui contrôle désormais les mods.
- **Vague 3** : S3 (après S2).
  *Pourquoi maintenant* : les skills appellent ce script ; sans lui, elles décriraient un geste qui
  n'existe pas.
  - **S3** — `/maj-workflow` et `/migrer-projet` installent les mods sans que tu aies rien à faire.
    Une session qui démarre avec des mods absents ou en retard te donne la commande à lancer.
- **Vague 4** : S4 (après S3).
  *Pourquoi maintenant* : la preuve porte sur la chaîne complète (publication, synchro, skills,
  installation) ; avant S3 elle serait partielle.
  - **S4** — Le workflow 0.56.0 est publié avec les garde-fous. Un fichier de preuve montre qu'ils
    sont installés et actifs dans Templates, et qu'ils agissent dans un projet vendoré de test :
    l'agent y tourne au modèle de l'index avec les mods, et pas sans eux.
- **Vague 5** : S5 (après S4).
  *Pourquoi maintenant* : l'affichage lit les fichiers du plan et des incidents, dont le format est
  le plus susceptible de bouger ; il passe donc après une distribution prouvée.
  - **S5** — Le mod d'affichage existe. Sa ligne d'état donne le plan, la vague, la session, les
    limites 5 h et 7 j avec l'heure de reset, et le contexte. Un panneau montre tes limites, un
    autre les fichiers modifiés, nouveaux ou commités sans être poussés. Ils sont vérifiés par
    leurs tests ; tu ne le verras pas avant S7.
- **Vague 6** : S6 (après S5).
  *Pourquoi maintenant* : le panneau du plan s'ajoute au module et au repère de plan écrits en S5.
  - **S6** — Le panneau du plan montre la vague, l'état des sessions et la prochaine action, avec
    quatre boutons : Go, Reprends, Enchaîne l'orchestration, Commit+push. La commande `/incidents`
    liste les incidents de tous les projets.
- **Vague 7 — validation-humaine** : S7 (après S6).
  *Pourquoi maintenant* : seul ton œil dit si la ligne et le panneau sont lisibles dans Desktop et
  sur le téléphone, et ce jugement décide s'il faut une passe de corrections avant de clore.
  - **S7** — Le workflow 0.57.0 est publié avec l'affichage. À toi de regarder, après redémarrage
    d'une session : la ligne d'état dans Desktop, le panneau sur le téléphone, un appui sur chaque
    bouton.
- **Vague 8 — clôture** : contexte (`TASKS.md`, brief de `claude-mods` coché) et push. Pas de
  commits de code à rattraper : chaque session a commité les siens.
