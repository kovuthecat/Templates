# 2026-10-06 — Régler modèle et effort d'une session planifiée : mesures

> Plan P14, branche jetable `preuve/reglage-session`. Décision d'origine :
> `docs/decisions/2026-10-06-reglage-des-sessions-planifiees.md`. Relevés bruts (sur la branche) :
> `docs/analyses/reglage-sessions-planifiees-releves.md`. Suite de
> `docs/analyses/2026-10-05-preuves-mods-autonomes-mesures.md` (M5). Moteur Desktop 2.1.286.
> Les critères sont cités mot pour mot. Verdicts possibles : positif, négatif, partiel, non conclu.
> Reproduire une lecture : `node preuves/reglage/transcription.mjs --lire <transcription.jsonl>`.

## Ce que ça change, en clair

- **Aucune des deux voies ne règle à la fois le modèle et l'effort d'une session planifiée.** La
  voie B (deux lignes `model:` et `effort:` dans le fichier de la tâche) règle le **modèle** dès la
  première requête, pas l'effort. La voie C (un mod) n'a rien réglé du tout en direct.
- **Voie retenue : B pour le modèle, repli A (session relais) pour l'effort.** Ce que l'utilisateur
  verra : une tâche planifiée tourne bien au modèle de l'index si `/orchestrer-plan` écrit
  `model:` dans son `SKILL.md` ; son effort reste celui de la conversation qui l'a lancée
  (`medium`). Si l'index demande un autre effort, il faut la session relais, au prix d'un
  préambule de plus par session. Revers : B seul ne suffit que quand l'effort de l'index est
  `medium`, le cas courant.
- **Écart à la décision** (tranché par l'utilisateur le 2026-10-06) : la cible de test est
  **Opus · low**, non Haiku · low. Preuve : les transcriptions Haiku de ce poste ne portent pas le
  champ `effort` (4 sur 4), l'axe effort n'y aurait pas été mesurable. Les critères se lisent
  « Opus » là où ils disent « Haiku ».
- Gestes humains demandés : **1** (cible 0).

## Étape 0

- **Départ** : la conversation d'orchestration (Sonnet · medium) a été lue par `--lire` :
  `claude-sonnet-5-5`, effort `medium`. Départ conforme.
- **0a — schéma de `create_scheduled_task`** : paramètres `taskId`, `prompt`, `description`,
  `title`, `cronExpression`, `fireAt`, `notifyOnCompletion`. **Aucun `model` ni `effort`** : B passe
  forcément par le frontmatter du `SKILL.md` (`~/.claude/scheduled-tasks/{taskId}/SKILL.md`).
- **0b — fichier de tâche existant** : aucun (`list_scheduled_tasks` vide, dossier absent). Le chemin
  et le frontmatter (`name`, `description`) se sont relevés sur `P94-B` en B.

**Verdict Étape 0 :** schéma sans `model` ni `effort` ; fichier de tâche relevé en B (0b : non conclu
avant création).

## B

**Critères cités** :
- « **Positif** : le **premier** message assistant et tous les suivants portent [la cible] et l'effort
  `low`, et aucune requête après la première n'a une création de cache supérieure à 50 % de celle de
  la première. »
- « **Négatif** : le premier message porte Sonnet (frontmatter ignoré), ou l'ajout est effacé avant
  l'exécution. »
- « **Partiel** : le modèle s'applique mais pas l'effort, ou l'inverse. »

**Protocole tel qu'exécuté** : `create_scheduled_task` `P94-B` (identifiant `p94-b`), prompt exact
`Ouvre plans/P94/S1.md et exécute-le.`, créée du premier coup ; ajout de `model: opus` et
`effort: low` au `SKILL.md`, relu : présent ; `run_scheduled_task` → session `local_5de8333b-…`,
sans `set_session_*`. Transcription `b15f6ba1-ee4a-4a6c-882d-5ae74256cb35.jsonl` repérée par prompt
exact et heure (l'identifiant de session n'est pas le nom du fichier).

```
rang  model            effort  cache_creation  outils
1     claude-opus-5-5  medium  37363           Read
2     claude-opus-5-5  medium  661             Read
3     claude-opus-5-5  medium  353             Read
4     claude-opus-5-5  medium  2175            —
5     claude-opus-5-5  medium  356             —
rapport max(cache 2..n)/cache 1: 0.058
```

- Modèle : 5 requêtes sur 5 en `claude-opus-5-5`, dès la première → positif.
- Effort : champ présent sur 5 requêtes, vaut `medium` partout → `effort: low` n'est pas appliqué.
- Cache : 0,058 (< 0,5), mais 2 tours (le second est un retour du hook Stop, « TASKS.md : 67 lignes
  (plafond 60) ») ; non conclu pour la règle des 50 %, sans effet sur le verdict.
- `get_session` : pendant, `model: "opus"` sans effort ; après, `claude-opus-5-5` / `medium`. Le
  `SKILL.md` a gardé `model: opus` et `effort: low` après exécution.

**Verdict B :** partielle (axe manquant : effort)

## C1

Mod `preuves/mods/reglage/` (hook `turn.step`, déclencheur : premier message exact
`Ouvre plans/P<n>/S<k>.md et exécute-le.`, fil principal seulement, colonnes Modèle et Effort de
l'index, `next({ ...e, model, effort })`, jamais un refus). Tests simulés sous `plugin test` :
**12 cas, 0 échec**, dont les 5 lignes du tableau de la décision ; `plugin validate` ✔ ; preuve N0
`plans/P14/S2.n0.json`. Moteur 2.1.286 : `turn.step`, `effort` réécrivable et
`$.session.messages()` présents. Reproduire : `"$CLAUDE_CODE_EXECPATH" plugin test preuves/mods/reglage`.
Point laissé à C2 : le mod écrit l'alias `opus`, alors que `e.model` arrive résolu
(`claude-…`) ; un test simulé ne prouve pas que le moteur accepte l'alias.

**Verdict C1 :** les tests simulés passent. Le critère C a deux moitiés : sans la seconde (C2), ce
n'est pas un positif.

## C2

**Critère cité** : « **Positif** : les tests C1 passent, **et** en C2 le premier message assistant et
tous les suivants portent la cible, avec un seul préambule écrit en cache. » « **Négatif** : `turn.step`
ne se déclenche pas sur le fil principal d'une session planifiée (journal vide), ou la réécriture
est refusée (…), ou le premier message porte encore Sonnet. »

**Protocole tel qu'exécuté** : module copié dans `plugin/hooks/reglage.ts`, `"modules"` ajouté à
`plugin/hooks/hooks.json`, `plugin validate` ✔, plugin réinstallé (`--scope local`), cache `0.54.0`
contrôlé (`modules` présent, `reglage.ts` présent) ; tâche `P94-C` sans aucun frontmatter ajouté ;
`run_scheduled_task` → session `local_9ea543bf-…`, sans `set_session_*`. Transcription
`802efa76-5567-468e-9370-b51112bbeb23.jsonl` :

```
rang  model              effort  cache_creation  outils
1     claude-sonnet-5-5  medium  37328           Read
2     claude-sonnet-5-5  medium  661             Read
3     claude-sonnet-5-5  medium  353             Read
4     claude-sonnet-5-5  medium  2175            —
5     claude-sonnet-5-5  medium  378             —
```

- Journal `~/.claude/preuves/mods/reglage.jsonl` : **vide** (fichier et dossier absents).
  `.claude/journal-modeles.jsonl` : absent (aucun changement de modèle). `get_session` après :
  `claude-sonnet-5-5` / `medium`.
- Les événements `SessionStart` et `Stop` du même `hooks.json` apparaissent dans la transcription :
  le fichier a été lu, le module n'a laissé aucune trace. Cause non déterminée (module non chargé
  en session planifiée, ou `turn.step` non déclenché sur son fil principal) ; la mesure ne les
  distingue pas.

**Verdict C2 :** négative (journal vide, et premier message encore en Sonnet)

## Réfuté

- « Créer une tâche planifiée est refusé par le classificateur » : réfuté, `P94-B` et `P94-C`
  créées du premier coup.
- « L'identifiant de session est le nom de la transcription » : réfuté (`local_5de8…` ≠
  `b15f6ba1-….jsonl`) ; le repérage par prompt exact et heure a suffi.
