# 2026-10-06 — Après P12 à P14 : mods adoptés, session neuve à prouver de bout en bout

> Issue de `/cadrer` : **Décision structurante** (adoption des mods) **+ Preuve à faire** (P15).
> Lit : `docs/analyses/2026-10-05-preuve-mods-mesures.md` (P12),
> `docs/analyses/2026-10-05-preuves-mods-autonomes-mesures.md` (P13),
> `docs/analyses/2026-10-06-reglage-sessions-planifiees-mesures.md` (P14).
> Brief : inchangé.

## Ce que ça change, en clair

- **Trois mods entrent dans le workflow** : O1 (le modèle de l'index est imposé aux sessions), O3
  (`run_in_background: false` par défaut) et O5 (ligne d'état). Ils vivent dans la source du
  workflow, sont publiés et vendorés avec lui, à la même version. Ce que tu verras : rien à
  installer à la main. `/maj-workflow` (et `/migrer-projet`) les mettent en place dans chaque projet.
  Revers : chaque changement d'un mod demande un changement de version, car une mise à jour à
  version égale ne recharge pas le module (P12).
- **La direction « l'orchestrateur ouvre lui-même les sessions neuves, à la place de la pastille »
  est maintenue** (décidée le 2026-10-05). Les blocages relevés par P13 et P14 ont chacun un réglage
  candidat, posé **avant** le lancement. Une dernière preuve, P15, les mesure de bout en bout. Si
  elle est positive, la pastille disparaît du repli Desktop. Si elle est négative, on saura
  exactement quel réglage manque.
- **Ne sont pas adoptés** : F (garde de fichiers : refuse des écritures légitimes, à corriger
  d'abord), L, O2, O4 (non conclus, non repris), et la garde git par mod (inutile : le hook
  classique bloque déjà les sous-agents, au premier plan comme en arrière-plan).
- **La méthode de preuve se corrige** : cinq défauts de P13 et P14 deviennent des règles, appliquées
  dès P15 (section « Leçons de méthode »).

## Ce qui est tranché, et pourquoi

### Distribution des mods : dans le workflow, installés automatiquement

Claude Code ne charge un mod que depuis un **plugin installé** (seule voie documentée,
code.claude.com/docs/en/plugins/mods/overview, relu le 2026-10-06). Le dossier vendoré
`.claude/workflow/` n'est pas un plugin, et `sync-workflow.mjs` ne copie pas `hooks.json`
(`plugin/bin/sync-workflow.mjs:60`) : les mods n'atteignent aujourd'hui que ce dépôt.

Décidé (utilisateur, 2026-10-06) : les mods font partie du workflow.

- Source : un sous-dossier `plugin/mods/`, avec un `.claude-plugin/plugin.json` qui le rend
  installable seul. Pas le plugin complet, qui doublerait les skills vendorées.
- Publication : `publier.mjs`, même version que le workflow.
- Vendoring : `sync-workflow.mjs` le copie dans `.claude/workflow/mods/`.
- Mise en place : `/maj-workflow` et `/migrer-projet` déclarent ce dossier comme marketplace locale
  et lancent `claude plugin install` / `update --scope local`, comme `publier.mjs` le fait déjà
  pour Templates. Templates installe le même mini-plugin : un seul chemin partout.

**Sauf si la mesure K de P15 est positive** : si le `.claude/settings.json` d'un projet peut câbler
un module comme il câble déjà les hooks classiques, il n'y a pas d'installation du tout, et les mods
se câblent comme les hooks actuels. Le plan du chantier des mods attend donc le verdict de K (et
seulement de K) avant de choisir sa voie.

O1, O3 et O5 sont fusionnés en un seul module : `hooks.json` n'en admet qu'un (P13, S5).

### La session neuve : les réglages candidats

| Blocage (P13 / P14) | Réglage candidat | État avant P15 |
| --- | --- | --- |
| Classificateur du mode auto : refuse création de tâche, archivage, report sur `main` | règles `autoMode.allow` dans les settings (code.claude.com/docs/en/auto-mode-config) | documenté ; on ignore si un `permissions.allow` suffit |
| Sessions planifiées en mode manuel | orchestrateur laissé en auto, règles posées d'avance ; le mode manuel de P13 venait d'un passage manuel pour débloquer une création | vraisemblable (héritage, comme le modèle), non mesuré |
| Remote Control des sessions lancées (demande utilisateur : les suivre sur mobile) | `set_remote_control` sur chaque session | a marché en P13, avec approbations |
| Modèle dès le premier tour | `model:` dans le `SKILL.md` de la tâche | mesuré positif (P14) ; **non documenté**, la doc dit même le contraire : fragile d'une version à l'autre |
| Effort dès le premier tour | `modelSettings.<modèle>.effortLevel` dans les settings du projet (≥ 2.1.251) | documenté, non mesuré en session planifiée |
| Réveil de l'orchestrateur | voie 1 : `Bash` en arrière-plan qui attend le fichier témoin de fin (l'outil relance l'agent à la sortie) ; voie 2 : `SendMessage` de la session vers l'orchestrateur | voie 1 au contrat de l'outil, jamais mesurée ici ; voie 2 non documentée |
| Archivage | `autoMode.allow` ; un client Remote Control connecté l'a bloqué en P13 | conflit probable avec le Remote Control |
| Hook Stop qui relance la session (« travail non poussé », plafond de `TASKS.md`) | correctif du workflow | dépend de nous |

**Effort par modèle** (utilisateur, 2026-10-06) : mesurer d'abord, trancher après. Revers à
trancher alors : `modelSettings` fixe **un** effort par modèle ; une session qui demande un autre
effort passerait par la session relais (un préambule de plus).

## Leçons de méthode (P13, P14)

Appliquées dès le plan de P15 ; transposées dans `/cadrer` (section « Protocole de preuve ») et
dans le gabarit de session `exploration` de `/nouveau-plan` par le plan d'intégration qui suivra P15.

1. **Une moitié de critère a sa propre mesure.** M3 bis portait la seconde moitié de L, O2 et O1 :
   une consigne l'a arrêtée, trois verdicts sont tombés en « non conclu » d'un coup.
2. **La consigne d'une session de fixture est confrontée au parcours qu'elle doit jouer.** La
   consigne A de P13 interdisait le push dont l'orchestration avait besoin ; `verificateur-plan`
   a rendu RAS.
3. **Le report des mesures sur `main` est une étape nommée**, avec son exécutant et sa permission.
   En P14, le classificateur l'a refusé ; il a fallu un ordre direct.
4. **Le commit de restauration s'écrit par son hash**, jamais par `git log --grep … -1` (qui rend le
   plus récent, P13 S7).
5. **Une session non interactive ne doit pas être relancée par le hook Stop** du workflow : il fausse
   le nombre de tours mesurés et relance une session qui a fini.

## Protocole de preuve — P15

**Question** : une session d'orchestration Desktop peut-elle lancer deux sessions planifiées qui
travaillent sans aucun geste humain, au modèle et à l'effort de l'index dès leur première requête,
visibles en Remote Control, puis reprendre seule la main à leur fin ? Et un mod peut-il se câbler
sans installation de plugin ?

**Branche** : `preuve/session-neuve`, créée depuis `main` (hash écrit dans le plan), poussée, jamais
fusionnée.

**Préalable sur `main`, avant la branche** : le correctif du hook Stop (leçon 5). C'est une session
ordinaire du plan, pas une mesure.

**Réglage initial** : les règles `autoMode.allow` (création, lancement, Remote Control, archivage de
tâches, report du fichier de mesures sur `main`) et le `modelSettings` de la fixture sont posés
**avant** le lancement, par une session du plan ; l'utilisateur les approuve une fois s'il le faut.
Ce geste est compté à part. Cible : **0 geste** ensuite.

**Fixture** : deux sessions, sur deux modèles distincts de celui de l'orchestrateur, dont une à un
effort ≠ `medium`. Chacune fait au moins un appel `Bash` et une écriture (pour éprouver la
permission, que P14 avait écartée en restant en lecture seule), écrit son témoin de fin, finit par
`VERDICT: PASS`. Leur consigne est relue contre le parcours (leçon 2).

**Instrument** : comme P14 — transcriptions (`model`, `effort`, `cache_creation` par requête),
`get_session`, `list_events` ; plus `node preuves/reglage/transcription.mjs --lire` (branche
`preuve/reglage-session`) à reprendre.

**Règle d'autonomie** : aucune question ; un choix non prévu s'écrit « non conclu : <choix
manquant> », et la session passe à la mesure suivante.

Une mesure par blocage, chacune jugée seule (leçon 1) :

| Mesure | Positif | Négatif |
| --- | --- | --- |
| **P** — permission | les deux sessions tournent en auto, aucune approbation, aucun refus du classificateur | une approbation demandée ou un refus, dans l'orchestrateur ou une session |
| **R** — Remote Control | `set_remote_control` accepté sur les deux sessions, sans approbation | refus ou approbation exigée |
| **M** — modèle | premier message assistant au modèle de l'index (frontmatter du `SKILL.md`) | premier message au modèle de l'orchestrateur |
| **E** — effort | première requête à l'effort de l'index via `modelSettings` | `medium` (ou l'effort de l'orchestrateur) sur la première requête |
| **W1** — réveil par `Bash` en arrière-plan | l'orchestrateur reprend son tour seul, dans les 2 min après le dernier témoin | aucune reprise sans message humain |
| **W2** — réveil par `SendMessage` | idem, sur message de la session finie | message non reçu, ou reçu sans nouveau tour |
| **A** — archivage | `archived: true` sur les deux, Remote Control actif | refus ; le motif est relevé (classificateur ou client connecté) |
| **K** — câblage d'un mod sans plugin | dans un projet de fixture vendoré sans plugin installé, un module déclaré dans `.claude/settings.json` écrit sa ligne `session.start` dans une session neuve ; module validé au préalable par `plugin validate` (piège P12) | ligne absente avec un module valide |
| **Report** | le fichier de mesures est committé et poussé sur `main` par la session prévue, sans refus | refus du classificateur |

W1 et W2 se jouent sur deux déroulés distincts (une session chacun), pour ne pas se masquer.

**Ce qui revient** : `docs/analyses/<date>-session-neuve-mesures.md`, seul fichier reporté sur
`main`, une section par mesure (protocole exécuté, lignes citées, commande qui reproduit, verdict
contre le critère cité mot pour mot), puis « Réfuté », « Voie retenue », gestes humains. N0 en fin
de plan sur la branche. Ensuite : tâches supprimées, réglages de la branche retirés, plugin local
réinstallé depuis `main` (vérifié).

**Budget** : réglage et fixture 30 tours ; déroulé W1 et déroulé W2, 20 tours et 20 min chacun ;
K 25 tours ; rendu 15 tours. Dépassement : « non conclu, budget » pour le reste, et on rend ce qui
a été mesuré.

**Hors de cette preuve** : F, L, O2, O4 ; l'intégration dans `/orchestrer-plan` et `WORKFLOW.md`
§5b (décision qui suivra le verdict).

## État final de la grille

| Dimension | État | Preuve | Si OPEN — résolution |
| --- | --- | --- | --- |
| problème concret | READY | M5 négatif (P13) ; B partiel, C négatif (P14) | — |
| résultat visé | READY | utilisateur, 2026-10-06 : direction maintenue, mods dans le workflow vendoré | — |
| vérification | READY | critères positif/négatif par mesure, ci-dessus | — |
| périmètre | READY | branche `preuve/session-neuve` ; hook Stop sur `main` en préalable | — |
| cohérence | OPEN | P, E, W1, W2, A, K non mesurés ; M non documenté | **expérience** (P15) |
| distribution des mods | OPEN | installation automatique ou câblage par settings | **expérience** (K), puis plan du chantier des mods |
| grille effort par modèle | OPEN | revers de `modelSettings` | **utilisateur**, au vu de E |

**Validité** : Desktop 2.1.286 ; doc relue le 2026-10-06 (auto-mode-config, settings-reference,
desktop-scheduled-tasks, plugins/mods/overview).
