# Scénarios de bout en bout

Joue un **plan réel** sur un mini-projet jetable, de `/workflow:orchestrer-plan P1` jusqu'à `fini`, par
un vrai `claude -p`, et note ce que ça a coûté. C'est la mesure de référence du workflow : « coût total
par plan terminé » (`docs/analyses/2026-10-14-mesure-de-reference.md`), à rejouer avant et après toute
simplification. Le banc voisin `tests/evals-orchestrateur/` reste, lui, le test rapide du *premier geste*
de l'orchestrateur ; celui-ci mesure le plan entier.

Rien n'est écrit dans ce dépôt : tout vit dans `<dossier temporaire>/scenarios-templates/`.

## Usage

```bash
node tests/scenarios/lancer.mjs --poser-seulement          # pose les 4 états, vérifie le moteur, n'appelle pas claude
node tests/scenarios/lancer.mjs --scenario nominal          # un passage réel
node tests/scenarios/lancer.mjs --scenario nominal --essais 2
node tests/scenarios/lancer.mjs --scenario tous              # les 4 scénarios, l'un après l'autre
node tests/scenarios/noter.mjs                               # note le dernier passage ; -v détaille les agents ; --tous
node tests/scenarios/lancer.mjs --nettoyer                   # supprime les passages posés
```

Options : `--model haiku --effort medium` (orchestrateur, `WORKFLOW.md` §3) · `--max-budget 3` (USD
par passage) · `--max-turns 200` · `--delai-min 45` · `--claude <binaire>` (sinon `$CLAUDE_BIN`, sinon
le binaire qui lance la session courante, sinon `claude` du PATH).

**Prérequis** : `claude auth status` doit rendre `loggedIn: true` *dans un terminal ordinaire*. Une
session Desktop s'authentifie par l'application hôte ; un processus enfant ne le peut pas, et le premier
appel rend « OAuth session expired » sans rien dépenser. `lancer.mjs` le contrôle avant de poser quoi que
ce soit et s'arrête en code 3 avec la consigne (`claude auth login`, ou `ANTHROPIC_API_KEY`).

## Le mini-projet

`projet/base/` : quelques fichiers de contexte minimaux (`CLAUDE.md`, `STATUS.md`, `TASKS.md`,
`DECISIONS.md`), `src/ops.mjs`, `test.mjs` (aucune dépendance), `.claude/n0.json` (N0 = `node test.mjs`).
`projet/plan.mjs` écrit le plan P1 et ses `S<k>.md` ; `projet/poser.mjs` construit le passage :

1. copie de `plugin/` (sans `evals/`) dans le dossier du passage — l'**instantané** que `--plugin-dir`
   charge, hors du mini-projet et hors du dépôt ;
2. mini-projet **vendoré** par `sync-workflow.mjs` depuis cet instantané, comme un vrai projet ;
3. `origin` = dépôt nu local, `main` poussée avec son amont ;
4. l'état du scénario ; 5. vérification de la première action du moteur (`prochaine-action.mjs P1 --json`).

Sessions en Haiku · medium, tâches triviales (`doubler()`, `tripler()` et leur cas de test).

| Scénario | État posé | Première action du moteur |
| --- | --- | --- |
| `nominal` | plan P1 neuf, deux sessions d'une tâche | `lancer` S1 |
| `echec-reprise` | S1 a échoué : `S1.echec.md` (`Nature : exécution`, `reprise=0 enquete=0`), test rouge commité | `reprendre` S1 |
| `interruption` | S1 a deux tâches, T1 commitée (`Plan: P1/S1/T1`), T2 amorcée non commitée, rapport `Nature : interruption` | `relancer-interrompue` S1 |
| `revue-incomplete` | S1 faite (preuve N0 valide), `S1.revue.md` avec `Bloquant : 0` sans `Couverture :` | `relire` S1 |

**Une fixture qui ne rend pas la première action attendue est à corriger, jamais l'attendu.** Cas
rencontré : l'état `interruption` « sans rapport d'échec » rend `lancer`, pas `relancer-interrompue` —
le moteur ne rend cette action que sur un rapport `Nature : interruption`, que l'orchestrateur écrit
lui-même à la coupure par quota (`orchestrer-plan/SKILL.md`, « Coupure par quota »). L'état posé porte
donc ce rapport ; `--poser-seulement` imprime le constat.

