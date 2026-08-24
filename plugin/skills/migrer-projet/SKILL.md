---
name: migrer-projet
description: Rattacher un projet existant au plugin `workflow@templates` — un diagnostic unique route vers la bonne voie : **bascule** d'un projet encore en workflow v1 (import `@<chemin absolu>CLAUDE-BASE.md`, hooks à chemins absolus dans `.claude/settings.json`, skills du workflow copiées ou jonctionnées en local), ou **adoption** d'un projet qui a du code mais n'a jamais été outillé (ni `.claude/settings.json`, ni fichiers de contexte, ni `plans/`). Puis vérification prouvée. À dérouler dans le projet concerné.
model: sonnet
---

# Rattacher un projet existant au workflow

Procédure exécutable, à dérouler **dans le projet concerné**. Le frontmatter demande **Sonnet,
effort `medium`** — du jugement, mais borné. Référence longue : `${CLAUDE_PLUGIN_ROOT}/MIGRATION.md`,
pour les cas tordus (contexte rangé dans un sous-dossier, nom non standard, annexe par projet).

**Ne pas demander à l'utilisateur dans quel cas il est.** La Phase A le détermine par lecture, et
c'est précisément le travail : deux états de départ très différents mènent au même état cible, par
des voies qui ne se ressemblent qu'au début et à la fin.

**Priorité absolue : ne jamais perdre de contenu spécifique au projet.** En cas de doute :
conserver et signaler dans le rapport, jamais supprimer.

## Phase A — Diagnostic (lecture seule, aucune écriture)

**Déléguer, ne pas lire soi-même.** Un inventaire lu en direct remplit le contexte de chemins et
d'extraits qu'on paie ensuite à chaque tour, alors que seule la synthèse sert. Lancer l'agent
`explorateur` pour la carte du dépôt, `resumeur-git` pour l'état git.

Constater, ne rien corriger encore. Huit points :

1. `.claude/settings.json` — existe-t-il ? `enabledPlugins: {"workflow@templates": true}` présent ?
   un bloc `hooks` avec des entrées `PreToolUse`/`PostToolUse`/`Stop` à chemins absolus (obsolètes,
   à retirer) ? un hook `SessionStart` de bootstrap déjà présent (`.claude/hooks/session-start.sh` —
   à garder) ? une `permissions.allow` enrichie par l'usage réel du projet (à préserver, jamais à
   écraser) ?
2. `CLAUDE.md` — existe-t-il ? ligne d'import `@…CLAUDE-BASE.md` ? section `# Compact instructions` ?
   vraies commandes du projet, ou placeholders jamais remplis ?
3. **Skills du workflow copiées ou jonctionnées en local** — `.claude/skills/<nom>`, et les jonctions
   `~/.claude/skills/<nom>`. Une skill locale de même nom **masque** celle du plugin.
4. Copies locales obsolètes de `WORKFLOW.md`, `CONVENTIONS.md`, `AGENTS.md` central, `MIGRATION.md`,
   `CHANGELOG.md`, README de workflow.
5. **Fichiers de contexte — y en a-t-il ?** Racine, ou `Contexte/`, `fichierscontexte/`,
   `CONTEXTE/<x>-context/`, `SPEC.md`, `ROADMAP.md`, `PLAN_*.md`. Plusieurs variantes peuvent
   coexister (migration précédente incomplète) : ne pas s'arrêter à la première. **Aucun fichier de
   contexte nulle part** est le signe le plus net de la voie 2.
6. **Stack, commandes et code déjà écrit** — `package.json` (scripts, dépendances), et selon le cas
   `pyproject.toml`, `Cargo.toml`, `go.mod`, `Dockerfile`. Relever les vraies commandes de dev,
   build, test, lint, typecheck. Repérer aussi la doc déjà là (`README.md`, `docs/`, `TODO.md`).
7. **Serveur dev et UI** — conditionne `.claude/launch.json` (requis par le N1) et `DESIGN_SPEC.md`.
8. Dette de format — `DECISIONS.md` non éclaté en `docs/decisions/` ? blocs `### Statut` dans des
   `S<k>.md` de plans **en cours** ? items N1 dans `VALIDATION.md` ? plafonds dépassés
   (`${CLAUDE_PLUGIN_ROOT}/hooks/plafonds.json`) ?

