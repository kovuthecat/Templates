# Preuve P15 — relevés de la branche `preuve/session-neuve`

## Base

- Hash de base (`git rev-parse origin/main` après fetch) : `b583538f4b78c4bcb90850c998e664dbcf616b34` ;
  contient le commit de S1 (`bbaa3a0`, `Plan: P15/S1/T1`).
- Plugin chargé (`claude.exe plugin list`) : `workflow@templates` 0.55.0, scope local, enabled.
- `~/.claude/preuves/p15-pose.txt` : `2026-10-06T11:22:11.525Z` (heure de la pose).
- Règles `allow` commençant par `P15 —` dans `claude auto-mode config` : 7 (attendu : 7).
- `modelSettings["claude-opus-5-5"].effortLevel` dans `~/.claude/settings.json` : `low` (attendu).
- Instrument : restauré depuis le commit orphelin `1759667` (`preuves/reglage/transcription.mjs`).
- Rejeu de contrôle sur `b15f6ba1-….jsonl` : 5 requêtes, `claude-opus-5-5`, effort `medium`,
  rapport max(cache 2..n)/cache 1 = 0.058 — identique au tableau de P14 (§ B).
- Revers du réglage d'effort : jusqu'au retrait en S6, toute session Opus ouverte sur ce poste dans un
  projet sans `modelSettings` propre tourne en `low`.

## Parcours et permissions

Sources : `permissions.allow` de `.claude/settings.json` (abrégé **allow**) ; règles `P15 — n°k` de
`claude auto-mode config` (n°1 tâches `P95-` · n°2 gestes de session · n°3 minuteur et `Bash` d'attente ·
n°4 session de test : `ToolSearch`/`SendMessage`, `fixture.mjs`, écriture sous `plans/P95/sorties/` ·
n°5 push de la branche et report sur `main` par index temporaire · n°6 fixture `~/preuves-p15/` et
`claude -p`/`plugin` dedans · n°7 retrait des règles `P15 —`) ; `$defaults` (comportement du
classificateur hors règle). Les entrées `allow` ne valent pas pour une commande non listée : le
classificateur du mode auto tranche alors, d'où « rien ».

