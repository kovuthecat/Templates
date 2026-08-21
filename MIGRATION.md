# MIGRATION.md

Checklist déclarative pour amener un projet existant (contexte hétérogène, potentiellement
ancien) à l'état cible du workflow centralisé — sans script, par jugement. Destinée à une session
Sonnet `medium` qui n'a **aucun autre contexte** que le projet dans lequel elle tourne.

Priorité absolue : **ne jamais perdre de contenu spécifique au projet.** En cas de doute, conserver
et signaler plutôt que supprimer.

## §But & état cible

Un projet migré a exactement ces fichiers de contexte, à la racine (sauf mention contraire) :

| Fichier | Statut attendu |
| --- | --- |
| `PROJECT_BRIEF.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PROJECT_MAP.md`, `STATUS.md`, `TASKS.md`, `VALIDATION.md` | copiés — contenu spécifique au projet, conservé tel quel |
| `CLAUDE.md` | squelette actuel (commandes réelles + règles spécifiques du projet) **+** ligne d'import `@C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\CLAUDE-BASE.md` |
| `AGENTS.md` | stub 3 lignes (cf. `README.md` §Séquence de création, point 1) |
| `WORKFLOW.md`, `CONVENTIONS.md`, `AGENTS.md` (central), `MIGRATION.md`, `CHANGELOG.md`, `README.md`, `plans/` | **PAS de copie locale** — référencés uniquement via chemin absolu vers `Templates/` |
| `.claude/skills/*` (local) | **absent** — les skills utilisateur (`~/.claude/skills/`, jonctions vers `Templates/.claude/skills/`) prennent le relais ; une skill locale de même nom les masquerait |
| `.claude/settings.json` | copie de `Templates/project-settings.json` (effort par défaut + les 3 hooks). Fusionner s'il existe déjà, ne pas écraser |
| `docs/decisions/` | un fichier par décision, créé par l'Étape 4 |

## §Étape 0 — Inventaire

Localiser les fichiers de contexte réels du projet sans préjugé d'emplacement. Chercher, dans cet
ordre :

- racine du repo (nom standard ou approchant)
- `fichierscontexte/` (variante rencontrée : S&C, ex-app-rectte-course-md)
- `CONTEXTE/<x>-context/` (variante rencontrée : FermentLab)
- `Contexte/` — sous-dossier racine, y compris ses propres `plans/` (variante rencontrée : Chords)
- `SPEC.md`, `ROADMAP.md`, `PLAN_*.md` (variantes rencontrées : ETP interactif, laser-tools, Chords)
- ancien format `plans/PLAN_<id>.md` et `T<n>.md` (avant la refonte `plans/P<n>/S<k>.md`)
- `PROJECT_BRIEF`/`DECISIONS` sous d'autres noms (`BRIEF.md`, `NOTES_ARCHITECTURE.md`, etc.)
- `CLAUDE.md` existant, `AGENTS.md` existant
- `.claude/skills/` local (à vérifier pour suppression, cf. §Étape 3)

Ne pas s'arrêter à la première variante trouvée : plusieurs peuvent coexister (reliquat d'une
migration précédente incomplète).

## §Étape 1 — Classer

Pour chaque fichier trouvé, décider :

- **Générique** : contenu identique ou quasi-identique (renommages mineurs, dates) à un ancien
  template Templates — règles générales recopiées, squelette vide de `PROJECT_BRIEF`/`ARCHITECTURE`
  jamais rempli, copie de `WORKFLOW.md`/`CONVENTIONS.md`.
- **Spécifique** : contenu produit du projet — décisions réellement prises, roadmap réelle,
  specs métier, contraintes techniques découvertes.
- **Mixte** : mélange dans un même fichier (cas fréquent pour `CLAUDE.md` : règles générales
  recopiées + commandes réelles du projet).

## §Étape 2 — Appliquer

- **Générique** → supprimer (le central le remplace).
- **Mixte** → extraire le spécifique vers le fichier cible standard (ex. commandes projet →
  `CLAUDE.md` §Commandes ; règle métier type « mettre à jour X avant chaque commit » →
  `CLAUDE.md` §Règles spécifiques au projet ; contrainte technique → `DECISIONS.md` ou
  `ARCHITECTURE.md` selon la nature), puis supprimer le reste.
- **Spécifique** → conserver tel quel. Ne renommer/déplacer vers un nom standard que si trivial et
  sans casser de renvois existants (liens internes, scripts qui lisent le fichier par son chemin
  actuel).
- **Déplacement d'un sous-dossier vers la racine** (`Contexte/`, `fichierscontexte/`,
  `CONTEXTE/<x>-context/`) : après déplacement, grep les anciens chemins relatifs (ex.
  `Contexte/DECISIONS.md`) dans les fichiers déplacés eux-mêmes et corriger mécaniquement les
  renvois internes cassés par le déplacement (retirer le préfixe de dossier) — ne pas réparer au
  passage des renvois qui étaient déjà morts avant la migration (hors périmètre).