### Classer — la voie découle du diagnostic

| Ce que la Phase A a trouvé | Voie | Phase B à dérouler |
| --- | --- | --- |
| Import `@…CLAUDE-BASE.md`, et/ou hooks à chemins absolus, et/ou skills du workflow en local | **1 — Bascule** | B1 |
| Du code, mais ni `.claude/settings.json`, ni fichiers de contexte, ni `plans/` | **2 — Adoption** | B2 |
| `enabledPlugins` déjà correct, pas d'import, pas de skills locales — seulement de la dette (point 8) | **3 — Entretien** | B1 point 5 seul |
| Repo **vide**, aucun code | *hors périmètre* | STOP → `/nouveau-projet` (interview de cadrage) |

Les états se mélangent (migration précédente inachevée) : dérouler alors les points concernés des
deux voies, dans l'ordre de B1 puis B2.

## Voie 1 — Le piège qui fait tout rater : le double chargement

*(À lire seulement si la Phase A a classé en voie 1 ou 3.)*

Deux interrupteurs commandent les **mêmes** règles communes (`CLAUDE-BASE.md`) : l'import
`@<chemin absolu>` dans le `CLAUDE.md` du projet, et le plugin (qui les injecte par son hook
`SessionStart`). Ils doivent bouger **ensemble**, dans la même passe.

| `enabledPlugins` | import `@…CLAUDE-BASE.md` | Résultat |
| --- | --- | --- |
| absent | présent | état d'avant migration — fonctionne, rien n'est cassé |
| **présent** | **présent** | règles chargées **deux fois** : contexte payé en double à chaque session |
| **absent** | **absent** | **plus aucune règle commune** — panne silencieuse, la pire des quatre |
| présent | absent | ✅ cible |

Les deux états fautifs sont invisibles à l'œil : la Phase D les fait tomber mécaniquement.

## Voie 2 — Le principe : le brief se dérive du code

*(À lire seulement si la Phase A a classé en voie 2.)*

C'est l'inverse exact de `/nouveau-projet`, qui interroge des intentions parce qu'il n'y a rien à
lire. Ici il y a des milliers de lignes qui disent déjà la stack, le découpage et la moitié du
périmètre. Les redemander à l'utilisateur, c'est lui faire dicter ce qu'une lecture donne
gratuitement — et récolter une description idéalisée plutôt que l'état réel.

**Interview courte : seulement ce que le code ne dit pas.** Six questions, une à la fois, chaque
réponse reformulée en une ligne avant la suivante.

1. **Pourquoi ce projet existe** — quel problème il résout, à quoi ressemble « réussi ». (→ `PROJECT_BRIEF.md`)
2. **Usage prévu** — perso ou pas, local ou déployé, d'autres utilisateurs que toi ou pas.
3. **Où il en est vraiment** — ce qui marche, ce qui est cassé, ce qui est à moitié fait. La réponse
   la plus utile, et la seule qu'aucune lecture ne donne. (→ `STATUS.md`)
4. **Ce qui vient ensuite** — 3 à 7 items, sans les ordonner. (→ `TASKS.md`)
5. **Décisions déjà prises** dont il faut se souvenir — choix de stack contre-intuitif, contrainte
   externe, piège rencontré. Une ligne chacune. (→ `DECISIONS.md`)
6. **Stratégie de test — question obligatoire, jamais optionnelle** — ce qui est testé aujourd'hui
   (constaté en Phase A), ce qui devrait l'être. Une réponse « aucun test » doit être justifiée et
   consignée dans `DECISIONS.md`.

Ne pas demander ce que la Phase A a déjà établi. Si une réponse contredit le code, le dire et
trancher avec l'utilisateur : c'est souvent là que se trouve la vraie dette.

## Gate — restituer avant d'écrire

Synthèse en **≤ 15 lignes** : la voie retenue et pourquoi, l'état constaté, les fichiers qui seront
créés ou modifiés, ce qui sera supprimé, ce qui sera absorbé depuis la doc existante. Faire valider
explicitement par l'utilisateur **avant la première écriture** — une suppression de contenu projet
ne se rattrape qu'à la main.

## Phase B1 — Bascule *(voie 1, et point 5 pour la voie 3)*

Ordre imposé : le gain décroît, le risque croît.

