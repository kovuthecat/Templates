# 2026-09-12 — Analyse : conseils Anthropic (contexte, skills, vérification, Fable) confrontés au workflow

- Statut : **à arbitrer** — aucune mesure n'est décidée ici ; ce fichier est une entrée de
  `/analyser-incidents` (Étape 2b) et de `/cadrer`, jamais une décision.
- Workflow analysé : plugin **v0.27.0** (`plugin/.claude-plugin/plugin.json`).
- Produit par : session Claude Code cloud, à la demande du mainteneur, après lecture intégrale de
  `plugin/` (CLAUDE-BASE, WORKFLOW, CONVENTIONS, 13 skills, 5 agents, 4 hooks, gabarits) et du
  registre `DECISIONS.md`.
- Consommation : chaque mesure porte un identifiant stable (`A1`…`C4`, `J0`) et un champ
  `Incidents liés :` vide. Une passe `/analyser-incidents` qui rattache un groupe d'incidents à une
  mesure remplit ce champ ; une mesure qui accumule des incidents monte en priorité, une mesure
  qui n'en reçoit jamais reste ce qu'elle est : un conseil, pas un besoin constaté.

## Sources

| Article | Date | Ce qu'il apporte |
| --- | --- | --- |
| [The new rules of context engineering for Claude 5 generation models](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models) | 2026-07-24 | 80 % du prompt système retiré pour Opus 5 / Fable ; jugement plutôt que règles ; interfaces plutôt qu'exemples ; divulgation progressive ; `/doctor` ; mémoire automatique ; références riches (HTML, code, rubriques) |
| [A complete guide to building skills for Claude](https://claude.com/blog/complete-guide-to-building-skills-for-claude) | 2026-01-29 | page d'accueil vers un PDF ; contenu lu via un miroir du PDF (`resources.anthropic.com`) : structure `SKILL.md` + `scripts/` + `references/` + `assets/`, trois niveaux de divulgation, description = QUOI + QUAND, tests de déclenchement et de fonction, `< 5 000 mots` |
| [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 2025-09-29 | budget d'attention fini ; « bonne altitude » du prompt ; outils sans recouvrement ; récupération juste-à-temps ; compaction, prise de notes structurée, sous-agents qui rendent 1 000-2 000 tokens |
| [Building verification loops in Claude Code with skills](https://claude.com/blog/building-verification-loops-in-claude-code-with-skills) | 2026-07-22 | boucle = vérifier puis corriger ; `/verify` intégré ; validation contre une spec ; skills de vérification autonomes / embarquées / chaînées / sur PR ; chaîne interne Anthropic `/code-review` → `/simplify` → `/verify` → `/design` |
| [Maximizing the value of your Claude Code sessions](https://claude.com/blog/maximizing-the-value-of-your-claude-code-sessions) | 2026-08-14 | `/clear` entre tâches ; modèle et effort avant de commencer (cache) ; `@`-mention ; flags silencieux ; `/context` ; `/compact` avant une pause ; `/rewind` plutôt que `/compact` ; `MAX_THINKING_TOKENS=0` ; sous-agents Haiku pour le bruit |
| [A field guide to Claude Fable 5: finding your unknowns](https://claude.com/blog/a-field-guide-to-claude-fable-finding-your-unknowns) | 2026 | la qualité de Fable est bornée par la capacité à clarifier ses inconnues avec l'humain ; passe d'angles morts, brainstorm/prototype, interview, références en code, plan qui mène par ce qui va changer, notes d'implémentation avec « Deviations », explicatifs, quiz |

**Réserves.** `claude.com` et `anthropic.com` sont bloqués par le proxy de la session cloud ; les
pages ont été lues via le connecteur Exa. Le guide des skills n'a été lu que par miroir du PDF.
Toute citation précise à recouper sur la source avant d'en faire une règle.

## Ce qui est déjà aligné — ne pas toucher

Le workflow applique déjà l'essentiel de ces conseils, souvent avant leur publication :

- démarrage à froid par session, jamais deux sessions d'un plan dans une conversation (§5b) ;
- délégation à des agents mécaniques Haiku, sortie plafonnée à 20-25 lignes — la cible exacte
  que l'article d'ingénierie du contexte donne pour un sous-agent ;
- statut à un seul endroit, prise de notes structurée (`STATUS.md`, `index.md`, bilan de session) ;
- verdicts à énumération mécanique (`VERDICT: PASS|FAIL`, `Nature :`, `Bloquant :`) — c'est le
  « design d'interface » que l'article oppose aux exemples ;
- section « Compact instructions » dans le gabarit `CLAUDE.md` ;
- modèle et effort réglés **avant** de lancer (« À régler AVANT de lancer », §3) ;
- pas d'exemples few-shot dans les skills ;
- `allowed-tools` qui retire `Bash` de `/cadrer` et `/revue-de-conception`, Plan Mode imposé :
  contrainte structurelle plutôt que prose ;
- maquette HTML comme référence de câblage (`design/maquettes/`).

## Ce que chaque session paie avant le premier mot

| Chargé | Taille | Quand |
| --- | --- | --- |
| `CLAUDE-BASE.md` injecté par hook | 138 lignes / ~1 240 mots | toutes sessions |
| Descriptions des 13 skills | ~3 Ko | toutes sessions |
| Définitions d'outils MCP du compte | non mesuré — mesurer par `/context` | toutes sessions |
| `orchestrer-plan`, relue par un Haiku qui boucle | 408 lignes / ~3 900 mots | chaque orchestration |
| `WORKFLOW.md` (référencé, pas injecté) | 437 lignes / ~4 400 mots | quand une skill y renvoie |
| Préfixe (règles, skills, `CLAUDE.md`) d'un sous-agent | plein tarif, jamais à 1/10 | par session, à froid (source cache : `WORKFLOW.md` §3b) |

Aucune skill ne dépasse 5 000 mots, aucune n'utilise de `references/`.

## Principe transversal — moins contraindre les modèles forts

**Ce que dit l'article.** Trois causes de sur-contrainte : des consignes qui se recoupent ou se
contredisent entre prompt système, skills, `CLAUDE.md` et demande, que le modèle doit réconcilier
avant d'agir ; des règles absolues qui remplacent un jugement, justes dans 90 % des cas ; des
exemples qui bornent l'exploration. Le remède : donner le fait et le contexte, laisser conclure.
L'exemple cité passe de « n'écris pas de commentaires » à « écris du code qui ressemble au code
environnant ».

**Où ça s'applique ici.** Le workflow a deux étages — Opus pense, Sonnet/Haiku exécutent — et
l'allègement vise le premier. Un exécutant Haiku avec un `S<k>.md` serré reste la bonne
architecture. Le défaut est que le premier étage lit les **mêmes** contraintes que le second :
`CLAUDE-BASE` est injecté à l'identique dans un `/cadrer` sur Opus et dans une exécution Haiku.

**Trois formes de contrainte, trois sorts différents.**

| Forme | Exemples dans le workflow | Sort |
| --- | --- | --- |
| Garde-fou mécanique | 4 hooks, `allowed-tools`, Plan Mode, formats de verdict | **garder, étendre** (A3) — l'article les recommande sous le nom de design d'interface |
| Règle issue d'un fait du harnais | relecteur au premier plan (09-04), pas de fork en reprise (08-30), commit par session (08-24) | **garder, reformuler en fait** : « le retour d'un agent d'arrière-plan lancé en dernier geste n'est jamais lu » suffit à un modèle fort ; « JAMAIS run_in_background » s'applique aussi là où c'était pertinent |
| Règle qui remplace un jugement | « plan court, max 5 lignes », « deux ou trois options, jamais un panorama », « sept questions max », « design fixé, doute → STOP » | **relâcher pour l'étage Opus/Fable**, remplacer le chiffre par l'intention — « assez d'options pour trancher, pas un panorama » |

**Ce qui ne se relâche pas.** Les plafonds de sortie des agents mécaniques (ils protègent le
contexte du parent, pas le jugement de l'agent) ; les règles git ; les formats de verdict ; tout ce
qui protège un exécutant Haiku tant que l'exécutant est un Haiku.

## Mesures

Étiquettes : **[jugement]** sert le principe ci-dessus · **[contexte]** réduit ce qui est payé à
chaque tour · **[vérification]** renforce une boucle de contrôle.
Classes : grammaire de `/choisir-mecanisme` — A gain fort / coût faible · B gain net / coût
modéré · C gain marginal. Confiance = à quel point l'effet est mécanique et vérifiable.

### J0 — Scinder CLAUDE-BASE en socle commun + fichier d'exécutant [jugement] [contexte]

- Classe A · confiance moyenne-haute · coût : une session Opus courte + bump + sync des projets.
- Statut : faite v0.29.0.
- **Ce que ça change** : un socle court chargé partout (dépendances, trois niveaux de validation,
  où vit chaque information, fin de tâche, compactage) ; un fichier d'exécutant (table de
  délégation, interdits de fork et d'arrière-plan, « design fixé ») chargé **seulement** par les
  sessions de plan, parce que le bandeau du `S<k>.md` le liste dans « Lire ». Une session Opus de
  cadrage ne le charge jamais.
- **Ce qu'on verra** : injection SessionStart plus courte ; cadrages qui ne portent plus les
  garde-fous d'exécution.
- **Risque** : une session d'exécution lancée sans `S<k>.md` (à la main, hors plan) ne lit pas le
  fichier d'exécutant. Parade : le hook SessionStart peut l'injecter quand `plans/` contient une
  vague en cours, ou le socle peut y renvoyer en une ligne.
- Fichiers : `plugin/CLAUDE-BASE.md`, nouveau `plugin/EXECUTANT.md`, gabarit `S<k>.md` dans
  `/nouveau-plan` Étape 4, `hooks/sessionstart-contexte.mjs`.
- Incidents liés :

### A1 — `/context` et `/mcp` dans l'audit et la gate de migration [contexte]

- Classe A · confiance **haute** · coût : deux paragraphes.
- Statut : faite v0.30.0.
- **Ce que ça change** : `/choisir-mecanisme` (audit, point 6) et `/migrer-projet` (Phase D)
  demandent de lancer `/context` dans une session neuve, de noter la part de `CLAUDE.md`, des
  skills et des serveurs MCP, et de couper par `/mcp` les serveurs sans rapport avec le projet.
  Ajouter `/doctor` au même endroit (redimensionnement automatique de `CLAUDE.md` et skills,
  livré avec l'article).
- **Ce qu'on verra** : un chiffre avant/après par projet ; des sessions qui démarrent avec moins de
  définitions d'outils. Constaté dans la session qui a produit ce fichier : des dizaines d'outils
  Gmail, Vercel, PubMed chargés sans rapport avec le dépôt.
- **Risque** : nul, c'est une lecture.
- Fichiers : `plugin/skills/choisir-mecanisme/SKILL.md`, `plugin/skills/migrer-projet/SKILL.md`.
- Incidents liés :

### A2 — Dédupliquer CLAUDE-BASE [jugement] [contexte]

- Classe A · confiance haute sur le coût, moyenne sur l'effet · coût : une session Opus courte.
- Statut : faite v0.29.0.
- **Ce que ça change** : la section « Avant de coder » reformule sur ~25 lignes le §5 et le §5b de
  `WORKFLOW.md` et la décision du 2026-09-04, justification et historique d'incident compris. On
  garde une ligne par règle, énoncée comme un fait, et on pointe la décision pour le pourquoi.
  Même traitement pour le §8 « Anti-patterns » de `WORKFLOW.md`, qui restate une quinzaine de
  règles déjà domiciliées ailleurs.
- **Ce qu'on verra** : `CLAUDE-BASE` sous 100 lignes.
- **Risque** : retirer une justification qui empêchait réellement une erreur — d'où : la règle
  reste, seul le récit part.
- Fichiers : `plugin/CLAUDE-BASE.md`, `plugin/WORKFLOW.md` §8.
- Incidents liés :

### A3 — Sortir les scripts des skills vers `bin/` [contexte] [vérification]

- Classe A · confiance **haute** · coût : une session Sonnet.
- Statut : écartée — voie headless retirée v0.30.0, les trois scripts n'ont plus d'objet.
- **Ce que ça change** : trois blocs de code vivent en prose et sont recopiés par le modèle à
  chaque exécution : le lecteur de verdict headless (`lire()` en `node -e`, `/orchestrer-plan`
  Étape 4), la pose du trust dialog (dupliquée dans `/nouveau-projet` C3 et `/migrer-projet` B1.2),
  le préflight d'orchestration (Étape 2, quatre contrôles). Ils deviennent des scripts Node appelés
  en une ligne, testables seuls. La hiérarchie de `/choisir-mecanisme` les classe elle-même en
  « script déterministe » avant « skill ».
- **Ce qu'on verra** : `orchestrer-plan` raccourcit d'un tiers ; une classe d'incident disparaît.
- **Risque** : un script a un comportement figé là où la prose laissait adapter — voulu pour un
  préflight.
- Fichiers : nouveaux `plugin/bin/lire-verdict.mjs`, `plugin/bin/poser-confiance.mjs`,
  `plugin/bin/preflight-vague.mjs` ; les trois skills citées.
- Incidents liés :

### A4 — `references/` pour les quatre skills longues [contexte]

- Classe A · confiance moyenne · coût : une session par skill.
- Statut : **faite à moitié, v0.35.0** — `orchestrer-plan` (493 → 362, Étapes 5c/5d en annexe, lues
  seulement sur un `FAIL`) et `nouveau-plan` (341 → 240, les deux squelettes). Restent
  `migrer-projet` (275) et `reprendre-echec` (262). Ligne de coupe retenue, à reprendre telle
  quelle : **le corps garde ce qui se décide, l'annexe ne porte que ce qui se tape.**
  `sync-workflow.mjs` copiait déjà les sous-dossiers — aucune modification nécessaire.
  **Le risque nommé n'est pas levé** : il se vérifie sur une vraie vague avec un `FAIL`.
- **Ce que ça change** : troisième niveau de divulgation, absent du plugin. Candidats : bloc
  headless et Étape 5c de `orchestrer-plan` ; squelettes `index.md`/`S<k>.md` de `nouveau-plan` ;
  voies 1 et 2 de `migrer-projet` ; gabarit de rapport de `reprendre-echec`. Le corps garde la
  procédure et désigne l'annexe au moment utile.
- **Ce qu'on verra** : même skill, plus courte ; contexte de l'orchestrateur qui grossit moins vite.
- **Risque réel** : une annexe mal désignée n'est jamais lue. Commencer par `orchestrer-plan` seule
  et vérifier sur une vague avec échec que la reprise se déroule encore.
- Fichiers : les quatre dossiers de skill ; `bin/sync-workflow.mjs` doit copier les sous-dossiers.
- Incidents liés :

### A5 — Le relecteur lit l'Objectif et la Validation du `S<k>.md` [vérification]

- Classe A · confiance moyenne · coût : trois lignes.
- Statut : faite v0.29.0.
- **Ce que ça change** : `relecteur-session` relit le diff sans connaître l'intention — il attrape
  un crash, pas un livrable qui fait autre chose que demandé. Il reçoit les sections « Objectif »
  et « Validation » de chaque tâche et confronte le diff au critère écrit (la « validation contre
  une spec » de l'article sur les boucles).
- **Ce qu'on verra** : des revues « l'objectif demandait X, le diff fait Y ».
- **Risque** : un Objectif mal rédigé sera pris au pied de la lettre.
- Fichiers : `plugin/agents/relecteur-session.md`.
- Incidents liés :

### A6 — Point d'extension de vérification par projet (`verif-*`) [vérification]

- Classe A/B · confiance moyenne · coût : un paragraphe.
- Statut : faite v0.30.0.
- **Ce que ça change** : convention — toute skill projet nommée `verif-<chose>` est déroulée par
  `/fin-de-tache` après N0, sans que le workflow vendoré ait à la connaître. Ordre aligné sur la
  chaîne citée par l'équipe Claude Code : revue, simplification, vérification, design. Le point 6
  de `/fin-de-tache` (« Skill projet ? ») propose déjà la création ; il propose désormais
  explicitement une skill de vérification quand un contrôle manuel revient.
- **Risque** : adoption — personne n'écrira ces skills sans y penser.
- Fichiers : `plugin/skills/fin-de-tache/SKILL.md`.
- Incidents liés :

### A7 — Commandes silencieuses dans le gabarit `CLAUDE.md` et `verificateur-n0` [contexte]

- Classe A · confiance **haute** · coût : dix lignes.
- Statut : faite v0.28.0.
- **Ce que ça change** : le gabarit demande les commandes réelles sans reporter compact ; un runner
  qui imprime 400 tests reste dans le contexte de l'agent N0 pendant ses 12 tours. Ajouter « avec
  reporter compact » au gabarit (`--reporter=dot`, `--silent`…) et une consigne à l'agent.
- **Ce qu'on verra** : verdicts N0 en moins de tours.
- **Risque** : nul.
- Fichiers : `plugin/templates/CLAUDE.md`, `plugin/agents/verificateur-n0.md`.
- Incidents liés :

### B1 — Fable en amont, jamais en escalade [jugement]

- Classe B · confiance moyenne · coût : **un cadrage** (change la grille §2 et le prix par défaut
  d'une réflexion).
- Statut : écartée — Fable hors workflow, déclenché à la main (décision du mainteneur, 2026-09-12) ;
  la moitié utile (escalade qui s'arrête à Opus) est faite v0.29.0.
- **Ce que ça change** : la grille réserve Fable au problème qu'Opus n'a pas résolu, donc à une
  reprise à froid, sans humain, avec un rapport de 40 lignes pour seul contexte. Le guide de terrain
  dit l'inverse : la qualité de Fable est bornée par la capacité de l'humain à clarifier ses
  inconnues, en interview, en amont. La décision du 2026-09-09 a déjà constaté que les reprises
  Fable refaisaient le diagnostic pour rendre `ARBITRAGE`. Inverser : Fable sur `/cadrer` et
  `/revue-de-conception` ; l'escalade d'exécution s'arrête à Opus.
- **Ce qu'on verra** : cadrages plus chers à la session, une reprise de moins par échec.
- **Risque** : payer 2× Opus sur des cadrages qu'Opus faisait bien. **Preuve la moins chère** : deux
  cadrages identiques, un par modèle, comparer la décision et le nombre de questions posées.
- Fichiers : `plugin/WORKFLOW.md` §1-2, §9a ; `/orchestrer-plan` 5c ; `/cadrer` frontmatter.
- Incidents liés :

### B2 — Passe d'angles morts et interview dans `/cadrer` [jugement]

- Classe B · confiance basse · coût : une heure.
- **Ce que ça change** : `/nouveau-projet` et `/revue-de-conception` ont une interview, `/cadrer`
  n'en a pas. Étape optionnelle, déclenchée quand le sujet est hors de la zone connue de
  l'utilisateur : « passe d'angles morts » (inconnues inconnues) puis interview une question à la
  fois, priorisée par ce qui changerait l'architecture.
- **Risque** : allonger la session la plus chère.
- Fichiers : `plugin/skills/cadrer/SKILL.md`.
- Incidents liés :

### B3 — Ligne « Écarts au plan » dans le bilan de session [jugement]

- Classe B · confiance moyenne · coût : dix minutes.
- Statut : faite v0.28.0.
- **Ce que ça change** : le bandeau dit « design fixé, doute → STOP » ; le guide dit « option
  conservatrice, note-la sous Deviations, continue ». La règle §9a a déjà ouvert la brèche pour
  l'environnement. Extension : un exécutant peut s'écarter si l'objectif reste servi, à condition
  de le consigner dans une ligne « Écarts au plan » du bilan, relue par le relecteur. La prémisse
  fausse reste un STOP. **La latitude se déclare dans le bandeau, par le cadreur, session par
  session** — pas dans la règle commune, pour ne pas l'ouvrir à un Haiku.
- **Ce qu'on verra** : moins de `FAIL` pour un détail ; une trace de ce que le modèle a décidé seul.
- Fichiers : gabarits de `/nouveau-plan` Étape 4, `/fin-de-tache` point 3,
  `plugin/agents/relecteur-session.md`.
- Incidents liés : Chords `2026-09-09-headless-permissions-allow-sans-pytest.md` (écart d'effort
  assumé sans ligne pour le tracer).

### B4 — Champ « Référence » dans le gabarit de tâche [jugement]

- Classe B · confiance moyenne · coût : dix minutes.
- Statut : faite v0.28.0.
- **Ce que ça change** : la meilleure spécification est du code (fonction à imiter, dossier qui
  fait déjà la chose, maquette HTML). Le workflow le fait pour les maquettes, pas pour le code.
  Champ optionnel « Référence : chemin, et ce qu'il faut y regarder » dans le bloc `T<n>`.
- **Ce qu'on verra** : des « Étapes » plus courtes — « fais comme là » remplace six lignes.
- Fichiers : `/nouveau-plan` Étape 4.
- Incidents liés : Chords `2026-09-10-agent-content-filter-sessions-tuees-S4-S6.md` (leçon 2 : une
  décision écrite comme interdit de contenu plutôt que comme mécanique à imiter n'a pas été
  reconnue par l'exécutant).

### B5 — Évals sur `fin-de-tache` et `orchestrer-plan` [vérification]

- Classe B · confiance basse à court terme · coût : le plus élevé de la liste.
- **Ce que ça change** : tests de déclenchement (se déclenche sur les bonnes demandes, pas sur les
  autres) et de fonction (une session simulée finit par son commit et sa revue) avec l'outillage
  d'éval de plugin (`claude plugin eval`, `/skill-doctor`). Feu rouge avant publication au lieu
  d'un incident après.
- **Signal d'entrée** : une deuxième publication cassée.
- Incidents liés :

### B6 — Politique sur la mémoire automatique [contexte]

- Classe B · confiance basse · coût : une vérification (`lecteur-doc`).
- Statut : faite v0.29.0.
- **Ce que ça change** : Claude Code enregistre désormais seul des souvenirs. La décision du
  2026-08-30 ne couvre que la mémoire des agents. Rien ne dit ce qu'il advient d'un souvenir
  d'état projet qui contredit `STATUS.md`. Une ligne de politique, après vérification de ce qui est
  configurable.
- **Signal d'entrée** : premier conflit observé.
- Incidents liés :

### B7 — Rubrique projet pour le relecteur [vérification]

- Classe B · confiance basse · coût : une heure. **Après A5**, redondant avant.
- **Ce que ça change** : le relecteur lit `docs/rubrique.md` s'il existe — les règles propres au
  projet de ce qu'un bon livrable est.
- Incidents liés :

### C1 à C4 — lignes de documentation

- **C1** `@plans/P<n>/S<k>.md` dans les prompts de lancement (pastille, `claude -p`) : économise un
  tour de lecture par session **si** la mention est expansée dans ces canaux — à vérifier avant
  d'écrire.
- **C2** `/rewind` avant `/compact` dans `/cadrer` 4b : couper une fausse piste par rewind ne coûte
  rien (cache conservé), le compactage réécrit tout. Statut : faite v0.28.0.
- **C3** Un `model:` en frontmatter de skill invoquée **en cours** de conversation invalide le cache
  pour ce tour, comme un `/model`. Sans effet quand la skill ouvre la session ; coûteux pour
  `/purge-contexte` lancée après un signal du hook Stop. À noter dans `/choisir-mecanisme`. Statut :
  faite v0.29.0 (`WORKFLOW.md` §3b, `/choisir-mecanisme`).
- **C4** Explicatif HTML + quiz de fin de plan (guide de terrain) : dans l'esprit de « Écrire pour
  qui décide », à réserver aux plans longs, sur demande.
- Incidents liés :

## Signaux neufs — 2026-09-12

Quatre groupes d'incidents ramassés depuis la publication de ce fichier, sans mesure existante pour
les expliquer — traités en correction directe plutôt qu'attendre un second groupe (règle du point 1
de « Comment ce fichier se consomme ») :

- **G1** — `relecteur-session` épuise ses 30 tours sans écrire son `.revue.md` (enquête avant
  d'écrire, commits documentaires ou fichiers de données relus en clair). 7 occurrences, Chords +
  DoxUploader. `Chords/.../2026-09-09-relecteur-session-limite-de-tours.md`,
  `...-limite-de-tours-S11.md`, `2026-09-10-relecteur-session-limite-de-tours-S7.md`,
  `DoxUploader/.../2026-09-11-relecteur-session-tours-epuises.md`. Correction directe v0.28.0.
- **G2** — `Agent({subagent_type: "relecteur-session"})` introuvable dans l'orchestrateur. 2
  occurrences, MYO. `MYO/.../2026-09-11-relecteur-session-absent.md`, `...-absent-s5.md`.
  Correction directe v0.28.0.
- **G3** — session orchestrée qui lance une tâche de fond puis rend la main sans `VERDICT:`, lue à
  tort comme un `FAIL`. 2 occurrences, MYO + Chords. `MYO/.../2026-09-11-verdict-perdu-en-route-s5.md`,
  `Chords/.../2026-09-10-session-sans-verdict-sous-agent-interne.md`. Correction directe v0.28.0.
- **G4** — sessions tuées par le filtre de contenu, reprises automatiques identiques et payées pour
  rien. 3 occurrences, Chords. `Chords/.../2026-09-10-agent-content-filter-sessions-tuees-S4-S6.md`,
  `...-faux-positifs.md`, `2026-09-10-filtre-contenu-S6-pendant-lecture-page.md`. Correction directe
  v0.28.0.

Trois groupes de plus, ramassés depuis :

- **G5** — en sous-agent orchestré, `navigate` vers `localhost` refusé (« navigation to … was denied
  or failed »), alors que `preview_start` ouvre l'onglet sans problème. 2 occurrences,
  torrent-uploader. `torrent-uploader/.../2026-09-10-navigation-localhost-refusee.md`,
  `.../2026-09-11-navigation-localhost-refusee.md`. Correction directe v0.30.0 (`/verif-visuelle` :
  un seul essai, repli mode B, ligne N1 relayée par l'orchestrateur).
- **G6** — dépôt `.git` sous `SynologyDrive` corrompu par une reprise de synchro en cours d'écriture
  git. 1 occurrence, torrent-uploader. `torrent-uploader/.../2026-09-11-git-corrompu-synology-drive.md`.
  Correction directe v0.30.0 (signal `sessionstart-contexte.mjs` + témoin `.git/info/synchro-exclue`).
- **G7** — vague headless : allowlist incomplète, permission refusée sans avoir écrit une ligne. 1
  occurrence, Chords. `Chords/.../2026-09-09-headless-permissions-allow-sans-pytest.md`. Correction
  directe v0.30.0 (voie headless retirée : la classe d'incident disparaît avec elle).

## Priorité et confiance

| Rang | Mesure | Gain | Confiance | Coût |
| --- | --- | --- | --- | --- |
| 1 | A1 `/context` + `/mcp` + `/doctor` | fort | haute | une heure |
| 2 | A3 scripts vers `bin/` | fort | haute | une session Sonnet |
| 3 | A7 flags silencieux | moyen | haute | trente minutes |
| 4 | A2 dédupliquer CLAUDE-BASE | moyen | haute (coût) / moyenne (effet) | une session Opus courte |
| 5 | A5 relecteur lit la spec | fort | moyenne | trois lignes |
| 6 | J0 scission socle / exécutant | fort | moyenne-haute | une session Opus + sync |
| 7 | A4 `references/` | moyen | moyenne | une session par skill |
| 8 | B1 Fable en amont | fort | moyenne | un cadrage |
| 9 | A6 `verif-*` | moyen | moyenne | une demi-journée |
| 10 | B3 « Écarts au plan » | moyen | moyenne | dix minutes |
| 11 | B4 « Référence » | moyen | moyenne | dix minutes |
| 12 | B5 évals | fort à terme | basse | plusieurs sessions |
| 13 | B2 angles morts / interview | moyen | basse | une heure |
| 14 | B6 mémoire automatique | faible | basse | une vérification |
| 15 | B7 rubrique | faible | basse | une heure |
| 16 | C1-C4 | faible | variable | minutes |

**Séquencement proposé.** Vague 1 : rangs 1 à 5 — mécanique, réversible, mesurable, deux sessions.
Vague 2 : J0, A4, A6, B3, B4 — touchent les gabarits, exigent une publication puis `/maj-workflow`
sur les projets. B1 passe par `/cadrer`, avec les incidents du 2026-09-09 et ce fichier comme
entrée. B5, B6, B7 attendent leur signal d'entrée.

**Révision du 2026-09-13 (mesure K6 du fichier du 2026-09-13).** Les mesures A2, J0 et le fil
directeur ci-dessous n'étaient adossés qu'à du jugement ; ils ont maintenant un chiffre publié par
Anthropic : des prompts écrits pour un modèle antérieur et exécutés sur Opus 5 ont coûté **+36 %
par tâche sans aucun gain de précision** ; audités, les mêmes prompts coûtaient 14 % de moins **et**
résolvaient 97 % des cas contre 92 %. Sur la migration Sonnet 4.6 → Sonnet 5, l'audit a retiré 14 %
à précision constante. A2 et J0 montent donc en priorité effective, sans changer de contenu.

**Le fil directeur.** Les mesures [jugement] forment un ensemble : A2 et J0 retirent aux sessions
Opus les contraintes écrites pour Haiku ; B3 et B4 donnent aux exécutants l'intention et la
référence plutôt que la lettre ; B1 et B2 mettent Fable là où son jugement a un interlocuteur.
Les mesures [contexte] et [vérification] sont plus sûres et indépendantes de ce choix.

## Ce qui ne s'applique pas

- Code Review sur PR et GitHub Actions avec skill de vérification : le workflow pousse sur `main`
  sans PR.
- Compaction et nettoyage des résultats d'outils côté API : Claude Code le gère seul.
- Exemples few-shot : l'article dit qu'ils contraignent les nouveaux modèles ; le plugin n'en met pas.
- `/loop` dans une session séparée : le workflow n'utilise pas `/loop`.
- La voie headless (`claude -p`) elle-même : retirée v0.30.0, tout ce qui en dépendait (A3, le
  bloc headless, le préflight CLI/trust/allowlist) n'a donc plus d'objet.

## Comment ce fichier se consomme

1. `/analyser-incidents`, Étape 2b : pour chaque groupe d'incidents, chercher la mesure de ce
   fichier qui l'expliquerait ; si elle existe, ajouter le chemin de l'incident dans son champ
   `Incidents liés :`. Un groupe sans mesure est un signal neuf ; une mesure qui reçoit deux
   groupes de deux projets différents passe en « correction directe ».
2. `/cadrer` sur une mesure de classe B : ce fichier est l'entrée, la décision sort dans
   `docs/decisions/` et le champ `Statut` de la mesure passe à `décidée → <fichier>`.
3. Une mesure réalisée : ligne dans `CHANGELOG.md`, statut `faite v<x.y.z>` ici. Le fichier n'est
   ni supprimé ni purgé — c'est la trace de ce qui a été évalué et écarté, pour ne pas le
   réévaluer au prix fort (même logique que « Écartés — ne pas reproposer » de
   `/revue-de-conception`).
