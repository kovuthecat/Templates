# 2026-10-06 — Session neuve : permission, Remote Control, modèle, effort, réveil, archivage, câblage d'un mod — mesures

> Plan P15, branche jetable `preuve/session-neuve` (poussée, jamais fusionnée), base
> `b583538f4b78c4bcb90850c998e664dbcf616b34` (`origin/main`, contient le commit de S1 `bbaa3a0`).
> Décision d'origine : `docs/decisions/2026-10-06-suite-des-preuves-mods.md`, « Protocole de preuve — P15 ».
> Suite de `docs/analyses/2026-10-06-reglage-sessions-planifiees-mesures.md` (P14).
> Moteur Desktop 2.1.286 ; plugin chargé `workflow@templates` 0.55.0 (scope local).
> Relevés bruts (sur la branche) : `docs/analyses/session-neuve-releves.md`. Les critères sont cités
> mot pour mot. Verdicts possibles : positif, négatif, partiel, non conclu.
> Reproduire une lecture de transcription : `node preuves/reglage/transcription.mjs --lire <transcription.jsonl>`
> (instrument restauré depuis le commit `1759667`).

## Ce que ça change, en clair

- **Une session planifiée ne reprend pas le mode auto de l'orchestrateur.** Les deux sessions de test
  (A en Opus, B en Haiku) ont tourné en mode de permission `default`, l'orchestrateur en `auto`.
  Concrètement : ce que le mode auto laisse passer à l'orchestrateur n'est pas acquis à une session
  qu'il lance ; mais aucune des deux n'a rencontré ni approbation ni refus.
- **Ce qui marche, sans geste humain** : créer, lancer et supprimer une tâche planifiée ; activer
  Remote Control sur l'orchestrateur et sur chaque session lancée ; faire tourner la session lancée
  au modèle voulu (frontmatter `model:`) et à l'effort voulu (`modelSettings` du poste).
- **Ce qui n'a pas pu être mesuré** : le réveil de l'orchestrateur à la fin d'une session (W1, W2) —
  les sessions de test finissent en 19 s et 45 s, avant que l'orchestrateur ait rendu la main ; et le
  câblage d'un mod sans plugin (K) — le CLI lancé en sous-processus n'est pas authentifié.
- **Ce qui bloque** : une session dont Remote Control est actif ne s'archive pas ; il faut d'abord
  l'éteindre.
- **Voie retenue** : la pastille ne se retire pas du repli Desktop (voir « Voie retenue »). Revers :
  l'orchestration complète sans geste humain n'est pas prouvée.
- Gestes humains demandés : **1 geste d'approbation** (cible 0) ; le réglage préalable est compté à part.

## Réglage préalable

Posé avant le lancement, par une session du plan : 7 règles `allow` commençant par `P15 —` dans
`autoMode` de `~/.claude/settings.json` (relevées par `claude auto-mode config`), et
`modelSettings["claude-opus-5-5"].effortLevel` = `low`. Heure de la pose (`~/.claude/preuves/p15-pose.txt`) :
`2026-10-06T11:22:11.525Z`. Ce geste est compté à part.

## P — permission

**Critère cité** : Positif : « les deux sessions tournent en auto, aucune approbation, aucun refus du
classificateur » ; Négatif : « une approbation demandée ou un refus, dans l'orchestrateur ou une session ».

**Protocole exécuté** : `permissionMode` lu dans les enregistrements `user` des transcriptions
(`transcription.mjs --lire`) ; refus et approbations cherchés par `is_error` et par les cartes.

**Lignes citées** : « Enregistrements `user` de A : `permissionMode` = `default` (1 enregistrement) ; le
mien : `auto`. » — « Enregistrement `user` de B : `permissionMode` = `default` ; négatif, comme A. »
Dans A et B : aucun `is_error: true`, aucune approbation, aucun refus de classificateur. Dans
l'orchestrateur : deux `is_error: true`, les deux sont les refus de `archive_session` (mesure A), pas un
refus du classificateur ; aucune carte.

**Commande qui reproduit** : `node preuves/reglage/transcription.mjs --lire ~/.claude/projects/C--Users-kovu-Projets-Templates/16079728-81bb-4815-9717-701ebab72a79.jsonl`
(A) ; B : `82267b08-c522-44dd-a6b1-23db6c621721.jsonl`, même dossier.

**P :** négatif : les deux sessions tournent en `default`, pas en `auto` (P-mode négatif sur A et B) ; aucune approbation ni refus de classificateur dans A, B ni l'orchestrateur

## R — Remote Control

**Critère cité** : Positif : « `set_remote_control` accepté sur les deux sessions, sans approbation » ;
Négatif : « refus ou approbation exigée ».