1. **Settings** — retirer de `.claude/settings.json` les entrées `hooks.PreToolUse` /
   `hooks.PostToolUse` / `hooks.Stop` à chemins absolus (le câblage vit dans le plugin), puis y
   porter le contenu de `${CLAUDE_PLUGIN_ROOT}/templates/project-settings.json` : `enabledPlugins`,
   `extraKnownMarketplaces`, `effortLevel`, `hooks.SessionStart` (bootstrap cloud — exception, cf.
   `docs/decisions/2026-08-24-sessionstart-bootstrap-hook.md`), `permissions`. **Fusionner** :
   `permissions.allow` = union des deux listes, jamais un remplacement. Copier aussi
   `${CLAUDE_PLUGIN_ROOT}/templates/session-start.sh` → `.claude/hooks/session-start.sh`
   (`chmod +x`) si absent.
2. **`CLAUDE.md`** — supprimer la ligne d'import `@…CLAUDE-BASE.md`. Ne **rien** mettre à la place.
   Garder tout le reste (commandes réelles, règles spécifiques). Ajouter en fin de fichier la
   section `# Compact instructions` de `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md` si elle manque.
3. **Skills locales et copies** — supprimer les skills du workflow copiées/jonctionnées (point 3 du
   diagnostic) et les copies locales de la doc centrale (point 4). Une skill **propre au projet**
   n'est pas concernée : elle reste.
4. **Contenu** — pour chaque fichier de contexte non standard : générique (identique à un ancien
   template) → supprimer ; spécifique → conserver tel quel ; mixte → extraire le spécifique vers le
   fichier cible (commandes → `CLAUDE.md`, contrainte technique → `ARCHITECTURE.md` ou
   `DECISIONS.md`), puis supprimer le reste. Après un déplacement de sous-dossier vers la racine,
   corriger les renvois internes cassés par ce déplacement — et seulement ceux-là.
5. **Dette de format** — dérouler `/purge-contexte` (§DECISIONS, §STATUS, §VALIDATION) ; reporter
   les statuts des `S<k>.md` en cours dans la colonne Statut de l'`index.md` ; créer
   `.claude/launch.json` s'il y a un serveur dev ; ajouter `.claude/wave.lock` au `.gitignore`.

Ne pas réécrire le contenu produit (brief, décisions, roadmap) à l'occasion de la migration : on
classe et on déplace.

## Phase B2 — Adoption *(voie 2)*

Câblage d'abord (mécanique, sans risque), contenu ensuite (du jugement).

1. **Plugin et settings** — copier `${CLAUDE_PLUGIN_ROOT}/templates/project-settings.json` →
   `.claude/settings.json`. Si le fichier existe déjà, **fusionner** : `permissions.allow` = union
   des deux listes.

   > `enabledPlugins` **n'installe rien à lui seul** pour une source externe. La session courante a
   > forcément le plugin (elle exécute cette skill), mais une session future sur une machine ou un
   > conteneur cloud neuf ne l'aurait pas. Fiabiliser avec
   > `claude plugin install workflow@templates --yes` — idempotent, no-op propre si déjà installé.

2. **Hook de bootstrap** — copier `${CLAUDE_PLUGIN_ROOT}/templates/session-start.sh` →
   `.claude/hooks/session-start.sh`, puis `chmod +x`. Sans lui le projet marche en local mais perd
   tout le plugin en session cloud, silencieusement.

3. **`AGENTS.md`** — copier `${CLAUDE_PLUGIN_ROOT}/AGENTS.md` à la racine, **tel quel** : Codex le
   charge depuis le projet et ne sait pas résoudre `${CLAUDE_PLUGIN_ROOT}`.

4. **`.gitignore`** — y ajouter `.claude/wave.lock` s'il manque (marqueur local, jamais versionné).

5. **`CLAUDE.md`** — partir de `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md` et le remplir avec les
   **vraies commandes relevées en Phase A**, pas des placeholders. Si un `CLAUDE.md` existe déjà,
   garder son contenu spécifique et n'ajouter que ce qui manque. Ne **jamais** y écrire de ligne
   d'import `@…CLAUDE-BASE.md` : les règles communes sont injectées par le hook `SessionStart`.

   > **Piège typecheck à vérifier ici, pas plus tard** : sur un scaffold Vite/TS, le tsconfig racine
   > est en `files: []` + références de projet, et `tsc --noEmit` y compile 0 fichier — un vert vide
   > qui ne bloque plus rien. Contrôle :
   > `<commande typecheck> --listFiles | grep -v node_modules | wc -l` doit être **non nul** ; sinon
   > la commande est `tsc -b --noEmit`.