- **`ROADMAP.md` séparé** : pas de règle unique — le squelette central `PROJECT_BRIEF.md` prévoit
  une section « Roadmap / jalons ». Fusionner dedans si le fichier est court et peu référencé
  ailleurs (fait pour S&C) ; le laisser en fichier séparé à la racine s'il est volumineux et
  référencé activement par d'autres fichiers de contexte (fait pour Chords, ETP interactif). En
  cas de doute, préférer le laisser séparé (moins de risque de perte/reformulation de contenu).
- **Contenu spécifique existant sous un nom non standard, avec renvois internes multiples qui
  bloquent le renommage trivial** (ex. `docs/architecture.md` référencé par 2 autres fichiers,
  rencontré sur ETP interactif) : laisser en place, ne pas créer de squelette `ARCHITECTURE.md`
  vide en doublon à côté (source de confusion) — signaler dans le rapport et laisser la décision
  de renommage à un futur cadrage produit humain.
- **README.md jouant le rôle d'un README workflow local** (liste les fichiers de cadrage à donner
  à un assistant, façon `Templates/README.md`, plutôt que de décrire le produit — rencontré sur
  S&C) : traiter comme générique/obsolète même si le nom de fichier est `README.md` et non un nom
  de template classique.
- **Fichiers spécifiques hors liste standard mais à forte valeur** (rapports d'audit ponctuels,
  anciens plans clôturés type `PLAN_<nom>.md` pré-refonte, `ROADMAP.md` non fusionné) : conserver
  à la racine par défaut (pas de sous-dossier d'archive imposé) ; question ouverte plus bas sur un
  éventuel rangement futur.

## §Étape 3 — CLAUDE.md & skill

- Reconstruire `CLAUDE.md` sur le squelette actuel de `Templates/CLAUDE.md` : section Commandes
  remplie avec les vraies commandes du projet, ajout de la ligne d'import
  `@C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\CLAUDE-BASE.md`, section « Règles
  spécifiques au projet » = ce qui a été extrait à l'Étape 2.
- Écrire le stub `AGENTS.md` (bloc donné dans `README.md` §Séquence de création, point 1).
- Supprimer `.claude/skills/fin-de-tache` local si présent.
- Supprimer toute copie locale obsolète de `WORKFLOW.md`, `CONVENTIONS.md`, `AGENTS.md` (central),
  `CHANGELOG.md`, `README.md` trouvée à l'Étape 0.

## §Étape 4 — Refonte coût & fiabilité (delta du 2026-07-28)

À appliquer **en plus** des étapes 1-3, y compris aux projets déjà migrés le 2026-07-07.
Ordre imposé : le gain décroît, le risque croît.

1. **Hooks & effort** — copier `Templates/project-settings.json` en `.claude/settings.json`.
   S'il existe déjà : fusionner (garder les clés existantes, ajouter `effortLevel` et les 3 entrées
   `hooks`). Vérifier ensuite qu'un `node .claude/... --version` de test ne casse rien : les hooks
   sont silencieux quand tout est sain.

2. **`DECISIONS.md` → registre + `docs/decisions/`** — dérouler `/purge-contexte` §DECISIONS.
   C'est le plus gros gain et le plus mécanique. **Ne jamais résumer une décision en la déplaçant** :
   le bloc part intégralement dans son fichier de détail, seule la ligne du registre est nouvelle.
   Reprendre ensuite les renvois (`DECISIONS.md §X`) dans les plans, `CLAUDE.md`, `STATUS.md`.

3. **`STATUS.md` → photo stricte** — supprimer les sections historiques (« Phase précédente »,
   « Phase P-1 », journaux de session). Vérifier avant que le contenu supprimé est bien retrouvable
   dans `git log` ou dans un `plans/P<n>/index.md` clos ; sinon, le déplacer dans le plan concerné.

4. **`VALIDATION.md` → N2 seulement** — supprimer les blocs entièrement `[x]` ; **relire chaque
   item restant** : tout ce qu'un navigateur constate seul (erreur console, élément absent, 404,
   débordement) sort du fichier et devient une ligne de `TASKS.md`. Réorganiser en un bloc par
   écran courant. C'est l'étape la plus longue sur les projets où la passe humaine a pris du retard
   (motif-layout : 194 items `[ ]` pour 2 `[x]` au 2026-07-28).

5. **Statut à un seul endroit** — retirer les blocs `### Statut` des `S<k>.md` des plans **en cours**
   (ne pas toucher aux plans clos : leur historique est figé) et reporter l'avancement dans la
   colonne Statut de l'`index.md`. Dans `TASKS.md`, remplacer le statut des tâches planifiées par
   `→ plans/P<n>/S<k>.md`.

6. **Bandeaux de session** — pour les plans **en cours** uniquement : ajouter
   `Environnement : <Desktop | indifférent>` au bandeau des `S<k>.md`, la colonne `Env.` à
   l'`index.md`, et remplacer la ligne « Validation » par le triplet N0/N1/N2.

