---
name: migrer-projet
description: Migrer un projet existant vers le plugin `workflow@templates` — diagnostic de l'état de départ, bascule des settings, du CLAUDE.md et des skills locales, reprise des fichiers de contexte, puis vérification prouvée. À dérouler dans un projet qui charge encore les règles communes par un import `@<chemin absolu>CLAUDE-BASE.md`, qui porte des hooks à chemins absolus dans `.claude/settings.json`, ou qui a des skills du workflow copiées ou jonctionnées en local.
model: sonnet
---

# Migrer un projet vers le plugin

Procédure exécutable, à dérouler **dans le projet à migrer**. Le frontmatter bascule sur
**Sonnet, effort `medium`** pour ce tour — du jugement, mais borné. **Couverture partielle** : les
deux gates (avant écriture, avant clôture) ouvrent chacune un nouveau tour après le oui de
l'utilisateur, hors override — la Phase A (diagnostic) en profite pleinement, les phases suivantes
tournent sur le modèle actif de la session. Référence longue : `${CLAUDE_PLUGIN_ROOT}/MIGRATION.md`, pour
les cas tordus (contexte rangé dans un sous-dossier, nom non standard, annexe des cas par projet).

**Priorité absolue : ne jamais perdre de contenu spécifique au projet.** En cas de doute :
conserver et signaler dans le rapport, jamais supprimer.

## Le piège qui fait tout rater : le double chargement

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

## Phase A — Diagnostic (lecture seule, aucune écriture)

Constater, ne rien corriger encore. Six points :

1. `.claude/settings.json` — `enabledPlugins: {"workflow@templates": true}` présent ? un bloc
   `hooks` avec des entrées `PreToolUse`/`PostToolUse`/`Stop` à chemins absolus (obsolètes, à
   retirer) ? un hook `SessionStart` de bootstrap déjà présent (`.claude/hooks/session-start.sh` —
   à garder, cf. étape 1 de la Phase B) ? une `permissions.allow` déjà enrichie par l'usage réel du
   projet (à préserver, pas à écraser) ?
2. `CLAUDE.md` — ligne d'import `@…CLAUDE-BASE.md` ? section `# Compact instructions` ? vraies
   commandes du projet, ou placeholders jamais remplis ?
3. Skills du workflow copiées ou jonctionnées en local — `.claude/skills/<nom>`, et les jonctions
   `~/.claude/skills/<nom>`. Une skill locale de même nom **masque** celle du plugin.
4. Copies locales obsolètes de `WORKFLOW.md`, `CONVENTIONS.md`, `AGENTS.md` central, `MIGRATION.md`,
   `CHANGELOG.md`, README de workflow.
5. Fichiers de contexte — où sont-ils réellement ? Racine, ou `Contexte/`, `fichierscontexte/`,
   `CONTEXTE/<x>-context/`, `SPEC.md`, `ROADMAP.md`, `PLAN_*.md`. Plusieurs variantes peuvent
   coexister (migration précédente incomplète) : ne pas s'arrêter à la première.
6. Dette de format — `DECISIONS.md` non éclaté en `docs/decisions/` ? blocs `### Statut` dans des
   `S<k>.md` de plans **en cours** ? items N1 dans `VALIDATION.md` ? `.claude/launch.json` absent
   malgré un serveur dev ? plafonds dépassés (`${CLAUDE_PLUGIN_ROOT}/hooks/plafonds.json`) ?

## Gate — restituer avant d'écrire

Synthèse en **≤ 12 lignes** : la case occupée dans le tableau ci-dessus, les écarts trouvés, et ce
qui sera supprimé. Faire valider explicitement par l'utilisateur **avant la première écriture** — une
suppression de contenu projet ne se rattrape qu'à la main.

## Phase B — Bascule (ordre imposé : le gain décroît, le risque croît)

1. **Settings** — retirer de `.claude/settings.json` les entrées `hooks.PreToolUse` /
   `hooks.PostToolUse` / `hooks.Stop` à chemins absolus (le câblage vit dans le plugin), puis y
   porter le contenu de `${CLAUDE_PLUGIN_ROOT}/templates/project-settings.json` : `enabledPlugins`,
   `extraKnownMarketplaces`, `effortLevel`, `hooks.SessionStart` (bootstrap cloud — exception, cf.
   `docs/decisions/2026-08-24-sessionstart-bootstrap-hook.md`), `permissions`. **Fusionner** :
   `permissions.allow` = union des deux listes, jamais un remplacement. Copier aussi
   `${CLAUDE_PLUGIN_ROOT}/templates/session-start.sh` → `.claude/hooks/session-start.sh` (executable)
   si absent.
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
   `.claude/launch.json` s'il y a un serveur dev.

Ne pas réécrire le contenu produit (brief, décisions, roadmap) à l'occasion de la migration : on
classe et on déplace.

## Phase D — Gate de vérification (aucune migration n'est finie sans elle)

Les quatre premiers points sont mécaniques et se lancent **maintenant** ; le cinquième exige une
**nouvelle session**, la config plugin n'étant lue qu'au démarrage.

1. `grep -c 'CLAUDE-BASE' CLAUDE.md` → **0**. Sinon : import non retiré.
2. `grep -c 'workflow@templates' .claude/settings.json` → **1**. Sinon : plugin non activé.
3. `grep -c 'SessionStart' .claude/settings.json` → **1**, et `grep -c 'PreToolUse\|PostToolUse\|Stop'
   .claude/settings.json` → **0** (seul le hook de bootstrap reste dans le projet, le reste a bien
   quitté vers le plugin). `test -x .claude/hooks/session-start.sh` → succès.
4. `ls -l .claude/skills` → aucune skill du workflow, ni fichier ni jonction.
5. **Nouvelle session dans le projet** : un `git add -A` de test doit être **refusé**. C'est la
   preuve que les hooks du plugin sont chargés, donc que `CLAUDE-BASE.md` est injecté ; combinée au
   point 1 (import absent), elle place le projet dans la case ✅ sans avoir à inspecter le contexte
   à l'œil. Vérifier au passage que les skills du plugin sont proposées et que le hook `SessionStart`
   est silencieux (sinon : plafond dépassé → `/purge-contexte`).

Un point rouge = migration non finie. Ne jamais conclure sur « ça devrait marcher ».

## Fin

- Staging explicite, fichier par fichier. Commit : `chore: migrate to workflow plugin`.
- **Rapport final** : ce qui a été supprimé, ce qui a été conservé par prudence, les écarts non
  résolus. Cas particulier tranché ici → l'ajouter à l'annexe de `${CLAUDE_PLUGIN_ROOT}/MIGRATION.md`.