- « La session de test fait plus d'un tour » : **confirmé**, non réfuté : le second tour est un
  retour du hook Stop du workflow, sans outil. Il n'a pas empêché de conclure (effort lu sur chaque
  requête), mais il rend la règle des 50 % non concluante.
- « Le `SKILL.md` perd son ajout » : réfuté, `model:` et `effort:` survivent à l'exécution.
- « Un mod `turn.step` règle une session planifiée » : réfuté en direct (C2).

## Voie retenue

**B pour le modèle ; repli A (session relais lançant `workflow:session-<effort>`) pour l'effort,
quand il diffère de celui de l'orchestrateur.** C n'est pas retenue : le mod n'a rien réglé et sa
cause d'échec n'est pas déterminée ; une preuve de plus serait nécessaire avant de le reconsidérer.
Rien n'entre dans `plugin/` ici ; l'intégration (`/orchestrer-plan`, `WORKFLOW.md` §5b) est une
décision ultérieure sur `main`.

## Gestes humains

**1** depuis le début du plan (cible 0) : le choix à la question sur les fichiers non suivis qui
bloquaient la preuve N0 de S1. Aucune approbation de tâche, aucun clic.

## Défauts relevés

- L'outil `delete_scheduled_task` laisse les `SKILL.md` `p94-b` et `p94-c` sur disque
  (`~/.claude/scheduled-tasks/`), hors planificateur, inoffensifs.
- Le hook Stop (plafond de 60 lignes de `TASKS.md`, 67 constatées) ajoute un second tour à une
  session planifiée de lecture seule.
- Vérification de l'état en S4 : aucune tâche `P94-*` ; `git diff` du dossier `plugin` contre le
  commit du plan → vide ; cache `0.54.0` : `modules` absent de `hooks.json`, `reglage.ts` absent.
  Rien n'a eu à être réparé.

## Report sur `main`

Le report de ce seul fichier sur `origin/main` a d’abord été refusé par le classificateur de permissions du mode automatique (« Modify Shared Resources », puis « Auto-Mode Bypass »), sans être contourné. Il a été fait ensuite sur ordre direct de l’utilisateur (2026-10-06), par commit sur `origin/main` à index temporaire, ce seul fichier.