6. **Fichiers de contexte** — copier depuis `${CLAUDE_PLUGIN_ROOT}/templates/` puis remplir :

   | Fichier | Source du contenu |
   | --- | --- |
   | `PROJECT_BRIEF.md` | questions 1-2 de l'interview |
   | `PROJECT_MAP.md` | **inventaire de la Phase A** — dérivé, pas demandé |
   | `ARCHITECTURE.md` | stack et découpage **constatés** ; ce qui est en place, pas la cible |
   | `STATUS.md` | question 3 — photo stricte de l'état, sans historique |
   | `TASKS.md` | question 4 |
   | `DECISIONS.md` | question 5, une ligne par décision (le détail va dans `docs/decisions/`) |
   | `VALIDATION.md` | N2 en attente uniquement — souvent vide au départ, et c'est bien |
   | `DESIGN_SPEC.md` | seulement si le projet a une UI |

   **Respecter les plafonds dès l'écriture** (`${CLAUDE_PLUGIN_ROOT}/hooks/plafonds.json`) : un
   fichier créé au-dessus de son plafond déclenchera le hook `Stop` à la première session.
   Supprimer les sections de template non pertinentes — une section vide est du bruit payé à chaque
   lecture.

7. **`.claude/launch.json`** — si le projet a un serveur dev (Phase A point 7). Requis par le N1.

8. **Doc existante** — la référencer depuis `PROJECT_MAP.md` plutôt que la recopier. Un `README.md`
   riche reste la source ; les fichiers de contexte pointent vers lui.

## Phase D — Gate de vérification (aucun rattachement n'est fini sans elle)

Commune aux deux voies. Les quatre premiers points sont mécaniques et se lancent **maintenant** ; le
cinquième exige une **nouvelle session**, la config plugin n'étant lue qu'au démarrage.

1. `grep -c 'CLAUDE-BASE' CLAUDE.md` → **0**. Sinon : import non retiré (voie 1), ou ajouté par
   erreur (voie 2).
2. `grep -c 'workflow@templates' .claude/settings.json` → **1**. Sinon : plugin non activé.
3. `grep -c 'SessionStart' .claude/settings.json` → **1**, et
   `grep -c 'PreToolUse\|PostToolUse\|Stop' .claude/settings.json` → **0** (seul le hook de bootstrap
   reste dans le projet, le reste a bien quitté vers le plugin). `test -x .claude/hooks/session-start.sh`
   → succès.
4. `ls -l .claude/skills` → aucune skill du workflow, ni fichier ni jonction. Et chaque fichier de
   contexte sous son plafond (`wc -l`).
5. **Nouvelle session dans le projet** : un `git add -A` de test doit être **refusé**. C'est la
   preuve que les hooks du plugin sont chargés, donc que `CLAUDE-BASE.md` est injecté ; combinée au
   point 1 (import absent), elle place le projet dans la case ✅ sans avoir à inspecter le contexte
   à l'œil. Vérifier au passage que les skills du plugin sont proposées et que le hook `SessionStart`
   est silencieux (sinon : plafond dépassé → `/purge-contexte`).

Un point rouge = rattachement non fini. Ne jamais conclure sur « ça devrait marcher ».

## Fin

- Staging explicite, fichier par fichier (`git add -A` est refusé par hook). Commit :
  `chore: migrate to workflow plugin` (voie 1/3) ou `chore: adopter le workflow templates` (voie 2).
  Si le dépôt n'a pas de `git init`, le signaler et demander — ne pas initialiser d'office.
- **Rapport final** : la voie déroulée, ce qui a été supprimé, ce qui a été conservé par prudence,
  ce qui a été absorbé depuis la doc existante, les écarts non résolus. Cas particulier tranché
  ici → l'ajouter à l'annexe de `${CLAUDE_PLUGIN_ROOT}/MIGRATION.md`.
- **Voie 2 — étape suivante à citer, pas à exécuter** : `/nouveau-plan` pour cadrer le premier plan
  à partir du `TASKS.md` fraîchement rempli.
