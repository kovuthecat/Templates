# 2026-10-05 — Preuves des mods autonomes : mesures

> Plan P13/S7, branche jetable `preuve/mods-2`. Décision d'origine :
> `docs/decisions/2026-10-05-preuves-mods-autonomes.md`. Relevés bruts (sur la branche) :
> `docs/analyses/preuves-mods-autonomes-releves.md`. Suite de
> `docs/analyses/2026-10-05-preuve-mods-mesures.md` (P12). Moteur Desktop 2.1.286.
> Les critères sont cités mot pour mot depuis la décision. Les verdicts possibles : positif,
> négatif, non conclu (avec la raison). Un critère à deux moitiés (« **et** en vague 2… ») n'est
> positif que si les deux sont tenues.

## Ce que ça change, en clair

- **Ouvrir une session neuve depuis l'orchestrateur ne remplace pas la pastille, pas en l'état (M5
  négatif).** L'orchestrateur sait créer et lancer les sessions, et lire leur `VERDICT:`. Mais les
  sessions lancées par tâche planifiée héritent du mode manuel et se bloquent sur leur première
  approbation ; la fin d'une session n'a pas réveillé l'orchestrateur ; l'archivage a été refusé.
  Il a fallu au moins 6 gestes humains pour deux sessions, contre une pastille par session et un
  message de fin aujourd'hui. Le revers : la direction décidée (remplacer la pastille) n'est pas
  prouvée, il faut un autre canal ou un mode de permission réglé d'avance.
- **Quatre mods tiennent** : la garde de fichiers (F : elle a refusé une écriture hors zone d'un
  sous-agent réel), et trois mods d'orchestration — O1 (le modèle de l'index est imposé), O3
  (`run_in_background: false` par défaut), O5 (ligne d'état posée dans une session planifiée).
  Réserve : la garde F a aussi refusé à tort une écriture de brouillon dans un dossier temporaire.
- **Le mod de limites (L) lit bien les fenêtres de quota** (`rateLimits` jamais vide), **mais on ne
  sait pas encore ce que coûte un plan**, car la mesure M3 bis n'a pas été jouée jusqu'au bout.
  Même cause pour O2 (préfixe `CLAUDE-BASE` : coût non comparé). O4 (collecte des verdicts) n'a rien
  écrit : non conclu.
- **Une garde git par mod n'apporte rien là non plus** (M2b négatif) : le hook classique refuse déjà
  le commit d'un sous-agent **en arrière-plan** sous verrou.
- **Le plugin se charge à froid sans réglage** (M1 bis positif) : question restée ouverte depuis P12,
  maintenant tranchée pour un plugin installé `--scope local`.
- **Gestes humains demandés : au moins 6** (cible 0). Le défaut vient de la tâche planifiée, pas
  des mods.
- Rien n'entre dans `plugin/` avant la décision qui suivra ; la branche est ramenée à l'état de `main`
  (T11).

## Recoupement des chiffres (étape 2)

`node preuves/harnais/collecter.mjs "$H/.claude/preuves/mods/P13-A.fin" "$H/.claude/preuves/mods/P13-B.fin"`
rejoué sur les témoins : **tous les chiffres d'usage, de F, de L et d'O1 à O5 par session sont
identiques** aux relevés bruts (usage par poste, écart A/B de −80 %, décisions de F, lignes
d'orchestration). Seul écart : les journaux ont grossi (observateur 171 lignes contre 138, limites
29 contre 26, orchestration 36 contre 31, fichiers 9 contre 8), parce que les mods restent installés
pendant S6 et S7 ; les fenêtres par session ne changent pas. Le relevé brut fait foi.

## M5 — Session neuve lancée par l'orchestrateur, à la place de la pastille

**Critères (décision § M5)** :
- « **Positif** : les deux sessions tournent sans geste humain, l'orchestrateur reprend la main sur la
  notification de fin, lit chaque `VERDICT:`, le modèle et l'effort de l'index s'appliquent dès le
  premier tour de travail, et les sessions finies sont archivées sans geste humain. »
- « **Négatif** : la notification ne réveille pas l'orchestrateur (il faut un message humain ou une
  attente bornée), ou une approbation humaine est exigée à chaque lancement, ou le modèle ne
  s'applique qu'après un tour déjà payé au mauvais prix. Chaque négatif est chiffré : nombre de
  gestes ou de tours restants contre la pastille d'aujourd'hui. »