| Joueur · geste | Outil | Ce qui l'autorise | Si refusé |
| --- | --- | --- | --- |
| A · ouvrir `plans/P95/S1.md` | Read | allow `Read` | impossible : la session n'a pas son contenu → pas de `A.fin`, W1 « non conclu : session A non finie » |
| A · `node preuves/session-neuve/fixture.mjs --session A` | Bash | règle n°4 (« may run `node preuves/session-neuve/fixture.mjs` ») ; **pas** dans allow, exprès | A écrit `VERDICT: FAIL bash refusé` : P-gestes négatif « règle présente, refus quand même » |
| A · écrire `plans/P95/sorties/A.fin` | Write | allow `Write` ; règle n°4 (« write files under plans/P95/sorties/ ») | `A.fin` absent : même issue que ci-dessus |
| B · ouvrir `plans/P95/S2.md` | Read | allow `Read` | idem A |
| B · `node preuves/session-neuve/fixture.mjs --session B` | Bash | règle n°4 ; pas dans allow | B écrit `VERDICT: FAIL bash refusé` |
| B · écrire `plans/P95/sorties/B.fin` | Write | allow `Write` ; règle n°4 | `B.fin` absent : W2 « non conclu » |
| B · `ToolSearch select:SendMessage,ListAgents` | ToolSearch | règle n°4 (« may load SendMessage/ListAgents with ToolSearch ») | pas d'envoi ; B réécrit `B.fin` (« adresse introuvable ») → W2 « non conclu : adresse » ou négatif selon la cause relevée |
| B · `ListAgents` | ListAgents | `$defaults` (lecture seule) ; rien d'explicite | idem ligne précédente |
| B · `SendMessage` à `P15-orchestrateur` | SendMessage | règle n°4 (« send one message to the session named `P15-orchestrateur` ») | message non reçu → W2 négatif « message non reçu » |
| B · cas d'échec : lire `B.fin` puis le réécrire avec « adresse introuvable » | Read, Write | allow `Read`, `Write` (réécrire un fichier existant exige une lecture préalable) | `B.fin` garde `VERDICT: PASS` seul : le motif « adresse » se perd, relevé comme tel |
| Orchestrateur S3 · créer / lancer / mettre à jour / lister / supprimer `P95-A` | scheduled-tasks | règle n°1 | création refusée deux fois → P « négatif : création refusée » (prévu) |
| Orchestrateur S3 · ajouter `model: opus` à `~/.claude/scheduled-tasks/p95-a/SKILL.md` | Edit | allow `Edit` ; règle n°1 (citant ce `SKILL.md`) | M non mesurable : « non conclu » |
| Orchestrateur S3/S4 · `node -e "console.log(Date.now())"` (T0) | Bash | allow `Bash(node -e:*)` | T0 pris autrement (heure du lancement) |
| Orchestrateur S3/S4 · `get_session`, `list_sessions`, `list_events`, `set_session_title` (sur la sienne) | ccd_session_mgmt | règle n°2 | adresse introuvable → W2 « non conclu : adresse » |
| Orchestrateur S3/S4 · `set_remote_control` | ccd_session_mgmt | règle n°2 | R négatif (refus ou carte relevés mot pour mot) |
| Orchestrateur S3/S4 · `archive_session` | ccd_session_mgmt | règle n°2 | A négatif, motif relevé |
| Orchestrateur S3/S4 · `CronCreate`, `CronList`, `CronDelete` | Cron* | règle n°3 | pas de minuteur de secours : le relever, la mesure continue |
| Orchestrateur S3 · `node preuves/reglage/transcription.mjs --attendre …` en arrière-plan | Bash | règle n°3 ; pas dans allow | pas de réveil W1 → négatif de fait « aucune reprise », cause citée |
| Orchestrateur S3/S4 · arrêt de la commande d'attente restée vivante | TaskStop | rien d'explicite (`$defaults`, commande propre à la session) | l'attente peut réveiller S4 à la place du message : relevé en P-gestes, W2 non conclu possible |
| Orchestrateur S3/S4 · `node preuves/reglage/transcription.mjs --lire` (et `--attendre … --max 30` au premier plan en S4) | Bash | règle n°3 vise l'attente en arrière-plan ; `--lire` n'est pas dans allow → **rien**, `$defaults` | M/E non jugés sur la transcription : « non conclu », jamais jugés sur `get_session` |
| Orchestrateur S3/S4 · `ls -l --time-style=full-iso plans/P95/sorties/`, lecture de `A.fin`/`B.fin` | Bash, Read | allow `Bash(ls:*)`, `Read` | témoin non daté → W1/W2 « non conclu » |
| Orchestrateur S3/S4 · `delete_scheduled_task` | scheduled-tasks | règle n°1 | tâche restante : relevée, dossier laissé |
| Orchestrateur S3/S4 · éditer les relevés et l'index | Edit | allow `Edit` | — |
| Orchestrateur S3/S4 · `node plugin/bin/n0.mjs --session P15/S3` (S4 pour S4) | Bash | allow `Bash(node plugin/bin/n0.mjs:*)` | pas de commit |
| Orchestrateur S3/S4 · `git add`, `git commit`, `git push`, `git status`, `git rev-parse` | Bash | allow (`git add/commit/push/status/rev-parse`) ; règle n°5 pour le push de la branche | pas de relevés poussés → le hook Stop forcerait un tour (anti-raccourci de S3) |
| Sous-agent S5 · `claude plugin validate preuves/session-neuve/k/.claude-plugin/plugin.json` (lancé depuis Templates) | Bash | **rien** : la règle n°6 vise le dossier `~/preuves-p15/`, pas Templates ; `$defaults` | K « non conclu : module invalide » ; refus à citer |
| Sous-agent S5 · `git init`, `claude plugin list`, `claude -p "Réponds OK."` dans `~/preuves-p15/k` | Bash | règle n°6 | « non conclu : lancement refusé » (prévu par S5) |
| Sous-agent S5 · `node plugin/bin/sync-workflow.mjs --projet ~/preuves-p15/k` | Bash | **rien** pour la commande lancée depuis Templates ; l'écriture dans la fixture relève de n°6 | fixture sans vendoring, noté (prévu par S5) |
| Sous-agent S5 · écrire dans `~/preuves-p15/k/.claude/settings.json` et `…/mods/journal.ts` | Write, Edit, Bash cp | allow `Write`/`Edit` ; règle n°6 | K « non conclu » |
| Sous-agent S5 · écrire `preuves/session-neuve/k/**` | Write | allow `Write` | — |
| Sous-agent S5 · `claude plugin marketplace add/remove`, `plugin install/uninstall --scope local` dans la fixture (essai 3 et T8) | Bash | règle n°6 | essai 3 impossible → K « non conclu : instrument » ; désinstallation refusée → geste humain compté (S5 « Si bloqué ») |
| Sous-agent S5 · `rm -rf ~/preuves-p15`, `rm ~/.claude/preuves/p15-k.jsonl` | Bash | règle n°6 pour `~/preuves-p15/` ; le journal `~/.claude/preuves/p15-k.jsonl` est **hors** règle : **rien** | journal laissé : relevé dans « État après K », geste humain compté |
| Sous-agent S5 · `claude plugin list`, `claude plugin marketplace list` dans Templates (T8 étape 3) | Bash | **rien** (lecture seule ; `$defaults`) | contrôle relevé « non conclu » |
| Sous-agent S5 · `node plugin/bin/n0.mjs --session P15/S5`, commit, push | Bash | allow n0, git ; règle n°5 | — |
| Sous-agent S6 · écrire `docs/analyses/2026-10-06-session-neuve-mesures.md`, commit, push de la branche | Write, Bash | allow `Write`, `git add/commit/push` ; règle n°5 | résultat de la branche : relevé |
| Sous-agent S6 · report : `git fetch origin`, `mktemp`, `git read-tree`, `git hash-object`, `git update-index`, `git write-tree`, `git commit-tree`, `git push origin $C:refs/heads/main` | Bash | règle n°5 (« reporting to origin/main … temporary index ») ; `git push` dans allow ; les autres sous-commandes ne sont **pas** dans allow | **Report négatif** : refus du classificateur ou hook `pretooluse-git`, cité ; commande rendue au Bilan |
| Sous-agent S6 · `git diff --name-only origin/main~1 origin/main` | Bash | allow `Bash(git diff:*)` | — |
| Sous-agent S6 · `node preuves/session-neuve/retirer-reglages.mjs` (retrait des entrées `autoMode.allow` `P15 —`) | Bash | règle n°7 ; le script n'est pas dans allow | commande rendue au Bilan, comptée |
| Sous-agent S6 · même script : retrait de `modelSettings["claude-opus-5-5"]` | Bash | **rien** : la règle n°7 ne couvre que les entrées `autoMode.allow` ; le classificateur peut refuser le script entier | même issue : commande au Bilan |
| Sous-agent S6 · supprimer `~/.claude/scheduled-tasks/p94-b`, `p94-c`, `p95-a`, `p95-b` ; supprimer `~/.claude/preuves/p15-pose.txt` | Bash | **rien** : la règle n°1 couvre les tâches `P95-` via les outils, pas un `rm` direct, ni `p94-*` | dossiers laissés : relevé, geste humain compté |
| Sous-agent S6 · `claude auto-mode config`, `claude plugin list`, `git diff <base> -- plugin/ .claude/settings.json` | Bash | `git diff` : allow ; `claude …` : **rien** (lecture seule, `$defaults`) | contrôle relevé « non conclu » |
| Sous-agent S6 · `node plugin/bin/n0.mjs --session P15/S6`, commit, push | Bash | allow n0, git ; règle n°5 | — |

