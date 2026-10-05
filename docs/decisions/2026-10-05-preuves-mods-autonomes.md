# 2026-10-05 — Preuves des mods, parallèles et sans interaction humaine

> Issue de `/cadrer` : **Preuve à faire**. Suite de `docs/decisions/2026-10-05-preuve-mods.md` et de
> ses mesures (`docs/analyses/2026-10-05-preuve-mods-mesures.md`).
> Brief : inchangé.

## Ce que ça change, en clair

**La prochaine preuve tourne sans toi.** P12 t'a demandé une dizaine de gestes : ouvrir des
conversations neuves, accepter le rechargement à chaud, taper `/etat-plan`, faire des captures,
trancher en cours de route. La suivante remplace chacun de ces gestes par un mécanisme sans humain,
ou par une règle écrite d'avance. Une seule action de ta part peut rester, **avant** le plan : autoriser une
fois la tâche planifiée qui ouvre les conversations neuves.

**Elle mesure quatre familles de mods** :
- les mods de **fichiers**, qui refusent une écriture hors de la zone d'une session ;
- les mods de **limites d'usage**, qui suivent la fenêtre de 5 h et la semaine, et freinent avant
  une coupure de quota ;
- le **chargement à froid** resté non conclu (M1), y compris par la voie qui servirait aux projets
  vendorés ;
- la **garde git** dans le cas que P12 n'a pas testé (sous-agent en arrière-plan) et le **coût d'un
  plan**, rejoué deux fois avec un orchestrateur neuf.

Ce qu'elle rend : un verdict positif ou négatif par mod, écrit d'avance. Rien n'entre dans le
plugin avant la décision qui suivra.

**Le revers** : une preuve sans humain ne juge rien de visuel. M4 (le panneau) est déjà acquis ;
tout nouveau constat d'affichage se fait par `claude plugin test` (rendu simulé), pas à l'œil.

## Pourquoi P12 a demandé autant de gestes, et ce qui les remplace

| Geste humain dans P12 | Cause | Remplacement |
| --- | --- | --- |
| Ouvrir une conversation Desktop neuve (×2) | Un plugin installé ne charge ses modules qu'au démarrage | `run_scheduled_task` : démarre une **nouvelle** session Claude Code dans Desktop, sans geste (vérifié dans la description de l'outil, 2026-10-05) |
| Accepter « Enable hot reloading » | Mod chargé depuis le dossier dev-mods | Plus de dossier dev-mods : installation à froid + session planifiée, ou `claude plugin test` |
| Taper `/etat-plan`, `/etat-plan` à nouveau | Une commande ne se tape que par un humain | La preuve lit le journal du mod et les événements de session (`mcp__ccd_session_mgmt__list_events`) |
| Captures d'écran | Seul l'humain voyait le panneau | Rendu simulé : `$.ui.mount` du kit `claude-code/testing` |
| Questions en cours de route (budget, suite, choix) | Critères d'arrêt incomplets | Règles écrites d'avance, ci-dessous ; un choix non prévu devient un résultat « non conclu », jamais une question |
| Diagnostic du module refusé | `validate` lancé avec le mauvais binaire et sur le mauvais fichier | Gate : `"$CLAUDE_CODE_EXECPATH" plugin validate <mod>/.claude-plugin/plugin.json` + `"$CLAUDE_CODE_EXECPATH" plugin test <mod>` |
| `claude -p` impossible | CLI du PATH (2.1.274) non authentifiée | Aucun `claude -p` : le binaire du moteur sert pour `validate` et `test`, qui n'exigent pas de compte |

