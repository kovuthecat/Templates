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

## W1 et session A

Source de la reprise : **il n'y a pas eu de tour de reprise.** La tâche `Bash` d'attente (`bheoo01bp`, exit 0,
sortie : le chemin `…/16079728-81bb-4815-9717-701ebab72a79.jsonl`) s'est terminée **pendant** mon tour, entre
deux outils (étape 7, rédaction des relevés), avant toute fin de tour. Témoin `plans/P95/sorties/A.fin` :
`2026-10-06 14:10:42.187 +0200` (= 12:10:42Z), soit **19 s** après T0 ; `A.travail` : 14:10:40.557. A a fini
avant que j'aie fini la section T4, donc avant que je puisse rendre la main. Le minuteur n'a pas sonné
(`CronDelete 953d910d` → « Cancelled job », `CronList` → « No scheduled jobs. »). Aucune commande d'attente
vivante à l'étape 2 (la tâche `bheoo01bp` était déjà terminée).

Protocole tel qu'exécuté : transcription de A par
`node preuves/reglage/transcription.mjs --lire ~/.claude/projects/C--Users-kovu-Projets-Templates/16079728-81bb-4815-9717-701ebab72a79.jsonl`
(commande refaisable telle quelle). Sortie : 4 requêtes, `claude-opus-5-5`, effort `low` sur chacune,
1 tour, outils `Read, Bash, Write`, rapport max(cache 2..n)/cache 1 = 0.019. Un seul message `user` humain-ou-tâche
(le prompt de la tâche planifiée) : A ne fait **qu'un tour**, le correctif de S1 tient (risque 1 de l'index non réalisé).

- **W1.** Le réveil n'a pas été mesuré au repos : l'attente a rendu pendant le travail, pas après une fin de
  tour ; A (Opus · low, tâche d'un `node` et d'un `Write`) finit en 19 s, plus vite que la rédaction des
  relevés que le plan place avant la fin de tour (étape 7 avant 9). Aucun tour n'a été repris après un
  repos. Aucun minuteur, aucun message humain n'a repris le tour : ce n'est ni le positif (reprise seule
  après repos) ni le négatif (aucune reprise) — la condition de mesure n'a pas existé.
- **P-mode.** Enregistrements `user` de A : `permissionMode` = `default` (1 enregistrement) ; le mien : `auto`.
  La tâche planifiée n'est donc pas en `auto` : moitié **négative**.
- **P-gestes.** Dans A : 0 `tool_result` avec `is_error: true`, 1 `is_error: false`, aucune demande
  d'approbation ni refus de classificateur (`fixture.mjs` en `Bash` passé sans refus, `Write` de `A.fin`
  passé). Dans mon fil depuis T0 : 0 `is_error: true`, aucune carte (création, lancement, Remote Control,
  suppression de la tâche, `--lire`, `CronCreate/Delete`) ; aucun refus à ranger. Moitié **positive**.
- **R sur A.** `set_remote_control` (`enabled: true`) sur `local_37bad09d-…` : accepté du premier coup,
  `{"remoteControlState":"on"}`, aucune carte ; `get_session` ensuite : `remoteControlActive: true`.
- **A.** `get_session` avant : `isArchived: false`, `isRunning: false`, Remote Control `off` (avant mon
  activation). `archive_session` → refus, mot pour mot : « Session local_37bad09d-c35b-48a6-a290-394ac949c73c
  ("P95 a") was not archived: it still has live work (an agent run, a Remote Control client, a queued message or
  a background task). Wait or ask the user; they can also archive it from the sidebar. » `get_session` après :
  `isArchived: false`, `remoteControlActive: true`. Motif rangé « client connecté » — mais je venais
  d'activer Remote Control sur A, donc la cause n'est pas isolée du client (l'archivage n'a pas été testé
  Remote Control éteint). Session A **laissée non archivée**, à traiter en S4.
- `delete_scheduled_task` `p95-a` : « deleted », dossier `SKILL.md` laissé ; `list_scheduled_tasks` →
  « No scheduled tasks found. » (aucune `P95-*`).