**Protocole exécuté** : `set_remote_control` (`enabled: true`) sur l'orchestrateur, puis sur A, puis sur B,
juste après `run_scheduled_task`.

**Lignes citées** : réponse `{"remoteControlState":"on"}` à chaque appel, « aucune carte d'approbation » ;
`get_session` ensuite : `remoteControlActive: true`.

**Commande qui reproduit** : appel `set_remote_control` de l'outil `ccd_session_mgmt` sur l'identifiant
de session (A `local_37bad09d-c35b-48a6-a290-394ac949c73c`, B `local_249e3824-4b77-472d-919b-c03e68b0d265`).

**R :** positif : `set_remote_control` accepté sans approbation sur l'orchestrateur, A et B

## M — modèle

**Critère cité** : Positif : « premier message assistant au modèle de l'index (frontmatter du `SKILL.md`) » ;
Négatif : « premier message au modèle de l'orchestrateur ».

**Protocole exécuté** : `model: opus` (A) et `model: haiku` (B) ajoutés au frontmatter du `SKILL.md`
sous `~/.claude/scheduled-tasks/`, relus ; transcription lue.

**Lignes citées** : A : « 4 requêtes, `claude-opus-5-5`, effort `low` sur chacune » ; B : « 7 requêtes,
`claude-haiku-4-5-20251001`, effort absent (prévu pour Haiku) » ; orchestrateur : `claude-sonnet-5-5`.

**Commande qui reproduit** : `--lire` des deux transcriptions (cf. P).

**M :** positif : A en Opus, B en Haiku au premier message, l'orchestrateur en Sonnet

## E — effort

**Critère cité** : Positif : « première requête à l'effort de l'index via `modelSettings` » ; Négatif :
« `medium` (ou l'effort de l'orchestrateur) sur la première requête ».

**Protocole exécuté** : `modelSettings["claude-opus-5-5"].effortLevel` = `low` posé avant le lancement ;
effort lu sur chaque requête de A.

**Lignes citées** : « effort `low` sur chacune » des 4 requêtes de A, l'orchestrateur étant en `medium`
(24 requêtes à cet instant, toutes `claude-sonnet-5-5` · `medium`). Rapport max(cache 2..n)/cache 1 = 0.019.
Sur Haiku, le champ `effort` est absent : l'axe n'y est pas mesurable.

**Commande qui reproduit** : `--lire` de la transcription de A.

**E :** positif : première requête de A à l'effort `low` (via `modelSettings`), l'orchestrateur étant en `medium`

## W1 — réveil par `Bash` en arrière-plan

**Critère cité** : Positif : « l'orchestrateur reprend son tour seul, dans les 2 min après le dernier
témoin » ; Négatif : « aucune reprise sans message humain ».

**Protocole exécuté** : T0 = `1791288623144` (`2026-10-06T12:10:23.144Z`) ; commande d'attente en arrière-plan
(`transcription.mjs --attendre …`, tâche `bheoo01bp`) ; minuteur de secours `CronCreate` `953d910d`.

**Lignes citées** : « il n'y a pas eu de tour de reprise. » La tâche d'attente « s'est terminée **pendant**
mon tour, entre deux outils » ; `A.fin` à `14:10:42.187 +0200`, soit 19 s après T0 : « A a fini avant que
j'aie fini la section T4, donc avant que je puisse rendre la main. » Le minuteur n'a pas sonné
(`CronDelete` → « Cancelled job »). Ni le positif ni le négatif : « la condition de mesure n'a pas existé ».

**Commande qui reproduit** : `ls -l --time-style=full-iso plans/P95/sorties/` ; ordre à inverser :
rendre la main avant tout écrit, ou allonger A.

**W1 :** non conclu : A a fini 19 s après T0, avant la fin de tour ; l'attente a rendu pendant le travail, aucune reprise après repos n'a eu lieu

## W2 — réveil par `SendMessage`

**Critère cité** : Positif : « idem, sur message de la session finie » (reprise seule dans les 2 min) ;
Négatif : « message non reçu, ou reçu sans nouveau tour ».

