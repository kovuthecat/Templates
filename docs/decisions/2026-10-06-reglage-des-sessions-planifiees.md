# 2026-10-06 — Régler le modèle et l'effort d'une session planifiée dès son premier tour

> Issue de `/cadrer` : **Preuve à faire**. Suite de M5 (`docs/analyses/2026-10-05-preuves-mods-autonomes-mesures.md`).
> Brief : inchangé.

## Ce que ça change, en clair

**Pour l'instant, rien n'entre dans le workflow.** Une preuve courte doit établir comment une
session lancée par **tâche planifiée** peut tourner, dès sa première requête, au modèle et à l'effort
que lui demande l'index du plan, sans payer son démarrage deux fois.

C'est une pièce de la direction déjà décidée le 2026-10-05 : la session neuve lancée par
l'orchestrateur doit remplacer la pastille. M5 a montré qu'elle ne la remplace pas encore. Cette
preuve ne traite que l'un des trois défauts relevés, le réglage. Les deux autres, le mode de
permission hérité et le réveil de l'orchestrateur, restent ouverts.

Deux voies sont mises à l'épreuve, **dans cet ordre, la seconde seulement si la première échoue** :

- **B — le frontmatter de la tâche.** Une tâche planifiée est stockée sous forme de `SKILL.md`. On
  y ajoute `model:` et `effort:`. S'il est lu, c'est la solution la plus simple : deux lignes,
  aucun code.
- **C — un mod `turn.step`.** Il réécrit modèle et effort de chaque requête du fil principal quand
  la session a été ouverte par `Ouvre plans/P<n>/S<k>.md et exécute-le.`. Il couvrirait aussi les
  sessions ouvertes depuis une pastille.

Conséquences observables, selon le verdict :

- **B positive** : `/orchestrer-plan` écrira le frontmatter de la tâche depuis la ligne d'index. Rien
  à maintenir en plus. C n'est pas construit.
- **B négative, C positive** : un mod de plus à installer et à maintenir. L'interface et le journal
  `PostModelSwitch` continueraient sans doute d'afficher le modèle de lancement. La preuve relève ce
  qu'ils affichent.
- **Les deux négatives** : reste la session relais (option A), qui marche aujourd'hui mais paie un
  préambule complet de plus par session.

## Le problème, mesuré

Relevés de M5 (P13/S6, 2026-10-05, `docs/analyses/preuves-mods-autonomes-releves.md` sur la branche
`preuve/mods-2`) :

- `create_scheduled_task` **n'accepte ni modèle ni effort**.
- La session lancée **hérite du modèle et de l'effort de la conversation qui la lance** : Opus /
  `medium` pour les deux, alors que l'index demandait Sonnet.
- `set_session_model` et `set_session_effort` répondent « à partir du prochain tour ». A a fait son
  premier tour en Opus. B est en Sonnet sur son seul tour : la commande est probablement arrivée
  avant la première requête. C'est une course, pas un mécanisme.
- **Le piège** : une session planifiée travaille en un seul long tour, sauf blocage. « Au prochain
  tour » peut donc vouloir dire « jamais ».

Le coût d'un démarrage, mesuré en P13 sur des sous-agents : **37 000 à 58 000 tokens de création de
cache** (P92/S1 36 976, M2b 55 227, sonde 57 740). Le préambule d'une session principale (prompt
système, outils, MCP, `CLAUDE.md`, contexte de `SessionStart`, liste des skills) est au moins aussi
gros. C'est l'unité qui départage les options.

## Les options

| Option | Préambules par session | À construire | État |
| --- | --- | --- | --- |
| **B** — frontmatter du `SKILL.md` de la tâche | 1 | deux lignes | non prouvé : on ignore si le lanceur de tâches lit ce frontmatter |
| **C** — mod `turn.step` | 1 | un hook, la lecture d'index d'O1 reprise | non prouvé : `turn.step` n'a jamais été mesuré |
| **A** — session relais qui lance `workflow:session-<effort>` avec `model:` | 2 | une consigne de prompt | chaque pièce est déjà prouvée (2026-09-18, O1) |
| **D** — `set_session_*` après lancement | 1, plus des tours au mauvais modèle | rien | course mesurée en M5 |

Écartées :

- **D** : un réglage qui dépend de qui arrive en premier n'est pas un mécanisme.
- **B′ — première ligne du prompt qui invoque une skill portant `model:` / `effort:`** : la première
  requête part au modèle hérité, puis la bascule réécrit le préambule au modèle cible. Elle coûte
  donc deux préambules, comme A, sans en avoir la preuve.
- **A n'est pas mise à l'épreuve** : elle est déjà prouvée par morceaux. Elle reste le repli si B et
  C échouent.

Le cas où rien n'est à régler : la session hérite du modèle de l'orchestrateur, donc tant que les
deux concordent (Sonnet / `medium`, le cas courant), aucune voie n'est nécessaire.

