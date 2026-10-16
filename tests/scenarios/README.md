# Scénarios de bout en bout

Joue un **plan réel** sur un mini-projet jetable, de `/workflow:orchestrer-plan P1` jusqu'à `fini`, par
un vrai `claude -p`, et note ce que ça a coûté. C'est la mesure de référence du workflow : « coût total
par plan terminé » (`docs/analyses/2026-10-14-mesure-de-reference.md`), à rejouer avant et après toute
simplification. Le banc voisin `tests/evals-orchestrateur/` reste, lui, le test rapide du *premier geste*
de l'orchestrateur ; celui-ci mesure le plan entier.

Rien n'est écrit dans ce dépôt : tout vit dans `<dossier temporaire>/scenarios-templates/`.

## Usage

```bash
node tests/scenarios/lancer.mjs --poser-seulement          # pose les états de tous les scénarios, vérifie le moteur, n'appelle pas claude
node tests/scenarios/lancer.mjs --scenario nominal          # un passage réel
node tests/scenarios/lancer.mjs --scenario nominal --essais 2
node tests/scenarios/lancer.mjs --scenario tous              # tous les scénarios, l'un après l'autre
node tests/scenarios/noter.mjs                               # note le dernier passage ; -v détaille les agents ; --tous
node tests/scenarios/lancer.mjs --nettoyer                   # supprime les passages posés
node tests/scenarios/lancer.mjs --scenario arret-relaye --autorisations projet --attente 30   # en deux temps (voir plus bas)
node tests/scenarios/lancer.mjs --reprendre --autorisations projet --pause-max 8              # continue le dernier passage en deux temps
```

Options : `--model haiku --effort medium` (orchestrateur, `WORKFLOW.md` §3) · `--max-budget 3` (USD
par passage) · `--max-turns 200` · `--delai-min 45` · `--claude <binaire>` (sinon `$CLAUDE_BIN`, sinon
le binaire qui lance la session courante, sinon `claude` du PATH) · `--autorisations banc|projet` ·
`--attente <minutes>` et `--pause-max <minutes>` (scénario `arret-relaye`, voir plus bas).

**`--autorisations projet`** (défaut `banc`) : `--allowedTools` n'est plus la liste large du banc
(`OUTILS_AUTORISES` : `Bash(git:*)`, `Bash(node:*)`, `Bash(cd:*)`, `Bash(cat:*)`…) mais le
`permissions.allow` du gabarit **tel que vendoré** — lu dans le `settings.json` du mini-projet — plus les
outils non-Bash du socle (`Read`, `Edit`, `Write`, `Glob`, `Grep`, `Agent`, `Task`, `SendMessage`,
`Skill`). Le `settings.json` du mini-projet porte, en plus du gabarit, la commande de sa stack
(`Bash(node test.mjs:*)`, `COMMANDE_STACK` de `projet/poser.mjs`) : un projet instancié par
`/nouveau-projet` l'a aussi, sans `node:*` générique. La liste jouée est écrite dans `meta.json` du passage (`autorisations`, `outilsAutorises`) : un
passage sans `autorisations: "projet"` ne prouve rien sur les refus.
Pourquoi : la liste large cachait les constats A et B de la mesure (`docs/analyses/2026-10-14-mesure-de-reference.md`,
§6) — `cd <dir> && cat <relatif>` demande une approbation dès qu'une règle `Read()` deny existe
(`Read(.env*)`… du gabarit), et `node C:/…/n0.mjs` ne commence par aucun préfixe autorisé ; un agent
d'arrière-plan ne peut pas approuver, la commande est refusée. Les `deny` du gabarit s'appliquent dans les
deux modes. Le remède est l'écriture des commandes (`EXECUTANT.md`, « Écrire ses commandes »), jamais
d'ajouter `Bash(cd:*)` ou `Bash(node:*)` au gabarit.

**Prérequis** : `claude auth status` doit rendre `loggedIn: true` *dans un terminal ordinaire*. Une
session Desktop s'authentifie par l'application hôte ; un processus enfant ne le peut pas, et le premier
appel rend « OAuth session expired » sans rien dépenser. `lancer.mjs` le contrôle avant de poser quoi que
ce soit et s'arrête en code 3 avec la consigne (`claude auth login`, ou `ANTHROPIC_API_KEY`).

## Le mini-projet