**Sonde faite pendant ce cadrage** : un mod de garde de fichiers (refus d'un `Edit` hors zone) et son
test passent `"$CLAUDE_CODE_EXECPATH" plugin test` hors session, sans authentification, en 0,24 s
(scratch, non commité). Tout ce qui est logique de mod se prouve donc en parallèle, sans session.

## Protocole de preuve

**Branche** : `preuve/mods-2`, créée depuis `main`, poussée, jamais fusionnée. Les mods vivent sous
`preuves/mods/<nom>/` (un dossier de plugin chacun), hors de `plugin/` ; seule la vague live
(vague 2) touche `plugin/hooks/hooks.json`.

**Règle d'autonomie** : aucune session du plan ne pose de question à l'utilisateur. Un choix non
prévu par ce protocole s'écrit « non conclu : <choix manquant> » dans le fichier de mesures, et la
session continue sur la mesure suivante.

**Gate de chaque mod** (remplace le N0 complet de 3 min 20 s, inadapté à une ligne de fixture) :
`"$CLAUDE_CODE_EXECPATH" plugin validate` sur le `plugin.json` du mod, `"$CLAUDE_CODE_EXECPATH" plugin
test` sur son dossier, `node tests/tester-hooks.mjs`. N0 complet une seule fois, en fin de plan.

### Vague 1 — logique des mods, en parallèle, hors session

Trois sessions sur des dossiers disjoints, lancées en sous-agents par `/orchestrer-plan`. Aucune
n'installe quoi que ce soit.

**F — mod de fichiers** (`preuves/mods/fichiers/`)
- Mesure : un `tool.call` sur `Edit`, `Write` ou `NotebookEdit` hors de la `Zone modifiée` de la
  session en cours est refusé ; dans la zone, il passe. La session est retrouvée par l'`agentId`, et
  la zone par l'appel `Agent` qui l'a lancée (`agent.spawn`, prompt `plans/P<n>/S<k>.md`) puis par
  `index.md`. Écritures par `Bash` (`>`, `tee`, `sed -i`) : comptées, pas refusées.
- Positif : les tests `plugin test` couvrent hors zone (refus), zone (passe), fil principal (passe),
  zone `aucune` (refus) et passent ; **et** en vague 2, le refus atteint le sous-agent sans faux
  positif sur un plan de fixture.
- Négatif : l'`agentId` ne se relie pas à une session (`agent.spawn` ne le donne pas), ou plus de la
  moitié des écritures des sessions de fixture passent par `Bash` (garde contournée de fait).

**L — mod de limites d'usage** (`preuves/mods/limites/`)
- Mesure : sur `session.measure`, le mod écrit `rateLimits` (`five_hour`, `seven_day` : `percentUsed`,
  `resetsAt`) dans `~/.claude/preuves/mods/limites.jsonl`. Au-dessus d'un seuil (option `userConfig`,
  80 % par défaut), il refuse un nouvel appel `Agent` avec un motif lisible, et laisse finir les
  sessions en cours.
- Positif : `plugin test` prouve le refus au seuil et le passage en dessous ; **et** en vague 2,
  `rateLimits` est non vide dans une session Desktop, et le coût d'un plan de fixture se lit en
  points de la fenêtre de 5 h.
- Négatif : `rateLimits` vide dans Desktop (hôte sans abonnement remonté), ou `session.measure` ne
  se déclenche pas dans une session lancée par tâche planifiée.

**H — harnais et observateur v2** (`preuves/mods/observateur/`, `preuves/harnais/`)
- L'observateur de P12 corrigé : refus relevé par `isError` (pas `deny`), plan suivi en argument
  (pas `P90` en dur), chemin du journal hors `C:/Users/Kovu`. Tests `plugin test`, y compris le rendu
  du panneau par `$.ui.mount`.
- Le prompt autonome de la session planifiée (vague 2) et le script de collecte
  (`preuves/harnais/collecter.mjs` : journal + `limites.jsonl` → mesures, par horodatage).
- Positif : tests verts, prompt autonome relu par `verificateur-plan`. Négatif : sans objet (outil).

### Vague 2 — en direct, à froid, en séquence

Une session qui installe les trois mods dans le plugin de la branche
(`"modules": ["./observateur.tsx", "./fichiers.ts", "./limites.ts"]`), réinstalle le plugin
(`uninstall` + `install` `--scope local`, `update` ne recopiant rien à version égale), puis démarre
**deux** sessions neuves par `run_scheduled_task`, à plus de 5 minutes d'écart (cache froid). Chacune
reçoit le même prompt autonome :

1. **M1 bis** : relever la ligne `session.start` du plugin `workflow`, racine dans le cache, sans
   variable d'environnement. Positif : présente dans la première session planifiée. Négatif :
   absente → remesurer avec un mod placé en dossier skills `.claude/skills/<nom>/` (la voie des
   projets vendorés), dans la même session.