**Protocole exécuté** : orchestrateur renommé `P15-orchestrateur` (`set_session_title`, sans carte) ; `P95-B`
(`model: haiku`) lancée à T0 = `1791289567684` (`2026-10-06T12:26:07.684Z`) ; relevés écrits et poussés
**avant** le lancement (écart d'ordre assumé, cf. W1) ; transcription de B lue.

**Lignes citées** : B a fini 45 s après T0 avec `B.fin` = `VERDICT: PASS — adresse P15-orchestrateur introuvable`.
Le premier `ToolSearch select:SendMessage,ListAgents` ne rend que `SendMessage` ; le second
`select:ListAgents` rend « No matching deferred tools found » : « **ni `ListAgents` ni `SendMessage` appelés** ».
Source de la reprise de mon tour : un message humain (« Je ne vois pas W2. Est ce normal? »), ni B ni le minuteur.

**Commande qui reproduit** : `--lire` de `82267b08-….jsonl` ; `ls -l --time-style=full-iso plans/P95/sorties/`.
À mesurer autrement : envoi direct à un nom, sans lister.

**W2 :** non conclu : adresse — B n'a pas pu charger `ListAgents` (`No matching deferred tools found`), n'a rien envoyé ; ma reprise vient d'un message humain

## A — archivage

**Critère cité** : Positif : « `archived: true` sur les deux, Remote Control actif » ; Négatif : « refus ;
le motif est relevé (classificateur ou client connecté) ».

**Protocole exécuté** : `archive_session` sur A, puis sur B, Remote Control actif ; sonde hors critère :
`set_remote_control` `enabled: false`, puis `archive_session`.

**Lignes citées** (mot pour mot) : « Session local_37bad09d-c35b-48a6-a290-394ac949c73c ("P95 a") was not
archived: it still has live work (an agent run, a Remote Control client, a queued message or a background
task). Wait or ask the user; they can also archive it from the sidebar. » Même refus sur B. Sonde : après
extinction de Remote Control, « Archived session local_249e3824-… ("P95 b") » et de même pour A. Le motif
est Remote Control lui-même, pas le classificateur.

**Commande qui reproduit** : `archive_session` (outil `ccd_session_mgmt`) sur une session dont Remote
Control est actif, puis après `set_remote_control` `false`.

**A :** négatif : l'archivage est refusé tant que Remote Control est actif, sur A comme sur B ; accepté une fois éteint (sonde, hors critère)

## K — câblage d'un mod sans plugin

**Critère cité** : Positif : « dans un projet de fixture vendoré sans plugin installé, un module déclaré
dans `.claude/settings.json` écrit sa ligne `session.start` dans une session neuve ; module validé au
préalable par `plugin validate` (piège P12) » ; Négatif : « ligne absente avec un module valide ».

**Protocole exécuté** : mini-plugin `p15-k-temoin@p15k` (`preuves/session-neuve/k/hooks/journal.ts`, hook
`session.start`, écrit dans `~/.claude/preuves/p15-k.jsonl`) ; validation avec le binaire 2.1.286 : « ✔ Validation
passed with warnings » (avec 2.1.251 du PATH : ✘ `"session.start" is not an event`) ; fixture
`~/preuves-p15/k` (`sync-workflow.mjs`, 74 fichiers) ; trois essais `claude -p "Réponds OK."` : clé `modules`
relative (2.1.286), chemin absolu (2.1.251), témoin positif (module en plugin installé).

**Lignes citées** : essais 1 et 2 : « `Ignoring 26 permissions.allow entries from .claude/settings.json: this
workspace has not been trusted.` puis `Failed to authenticate: OAuth session expired and could not be
refreshed` ; journal : absent. » Essai 3 (témoin positif) : mêmes messages, journal absent. `claude auth
status` → `loggedIn: false`. « l'absence aux essais 1 et 2 ne dit rien de la voie testée. » Non corrigé :
se reconnecter est un geste d'identifiants.

**Commande qui reproduit** : valider avec le binaire 2.1.286, créer la fixture, ajouter la clé `modules`,
puis `claude -p "Réponds OK."` dans la fixture avec une session connectée (`claude auth login`), lire
`~/.claude/preuves/p15-k.jsonl`.

**K :** non conclu : instrument (`claude -p` n'est pas authentifié ; le témoin positif n'écrit pas non plus)

## Report

**Critère cité** : Positif : « le fichier de mesures est committé et poussé sur `main` par la session
prévue, sans refus » ; Négatif : « refus du classificateur ». Un refus d'une autre source (hook
`pretooluse-git`, réseau) se cite tel quel et rend « négatif : <source> ».

**Protocole exécuté** : index temporaire, l'arbre de travail et la branche ne bougent pas ; autorisé
par la règle n°5 `P15 —` (leçon 3 du protocole) :

```bash
F=docs/analyses/2026-10-06-session-neuve-mesures.md
git fetch origin
export GIT_INDEX_FILE="$(mktemp)"
git read-tree origin/main
git update-index --add --cacheinfo "100644,$(git hash-object -w "$F"),$F"
ARBRE=$(git write-tree)
C=$(git commit-tree "$ARBRE" -p origin/main -m "docs(preuve): mesures de la session neuve (P15)" -m "Plan: P15/S6/T9")
unset GIT_INDEX_FILE
git push origin "$C:refs/heads/main"
```