Aiguillage des protocoles de méthode (`/cadrer` Étape 2) : **`NONE`**. Les deux inconnues sont
binaires et se lèvent à l'exécution. Aucune fiche n'améliorerait l'arbitrage.

## Protocole de preuve

**Question** : une session lancée par `run_scheduled_task` peut-elle tourner, **dès sa première
requête**, au modèle et à l'effort de sa ligne d'index, avec **un seul** préambule écrit en cache ?

**Branche** : `preuve/reglage-session`, créée depuis `main`, poussée, jamais fusionnée.

**Où ça se joue** : les mesures en direct (B, puis C2) se jouent **dans le fil d'une conversation
Desktop**, jamais en sous-agent, comme S6 de P13 : ce sont les outils `scheduled-tasks` et
`ccd_session_mgmt` de cette conversation qui lancent et lisent les sessions. Cette session cloud ne
les a pas.

**Règle d'autonomie** : aucune session du plan ne pose de question. Un choix non prévu ici s'écrit
« non conclu : <choix manquant> » dans le fichier de mesures, et la session passe à la mesure
suivante.

**Instrument, le même pour toutes les mesures** : la transcription de la session lancée sur disque,
`~/.claude/projects/<projet>/<sessionId>.jsonl`. On y lit :

- le champ `model` de **chaque** message assistant ;
- le champ `effort` des tours (porté par la transcription, constaté le 2026-09-18 sur les
  sous-agents) ;
- `usage.cache_creation_input_tokens` de chaque requête.

`get_session` est relevé à côté pour savoir ce que l'interface affiche, sans servir de juge. Si un
champ manque à la transcription, la mesure s'écrit « non conclu : instrument », et la preuve relève
où l'information se trouve à la place.

**Plan de fixture** : `plans/P94/` sur la branche, une session `S1` à la ligne d'index **Haiku ·
low**. Son `S1.md` lit deux fichiers du dépôt avec `Read` (au moins trois requêtes dans le tour),
n'écrit rien, n'appelle ni `Bash` ni outil d'écriture, et finit par `VERDICT: PASS`. Lecture seule :
aucune approbation n'est attendue, ce qui tient à l'écart le défaut de permission de M5.

**Conversation de lancement** : **Sonnet · medium**, distincte de la cible Haiku · low sur les deux
axes. Un héritage se voit donc sur chaque champ.

### Étape 0 — Lectures préalables, sans rien lancer

- **Le schéma de `create_scheduled_task`** dans la version de Desktop du jour. S'il accepte désormais
  `model` ou `effort`, on le note, on le mesure comme B, et on arrête là si c'est positif.
- **Un `SKILL.md` de tâche existant** (P13 a laissé ceux de `p13-a` et `p13-b` sur disque). On note
  son chemin, son frontmatter et ce que la description de l'outil dit du fichier.

### B — Frontmatter de la tâche

1. Créer la tâche `P94-B` (sans horaire), avec pour prompt `Ouvre plans/P94/S1.md et exécute-le.`.
2. Ajouter `model: haiku` et `effort: low` à son `SKILL.md`, puis relire le fichier : l'ajout doit
   y être encore.
3. `run_scheduled_task`, puis `get_session` immédiatement. **Ne pas** appeler `set_session_*`.
4. À la fin, lire la transcription. Relire aussi le `SKILL.md` : l'ajout a-t-il survécu à
   l'exécution ?

- **Positif** : le **premier** message assistant et tous les suivants portent Haiku et l'effort
  `low`, et aucune requête après la première n'a une création de cache supérieure à 50 % de celle de
  la première.
- **Négatif** : le premier message porte Sonnet (frontmatter ignoré), ou l'ajout est effacé avant
  l'exécution.
- **Partiel** : le modèle s'applique mais pas l'effort, ou l'inverse. C se joue alors pour l'axe
  manquant seulement.
- **B positive sur les deux axes → C ne se construit pas.** On passe directement au rendu.

### C — Mod `turn.step`, seulement si B n'est pas positive sur les deux axes

Fait relevé dans les types de l'API des mods (`claude-code.d.ts`, build 2.1.291, 2026-10-06) :
`turn.step` se déclenche avant chaque requête au modèle, sur le fil principal (`agentId` absent) comme
dans un sous-agent ; `next({ ...e, model })` et `next({ ...e, effort })` envoient la requête avec un
autre modèle ou un autre effort ; `$.session.messages()` lit la conversation. Aucune méthode ne règle
le modèle de la session elle-même.

**C1 — logique, hors session** (`preuves/mods/reglage/`). Sur une requête du **fil principal** dont
le **premier message utilisateur** est exactement `Ouvre plans/P<n>/S<k>.md et exécute-le.`, le mod
lit la ligne `S<k>` de `plans/P<n>/index.md` et réécrit `model` et `effort` (colonnes Modèle et
Effort). Le parseur d'index se reprend d'O1 (`preuves/mods/orchestration/hooks/orchestration.ts`,
branche `preuve/mods-2`). Tests `plugin test` attendus :