## Ce que `noter.mjs` mesure

Lu dans le `stream-json` **et** dans l'état final du mini-projet, jamais dans le seul récit du modèle :

| Mesure | Définition |
| --- | --- |
| coût | `total_cost_usd`, `num_turns`, durée, `modelUsage` par modèle |
| interventions | questions `❓ P1/S…` rendues (un `claude -p` s'arrête sur la première ; attendu 0) |
| relances inutiles | lancements d'une session déjà faite : état posé, ou `VERDICT: PASS` lu plus tôt dans le flux |
| preuves valides | chaque `plans/P1/S<k>.n0.json` vérifié par `plugin/bin/preuve-n0.mjs` |
| issue | action du moteur **relancée par `noter.mjs`** sur l'état final — attendu `fini` |
| H2 | `modelUsage` contient-il un autre modèle que l'orchestrateur ? (le relecteur de session est en Sonnet) |

Un passage n'est `ABOUTI` que si le moteur rend `fini` à l'état final **et** que le dernier appel du
moteur par le modèle rendait `fini` aussi, **et** que les commits de tâche sont dans le dépôt nu `origin`
(`git log main`), **et** que le dépôt est poussé. L'association « verdict ↔ lancement » (relances
inutiles) est une heuristique sur le flux : à valider sur le premier passage réel.

## Pièges tenus

- Variables `CLAUDE_CODE_*`, `CLAUDE_AGENT_SDK_*`, `CLAUDECODE`, `DISABLE_MICROCOMPACT`, `CLAUDE_EFFORT`
  retirées avant `claude -p` : héritées d'une session Desktop, elles compactent le contexte et faussent
  l'effort.
- `GIT_CONFIG_GLOBAL` jetable (dans le dossier du passage) et identité git **locale** : jamais le
  `~/.gitconfig` de l'hôte.
- `--strict-mcp-config`, `--no-session-persistence`, `--plugin-dir <instantané>`. `noter.mjs` alerte si
  l'événement `init` ne montre pas l'instantané : un résultat obtenu avec le plugin du cache ne mesure rien.
- **Jamais `bypassPermissions`** : le mini-projet tourne sur le vrai poste. `--permission-mode acceptEdits`
  et `--allowedTools` explicite (`OUTILS_AUTORISES` dans `lancer.mjs` ; `Task` y côtoie `Agent`, nom que
  `init` donne à l'outil en 2.1.293). Un outil refusé s'ajoute à la liste, nommé dans la mesure ;
  `noter.mjs` imprime les `permission_denials`.
- Le dossier du passage n'est pas « de confiance » : Claude Code y ignore les `permissions.allow` du
  `.claude/settings.json` du mini-projet (message `Ignoring … permissions.allow entries … not been
  trusted`). Seul `--allowedTools` compte — on n'écrit pas dans `~/.claude.json` de l'hôte.
- Le mini-projet vendoré porte `.claude/skills/` et `.claude/agents/` **et** le plugin est chargé : les
  skills et agents existent en double (`orchestrer-plan` / `workflow:orchestrer-plan`). C'est l'état d'un
  vrai projet vendoré qui charge aussi le plugin ; à lire comme tel.

## Exceptions au README du banc du premier geste

Deux pièges de `tests/evals-orchestrateur/README.md` ne s'appliquent pas ici, par construction :

1. **`origin` conservé** (dépôt nu local, jamais un réseau). Le banc rapide le retire ; ici une session
   pousse en fin de session et le moteur rend `pousser` selon l'amont — sans `origin`, chaque push
   échouerait et compterait comme une intervention.
2. **Hooks actifs** (pas de `disableAllHooks`). Le banc rapide les coupe pour isoler le texte ; ici on
   mesure le comportement réel, Stop et garde-fou git compris. Ils viennent du plugin chargé ; le
   `settings.json` du mini-projet ne câble pas les siens, sinon chacun tournerait deux fois.

## Coût d'un passage

Borné par `--max-budget 3` (USD) et `--delai-min 45`, jamais estimé ici : le chiffre réel d'un passage
est celui de `docs/analyses/2026-10-14-mesure-de-reference.md`. Les passages se jouent l'un après
l'autre — jamais en parallèle (quota).