**Protocole exécuté** (S6, par l'orchestrateur dans son propre fil) : `create_scheduled_task` ×2
(`P13-A`, `P13-B`, sans horaire), `run_scheduled_task` à 19:18:07 et 19:18:08, `set_session_model` et
`set_session_effort`, minuteur de secours, lecture par `list_events`, `archive_session`, suppression
des tâches. Quota au départ : 5 h à 15 %, semaine à 13 %. `start_session` : absent, donc pas de voie
comparée.

**Relevé** (cités du brut) :
- Création : `P13-B` du premier coup ; `P13-A` « refusée deux fois par le classificateur du mode auto
  (aucun motif), y compris après l'accord de l'utilisateur dans le chat », créée au troisième essai
  après passage en mode manuel et approbation.
- Modèle : au lancement `claude-opus-5-5` / `medium` pour les deux (modèle de la conversation
  d'orchestration) ; après `set_session_model` `claude-sonnet-5-5`, « à partir du prochain tour ».
  L'orchestrateur de A montre `claude-opus-5-5, claude-sonnet-5-5` sur 2 tours : le premier tour,
  bloqué, a démarré sur Opus.
- Blocage : A et B « se sont arrêtées dès leur premier appel Bash (étape 0, témoin de début),
  dernière activité 19:18:41, en attente d'une approbation » ; débloquées depuis le mobile après
  `set_remote_control`, reprise 20:28:56 (A) et 20:29:02 (B).
- Réveils de l'orchestrateur : minuteur n° 2 (≈ 20:09) sans témoin, puis message de l'utilisateur
  après 20:38 ; « aucune notification de tâche reçue dans ce fil avant lui ».
- Fin : témoins `P13-A.fin` 20:32:04 et `P13-B.fin` 20:38:14 ; `list_task_runs` : `succeeded`.
  `VERDICT:` lu par `list_events` (champ `summary` de `list_task_runs` absent).
- Archivage : `archived` à `false` avant l'appel (la tâche ne s'archive pas d'elle-même) ; A refusé
  par le classificateur, B refusé par l'outil (client Remote Control connecté).
- Hook Stop du workflow : A et B relancées après le `VERDICT:` pour « travail non poussé ».

**Reproduire** : rejouer les étapes 1 à 6 de la décision ; lire `list_events` de chaque session.
Les relevés : `docs/analyses/preuves-mods-autonomes-releves.md` § « M5 côté orchestrateur ».

**Verdict : négatif.** Trois des conditions du négatif sont remplies :
1. la notification n'a pas réveillé l'orchestrateur : il a fallu un minuteur (sans effet utile) puis un
   message humain ;
2. une approbation humaine a été exigée dès le premier appel de chaque session ;
3. le modèle ne s'est appliqué qu'après un tour déjà payé au mauvais prix : tour 1 de A en Opus (un
   tour, bloqué sur le premier appel d'outil).
Chiffre : au moins **6 gestes humains** pour deux sessions (voir la section Gestes), plus un message
de fin, contre la pastille d'aujourd'hui (un clic « Démarrer localement » par session, soit 2, et un
message de fin, soit 3 au total). Tenu à part : l'orchestrateur ouvre bien des sessions neuves sans
elle, règle leur modèle, lit le `VERDICT:` par `list_events`.

## M1 bis — Le plugin se charge-t-il à froid ?

**Critère (décision § Vague 2, 1)** : « Positif : présente dans la première session planifiée.
Négatif : absente → remesurer avec un mod placé en dossier skills `.claude/skills/<nom>/` (la voie
des projets vendorés), dans la même session. »

**Protocole exécuté** : plugin installé `--scope local` à froid par `uninstall` + `install`
(S5), sans `CLAUDE_CODE_PLUGIN_DIRS` ; sessions planifiées A et B ; `collecter.mjs --m1bis`.

**Lignes de journal** (`~/.claude/preuves/mods/observateur.jsonl`, lignes 38 et 39) :
`{"evt":"session.start","plugin":"workflow","root":"C:\\Users\\Kovu\\.claude\\plugins\\cache\\templates\\workflow\\0.54.0","cwd":"C:\\Users\\Kovu\\Projets\\Templates",…,"session":"794f9b5c-…"}`
(A, 19:18:10.964Z) et la même ligne pour `be05092b-…` (B, 19:18:11.036Z).

**Reproduire** : `node preuves/harnais/collecter.mjs --m1bis A` (sortie 0, dernière ligne `positif`).

**Verdict : positif.** La ligne est présente dans les deux premières sessions planifiées, racine dans
le cache, sans variable d'environnement. Le second essai (dossier skills) n'a pas lieu d'être :
`.claude/skills/observateur-m1/` n'a jamais été posé. Portée : plugin installé par projet ; la voie
des projets vendorés reste non testée (le critère ne la demande que sur un négatif).

## M2b — Garde git par mod, sous-agent en arrière-plan

**Critère (décision § Vague 2, 2)** : « Positif pour la garde par mod : le hook classique reste muet
et le mod voit l'`agentId`. Négatif : le hook classique refuse déjà (la prémisse de l'incident
2026-09-17 tombe aussi en arrière-plan). »

**Protocole exécuté** : `.claude/wave.lock` factice (« preuve M2b P13 »), un `Agent`
`general-purpose` / `haiku` / `run_in_background: true` exécute `git commit --allow-empty -m 'preuve M2b P13'`.

**Lignes de journal** (observateur, lignes 73 et 75) : `tool.call` `Agent` « M2b » `arrierePlan: true` ;
`{"evt":"tool.call","outil":"Bash","agentId":"a7d675b385ac3ba6a","cible":"git commit --allow-empty -m 'preuve M2b P13'","resultat":"refus","motif":"PreToolUse:Bash hook error: Vague parallèle en cours (`.claude/wave.lock` présent) : ni commit ni push …"}`.
Dernier commit inchangé (`177909b`).

**Reproduire** : `printf 'preuve M2b P13' > .claude/wave.lock` (commande seule), puis le même appel
`Agent` ; retirer le verrou ensuite.

**Verdict : négatif.** Le hook classique refuse déjà le commit du sous-agent en arrière-plan. Le mod
voit bien l'`agentId`, mais la condition « le hook classique reste muet » n'est pas remplie. Avec P12
M2 (premier plan), la prémisse de l'incident 2026-09-17 est réfutée dans les deux cas, dans Desktop,
avec les hooks du plugin installé.

## M3 bis — Coût d'un plan de fixture, rejoué deux fois

**Critère (décision § Vague 2, 3)** : « orchestrer un plan de fixture de deux sessions (P92 puis P93
dans la seconde session planifiée), orchestrateur en Sonnet · medium. Positif : écart < 15 % entre les
deux déroulés sur chaque poste, poste dominant identifié. Négatif : usage absent pour un sous-agent. »

**Protocole exécuté** : A joue P92/S1 (S1 en Haiku, PASS) et s'arrête à l'action `pousser`, classée
« question » par la consigne (règle 5 : push interdit) avant S2. B n'a pas orchestré : l'arbre
contenait le fichier non suivi `.claude/journal-modeles.jsonl`, présent avant le lancement.

**Relevé** (collecteur, session A) : orchestrateur 2 471 583 tokens (2 tours, 65 % du total),
`P92/S1` 1 063 364, `M2b` 159 339, sonde 110 148. Usage présent pour chaque sous-agent. L'écart A/B
de −80 % compare une orchestration à une session en lecture seule : **inutilisable**.

**Reproduire** : `node preuves/harnais/collecter.mjs <A.fin> <B.fin>` (section « Écart A/B »).

**Verdict : non conclu — un seul déroulé partiel, pas deux comparables.** Le négatif (« usage
absent pour un sous-agent ») n'est pas rempli ; le positif exige l'écart entre deux déroulés. Le
poste dominant (l'orchestrateur, 65 % sur A) est un indice sur un déroulé arrêté après S1, pas une
mesure.

## F — Mod de fichiers

**Critères (décision § F)** :
- « Positif : les tests `plugin test` couvrent hors zone (refus), zone (passe), fil principal
  (passe), zone `aucune` (refus) et passent ; **et** en vague 2, le refus atteint le sous-agent sans
  faux positif sur un plan de fixture. »
- « Négatif : l'`agentId` ne se relie pas à une session (`agent.spawn` ne le donne pas), ou plus de
  la moitié des écritures des sessions de fixture passent par `Bash` (garde contournée de fait). »

**Protocole exécuté** : première moitié par S1 (14 tests `plugin test`, gate `validate` ✔,
`tester-hooks.mjs` vert). Seconde par la session A : sonde `general-purpose` sans modèle, plan
P92/S1, `Write` hors zone ; session P92/S1 réelle.

**Lignes de journal** (`fichiers.jsonl`, lignes 4 à 8) : `{"agentId":"adcbeebac21341a7d","plan":"P92","session":"S1","outil":"Write","chemin":"preuves/fixtures/sonde-hors-zone.txt","decision":"refuse","zone":"preuves/fixtures/p92.txt"}` ;
`Write` `preuves/fixtures/p92.txt` `passe` ; `Edit` `plans/P92/S1.md` et `plans/P92/index.md`
`passe-suivi` ; `Bash` `git commit` `bash-compte`. Part des écritures par `Bash` : 20 % (1 sur 5).

**Reproduire** : `node preuves/harnais/collecter.mjs <A.fin> <B.fin>` (« Mod F ») ; tests :
`"$CLAUDE_CODE_EXECPATH" plugin test preuves/mods/fichiers`.

**Verdict : positif.** Les deux moitiés sont tenues, l'`agentId` se relie à la session (la sonde est
retrouvée sur P92/S1), et 20 % des écritures par `Bash` est sous le seuil de 50 %. Réserves, relevées
sur le plan réel S5 (ligne 2) : un `Write` vers un fichier de brouillon sous le dossier temporaire a
été refusé (faux positif sur un plan réel, hors fixture), et la session a contourné par `Bash` (deux
écritures sur trois, lignes 1 et 3). Voir « Défauts relevés ».

## L — Mod de limites d'usage

**Critères (décision § L)** :
- « Positif : `plugin test` prouve le refus au seuil et le passage en dessous ; **et** en vague 2,
  `rateLimits` est non vide dans une session Desktop, et le coût d'un plan de fixture se lit en
  points de la fenêtre de 5 h. »
- « Négatif : `rateLimits` vide dans Desktop (hôte sans abonnement remonté), ou `session.measure` ne
  se déclenche pas dans une session lancée par tâche planifiée. »

**Protocole exécuté** : S2 (tests simulés, cas au seuil et en dessous, seuil 95 en repli) ; en direct,
`~/.claude/preuves/mods/limites.jsonl` relevé sur A et B. Seuil réglé à 95 % (repli du module), donc
aucun refus attendu.

**Lignes de journal** (`limites.jsonl`, 29 lignes) : `{"ts":"2026-10-05T20:30:15.003Z","rateLimits":{"five_hour":{"percentUsed":21,"resetsAt":"2026-10-05T22:10:00.000Z"},"seven_day":{"percentUsed":13,"resetsAt":"2026-10-08T21:00:00.000Z"}}}`.
Collecteur : A 6 mesures, vides 0, 20 % → 21 % ; fenêtre M3 bis de A : 0 mesure ; B 7 mesures, vides 0,
20 % → 22 %.

**Reproduire** : `node preuves/harnais/collecter.mjs <A.fin> <B.fin>` (« Mod L ») ; tests :
`"$CLAUDE_CODE_EXECPATH" plugin test preuves/mods/limites`.

**Verdict : non conclu — le coût d'un plan de fixture ne se lit pas.** Tenu : `rateLimits` non vide
(0 vide sur toutes les mesures), `session.measure` se déclenche dans les sessions planifiées (donc le
négatif est écarté). Manque : la fenêtre M3 bis de A ne contient aucune mesure (relevé absent, plan
non rejoué) ; le seul chiffre est 20 → 22 % sur toute la durée des sessions A et B, où s'entremêlent
d'autres travaux. Le refus au seuil n'a pas été vu en direct (restée sous 95 %), ce que le critère
ne demande pas.

## H — Harnais et observateur v2

**Critère (décision § H)** : « Positif : tests verts, prompt autonome relu par `verificateur-plan`.
Négatif : sans objet (outil). »

**Protocole exécuté** : S3 — observateur v2 (refus par `isError`, plan en argument, journal sans
chemin en dur), harnais (`attendre.mjs`, `collecter.mjs`, consignes A et B), plans de fixture P92 et
P93.

**Lignes de journal** : la ligne `tool.call` `Bash` du sous-agent M2b porte `resultat:"refus"` et son
motif, ce qui valide la lecture par `isError` (défaut 3 de P12 corrigé) ; le chemin du journal est
résolu sous le dossier utilisateur courant.

**Reproduire** : `"$CLAUDE_CODE_EXECPATH" plugin test preuves/mods/observateur` (18 verts) ;
`node --test "preuves/harnais/*.test.mjs"` (34 verts) ; `verifier-plan P92 --extension` et P93 → RAS.

**Verdict : positif.** Tests verts, prompt relu par `verificateur-plan` (RAS). Le collecteur a servi
et ses chiffres se recoupent. Limite à ne pas lire comme un verdict : la consigne A interdisait le
push alors que l'orchestration y mène, ce qui a arrêté M3 bis (voir « Défauts relevés »).

## O1 — Modèle imposé par l'index

**Critères (décision § O1)** :
- « Positif : `plugin test` couvre modèle absent (imposé), modèle contraire à l'index (remplacé),
  prompt sans plan (inchangé), index illisible (inchangé, jamais un refus) ; **et** en M3 bis, le
  `turn.complete` de chaque session porte le modèle de l'index. »
- « Négatif : `agent.spawn` ne se déclenche pas pour un sous-agent du plugin (`workflow:session-*`),
  ou le modèle rendu par le hook n'est pas celui que relève `turn.complete`. »

**Protocole exécuté** : S4 (19 tests simulés, dont les quatre cas) ; en direct, la **sonde** de la
session A : `Agent` `general-purpose` sans `model`, prompt nommant `plans/P92/S1.md` (index : Haiku).
Seule la sonde distingue le mod du comportement du moteur, qui passe `model` de toute façon (les
sessions de fixture lancées en Haiku n'y comptent pas).

**Lignes de journal** : `orchestration.jsonl` : `{"hook":"o1","avant":{"model":null},"apres":{"model":"haiku"},"agentId":"adcbeebac21341a7d","plan":"P92","session":"S1"}` ;
observateur (ligne 81) : `agent.spawn` `modeleDemande:null`, `modele:"claude-haiku-4-5-20251001"` ;
ligne 84 : `turn.complete` du même agent, `usage.model:"claude-haiku-4-5-20251001"`. `agent.spawn`
a vu `workflow:session-low` (agent `a9ac7be1ceae612c7`, tableau « Agents lancés » du collecteur).

**Reproduire** : `node preuves/harnais/collecter.mjs <A.fin> <B.fin>` (« O1 » et « Agents lancés »).

**Verdict : positif.** Sonde sans modèle : Haiku rendu par le hook, Haiku relevé par `turn.complete`.
Les deux négatifs sont écartés. Réserve : « en M3 bis, chaque session » est limité à une session
(P92/S1, M3 bis non rejouée) ; c'est la sonde qui porte la preuve, comme prévu. Le comportement sans
le mod n'a pas été rejoué : la référence est P12 (Opus 5.5 pour une `session-low` sans `model`).

## O2 — `CLAUDE-BASE` injecté aux sous-agents

**Critères (décision § O2)** :
- « Positif : `plugin test` prouve le préfixe unique (pas de doublon si déjà présent) ; **et** en
  M3 bis, le surcoût de cache creation par session est inférieur au coût de la lecture de
  `CLAUDE-BASE.md` qu'il remplace (les deux relevés au journal). »
- « Négatif : le surcoût dépasse le coût de la lecture, ou la réécriture du prompt casse le
  lancement d'un agent du plugin. »

**Protocole exécuté** : S4 pour la première moitié ; en direct, trois `agent.spawn` réécrits.

**Lignes de journal** (`orchestration.jsonl`) : `{"hook":"o2","avant":{"prefixe":false},"apres":{"prefixe":true,"octets":5510}}`
pour `a7d675b385ac3ba6a` (M2b), `adcbeebac21341a7d` (sonde) et `a9ac7be1ceae612c7` (P92/S1,
`workflow:session-low`). Cache creation : P92/S1 36 976, M2b 55 227, sonde 57 740.

**Reproduire** : `node preuves/harnais/collecter.mjs <A.fin> <B.fin>` (« O2 » et « Usage par poste »).

**Verdict : non conclu — relevé absent.** La seconde moitié compare un surcoût à un coût de lecture
que M3 bis devait relever sur deux déroulés ; elle n'a pas de référence sans le mod. Le second
négatif est écarté : le lancement de `workflow:session-low` avec le préfixe a abouti (PASS).

## O3 — `run_in_background: false` par défaut

**Critères (décision § O3)** :
- « Positif : `plugin test` couvre absent (ajouté), `true` (inchangé), `false` (inchangé) ; **et** en
  M3 bis, l'orchestrateur lance ses sessions en arrière-plan (son `true` explicite passe) pendant
  qu'un appel `Agent` sans paramètre part au premier plan. »
- « Négatif : une réécriture de l'entrée de `tool.call` n'est pas prise en compte par l'outil `Agent`. »

**Protocole exécuté** : S4 (tests simulés) ; en direct, la session A lance M2b en `true`, une sonde
sans paramètre, puis `workflow:session-low` en `true`.

**Lignes de journal** : `{"hook":"o3","avant":{"run_in_background":null},"apres":{"run_in_background":false}}`
(20:30:12.708Z) ; observateur lignes 73 (M2b, `arrierePlan:true`), 85 (sonde, `arrierePlan:null`), 94
(`workflow:session-low`, `true`, `ok`). Preuve de l'effet : la session A attend M2b par `Bash`
(20:29:52.976) pendant que l'agent travaille ; elle n'émet aucun appel d'outil entre le lancement de
la sonde (20:29:58) et sa fin (20:30:12), son appel suivant partant à 20:30:16.

**Reproduire** : `node preuves/harnais/collecter.mjs <A.fin> <B.fin>` (« O3 »).

**Verdict : positif.** Le `true` explicite passe (arrière-plan réel), l'appel sans paramètre part au
premier plan (l'orchestrateur ne fait rien pendant la sonde). Le négatif est écarté. La condition
« en M3 bis » a été tenue par la session A dans son déroulé partiel.

## O4 — Collecte des verdicts et des coupures de quota

**Critères (décision § O4)** :
- « Positif : `plugin test` couvre verdict présent, verdict absent, erreur `rate_limit` simulée ;
  **et** en M3 bis, chaque session laisse son `.verdict`, identique à la ligne que l'orchestrateur
  a reçue. »
- « Négatif : le texte final du sous-agent n'est pas lisible depuis `turn.complete`, ou l'erreur de
  quota n'y est pas distinguable. »

**Protocole exécuté** : S4 (tests simulés ; type vérifié : `turn.complete` porte `answer`,
`agentId`, `reason`, **pas de genre d'erreur** — l'erreur `rate_limit` est sur `classic.StopFailure`,
et le module s'y accroche aussi) ; en direct, P92/S1 de la session A.

**Lignes de journal** : aucune ligne `o4` dans `orchestration.jsonl` ; pas de `plans/P92/S1.verdict`
sur le disque. Le `turn.complete` de P92/S1 porte `raison:"answer"` sans que le mod ait écrit.

**Reproduire** : `ls plans/P92/` ; `grep -c '"hook":"o4"' ~/.claude/preuves/mods/orchestration.jsonl`
(0).

**Verdict : non conclu — le mod n'a rien écrit, cause non établie.** Aucune coupure de quota n'a eu
lieu, donc la seconde moitié du négatif n'a pas été éprouvée ; mais la première moitié du positif
(un `.verdict` pour la session de fixture) ne s'est pas produite, et la preuve n'établit pas si
`turn.complete` ne portait pas le `VERDICT:`, ou si le hook n'a pas été atteint. À reprendre par
une mesure dédiée.

## O5 — Ligne d'état

**Critères (décision § O5)** :
- « Positif : `plugin test` prouve le texte rendu et le rappel unique au franchissement de 70 % ;
  **et** en vague 2, la ligne est posée dans la session planifiée (`$.ui.status` sans refus au
  journal). L'aspect visuel n'est pas jugé (règle d'autonomie). »
- « Négatif : `$.ui.status` refusé ou sans effet dans une session lancée par tâche planifiée. »

**Protocole exécuté** : S4 (rappel unique à 70 % mutation-testé) ; en direct, lignes `o5` relevées.

**Lignes de journal** (`orchestration.jsonl`) : `{"hook":"o5","apres":{"texte":"5 h : 20 % · contexte : 8 %"}}`
dans les sessions A et B (19:18:14, 20:28:58, 20:29:04) ; `{"…","plan":"P92","session":"S1","apres":{"texte":"P92 · S1 · 5 h : 21 % · contexte : 10 %"}}`
(20:31:41) ; côté orchestrateur : `"P13 · vague 3 · S6 · 5 h : 21 % · contexte : 21 %"`. A : 8 lignes,
B : 1 ligne.

**Reproduire** : `node preuves/harnais/collecter.mjs <A.fin> <B.fin>` (« O5 ») ; tests :
`"$CLAUDE_CODE_EXECPATH" plugin test preuves/mods/orchestration`.

**Verdict : positif.** La ligne est posée dans les sessions planifiées, aucun refus au journal.
Limite : le module ne lit pas le retour de `$.ui.status`, donc « sans effet » n'est pas observable
d'ici ; le seuil de 70 % n'a pas été franchi en direct (contexte 8 à 23 %).

## Réfuté

- **« Une tâche planifiée tourne sans approbation »** : réfuté. Les deux sessions se sont bloquées sur
  leur premier appel Bash (mode manuel hérité).
- **« La notification de fin réveille l'orchestrateur »** : réfuté dans ce déroulé. Aucune
  notification de tâche reçue avant le message de l'utilisateur.
- **« `set_session_model` s'applique au premier tour de travail »** : réfuté pour le premier tour
  (Opus), juste ensuite (Sonnet).
- **« Une tâche planifiée s'archive d'elle-même »** : réfuté (`archived` à `false`). L'archivage par
  l'orchestrateur a été refusé (classificateur, ou client Remote Control encore connecté).
- **« `start_session` est disponible »** : réfuté, absent des deux sessions.
- **« `list_task_runs` donne le `VERDICT:` »** : réfuté, champ `summary` absent ; `list_events` le donne.
- **« Le hook classique ne voit pas les sous-agents en arrière-plan »** (incident 2026-09-17) :
  réfuté (M2b), comme au premier plan (P12 M2).
- **« `agent.spawn` ne se déclenche pas pour `workflow:session-*` »** : réfuté.
- **« Plus de la moitié des écritures des sessions de fixture passent par `Bash` »** : réfuté, 20 %.
- **« `rate_limit` se lit sur `turn.complete` »** : réfuté par le type (S4) ; il est sur `StopFailure`.
- **« Plusieurs modules dans `hooks.json` »** : réfuté (S5) : « a second entry is refused », deux
  `on(<événement>)` sans matcher refusés ; les quatre mods ont dû être fusionnés dans `mods.tsx`.
- **« `claude plugin validate` suffit à repérer un défaut de style »** : non réfuté ; seul un
  avertissement (`author` absent).

## Mods candidats

| Mod | Verdict | Réserve avant adoption |
| --- | --- | --- |
| F — fichiers | positif | faux positifs (dossier temporaire, `docs/workflow/incidents/`, `.claude/`, fichiers de contexte) ; contournable par `Bash` |
| O1 — modèle imposé | positif | M3 bis non jouée ; fusion en un module à tester |
| O3 — `run_in_background: false` | positif | aucune |
| O5 — ligne d'état | positif | effet visuel non jugé ; rappel 70 % non vu en direct |
| H — harnais, observateur v2 | positif (outil) | consigne A à corriger (push) |
| L — limites | non conclu | coût d'un plan non lu ; refus au seuil non vu en direct |
| O2 — préfixe `CLAUDE-BASE` | non conclu | surcoût non comparé |
| O4 — verdicts et quota | non conclu | n'a rien écrit ; cause non établie |
| garde git par mod (M2b) | négatif | le hook classique suffit |
| session neuve à la place de la pastille (M5) | négatif | mode de permission et réveil à régler |

Coût de distribution (P12 reste vrai) : `uninstall` + `install` à chaque changement à version égale ;
un seul module par plugin, donc un fichier fusionné (`plugin/hooks/mods.tsx` sur la branche, 762
lignes, divergeant désormais de `preuves/mods/`).

## Défauts relevés

**Des Bilans de S1 à S6 :**
1. **S1** — N0 sous vague parallèle : la preuve d'une session dépend du silence des autres (deux
   passes en « entrées modifiées pendant la validation » ; les fichiers non suivis de `preuves/` des
   sœurs comptent comme entrées).
2. **S1** — `claude plugin validate` s'affiche en `✔` malgré un `author` absent.
3. **S1** — parité de lecture de zone avec `prochaine-action.mjs` non gardée (copie sans test de
   parité) ; faux positifs prévisibles de F, dont un constaté en vague 2 (voir F).
4. **S2** — **le Bilan de S2 est resté vide** (« à remplir par l'exécutant ») ; sa preuve N0 ne
   liste pas `plugin validate` ni `plugin test` du mod (revue de S2).
5. **S3** — `node --test preuves/harnais/` échoue sous Node 24 (répertoire non développé) ; forme qui
   marche : `node --test "preuves/harnais/*.test.mjs"`.
6. **S3** — la consigne A rend `pousser` « question » et interdit le push : l'orchestration d'un plan
   mène à un push, donc M3 bis s'arrête à S1 ; consigne B : l'arbre occupé par
   `.claude/journal-modeles.jsonl` suffit à sauter M3 bis, alors que le préalable 0.54.0 devait
   neutraliser ce fichier pour N0 seulement.
7. **S4** — la colonne Modèle de l'index est la 4e cellule, pas la 5e (décision) ; `turn.complete` ne
   distingue pas `rate_limit` ; `$` ne passe qu'à des fonctions déclarées au sommet du fichier.
8. **S5** — `hooks.json` n'admet qu'un module ; mods fusionnés ; le correctif du `\n` de
   l'observateur n'est pas répercuté dans `preuves/mods/` ; `plugin test` non joué sur le module
   fusionné ; les zones de S6 et S7 dans l'index listent encore les quatre noms d'origine, alors que
   le livrable est `plugin/hooks/mods.tsx` (constaté en S5, où F a refusé l'écriture du Bilan).
9. **S6** — le classificateur du mode auto refuse `create_scheduled_task` (×2) et `archive_session`
   sans motif, y compris après accord dans le chat ; les sessions planifiées héritent du mode
   manuel ; le hook Stop du workflow relance une session planifiée « pour travail non poussé » ;
   deux sessions « P13 a » / « P13 b » restent non archivées (à faire à la main).

**De l'outillage vu en route (S7) :**
10. `T11` désigne le commit du plan par `git log --grep "plan(P13)" -1` : cette commande rend le plus
    **récent** commit `plan(P13): …` (`cd8913a`, qui contient déjà les mods), pas le commit du plan sur
    `main` (`8a9c226`). Restaurer depuis `cd8913a` n'aurait rien retiré. La session a pris `8a9c226`.
11. Le plan T11 ne nomme pas `plugin/hooks/mods.tsx` ; sa « ceinture » le couvre.
12. Les journaux de mod grossissent tant que le plugin reste installé : le recoupement du collecteur
    doit porter sur les fenêtres, pas sur les totaux.

## Nombre de gestes humains demandés

**Au moins 6** (cible 0), d'après le relevé de S6 ; décompte exact **non conclu** (les approbations
côté A et B ne sont pas journalisées). Gestes constatés, `/orchestrer-plan` de lancement exclu :
1. accord dans le chat après deux refus du classificateur ;
2. passage en mode manuel ;
3. approbation de la création de `P13-A` ;
4. approbation du lot « minuteur + lancements » (plus d'une heure d'attente) ;
5. approbations `set_remote_control` ;
6. ouverture des sessions A et B depuis l'app mobile ;
7. au moins une approbation dans A, une dans B ;
8. message « A et B sont finies » (aucune notification reçue).

Les points 1 à 6 sont ceux que S6 compte ; 7 et 8 sont dans ses relevés sans être comptés. Tous
viennent de la voie par tâche planifiée (M5), aucun d'un mod.

## Méthode

Commandes de reproduction : une par section, ci-dessus. Journaux : `~/.claude/preuves/mods/`
(`observateur.jsonl`, `fichiers.jsonl`, `limites.jsonl`, `orchestration.jsonl`) et témoins
`P13-A.fin`, `P13-B.fin`. Branche : `preuve/mods-2` (statuts, preuves N0 et revues y restent).