| Cas | Attendu |
| --- | --- |
| premier message conforme, index lisible | modèle et effort réécrits à chaque requête |
| premier message différent (conversation interactive, `/orchestrer-plan …`) | inchangé |
| requête de sous-agent (`agentId` présent) | inchangé, c'est le domaine d'O1 |
| index illisible, ligne absente, valeur inconnue | inchangé, jamais un refus |
| la cible concorde déjà avec la requête | inchangé |

Gate : `"$CLAUDE_CODE_EXECPATH" plugin validate` sur le `plugin.json` du mod,
`"$CLAUDE_CODE_EXECPATH" plugin test preuves/mods/reglage`.

**C2 — en direct.** Ajouter le module à `plugin/hooks/hooks.json` de la branche, puis réinstaller le
plugin (`uninstall` puis `install`, `--scope local`, comme en P13). Ensuite :

1. Créer et lancer la tâche `P94-C` avec le même prompt, sans frontmatter ajouté et sans
   `set_session_*`.
2. Lire la transcription et le journal du mod (une ligne par réécriture). Relever ce qu'affichent
   `get_session` et `.claude/journal-modeles.jsonl`.
3. Désinstaller le mod de la branche, puis réinstaller le plugin depuis `main`.

- **Positif** : les tests C1 passent, **et** en C2 le premier message assistant et tous les suivants
  portent la cible, avec un seul préambule écrit en cache (même règle des 50 % qu'en B).
- **Négatif** : `turn.step` ne se déclenche pas sur le fil principal d'une session planifiée (journal
  vide), ou la réécriture est refusée (ligne grisée, journal de débogage), ou le premier message porte
  encore Sonnet.

### Ce qui revient

`docs/analyses/<date>-reglage-sessions-planifiees-mesures.md`, **seul fichier reporté sur `main`**.
Il contient une section par mesure (Étape 0, B, C1, C2) avec le protocole tel qu'exécuté, les lignes
de transcription citées, la commande qui reproduit et le verdict contre le critère ci-dessus cité mot
pour mot. Suivent les sections « Réfuté », « Voie retenue » (B, C ou repli A) et le nombre de gestes
humains (cible : 0).

Ensuite : supprimer les tâches créées, et vérifier que le plugin local est réinstallé depuis `main`.
N0 en fin de plan, sur la branche.

### Budget

| Étape | Budget |
| --- | --- |
| Étape 0 et B | 25 tours, plus une exécution de tâche de 10 minutes au plus |
| C1 | 30 tours |
| C2 | 25 tours, plus une exécution de 10 minutes au plus |
| Rendu | 15 tours |

En cas de dépassement : s'arrêter, écrire « non conclu, budget » pour les mesures restantes, et
rendre ce qui a été mesuré.

## Hors de cette preuve

- **Le mode de permission hérité** et **le réveil de l'orchestrateur** (M5) : sans eux, la pastille
  reste nécessaire, quel que soit le verdict ici. La fixture est en lecture seule précisément pour
  ne pas les mesurer par accident.
- **L'intégration** dans `/orchestrer-plan` et `WORKFLOW.md` §5b : ce sera la décision qui suit, au
  vu du verdict.
- **L'alignement des sessions ouvertes depuis une pastille** : C le couvrirait par construction, mais
  la preuve ne le mesure pas.

## État final de la grille

| Dimension | État | Preuve | Si OPEN — résolution |
| --- | --- | --- | --- |
| problème concret | READY | M5 : héritage du modèle de lancement, `set_session_*` « au prochain tour », premier tour en Opus (`2026-10-05-preuves-mods-autonomes-mesures.md` § M5) | — |
| résultat visé | READY | demande explicite de l'utilisateur (2026-10-06) : la voie la plus simple et la plus économe pour régler modèle et effort d'une session planifiée | — |
| vérification | READY | critères positifs et négatifs écrits ci-dessus ; instrument relevé en 2026-09-18 (`effort` dans la transcription) | — |
| périmètre | READY | branche `preuve/reglage-session` ; `plans/P94/`, `preuves/mods/reglage/`, `plugin/hooks/hooks.json` en C2 seulement | — |
| cohérence | OPEN | B : le lanceur de tâches lit-il le frontmatter du `SKILL.md` ? C : `turn.step` agit-il sur le fil principal d'une session planifiée ? | **expérience** (ce protocole) |
| intégration au workflow | OPEN | dépend du verdict, et de M5 pour la permission et le réveil | **expérience**, puis une décision et un plan ordinaire sur `main` |

**Validité** : moteur Desktop 2.1.286 (P13) ; types de l'API des mods du build 2.1.291 ; outils
`scheduled-tasks` tels que relevés le 2026-10-05 ; coût de démarrage des sous-agents mesuré en P13.