`projet/base/` : quelques fichiers de contexte minimaux (`CLAUDE.md`, `STATUS.md`, `TASKS.md`,
`DECISIONS.md`), `src/ops.mjs`, `test.mjs` (aucune dépendance), `.claude/n0.json` (N0 = `node test.mjs`).
`projet/plan.mjs` écrit le plan P1 et ses `S<k>.md` ; `projet/poser.mjs` construit le passage :

1. copie de `plugin/` dans le dossier du passage — l'**instantané** que `--plugin-dir`
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
| `arret-relaye` | plan P1 neuf, une session ; `docs/mot.txt` porte un mot que S1 lira avant de s'arrêter sur un choix (le nom d'une fonction) | `lancer` S1 |

**Une fixture qui ne rend pas la première action attendue est à corriger, jamais l'attendu.** Cas
rencontré : l'état `interruption` « sans rapport d'échec » rend `lancer`, pas `relancer-interrompue` —
le moteur ne rend cette action que sur un rapport `Nature : interruption`, que l'orchestrateur écrit
lui-même à la coupure par quota (`orchestrer-plan/SKILL.md`, « Coupure par quota »). L'état posé porte
donc ce rapport ; `--poser-seulement` imprime le constat.

## Le scénario `arret-relaye`, en deux temps (P20/S6)

Mesure l'hypothèse H1 du plan P20 : une session arrêtée sur une question reprend **par `SendMessage`, avec tout son
contexte**, même après une longue attente. Le banc joue deux `claude -p` sur la **même session persistée** (c'est le
seul scénario sans `--no-session-persistence`) :

1. **Temps 1** — `claude -p --session-id <uuid>` : l'orchestrateur lance S1 ; S1 lit `docs/mot.txt` (un mot qui ne
   figure nulle part ailleurs), en efface le contenu, committe, écrit `plans/P1/S1.question.md` (gabarit
   `reprendre-echec/references/gabarit-question.md`) et rend `VERDICT: QUESTION` ; l'orchestrateur complète `Agent :`,
   rappelle le moteur (`question`, source `attente-reponse`) et relaie la question. `claude -p` s'arrête.
2. **Attente** — `--attente <minutes>` (au moins 30 pour mesurer H1). Un appel du banc ne dépasse pas `--pause-max`
   minutes ; au-delà, code 4 : `--reprendre` continue (l'attente écoulée est lue dans `attente.json`).
3. **Temps 2** — le banc écrit la réponse (`Choisis le nom fois2.`, jamais le mot) dans la ligne `Réponse :` de
   `S1.question.md`, la committe et la pousse, puis `claude -p --resume <uuid>` relance `/workflow:orchestrer-plan P1`
   **en redonnant la réponse dans le message** (comme un utilisateur qui répond dans la conversation : avec la seule
   réponse committée, l'orchestrateur refusait de la transmettre, passage `…2026-10-16T07-35-15`) :
   le moteur rend `transmettre`, l'orchestrateur fait le `SendMessage`, S1 termine par
   `VERDICT: PASS · MOTIF: mot=<le mot> nom=<le nom>`.

`noter.mjs` lit les deux flux (`out/stream.jsonl`, `out/stream-reprise.jsonl`), somme les coûts, compte les
`SendMessage` (avec l'erreur du `tool_result`) et conclut H1 : **confirmée** (mot restitué par la même session,
`SendMessage` sans erreur), **réfutée** (envoi en erreur, ou envoi réussi mais mot perdu) ou **indéterminée** (pas de
question, pas d'envoi, mot dans la question ou la réponse, ou mot retrouvé par une relecture de `mot.txt` / d'un diff git).
Dans tous les cas une mesure, pas un échec de la session. Aucun outil du mini-projet ne supprime un fichier (`git rm`
n'est pas dans `permissions.allow`) : le mot est effacé par `Write`, et `S1.question.md` reste en place — le moteur le
tient pour consommé dès qu'un commit de tâche suit la réponse.

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
  et `--allowedTools` explicite (`OUTILS_AUTORISES` dans `lancer.mjs`, ou la liste du gabarit avec
  `--autorisations projet` ; `Task` y côtoie `Agent`, nom que `init` donne à l'outil en 2.1.293).
  `noter.mjs` imprime les `permission_denials`. Un refus sous `--autorisations projet` se corrige dans
  la commande (ou, pour une lecture seule, dans le gabarit), pas en élargissant la liste.
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