7. **`.claude/launch.json`** — si le projet a un serveur dev et pas encore ce fichier, le créer à
   partir de la commande dev du `CLAUDE.md` (nécessaire au N1, cf. `/verif-visuelle`).

8. **Contrôle final** : chaque fichier de contexte est sous son plafond
   (`Templates/.claude/hooks/plafonds.json`). Sinon, la migration n'est pas finie.

Commit dédié, séparé de l'Étape 1-3 : `chore: apply 2026-07-28 workflow refit (hooks, caps, N1)`.

## §Garde-fous

- Doute sur un contenu → le conserver et le signaler dans le rapport final, jamais le supprimer.
- Pas de refonte du contenu produit (brief, décisions) à l'occasion de la migration : on classe et
  on déplace, on ne réécrit pas.
- Staging explicite (ajouter les fichiers un par un ou par dossier ciblé — pas d'ajout aveugle de
  tout le répertoire) avant de committer.
- Un commit unique : `chore: migrate context files to central templates`.
- Rapport final à l'humain, en fin de session : liste des écarts non résolus (cas ambigus, contenu
  conservé par prudence, questions ouvertes).

## §Annexe — Cas particuliers par projet

À enrichir après chaque migration.

- **app-rectte-course-md** : fichiers de contexte sous `fichierscontexte/` ; préserver la règle
  « mettre à jour STATUS/TASKS/ROADMAP avant chaque commit ».
- **FermentLab** : fichiers de contexte sous `CONTEXTE/fermentlab-context/`.
- **Chords** : `vercel.json` **INTOUCHABLE** — ne jamais le supprimer (point d'entrée Vercel Flask ;
  déjà cause de 404 en prod deux fois). Fichiers de contexte rangés sous `Contexte/` (racine),
  y compris `Contexte/plans/` — migré par déplacement vers la racine + correction de 12 renvois
  internes cassés (`Contexte/X.md` → `X.md`). `AGENTS.md` racine était mixte (générique Codex +
  garde-fous spécifiques `generate_docx.py`/`memo.py`). Migré le 2026-07-07, commit `d9e0df4`.
- **laser-tools** : lire `SPEC.md` avant toute modification.
- **ETP interactif** : `docs/architecture.md` = contenu réel équivalent à `ARCHITECTURE.md` mais
  référencé par 2 fichiers (`PLAN_modules-tabac.md`, `docs/DESIGN_REFONTE.md`) sous ce chemin —
  laissé en place, pas de renommage. Migré le 2026-07-07, commit `f026ead`.
- **S&C** (ex-app-rectte-course-md ; le dossier a été renommé — la mémoire projet doit pointer vers
  `Projets/S&C/`) : fichiers dans `fichierscontexte/`, déplacés/fusionnés vers la racine
  (`ROADMAP.md` fusionné dans `PROJECT_BRIEF.md` §Roadmap). Règle à préserver : mettre à jour
  STATUS/TASKS/DECISIONS avant chaque commit. Trois noms différents coexistent pour ce projet
  (dossier `S&C`, `package.json` → `app-recette-course`, déploiement Vercel → `shopandcook`) —
  non unifiés lors de cette migration, hors périmètre. Migré le 2026-07-07, commit `c057133`.

## Règles tranchées

- **Fichiers de contexte à l'échelle multi-sous-domaines** *(tranché 2026-07-08, pilote ETP interactif)* :
  les fichiers racine (`STATUS`, `DECISIONS`, `PROJECT_MAP`, `VALIDATION`) restent **au niveau projet et
  bornés**. Le détail propre à un sous-domaine (thème, module volumineux) est routé dans
  `docs/<sous-domaine>/` : cadrage + journal des décisions du sous-domaine dans son dossier,
  `docs/<sous-domaine>/VALIDATION.md` pour sa validation. **Pas** de `STATUS`/`DECISIONS` par module
  (multiplie les fichiers, casse la découvrabilité). Règles inscrites dans les en-têtes de
  `Templates/DECISIONS.md` et `Templates/VALIDATION.md`. `VALIDATION.md` reflète l'**état actuel** de
  l'app, pas l'empilement des vagues de correction (git + `STATUS.md` gardent l'historique).

## Questions ouvertes (à trancher pendant le pilote S4)

- **Rangement des fichiers spécifiques hors liste standard** (rapports d'audit ponctuels, anciens
  plans clôturés pré-refonte, `ROADMAP.md` non fusionné) : les laisser à plat à la racine (choix
  par défaut actuel) ou les ranger dans un sous-dossier d'archive dédié (`archive/`,
  `plans/_archive/`) pour ne pas alourdir la racine au fil des migrations futures ?
- **`ROADMAP.md` séparé vs fusionné dans `PROJECT_BRIEF.md`** : pas de règle unique tranchée (cf.
  §Étape 2) — à trancher si le cas se répète souvent, pour éviter une incohérence entre projets
  migrés.