**Contradictions trouvées et corrigées dans P95 (jamais dans S3-S6)**
1. `P95/S1` et `P95/S2` interdisaient tout outil hors `Bash`/`Write` (S2 : et la messagerie) alors que le
   prompt de la tâche (`Ouvre plans/P95/S1.md…`) exige de **lire** le fichier : sans `Read`, la session
   ne peut pas obéir à sa consigne. Corrigé : `Read` ajouté aux outils admis (le fichier lui-même).
2. `P95/S2` étape 3 (adresse introuvable) demande de **réécrire** `B.fin` : un `Write` sur un fichier
   existant exige une lecture préalable, que « Aucun outil autre que » interdisait. Corrigé : `Read` de
   `B.fin` admis juste avant la réécriture.

**Gestes sans autorisation explicite** (la mesure en tirera P-gestes : un refus s'y range « règle absente
de la config effective ») : `claude plugin validate/list/marketplace list` lancés depuis Templates ;
`sync-workflow.mjs` lancé depuis Templates ; `transcription.mjs --lire` ; `TaskStop` ; `rm` du journal
`~/.claude/preuves/p15-k.jsonl` ; retrait de `modelSettings` ; `rm` des dossiers de tâches `p94-*`/`p95-*`
et de `p15-pose.txt` ; `claude auto-mode config`. S3-S6 sont figées : ces gestes ne se corrigent pas ici.