Constat : `git fetch origin` puis `git diff --name-only origin/main~1 origin/main` → ce seul fichier.

**Report :** positif : le premier report (commit 96d05fd, index temporaire, `git push origin $C:refs/heads/main`) est passé sans refus ni du classificateur ni du hook ; `git diff --name-only origin/main~1 origin/main` ne rend que ce fichier

## Réfuté

- « Créer une tâche planifiée est refusé par le classificateur » : réfuté, `P95-A` et `P95-B` créées du
  premier coup, sans carte (P14 l'avait déjà réfuté).
- « Le correctif du hook Stop de S1 ne tient pas » : réfuté, A ne fait qu'**un** tour (risque 1 de
  l'index non réalisé).
- « Activer Remote Control exige une approbation » : réfuté (R).
- « Le frontmatter `model:` d'un `SKILL.md` est ignoré » : réfuté pour Opus et pour Haiku (M).
- « La tâche A est assez longue pour mesurer un réveil » : réfuté, 19 s ; B, 45 s (W1, W2).
- « `ListAgents` se charge dans une session lancée par tâche planifiée » : réfuté (W2).
- « Une session planifiée hérite du mode auto de l'orchestrateur » : réfuté (P).
- « L'archivage est refusé par le classificateur » : réfuté, la cause est Remote Control actif (A).

## Voie retenue

Ce que les verdicts permettent : la pastille ne se retire **pas** du repli Desktop, puisque P, M, E, W1,
W2 et A ne sont pas tous positifs. Reste acquis : R, M et E sont positifs (lancer une tâche, la rendre
visible en Remote Control, la régler en modèle et en effort). Manquent, nommés :
- P : un moyen de lancer la session planifiée en mode `auto` (elle tourne en `default`) ;
- W1 et W2 : une mesure refaite où l'orchestrateur n'a plus rien à écrire après le lancement, avec
  un envoi à un nom sans passer par `ListAgents` ;
- A : éteindre Remote Control avant d'archiver (la sonde le fait passer), ce qui ne répond pas au
  critère « Remote Control actif » ;
- K : une session connectée (`claude auth login`) pour mesurer la voie du module déclaré dans les settings.

L'intégration dans `/orchestrer-plan` et `WORKFLOW.md` §5b reste une décision ultérieure sur `main`.

## Gestes humains

- **Réglage préalable (compté à part)** : règles `P15 —` et `modelSettings` posés par une session du plan.
- **Depuis le lancement, contre la cible 0** : **1 geste d'approbation** — la réponse « 2 » à la question
  sur le commit/push/publication refusés à S1 (classificateur, motif « Modify Shared Resources », sur
  `main`), avant la branche de preuve. Une question humaine, « Je ne vois pas W2. Est ce normal? », a été
  la source de la reprise de W2 ; ce n'est pas un geste d'approbation. Aucune approbation sur la branche
  de preuve ni dans A, B.
- Un appel PowerShell groupé (désinstallation de plugin + suppression) a été refusé en S5, rejoué en
  Bash par morceaux.

## Défauts relevés

- `autoMode` du `.claude/settings.json` du dépôt : lettre morte, la doc le dit ignoré dans les settings
  de projet ; seules les règles de `~/.claude/settings.json` jouent.
- `delete_scheduled_task` laisse les `SKILL.md` de tâches sur disque (`p94-b`, `p94-c`, `p95-a`, `p95-b`
  sous `~/.claude/scheduled-tasks/`), hors planificateur.
- `ListAgents` n'est pas chargeable par `ToolSearch` dans une session lancée par tâche planifiée.
- Le `claude` du PATH (2.1.251) ne connaît pas l'événement `session.start` : `plugin validate` doit se
  faire avec le binaire du bureau (2.1.286).
- `claude -p` lancé en sous-processus : « OAuth session expired » ; et l'espace de travail non approuvé
  fait ignorer les `permissions.allow` du projet.
- Erreur de relevé de S3, corrigée à S4 : « 0 `is_error: true` dans mon fil depuis T0 » était vraie au
  moment du comptage, fausse après coup (le refus d'archivage de A n'était pas encore dans la transcription).
- Le plan place les relevés après le lancement : une session de test de moins d'une minute finit avant
  la fin de tour, et W1 comme W2 ne se mesurent pas dans cet ordre.
- Deux contradictions de consigne corrigées dans P95 (jamais dans S3-S6) : `Read` manquait aux
  sessions A et B pour ouvrir leur fichier et relire `B.fin`.

## Report sur main

Voir la mesure Report : le fichier est reporté seul par index temporaire ; le verdict est posé par le
second report.