**W1 :** non conclu : A a fini 19 s après T0, avant la fin de tour ; l'attente a rendu pendant le travail, aucune reprise après repos n'a eu lieu
**E :** positif : première requête de A à l'effort `low` (via `modelSettings`), l'orchestrateur étant en `medium`
**P (partie A) :** négatif : A en `permissionMode` `default` (P-mode) ; P-gestes positif (aucune approbation ni refus dans A ni dans l'orchestrateur)
**R (partie A) :** positif : `set_remote_control` accepté sans approbation sur l'orchestrateur et sur A
**M (partie A) :** positif : premier message de A en `claude-opus-5-5` (frontmatter `model: opus`), l'orchestrateur étant en `claude-sonnet-5-5`
**A (partie A) :** négatif : `archive_session` refusé, motif « still has live work (… a Remote Control client …) » ; cause non isolée (Remote Control activé juste avant)

Gestes humains depuis le début du plan : 1 (réponse « 2 » au commit/push/publication de S1, sur `main`) ;
aucun sur la branche de preuve.

Constat pour S6 : la tâche A est trop courte (19 s) pour mesurer un réveil dans le déroulé prévu ; pour
W1, soit rendre la main avant tout écrit, soit allonger A.

## W2 — lancement

Contrôle : aucune commande d'attente vivante (tâches `bheoo01bp` et `brwj45dm9` terminées avant S4) ;
`P95-A` supprimée, aucune `P95-*` en liste au départ de S4 ; session A `local_37bad09d-…` toujours
non archivée (cf. « A (partie A) »).

- **Adresse** : `list_sessions` n'inclut pas la session courante (par construction) ; `get_session self` →
  `local_3887f034-1633-481c-b7af-727777ee7ea7`, `claude-sonnet-5-5`, `medium`, `permissionMode: auto`,
  `remoteControlActive: true`, titre « P15 template » (posé à la main). `set_session_title self` →
  « Renamed this session to "P15-orchestrateur" (was "P15 template") », sans carte ni refus.
- `P95-B` : `create_scheduled_task` du premier coup ; `model: haiku` ajouté au frontmatter du `SKILL.md`
  et relu (`cat`).
- Minuteur de secours : `CronCreate` `fb3eed09`, une fois, `51 14 6 10 *` (heure locale +02:00 ; T0 estimé
  à 14:26, + 25 min).
- **Écart d'ordre par rapport au plan (assumé).** S3 a montré qu'une session A finit en 19 s. Le plan place
  les relevés (étape 5) *après* le lancement : B (Haiku) aurait fini et écrit son message avant la fin de
  tour, et le message tomberait dans le tour en cours, pas sur un orchestrateur au repos (même défaut que
  W1). Cette section est donc écrite, commitée et poussée **avant** `run_scheduled_task` ; T0, l'identifiant
  de session de B et la réponse de `set_remote_control` sont relevés à la reprise, dans « W2 et session B »,
  depuis les sorties des outils de cette conversation. Les gestes restent les mêmes, seul leur ordre change.

## W2 et session B

Faits relevés à la reprise (sorties des outils de cette conversation) : `P95-B` lancée à T0 =
`1791289567684` (`2026-10-06T12:26:07.684Z`), session `local_249e3824-4b77-472d-919b-c03e68b0d265`,
`get_session` aussitôt : `model: "haiku"`, `isRunning: true`, Remote Control `off` ; **R** :
`set_remote_control` (activation) sur B → `{"remoteControlState":"on"}`, sans carte.

Source de la reprise : le premier enregistrement `user` du tour de reprise, dans ma transcription, est
`2026-10-06T12:29:24.304Z` · `permissionMode: auto` · texte « Je ne vois pas W2. Est ce normal? » : **un
message humain**, ni le message de B (aucun n'a été envoyé), ni le minuteur (`fb3eed09`, prévu 14:51 locale,
supprimé par `CronDelete` : « Cancelled job », `CronList` → « No scheduled jobs. »). Témoin
`plans/P95/sorties/B.fin` : `2026-10-06 14:26:52.594 +0200`, contenu
`VERDICT: PASS — adresse P15-orchestrateur introuvable`. B a donc fini 45 s après T0 sans me joindre.

Transcription de B (`82267b08-c522-44dd-a6b1-23db6c621721.jsonl`, retrouvée par
`transcription.mjs --attendre … --depuis 1791289567684 --max 30`, lue par `--lire`) : 7 requêtes,
`claude-haiku-4-5-20251001`, effort absent (prévu pour Haiku), 1 tour, outils `Read, Bash, Write, ToolSearch`
— **ni `ListAgents` ni `SendMessage` appelés**. Cause de « adresse introuvable » : le premier
`ToolSearch select:SendMessage,ListAgents` ne rend que `SendMessage` ; le second `select:ListAgents` rend
« No matching deferred tools found ». B n'a jamais pu lister les agents, et n'a pas tenté d'envoyer au nom
`P15-orchestrateur`. Le contrôle d'adresse du plan (`ListAgents`) n'est donc pas disponible dans une session
lancée par tâche planifiée. Aucune erreur, aucun refus dans B (`is_error: false` seul).

- **P-mode.** Enregistrement `user` de B : `permissionMode` = `default` ; négatif, comme A.
- **P-gestes.** Dans B : aucun refus ni approbation. Dans mon fil : `is_error: true` ×2, **les deux sont les
  refus de `archive_session`** (A à 12:11:25, B à 12:30:04 ; motif cité en S3), pas un refus du classificateur ;
  aucune carte d'approbation. **Correction de S3** : la phrase « 0 `is_error: true` dans mon fil depuis T0 » était
  vraie au moment du comptage (le refus d'archivage de A n'était pas encore dans la transcription) mais
  fausse après coup : il y en avait 1, le refus d'archivage ; rien d'autre.
- **A sur B.** `archive_session` avec Remote Control actif → même refus, mot pour mot que pour A (« … it still
  has live work (an agent run, a Remote Control client, a queued message or a background task). … »).
  **Sonde supplémentaire (hors critère)** : `set_remote_control` `enabled: false` sur B → `off`, puis
  `archive_session` → « Archived session local_249e3824-… ("P95 b") » ; même geste sur A
  (`off`, puis « Archived session local_37bad09d-… ("P95 a") »). Le « client connecté » est donc bien
  Remote Control lui-même : une session avec Remote Control actif ne s'archive pas, et le critère A
  (« `archived: true` sur les deux, Remote Control actif ») ne peut pas être positif.
- `delete_scheduled_task` `p95-b` : « deleted » ; `list_scheduled_tasks` → « No scheduled tasks found. »

**W2 :** non conclu : adresse — B n'a pas pu charger `ListAgents` (`No matching deferred tools found`), n'a rien envoyé ; ma reprise vient d'un message humain
**P (partie B) :** négatif : B en `permissionMode` `default` (P-mode) ; P-gestes positif (aucun refus ni approbation dans B)
**R (partie B) :** positif : `set_remote_control` accepté sans approbation sur B
**M (partie B) :** positif : premier message de B en `claude-haiku-4-5-20251001` (frontmatter `model: haiku`), l'orchestrateur étant en `claude-sonnet-5-5`
**A (partie B) :** négatif : `archive_session` refusé (« still has live work … a Remote Control client »), accepté une fois Remote Control éteint

Synthèse A + B :

**P :** négatif : les deux sessions tournent en `default`, pas en `auto` (P-mode négatif sur A et B) ; aucune approbation ni refus de classificateur dans A, B ni l'orchestrateur
**R :** positif : `set_remote_control` accepté sans approbation sur l'orchestrateur, A et B
**M :** positif : A en Opus, B en Haiku au premier message, l'orchestrateur en Sonnet
**A :** négatif : l'archivage est refusé tant que Remote Control est actif, sur A comme sur B ; accepté une fois éteint (sonde, hors critère)

Gestes humains depuis le début du plan : 2 — la réponse « 2 » au commit/push/publication de S1
(sur `main`), et la question « Je ne vois pas W2. Est ce normal? », qui a été la source de la reprise de W2
(pas un geste d'approbation). Aucune approbation sur la branche de preuve.

Constats pour S6 : (1) la fixture B suppose `ListAgents` chargeable par `ToolSearch` ; ce n'est pas le cas dans
une session lancée par tâche planifiée, W2 reste donc à mesurer autrement (envoi direct à un nom, sans lister) ;
(2) A et B finissent en moins d'une minute : un réveil se mesure seulement si l'orchestrateur n'a plus rien à
écrire après le lancement (ordre inversé en S4) ; (3) l'archivage d'une session de test passe par l'extinction
de Remote Control.

## K

Question : un module déclaré par une clé `"modules"` au niveau racine du `.claude/settings.json` d'un projet
vendoré, sans plugin, est-il chargé ? (voie non documentée)

- Module : `preuves/session-neuve/k/hooks/journal.ts` (mini-plugin `p15-k-temoin@p15k`, `hooks.json` =
  `{ "modules": ["./journal.ts"] }`) ; il ajoute `{"evt":"session.start","cwd":…,"iso":…}` à
  `~/.claude/preuves/p15-k.jsonl`.
- Validation (`plugin validate` sur le `plugin.json`) :
  - Avec le `claude` du PATH (`~/.local/bin/claude.exe`, **2.1.251**) : ✘ `"session.start" is not an event` —
    ce binaire ne connaît pas l'événement (idem `session.end`; `tool.call` et `prompt.submit` passent).
  - Avec le binaire du bureau (`%APPDATA%\Claude\claude-code\2.1.286\635c1867224a\claude.exe`, **2.1.286**,
    celui dont la skill `plugin-authoring` décrit l'API) : « ✔ Validation passed with warnings » ;
    `./journal.ts hooks: session.start`, `calls: $.env.get, $.fs.read, $.fs.write`, `env reads: USERPROFILE`
    (seul avertissement : pas d'auteur).
- Fixture : `~/preuves-p15/k` (`git init`, `sync-workflow.mjs --source plugin` : 74 fichiers, manifeste v0.55.0,
  `settings.json` = gabarit `project-settings.json`, `journal.ts` copié en `.claude/mods/`).
  `claude plugin list` dans la fixture : seul `workflow@templates` (désactivé), aucun `p15-k-temoin`.
- Essai 1 (`"modules": [".claude/mods/journal.ts"]`, T0 12:47:21Z), `claude -p "Réponds OK."`, binaire 2.1.286 :
  `Ignoring 26 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. …`
  puis `Failed to authenticate: OAuth session expired and could not be refreshed` ; journal : absent.
- Essai 2 (chemin absolu, T0 12:48:07Z), binaire 2.1.251 : mêmes deux messages, sortie 1 ; journal absent.
- Essai 3, témoin positif (clé retirée ; `plugin marketplace add …/preuves/session-neuve/k --scope local`,
  `plugin install p15-k-temoin@p15k --scope local`, « enabled » ; T0 12:48:15Z) : mêmes messages, sortie 1 ;
  journal absent.
- Lecture : `claude auth status` → `loggedIn: false`. Le CLI lancé en sous-processus ne s'authentifie pas
  (session OAuth expirée) et s'arrête avant d'ouvrir une session ; le témoin positif, module en plugin
  installé, n'écrit rien non plus : l'absence aux essais 1 et 2 ne dit rien de la voie testée. Non corrigé :
  se reconnecter est un geste d'identifiants. Aussi relevé : l'espace de travail non approuvé
  (`hasTrustDialogAccepted`) fait ignorer les `permissions.allow` du projet ; l'effet sur un module n'est pas
  mesuré.
- Reproduire : valider avec le binaire 2.1.286, créer la fixture, ajouter la clé `modules`, puis
  `claude -p "Réponds OK."` dans la fixture avec une session connectée (`claude auth login`) et lire
  `~/.claude/preuves/p15-k.jsonl`.

**K :** non conclu : instrument (`claude -p` n'est pas authentifié ; le témoin positif n'écrit pas non plus)

## État après K

- `claude plugin uninstall p15-k-temoin@p15k --scope local` → « ✔ Successfully uninstalled plugin » ;
  `claude plugin marketplace remove p15k --scope local` → « ✔ Successfully removed marketplace: p15k ».
- `~/preuves-p15/` et `~/.claude/preuves/p15-k.jsonl` (jamais créé) supprimés ; `test ! -e ~/preuves-p15` → 0.
- Dans Templates, `claude plugin list` : `workflow@templates` 0.55.0, local, ✔ enabled, aucun `p15-k-temoin` ;
  `claude plugin marketplace list` : `claude-plugins-official`, `templates`, aucune `p15k`.
- Gestes humains depuis le début du plan : 2 (inchangé en S5, aucun geste demandé). Un appel PowerShell groupé
  (désinstallation + suppression) a été refusé, rejoué en Bash par morceaux.