Conclusion : après les deux corrections ci-dessus, aucune consigne n'interdit un geste dont le parcours a
besoin.

## W1 — lancement

Contrôle de départ (quatre conditions, toutes vraies) :
1. Ma transcription (`6456b39f-….jsonl`, premier message `/orchestrer-plan P15`) rejouée par
   `transcription.mjs --lire` : 24 requêtes à cet instant, toutes `claude-sonnet-5-5` · `medium` ;
   `permissionMode` = `auto` (5 enregistrements `user`, aucun autre mode).
2. Premier enregistrement : `2026-10-06T11:25:03.875Z`, postérieur à `p15-pose.txt` (`2026-10-06T11:22:11.525Z`).
3. `claude auto-mode config` : 7 entrées `allow` commençant par `P15 —` (ligne comptée : 7 ; « P15 » apparaît
   dans les 7, la 7e se cite elle-même).
4. `~/.claude/settings.json` : `modelSettings["claude-opus-5-5"].effortLevel` = `low`.

Lancement :
- `create_scheduled_task` `P95-A` : créée du premier coup, sans carte ni refus ; `model: opus` ajouté au
  frontmatter de `~/.claude/scheduled-tasks/p95-a/SKILL.md` et relu.
- T0 = `1791288623144` (`2026-10-06T12:10:23.144Z`). `run_scheduled_task` → session
  `local_37bad09d-c35b-48a6-a290-394ac949c73c`.
- `get_session` aussitôt : `model: "opus"`, `isRunning: true`, `remoteControlState: "off"` (effort et mode de
  permission non affichés à ce stade).
- **R** — `set_remote_control` (activation) sur cette session (`local_3887f034-…`) : accepté du premier
  coup, réponse `{"remoteControlState":"on"}`, aucune carte d'approbation.
- Minuteur de secours : `CronCreate` `953d910d`, une fois, `35 14 6 10 *` (T0 + 25 min, heure locale +02:00).
- Attente : `Bash` en arrière-plan, tâche `bheoo01bp`, commande exacte du plan.
- Refus ou cartes rencontrés depuis le début de cette conversation : aucun sur la branche de preuve. Un
  geste humain avant la branche : la réponse « 2 » à la question sur le commit/push/publication refusés
  à S1 (classificateur, motif « Modify Shared Resources », sur `main`).
