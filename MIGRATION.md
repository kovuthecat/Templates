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
| `.claude/skills/fin-de-tache` (local) | **absent** — la skill utilisateur `~/.claude/skills/fin-de-tache` (jonction vers `Templates/.claude/skills/fin-de-tache`) prend le relais ; une skill locale de même nom la masquerait |

## §Étape 0 — Inventaire

Localiser les fichiers de contexte réels du projet sans préjugé d'emplacement. Chercher, dans cet
ordre :

- racine du repo (nom standard ou approchant)
- `fichierscontexte/` (variante rencontrée : app-rectte-course-md)
- `CONTEXTE/<x>-context/` (variante rencontrée : FermentLab)
- `SPEC.md`, `ROADMAP.md`, `PLAN_*.md` (variantes rencontrées : ETP interactif, laser-tools)
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

## §Étape 3 — CLAUDE.md & skill

- Reconstruire `CLAUDE.md` sur le squelette actuel de `Templates/CLAUDE.md` : section Commandes
  remplie avec les vraies commandes du projet, ajout de la ligne d'import
  `@C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\CLAUDE-BASE.md`, section « Règles
  spécifiques au projet » = ce qui a été extrait à l'Étape 2.
- Écrire le stub `AGENTS.md` (bloc donné dans `README.md` §Séquence de création, point 1).
- Supprimer `.claude/skills/fin-de-tache` local si présent.
- Supprimer toute copie locale obsolète de `WORKFLOW.md`, `CONVENTIONS.md`, `AGENTS.md` (central),
  `CHANGELOG.md`, `README.md` trouvée à l'Étape 0.

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
  déjà cause de 404 en prod deux fois).
- **laser-tools** : lire `SPEC.md` avant toute modification.

## Questions ouvertes (à trancher pendant le pilote S4)

_Aucune pour l'instant — section à remplir si une règle de classement générique/spécifique s'avère
indécidable dans l'abstrait lors de la migration pilote._