2. **M2b** : sous `.claude/wave.lock` factice, un sous-agent lancé **en arrière-plan** tente
   `git commit --allow-empty`. Positif pour la garde par mod : le hook classique reste muet et le
   mod voit l'`agentId`. Négatif : le hook classique refuse déjà (la prémisse de l'incident
   2026-09-17 tombe aussi en arrière-plan).
3. **M3 bis** : orchestrer un plan de fixture de deux sessions (P92 puis P93 dans la seconde
   session planifiée), orchestrateur en Sonnet · medium. Positif : écart < 15 % entre les deux
   déroulés sur chaque poste, poste dominant identifié. Négatif : usage absent pour un sous-agent.
4. Les mesures de F et L en direct (ci-dessus).

La session de vague 2 attend la fin de chaque session planifiée en lisant un fichier témoin que le
prompt autonome écrit en dernier (`~/.claude/preuves/mods/<run>.fin`), par une boucle au premier plan
bornée à 10 minutes par appel. Elle ne lance aucune commande détachée.

### Vague 3 — rendu

`docs/analyses/<date>-preuves-mods-autonomes-mesures.md` : une section par mesure (protocole tel
qu'exécuté, lignes de journal citées, commande qui reproduit, verdict contre le critère ci-dessus,
cité mot pour mot), puis « Réfuté », « Mods candidats », « Défauts relevés », et le **nombre de
gestes humains demandés** (cible : 0). Désinstaller les mods du plugin local (réinstallation depuis
`main`), supprimer la tâche planifiée. Seul ce fichier de mesures va sur `main`.

### Budget

Vague 1 : 3 sessions × 40 tours, en parallèle. Vague 2 : 1 session de 40 tours + 2 sessions
planifiées de 30 minutes au plus chacune. Vague 3 : 20 tours. Dépassement : s'arrêter, écrire « non
conclu, budget » pour les mesures restantes, rendre ce qui est mesuré.

## Préalables (hors preuve, sur `main`, par un plan ordinaire)

- **`valider-n0` boucle** sur un fichier non suivi dans l'arbre (`plugin/bin/preuve-n0.mjs`,
  `empreinte()` sans `ref` compte `--others`) ; `.claude/journal-modeles.jsonl`, écrit par le hook
  PostModelSwitch, déclenche la boucle à chaque plan à preuve N0. À corriger avant, sinon chaque
  session de la preuve repaie ≈ 3 min 20 s de N0 par revalidation.

## Options écartées

- **Tout faire en `plugin test`** : gratuit et parallèle, mais ne prouve ni le chargement à froid ni
  le comportement des sous-agents réels. Gardé pour la vague 1 seulement.
- **`claude -p` headless** : demande de réauthentifier la CLI du PATH, en retard de version sur le
  moteur ; écarté.
- **Dossier dev-mods + rechargement à chaud** : un clic humain par conversation ; écarté.
- **Levier de réduction de coût (M3b, `prompt.section`)** : reporté tant que M3 bis n'a pas donné un
  coût de référence stable.

## État final de la grille

| Dimension | État | Preuve |
| --- | --- | --- |
| problème concret | READY | P12 : M1 non conclu, ≈ 10 gestes humains (`docs/analyses/2026-10-05-preuve-mods-mesures.md`) ; mods de fichiers et de limites jamais mesurés |
| résultat visé | READY | Demande explicite de l'utilisateur : preuves parallèles et autonomes, mods de fichiers, de limites d'usage et autres jugés nécessaires |
| vérification | READY | Critères positifs et négatifs écrits ci-dessus ; `plugin test` sondé (0,24 s, sans compte) |
| périmètre | READY | Branche `preuve/mods-2`, dossiers `preuves/mods/*`, `preuves/harnais/`, `plugin/hooks/hooks.json` en vague 2 seulement |
| cohérence | OPEN | La tâche planifiée : dossier de travail, mode de permission, approbations au premier lancement, notification de fin → **expérience**, premier geste de la vague 2 ; si une approbation humaine est exigée → **tâche** : l'utilisateur l'accorde une fois, avant le plan |

Validité : moteur Desktop 2.1.286, kit `claude-code/testing` de ce build, outils `scheduled-tasks`
tels que décrits le 2026-10-05.
