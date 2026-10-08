# 2026-10-08 — Inventaire des règles propres aux projets

Préparation d'une revue avec l'utilisateur. Question posée : les règles et invariants que Claude a
écrits à la création de chaque projet (`/nouveau-projet`, ou `/migrer-projet` pour les projets
plus anciens) collent-ils aux objectifs ? Créent-ils des blocages découverts tard ?

**Périmètre.** 21 projets vendorés sous `C:\Users\Kovu\Projets\`. Le socle commun n'est pas
compté : `.claude/workflow/`, CLAUDE-BASE, règles N0/N1/N2 génériques.

**Sources lues.** Pour chaque projet :
- `CLAUDE.md`, `.claude/rules/`, `PROJECT_BRIEF.md`, `ARCHITECTURE.md` ;
- `DESIGN_SPEC.md` (interdits seulement), `.claude/n0.json`, la ligne `Preuve N0` des index de plans ;
- `.claude/settings.json`, comparé au gabarit `plugin/templates/project-settings.json` ;
- les gardes propres au projet.

**Méthode.** La lecture a été faite par cinq agents, en lecture seule. Ils ont cherché les preuves
de blocage dans :
- `docs/workflow/incidents/`, les `.echec.md` (y compris ceux supprimés, retrouvés dans
  l'historique git) ;
- les `plans/P*/S*.md` et les `*.revue.md` ;
- `TASKS.md`, `STATUS.md`, `DECISIONS.md` et `docs/decisions/`.

Les totaux ont été recomptés ligne par ligne : trois totaux d'agents étaient faux d'une unité
(ebm-msp, trames-consultation, Interface-OE) et ont été corrigés. Des contrôles ponctuels
(allow de Chords, décision d'interface de vostfr-CLI, seuil 960 px d'ebm-msp, budgets de
trames-consultation) concordent avec les rapports.

**Drapeaux.**
- `BLOCAGE CONSTATÉ` : un écrit prouve que la règle a bloqué, fait échouer une session, forcé un
  contournement, ou dû être amendée. La preuve est citée.
- `SUSPECTE` : la règle est plaquée depuis le gabarit, contredite ensuite, invérifiable, ou d'un
  coût sans lien avec l'objectif.
- `OK` : ni l'un ni l'autre.

**Origine** (colonne des tableaux par projet).
- `INIT` : écrite à l'instanciation ou au cadrage du jour de création.
- `MIGR` : écrite à la migration d'un projet plus ancien vers le workflow.
- `AJOUT` : ajoutée plus tard, avec la décision qui la motive quand elle existe.

## 1. Synthèse par projet

Le tableau suit l'ordre d'activité : date du dernier commit, puis volume depuis le 2026-09-01.

| Projet | Dernier commit | Règles | BLOCAGE CONSTATÉ | SUSPECTE | Origine du projet |
|---|---|---:|---:|---:|---|
| EBM-MSPv2 | 2026-10-08 | 25 | 5 | 2 | `/nouveau-projet` 2026-10-02 |
| torrent-uploader | 2026-10-08 | 18 | 2 | 1 | `/nouveau-projet` 2026-09-08/09 (histoire perdue avant) |
| ebm-msp | 2026-10-08 | 23 | 5 | 4 | création 2026-07-22 |
| EBM-perso | 2026-10-08 | 15 | 1 | 2 | `/nouveau-projet` 2026-10-08, copie de EBM-MSPv2 |
| ETP interactif | 2026-10-08 | 17 | 3 | 4 | migré (création 2026-06-28) |
| trieur-plex | 2026-10-08 | 14 | 0 | 2 | `/nouveau-projet` 2026-10-08 |
| cosme-diy | 2026-10-08 | 17 | 0 | 2 | migré, clone de S&C |
| S&C | 2026-10-08 | 19 | 1 | 4 | migré (création 2026-05-18) |
| annuaire-msp | 2026-10-08 | 13 | 2 | 2 | création 2026-07-16 |
| extension-firefox | 2026-10-06 | 21 | 0 | 1 | `/nouveau-projet` 2026-10-06 |
| claude-mods | 2026-10-06 | 8 | 2 | 1 | `/nouveau-projet` 2026-10-05, clos le 10-06 |
| Veilleur | 2026-10-06 | 12 | 0 | 1 | `/nouveau-projet` 2026-10-06, 1 commit |
| Interface-OE | 2026-10-05 | 20 | 5 | 1 | `/nouveau-projet` 2026-08-25 |
| trames-consultation | 2026-10-02 | 17 | 6 | 1 | `/nouveau-projet` 2026-09-29 |
| DrumsTraining | 2026-09-26 | 19 | 0 | 4 | `/nouveau-projet` 2026-09-24 |
| Chords | 2026-09-24 | 19 | 5 | 4 | migré (création 2026-05-22) |
| MYO | 2026-09-24 | 20 | 2 | 5 | migré (création 2026-05-15) |
| DoxUploader | 2026-09-24 | 23 | 6 | 4 | migré 2026-09-11 |
| vostfr-CLI | 2026-09-24 | 17 | 1 | 1 | `/nouveau-projet` 2026-09-21 |
| Lunii Studio upgrade | 2026-09-24 | 9 | 2 | 4 | migré (fork, adoption 2026-08-25) |
| Tuto-onshape | inconnu | 18 | 3 | 2 | **pas de dépôt git valide** (voir sa section) |
| **Total** | | **364** | **51** | **52** | |

Lecture rapide :
- **Une règle sur sept a bloqué** (51 sur 364), une autre sur sept est suspecte.
- **Les blocages se concentrent sur six projets** : trames-consultation, DoxUploader, ebm-msp,
  EBM-MSPv2, Interface-OE et Chords en ont chacun 5 ou 6. Ce sont les projets aux règles de
  contenu les plus précises, ou aux interdits les plus absolus.
- **Les projets sans blocage sont jeunes** : trieur-plex, extension-firefox, Veilleur,
  DrumsTraining et cosme-diy ont entre 1 jour et 2 semaines de vie, ou n'ont pas de plan. Leur
  zéro ne prouve pas que leurs règles sont bonnes.
- **Environ deux tiers des blocages d'origine connue** (≈ 33 sur 48) visent une règle écrite **le
  jour de la création ou de la migration**. Beaucoup sont levés en quelques jours :
  - vostfr-CLI à J+1 ;
  - trames-consultation le jour même ;
  - annuaire-msp à J+1 ;
  - la règle R3 d'EBM-MSPv2 à J+1 ;
  - la règle « zéro persistance » d'ebm-msp à J+5.

## 2. Motifs transverses

Ce sont les familles de règles qui reviennent d'un projet à l'autre. Elles viennent du gabarit, ou
d'une habitude de l'interview `/nouveau-projet`, et c'est là que se décide ce qu'il faut changer
dans la skill. Les 51 blocages se répartissent sans reste entre les motifs M1 à M3 et un résidu
(M7). Les 52 suspectes se répartissent entre M4 à M6 et M8.

### Vue d'ensemble

| # | Motif | Projets touchés | BLOCAGE | SUSPECTE | Taux de problème |
|---|---|---:|---:|---:|---|
| M1 | Interdits absolus posés à la création (« zéro », « aucun », « jamais », « hors périmètre » sans condition de levée) | 13 | **24** | — | moitié des blocages |
| M2 | Chiffres, seuils, listes fermées et procédures fines fixés à l'interview, sans mesure | 7 | **12** | 2 (UI invérifiable) | presque toujours révisés |
| M3 | Outillage du workflow mal instancié (n0.json absent, Preuve N0 sans commande, `allow` minimal) | 9 | **9** | 2 | 9 projets sur 21 |
| M4 | Bloc gabarit « Critères avant ajout de feature » recopié | 14 | 0 | **14** | 14 / 14 suspect |
| M5 | Règles dupliquées dans 3-4 fichiers, non resynchronisées après amendement | 9 | — | **14** | dérive systématique |
| M6 | Doublons du socle, procédures d'avant le workflow, règles visant ChatGPT ou Codex | 8 | 0 | **14** | 100 % des projets migrés |
| M7 | Divers : accès aux sources bloqué, double vérification humaine, `DRY_RUN`, launch.json | 5 | 6 | — | — |
| M8 | Renvois à un dépôt voisin, critères d'aspect sans seuil | 5 | 0 | 6 (+2 en M2) | — |

### M1 — Interdits absolus posés à la création : 24 blocages, le motif le plus net

Ce motif produit la moitié des blocages. La règle s'écrit en « jamais » ou « aucun », sans motif
explicite et sans condition de levée. Elle est ensuite levée par une décision, une « exception
cadrée » ou un contournement, et souvent très vite.

Exemples :
- **ebm-msp.** « Zéro donnée, aucun disque » est amendé par D28 (mémoire de session) cinq jours
  après la création. Le moteur générique « ne connaît aucun nœud » fait abandonner un correctif en
  P10/S10. La pile figée doit faire une exception en D51.
- **ETP interactif.** « Zéro persistance partout » est jugé « surestrictif » : l'app patient était
  inutilisable. « Aucune dépendance runtime » oblige à encoder les QR codes en PNG hors de l'app.
  Le bundle patient « isolé » est amendé.
- **Chords.** Quatre interdits ont cédé : pas de web, pas d'audio, pas d'authentification (d'où un
  push contraint avec la clé `service_role`), et « on n'ajoute plus de fonction » (une exception le
  même jour).
- **vostfr-CLI.** « Interface graphique hors périmètre » est levé à J+1, après trois gênes d'usage.
- **DoxUploader.** « MFA manuelle », « pas de framework » (dérogation Electron) et « un site = un
  fichier » sont tous amendés.
- **Lunii Studio upgrade.** « Pas de reverse engineering » est levé le lendemain.
- **claude-mods.** L'« activation en settings utilisateur » était impossible techniquement : le
  projet est clos.
- **trames-consultation.** « Aucun code, aucun test » est contredit par un outil de visualisation
  testé dix jours plus tard.

À l'inverse, les interdits qui protègent quelque chose de concret n'ont **jamais bloqué**, dans
aucun projet :
- « aucune donnée patient dans le dépôt » ;
- « secrets jamais versionnés » ;
- « le NAS en lecture seule » ;
- « brouillon seulement » ;
- « jamais l'API interne d'OE ».

La différence tient à la portée : ces règles visent une donnée ou une action précise, pas une
classe entière de solutions.

**Piste pour `/nouveau-projet`.** Toute règle formulée en « jamais » ou « aucun » sur une **classe
de solutions** (dépendances, persistance, réseau, IA, interface, authentification) devient une
question explicite de l'interview. La règle porte son motif et sa **condition de levée** (« tant
que… », « sauf si… »). Une règle qui protège une donnée ou une action précise reste absolue.

### M2 — Chiffres, seuils et listes fermés à l'interview : 12 blocages

Ce sont des valeurs ou des procédures fines posées dès le cadrage, sans mesure, puis révisées dès
le premier contact avec le réel.

- **trames-consultation.** Budget écran « suivi = un écran » : revu le jour même, avec des
  plafonds « déclarés, non mesurés ». Liste fermée d'abréviations et « règle de deux » : des
  dérogations à chaque plan. Principes de rédaction : amendés trois fois.
- **ebm-msp.** Seuil de mise en page à 960 px, passé à 1200 px par trois décisions successives.
  `ARCHITECTURE.md` dit toujours 960.
- **torrent-uploader.** Un plafond de 3 captures inventé, alors qu'il « n'était pas une exigence du
  tracker ».
- **Interface-OE.** Un délai de 20 à 60 s entre requêtes, retiré comme « preuve réfutée ».
- **EBM-MSPv2.** `verifier-chiffres` force à écrire des nombres en lettres. L'invariant I11 et les
  règles R3 et R7 sont amendés en quelques jours.
- **EBM-perso.** Le brief annonce un « JSON Schema » que le code copié n'a jamais eu.
- **Variante invérifiable**, sans blocage : « lisible à 1 m » (ETP interactif) et « compréhensible
  par un enfant de 5 ans » (trieur-plex). La revue d'ETP a dû inventer un seuil en pixels.

**Piste.** Un nombre ou une liste fermée issus de l'interview s'écrivent **« provisoire, à
mesurer au premier plan »**, jamais en invariant. Un critère d'aspect doit avoir un seuil
mesurable, ou il est noté comme jugement humain en N2.

### M3 — Outillage du workflow mal instancié : 9 blocages, entièrement mécanique

Trois mécanismes se cumulent.

1. **`.claude/n0.json` absent à l'instanciation.** La Phase D de `/nouveau-projet` le renvoie à
   une ligne de `TASKS.md`. Résultat : `n0.mjs` refuse de tourner.
   - torrent-uploader : incident du 2026-09-17.
   - Interface-OE : fichier créé seulement en P12/S1, le 2026-10-03.
   - DoxUploader : T-229, N0 lancé à la main.
   - Restent sans n0.json : Lunii Studio upgrade (commandes encore en placeholders), Tuto-onshape
     (N0 réel = `node tools/verifier.mjs`), Veilleur, claude-mods, ETP interactif, S&C,
     cosme-diy, annuaire-msp.
2. **« Preuve N0 : requise » imposée à un projet sans commande.** Sur trames-consultation, la
   dérogation a été reconduite sur 5 plans (incident J14 de la synthèse du jour). Le champ est
   présent dans 100 % des index des projets récents (EBM-MSPv2 11/11, EBM-perso 2/2, trieur-plex,
   extension-firefox) et dans 0 % des autres : 0 sur 56 dans MYO, Chords, DrumsTraining et Lunii.
3. **`permissions.allow` « jamais élargie par précaution ».** Ce commentaire du gabarit a bloqué
   une session headless dans MYO (f2441226), Chords (incident du 2026-09-09 : pas de `pytest`,
   toujours pas corrigé) et Lunii Studio upgrade (09dc1f6). Ensuite, le classifier auto-mode
   empêche la session de corriger elle-même son allow. MYO, Chords et Lunii n'ont toujours ni
   `git push` ni `n0.mjs` dans leur allow.

   Plus marginal : la garde propre d'EBM-MSPv2 (`garde-extracteur`, seul hook propre à un projet
   dans les 21) refusait `SubagentHandback`. Une commande N0 de contenu (`pivots`) est passée au
   rouge à cause du travail d'une autre session.

**Piste.**
- n0.json obligatoire **à l'instanciation**, quitte à être minimal ; ou bien `Preuve N0 : non
  requise` écrite par `/nouveau-plan` quand il n'existe aucune commande.
- `allow` dérivé de la stack choisie à la question 10, **y compris** le runner de tests réel.
- Un contrôle de `/maj-workflow` qui signale les `allow` en retard sur le gabarit.

### M4 — Le bloc gabarit « Critères avant ajout de feature » : 14 projets, 14 suspects

Ce bloc est recopié mot pour mot ou presque dans **14 briefs sur 21**. Seul trames-consultation l'a
adapté, et sa version adaptée est déjà contredite par une décision. Aucun projet ne l'applique de
façon vérifiable, aucun écrit ne s'y réfère, et il n'a jamais rien bloqué : c'est du texte payé à
chaque lecture. S&C en garde même une version d'avant le plugin (« workflow IA simple »).

**Piste.** Le retirer de `templates/PROJECT_BRIEF.md`, ou le remplacer par une question de
l'interview dont la réponse est propre au projet.

### M5 — Une règle écrite à 3 ou 4 endroits ne survit pas à son amendement : 14 suspectes

Une même règle vit souvent à la fois dans `CLAUDE.md`, `PROJECT_BRIEF.md`, `ARCHITECTURE.md` et
`DESIGN_SPEC.md`. Quand une décision l'amende, une ou deux copies restent périmées, et la
prochaine session lit la mauvaise.

- **ETP interactif.** `docs/architecture.md:50` dit encore « aucune persistance ».
  `STATUS.md:78` recommande `npx tsc --noEmit`, que `CLAUDE.md` interdit.
- **Interface-OE.** `CLAUDE.md` affirme le mimétisme, pourtant archivé.
  `ARCHITECTURE.md:97` garde le délai de 20 à 60 s.
- **MYO.** `CLAUDE.md` garde « Gemini en priorité » alors que la pipeline n'a plus d'IA distante.
  L'exclusion des `.stl` contredit le brief.
- **trames-consultation.** Le brief dit « un écran » et « aucun test » aux lignes 63, 68, 79 et 128.
- **EBM-MSPv2.** « Ne pas construire l'affichage des dossiers » est toujours là, alors que c'est
  livré.
- **S&C.** La règle « Supabase seulement via `*Repository.ts` » est enfreinte dans 3 fichiers.
  `docs/ARCHITECTURE.md` est périmé.
- **annuaire-msp.** « Pas de rôles » est contredit par deux décisions.
- **ebm-msp.** « Publication par pull request » n'a jamais été appliquée : 1 merge sur 402
  commits.
- **DoxUploader.** Le registre `DECISIONS.md` garde actives des décisions contredites.

À noter aussi : la section « Règles spécifiques au projet » de `CLAUDE.md` est **vide** dans
EBM-MSPv2, extension-firefox, claude-mods et Lunii Studio upgrade, et l'était dans vostfr-CLI à
l'instanciation. Les règles sont alors dispersées dans le brief et l'architecture, ce qui aggrave
la dérive.

**Piste.** Une règle a **un seul fichier source**, `CLAUDE.md § Règles spécifiques`, et les autres
fichiers y renvoient sans la recopier. `/fin-de-tache` ou le relecteur vérifient qu'une décision
qui amende une règle met à jour ce fichier source.

### M6 — Doublons du socle et règles d'un autre outillage : 14 suspectes, toutes dans des projets migrés

Ce motif ne vient pas de `/nouveau-projet` mais de `/migrer-projet`. Ce sont des procédures
d'avant le workflow, gardées telles quelles.

- « Lire BRIEF, ARCHITECTURE, DECISIONS et MAP avant toute tâche » : ebm-msp, DoxUploader,
  Lunii Studio upgrade.
- « Mise à jour de STATUS.md obligatoire avant chaque commit » : texte identique dans cosme-diy et
  S&C.
- « Plan de 5 lignes » et « rapport en 6 rubriques » : DoxUploader.
- « Escalader vers ChatGPT » : MYO et DoxUploader.
- « Garde-fou Codex » et « AGENTS.md central » : Chords.
- `AGENTS.md`, copie intégrale non versionnée de `CLAUDE.md` « pour Codex » : DrumsTraining.
- « Choisir le modèle le moins cher » : Lunii Studio upgrade.
- « Lire la doc Next.js avant de coder » : MYO.

Ces règles n'ont rien bloqué, mais elles concurrencent `/cadrer`, `/fin-de-tache` et la grille
modèle/effort.

**Piste pour `/migrer-projet`.** Ajouter une passe qui liste les règles redondantes avec le socle
ou visant un autre outil, et les fait trancher par l'utilisateur.

### M7 — Divers : 6 blocages sans famille commune

- **Accès aux sources.** Tuto-onshape exige de vérifier chaque point sur cad.onshape.com et FsDoc,
  mais ces sites sont bloqués par le proxy des sessions, d'où l'échec de S10.
- **Double vérification humaine.** ebm-msp prévoit une relecture par deux humains, alors qu'il n'y
  a qu'un référent (D39).
- **`DRY_RUN` par défaut.** Sur DoxUploader, il provoquait des runs planifiés sans effet.
- **N1 impossible.** Interface-OE pensait N1 impossible faute de launch.json ; la règle a été
  amendée.
- **Hiérarchie des sources.** La règle de T-005 d'annuaire-msp a été amendée le lendemain.

### M8 — Renvois hors dépôt et critères sans seuil : 6 suspectes

- DrumsTraining et Tuto-onshape renvoient à `../Tuto-code/CONVENTIONS.md`, et DrumsTraining aussi
  à `../Chords/static/audio_ctx.js` : ces chemins n'existent pas dans une session cloud.
  DrumsTraining a hérité de Tuto-code un interdit JavaScript qu'il a dû lever le jour même.
- La contrainte « ouvrable en `file://` » de DrumsTraining dicte le format de tout le JavaScript,
  mais n'a jamais été vérifiée.
- La règle de cosme-diy « tester les parsers » n'a aucune suite de tests branchée.

**Piste.** Interdire dans l'interview les renvois `../<autre-projet>` : on copie l'extrait utile
dans le dépôt.

### Ce qui marche

Les familles suivantes, présentes dans la plupart des projets, ont un taux de blocage nul :
- **DONNEES et SECU concrètes** : aucune donnée patient dans le dépôt, secrets dans `.env`
  jamais lus, endpoints authentifiés, écoute sur `127.0.0.1` ;
- **ARCHI locale** : logique pure séparée et testée, un seul point d'accès au stockage, état dans
  l'URL ;
- **PERIM sur des fonctions nommées** : listes de hors-périmètre v1 précises.

Le problème ne vient donc pas de l'interview en général. Il vient de **trois réflexes** : absolutiser
une classe de solutions (M1), figer un chiffre non mesuré (M2), et laisser l'outillage N0 et les
permissions à plus tard (M3).

### Héritage par copie

Quand un projet est créé par copie d'un autre, il hérite des règles qui ont bloqué chez son
parent :
- **EBM-perso** reprend d'EBM-MSPv2 les gardes `verifier-chiffres` et `pivots`, qui y ont bloqué.
  Il a 0 dossier réel, donc aucun recul propre.
- **cosme-diy** a hérité de S&C « IA intégrée » en hors-périmètre. S&C l'a depuis amendé,
  cosme-diy non. Il en a aussi hérité « authentification magic link », démentie ensuite par D7.

**Piste.** Quand un projet naît d'une copie, l'interview passe en revue les règles du parent avec
leur historique de blocages.

### Constats annexes

- **Tuto-onshape n'est pas un dépôt git valide.** `.git/` est vide, et seul
  `_DESKTOP-DBJ4TBO_sept.-16-172001-2026_TYPECONFLICT.git` traîne, conflit de synchronisation
  Synology. Le projet est sous le dossier synchronisé, cas que traite la Phase C étape 7. Geste
  utilisateur à prévoir.
- **Aucun projet** n'ajoute de `deny`, d'`ask` ni de hook propre dans `settings.json`. Les règles
  propres sont toutes textuelles. Les seules gardes automatiques propres sont
  `garde-extracteur` (EBM-MSPv2 et EBM-perso) et des tests garde-fous (MYO, extension-firefox,
  DrumsTraining).
- **Renvois vers un `CONVENTIONS.md` absent de la racine du projet** : ebm-msp
  (`ARCHITECTURE.md:181`), annuaire-msp (`PROJECT_BRIEF.md:69`), Chords (`ARCHITECTURE.md:189`).

---

## 3. Détail par projet

Colonnes : # · règle paraphrasée · fichier:ligne · famille · origine · drapeau · preuve ou motif.
Codes de famille :
- DEP : gel de la stack, pas de dépendance ;
- DONNEES : confidentialité, données personnelles, local-only ;
- OFFLINE : hors-ligne, PWA, sans backend ;
- TEST : exigences de tests ;
- N0 : commandes N0, Preuve N0 requise ;
- TYPE : typecheck, lint, interdits d'outillage ;
- ARCHI : structure du code ;
- CONTENU : contenu comme données, sourcing, exactitude, droit d'auteur ;
- UI : design, accessibilité ;
- PERIM : hors-périmètre, à éviter ;
- PERM : permissions, hooks propres ;
- GIT : git, commits, branches ;
- STYLE : langue, nommage, ton ;
- SECU : secrets, sécurité ;
- PROCESS : procédure obligatoire ;
- PLATEFORME : OS, cible ;
- AUTRE.

### EBM-MSPv2

Objectif : visualiser, classe par classe, la balance bénéfices/risques (NNT/NNH sourcés) pour le
praticien de la MSP et la décision partagée. Second axe : les dossiers de preuve.
241 commits · instanciation f3c6553 2026-10-02.

Notes :
- `CLAUDE.md § Règles spécifiques` est vide (encore « À remplir »).
- Les règles vivent dans le brief, l'architecture, DESIGN_SPEC et `.claude/rules/fiche-classe-design.md`.
- settings.json est conforme au gabarit.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Le contenu est la donnée, l'app une vue : aucun calcul patient ni règle de décision au runtime | ARCHITECTURE.md:9 | ARCHI | INIT d092547 2026-10-02 | OK | |
| 2 | Aucun moteur de décision, aucune saisie de critères patient, aucun NNT individualisé | PROJECT_BRIEF.md:65,71,158 | PERIM | INIT f3c6553 | OK | |
| 3 | Aucune donnée patient, ni stockée ni saisie | PROJECT_BRIEF.md:66 ; ARCHITECTURE.md:276 | DONNEES | INIT f3c6553 | OK | |
| 4 | Pas de chiffre sans source ; `verifier-chiffres` refuse tout nombre hors item concordant du pivot | ARCHITECTURE.md:11 | CONTENU | INIT d092547 | BLOCAGE | P10/S1.md:155 : un chiffre de recommandation sans DOI « s'écrit en lettres » ; P1/S5.md:193 : RCP et recos refusées à tort (correctif e7e2f8c) |
| 5 | Chaque chiffre extrait deux fois en aveugle, par deux modèles | PROJECT_BRIEF.md:51 | CONTENU | INIT 4dc063a → decisions/2026-10-02-exploration-commune.md | OK | coût élevé, mais c'est le risque n°1 du brief |
| 6 | Hook `garde-extracteur` : lecture sous `entrees/` seulement, écriture d'un fichier neuf seulement | .claude/agents/extracteur.md:11 ; scripts/exploration/garde-extracteur.mjs | PERM | AJOUT 97a619d 2026-10-03 | BLOCAGE | incident 2026-10-03-garde-extracteur-bloque-handback : `SubagentHandback` refusé, agent sans rapport (corrigé) |
| 7 | Aucun vide silencieux : chaque critère commun couvert, « Pas de donnée » affiché | ARCHITECTURE.md:14 ; DESIGN_SPEC.md:27 | CONTENU | INIT d092547 | OK | |
| 8 | Validé au build : contenu invalide = build rouge, invariants I1–I10 testés | ARCHITECTURE.md:16,253 | TEST | INIT d092547 | OK | |
| 9 | I11 : toute molécule d'une estimation appartient à sa classe | ARCHITECTURE.md:267 | CONTENU | AJOUT 34b90fc 2026-10-04 | BLOCAGE | P11/index.md:57-58 : sans amendement, les fiches MHD « ne compileraient pas » ; amendé par decisions/2026-10-07-classes-mhd.md |
| 10 | Verdicts R0–R7 calculés à la compilation (`verdict.ts`) | ARCHITECTURE.md:148-180 ; rules:35 | ARCHI | AJOUT 34b90fc → decisions/2026-10-04-verdict-sections-pictogrammes.md | BLOCAGE | R3 amendée dès le lendemain (2026-10-05-verdict-classe-prioritaire-benefices), R7 ensuite (2026-10-07-classes-mhd) |
| 11 | Un seul accès au contenu (`acces.ts`) ; état dans l'URL, pas de store global | ARCHITECTURE.md:18,281 | ARCHI | INIT d092547 | OK | |
| 12 | DT2 seul au MVP, pas de deuxième pathologie avant stabilité | PROJECT_BRIEF.md:67,159 | PERIM | INIT f3c6553 | OK | |
| 13 | Ni veille, ni collecte automatisée, ni édition dans l'app, ni code partagé avec ebm-msp | PROJECT_BRIEF.md:68-70 | PERIM | INIT f3c6553 | OK | |
| 14 | « Ne pas construire l'affichage des dossiers avant d'avoir des dossiers réels » | PROJECT_BRIEF.md:160 | PERIM | INIT f3c6553 | SUSPECTE | obsolète : l'affichage est livré (brief:137) |
| 15 | Droit d'auteur : citer et résumer ; textes sources hors git | PROJECT_BRIEF.md:100 ; ARCHITECTURE.md:35 | CONTENU | INIT f3c6553 | OK | |
| 16 | WCAG 2.1 AA : le sens n'est jamais porté par la couleur seule | PROJECT_BRIEF.md:96 ; DESIGN_SPEC.md:29 | UI | INIT f3c6553 | OK | |
| 17 | Bureau ≥ 1280 px, pas de PWA, hors-ligne non requis | PROJECT_BRIEF.md:94,99 | PLATEFORME | INIT f3c6553 | OK | |
| 18 | Profil patient obligatoire sans défaut ; un seul volet ouvert ; un seul niveau de fenêtre | .claude/rules/fiche-classe-design.md:18-28 | UI | AJOUT 636a9be 2026-10-05 | OK | |
| 19 | Vue patient à quatre niveaux, jamais « Ça dépend » | rules:31-35 | UI | AJOUT 636a9be → decisions/2026-10-05-verdict-patient-sans-ca-depend.md | OK | |
| 20 | Le texte patient ne promet pas plus que ce que mesure l'étude | rules:62 | CONTENU | AJOUT 636a9be | OK | |
| 21 | Vocabulaire par type de classe dans `vocabulaire.ts`, rien en dur (test) | rules:51 | ARCHI | AJOUT 67ae3b4 → decisions/2026-10-07-classes-mhd.md | OK | |
| 22 | Pictogrammes en grille 24, style Lucide/Tabler, jeu provisoire à tester avec des patients | rules:66-71 | UI | AJOUT 636a9be | OK | |
| 23 | Couleurs uniquement par les jetons de `theme.css` | rules:74 | UI | AJOUT 636a9be | OK | écart non bloquant (docs/backlog/revues-code.md:8) |
| 24 | N0 = tests, pivots, chiffres, typecheck, build, vitest ; Preuve N0 requise 11/11 | .claude/n0.json | N0 | INIT 4eaa595 + AJOUT 97a619d/3ea4567 | BLOCAGE | incident 2026-10-06-pivots-precollecte-n0-rouge : pré-collecte d'une autre session, `pivots` rouge (51 erreurs), N0 de S2 bloqué |
| 25 | Critères avant ajout de feature | PROJECT_BRIEF.md:148-154 | PERIM | INIT f3c6553 | SUSPECTE | gabarit verbatim |

### torrent-uploader

Objectif : depuis un dossier du NAS, produire un brouillon de publication conforme à c411 et un
.torrent, sans double transfert. 165 commits.

Notes :
- L'histoire antérieure au 2026-09-09 est perdue (corruption Synology). Les commits ont été greffés
  sur ca2155a.
- `INIT†` signifie : présent dans ca2155a, issu du cadrage du 2026-09-08.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Portabilité : aucun chemin en dur, racines en config, `path.posix`, testé | CLAUDE.md:46 | PLATEFORME | INIT† → decisions/2026-09-08-application-portable-local-nas.md | OK | |
| 2 | Clés API c411/imgbb jamais envoyées au navigateur ni versionnées | CLAUDE.md:52 | SECU | AJOUT e3ab1fd 2026-09-16 | OK | |
| 3 | Brouillon seulement : aucune fonction de publication directe | CLAUDE.md:54 ; ARCHITECTURE.md:194 | PERIM | INIT† → 2026-09-08-auth-nulle-cloisonnement-reseau.md | OK | |
| 4 | Jamais exposée sur Internet ; pas d'auth ; tunnel privé | CLAUDE.md:57 | SECU | INIT† | OK | |
| 5 | Le backend n'écrit jamais sur le NAS | CLAUDE.md:59 | AUTRE (NAS) | INIT† | OK | |
| 6 | Aucune abstraction spéculative : un tracker, un hébergeur, en dur | CLAUDE.md:61 | ARCHI | INIT† | OK | coût visible (P3/S4.revue.md:18), pas de blocage |
| 7 | MediaInfo en binaire CLI officiel, pas en WASM | CLAUDE.md:62 | DEP | INIT† → 2026-09-08-mediainfo-binaire-cli.md | OK | |
| 8 | Logique pure dans `shared/` sans dépendance ; entrées/sorties dans les adaptateurs | ARCHITECTURE.md:13-29 | ARCHI | INIT† | OK | |
| 9 | Pas de store, d'ORM ni de base : fichiers JSON `data/` | ARCHITECTURE.md:195 | ARCHI | INIT† → 2026-09-08-persistance-fichiers-json.md | OK | |
| 10 | IDs de catégories c411 récupérés dynamiquement | ARCHITECTURE.md:143 | CONTENU | INIT† | OK | |
| 11 | Taille de pièce forcée par le barème, jamais « Auto » | ARCHITECTURE.md:141 | CONTENU | INIT† | OK | |
| 12 | Purge des données personnelles : jamais de ligne entière supprimée ; NFO relu par un humain | ARCHITECTURE.md:165-166 | DONNEES | INIT† | OK | |
| 13 | Brouillon refusé sans 1 bannière et ≥ 2 captures imgbb | decisions/2026-09-16-images-reuploadees-imgbb.md:5 | CONTENU | AJOUT 90d5e2b 2026-09-16 | BLOCAGE | plafond de 3 captures inventé puis retiré (348904a : « n'était pas une exigence du tracker ») |
| 14 | Navigateur desktop uniquement ; accessibilité minimale | PROJECT_BRIEF.md:106-109 | UI | INIT† | OK | |
| 15 | Hors périmètre : multi-tracker, renommage, encodage, sous-titres, file d'attente, TMDB… | PROJECT_BRIEF.md:56-75 | PERIM | INIT† ; sous-titres → 2026-09-21 | OK | |
| 16 | Contenu libre de droits, `-NOTAG`, deux catégories | PROJECT_BRIEF.md:14,52 | CONTENU | INIT† → 2026-09-08-perimetre-contenu-notag.md | OK | |
| 17 | Critères avant ajout de feature | PROJECT_BRIEF.md:171-177 | PERIM | INIT† | SUSPECTE | gabarit verbatim |
| 18 | N0 = build, `tsc -b --noEmit`, test ; Preuve N0 0/3 | .claude/n0.json | N0 | AJOUT dc2c84f 2026-09-17 | BLOCAGE | incident 2026-09-17-n0-json-absent : n0.mjs refusait de tourner, fichier jamais créé à l'instanciation |

### ebm-msp

Objectif : aide à la décision clinique déterministe et multi-domaine (DT2 d'abord), plus une veille
scientifique hebdomadaire qui alimente les algorithmes après validation humaine. 402 commits ·
instanciation a9a633f 2026-07-22.

Notes :
- Les invariants 1 et 8 de `CLAUDE.md` ont été amendés par décision.
- `ARCHITECTURE.md:181` renvoie à un `CONVENTIONS.md` absent.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Jamais `npx tsc --noEmit` (0 fichier compilé) : `npm run typecheck` | CLAUDE.md:27 | TYPE | AJOUT 318e2da 2026-08-02 | OK | née d'un constat réel |
| 2 | Lire BRIEF, ARCHITECTURE, DECISIONS et MAP avant une « tâche importante » | CLAUDE.md:40-43 | PROCESS | INIT a9a633f | SUSPECTE | générique ; « tâche importante » n'est pas défini |
| 3 | Invoquer les 5 skills de circuit plutôt que redériver la procédure | CLAUDE.md:46-50 | PROCESS | AJOUT 7dcb001 2026-09-24 → D65 | OK | |
| 4 | OpenEvidence via la CLI d'Interface-OE | CLAUDE.md:51-52 | PROCESS | AJOUT 04fe1ac 2026-08-28 | OK | |
| 5 | Avant d'écrire un nœud : `GRAMMAIRE-NOEUD.md` R1→R9 | CLAUDE.md:53-56 | PROCESS | AJOUT aa51a6e 2026-07-26 → D19 | OK | |
| 6 | Avant un nouveau module : procédé P0→P7, checklists « opposables » | CLAUDE.md:57-59 | PROCESS | AJOUT aa51a6e | SUSPECTE | D66 le déclare « arbitré en partie » ; CLAUDE.md le rend opposable en bloc |
| 7 | Zéro donnée patient ; module Décision sans disque, sans réseau, sans persistance | CLAUDE.md:63 | DONNEES | INIT a9a633f | BLOCAGE | amendé par D28 (mémoire de session) puis D50 ; côté veille, D4 contourné par D37 (localStorage) puis D51 |
| 8 | Moteur déterministe : règles booléennes, jamais de ML | CLAUDE.md:70 | ARCHI | INIT → D3 | OK | |
| 9 | Contenu = YAML + JSON Schema, séparé de la logique | CLAUDE.md:72-73 | ARCHI | INIT | OK | |
| 10 | Un nœud ou une veille se publie par pull request | CLAUDE.md:73 | GIT | INIT | SUSPECTE | jamais appliquée (1 merge sur 402 commits) ; éditions via Supabase (D64) |
| 11 | Veille → algorithme : validation humaine ; tout changement de nœud = bump de version + changelog | CLAUDE.md:74-75 | PROCESS | INIT → D5 | OK | |
| 12 | Socle et moteur génériques : aucun domaine ni nœud nommé en dur | CLAUDE.md:76-80 | ARCHI | INIT → D8 | BLOCAGE | P10/S10.md:248-269 : correctif abandonné car coder `intention` « viole l'invariant 5 » |
| 13 | Exactitude médicale : sourcé (GRADE, NNT), signaler plutôt qu'inventer | CLAUDE.md:81-83 | CONTENU | INIT | OK | |
| 14 | L'écran ne cite que des sources primaires | PROJECT_BRIEF.md:91 | CONTENU | AJOUT e05a48b → D48 | OK | |
| 15 | Droit d'auteur : résumé + lien, pas de contournement de paywall | CLAUDE.md:84 | CONTENU | INIT | OK | |
| 16 | Pile runtime figée ; aucune dépendance runtime sans décision explicite | CLAUDE.md:86-87 | DEP | INIT | BLOCAGE | décision D51 : « première exception à l'invariant 8 » (supabase-js, html2canvas) ; doublonne aussi le socle |
| 17 | Vérification bi-agents + relecture du référent à J+3 ; tri-agents hors MG | PROJECT_BRIEF.md:97-99 | PROCESS | INIT → D6 | BLOCAGE | D39 remplace la double lecture humaine (un seul référent) ; D60 suspend, D61 amende |
| 18 | DT2 v1 ; ne pas élargir avant un socle stable | PROJECT_BRIEF.md:60,158 | PERIM | INIT | OK | |
| 19 | Pas de collecte automatisée avant que la veille manuelle soit rodée | PROJECT_BRIEF.md:68,159 | PERIM | INIT → D7 | OK | |
| 20 | Disclaimer permanent, badges de preuve, contrastes | ARCHITECTURE.md:170-175 | UI | INIT | OK | |
| 21 | Deux colonnes ≥ 960 px, résultats sticky | ARCHITECTURE.md:244-247 | UI | AJOUT 9d65908 2026-07-29 | BLOCAGE | seuil amendé par D45, D46, D47 (1200 px) ; ARCHITECTURE dit toujours 960 |
| 22 | N0 = typecheck, build, tests ; Preuve N0 0/17 | .claude/n0.json | N0 | AJOUT a9002ed 2026-09-24 | OK | |
| 23 | Critères avant ajout de feature | PROJECT_BRIEF.md:150-154 | PERIM | INIT | SUSPECTE | gabarit à peine reformulé |

### EBM-perso

Objectif : bibliothèque personnelle de dossiers de preuve sur des sujets de santé peu étudiés,
une question traitée en une soirée. 34 commits, créé le 2026-10-08 par copie d'EBM-MSPv2.

Note : 0 dossier réel à ce jour. L'absence de blocage ne prouve rien.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Compatible v2 par ajout ; un pivot doit passer les scripts de v2 | CLAUDE.md:45-47 ; ARCHITECTURE.md:18-20 | ARCHI | INIT 9abe3e7 | SUSPECTE | invérifiable (aucun test ne lance les scripts de v2) ; en tension avec « pas de lien avec v2 » (brief:55) |
| 2 | Jamais de conseil individualisé ; ni saisie ni calcul | CLAUDE.md:48 | PERIM | INIT | OK | |
| 3 | Section Sécurité obligatoire, trois volets non vides | CLAUDE.md:49 | CONTENU | INIT (+ acd214d) → decisions/2026-10-08-format-dossier.md | OK | |
| 4 | Droit d'auteur : citer et résumer ; `entrees/` hors git | CLAUDE.md:50 | CONTENU | INIT | OK | |
| 5 | Pas de chiffre sans source (`verifier-chiffres` hérité de v2) | ARCHITECTURE.md:11 | CONTENU | INIT acd214d | OK | a forcé un contournement dans v2 |
| 6 | Rigueur B : double extraction réservée aux chiffres clés | PROJECT_BRIEF.md:29-34 | CONTENU | INIT → decisions/2026-10-08-rigueur-b-et-grade.md | OK | |
| 7 | Hook `garde-extracteur` copié de v2 | scripts/exploration/garde-extracteur.mjs | PERM | AJOUT 091a050 2026-10-08 | OK | copié avec le correctif |
| 8 | Validé au build, à l'origine « par JSON Schema » | ARCHITECTURE.md:16-18 ; PROJECT_BRIEF.md:62 | TEST | INIT | BLOCAGE | decisions/2026-10-08-validation-dans-le-compilateur.md : v2 n'a pas de JSON Schema, brief amendé |
| 9 | Tags contrôlés + `libres` | PROJECT_BRIEF.md:79 | CONTENU | INIT | OK | |
| 10 | Hors périmètre : fiches de classe, vue patient, veille, édition, comptes, lien avec v2 | PROJECT_BRIEF.md:51-56 | PERIM | INIT | OK | |
| 11 | Web local bureau, pas de PWA, pas de hors-ligne | PROJECT_BRIEF.md:81 | PLATEFORME | INIT | OK | |
| 12 | Ton visuel de v2 ; état dans l'URL | PROJECT_BRIEF.md:82 | UI | INIT | OK | |
| 13 | Dossiers rédigés en français | PROJECT_BRIEF.md:83 | STYLE | INIT | OK | |
| 14 | N0 = tests, pivots, chiffres, typecheck, vitest, build ; Preuve N0 2/2 | .claude/n0.json | N0 | AJOUT 79f8fe5 | OK | mêmes commandes que v2, où elles ont bloqué |
| 15 | Critères avant ajout de feature | PROJECT_BRIEF.md:127-133 | PERIM | INIT | SUSPECTE | gabarit verbatim |

### ETP interactif

Objectif : support web interactif d'éducation thérapeutique pour la consultation, avec un moteur
multi-thèmes et une app patient autonome. 375 commits.

Notes :
- Créé le 2026-06-28 avec l'ancien workflow, migré le 2026-07-07, vendoré le 2026-08-24.
- Pas de n0.json.
- `STATUS.md:78` recommande `npx tsc --noEmit`, que `CLAUDE.md` interdit.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Jamais `npx tsc --noEmit` ; typecheck = `tsc -b --noEmit` | CLAUDE.md:24-26 | TYPE | AJOUT 0c991ae 2026-08-06 | OK | contredite par STATUS.md:78 |
| 2 | Lire BRIEF, DECISIONS, MAP et l'autorité de contenu avant une tâche importante | CLAUDE.md:37-42 | PROCESS | AJOUT aa6b49e 2026-07-01 | OK | |
| 3 | Contenu médical : skill `recherche-preuve-etp`, relecture clinique = gate G1 | CLAUDE.md:40-41 | PROCESS | AJOUT 370e286 2026-08-28 | OK | |
| 4 | Consultation : zéro donnée patient stockée, état en mémoire | CLAUDE.md:46-47 | DONNEES | INIT 331190b (« zéro persistance partout ») | BLOCAGE | decisions/2026-07-15-scopage-de-la-persistance : « surestrictif », app patient inutilisable |
| 5 | App patient : localStorage local, jamais de réseau | CLAUDE.md:48 | DONNEES | AJOUT fc066bd 2026-07-15 | OK | |
| 6 | Local-first : aucune dépendance réseau au runtime | CLAUDE.md:49 | OFFLINE | INIT | OK | jamais vérifié sur tablette (brief:76) |
| 7 | Pile figée sans backend ; aucune dépendance runtime (routeur, QR, animation, DnD) | CLAUDE.md:50 | DEP | INIT, durcie daf647c | BLOCAGE | QR encodé en PNG hors de l'app (decisions/2026-07-13-app-d-aide-patient:19-20) ; QR dynamique écarté (2026-07-21:53-55) |
| 8 | Moteur générique agnostique du thème | CLAUDE.md:51 | ARCHI | INIT, précisée 5598bb0 | OK | coût assumé : composants dupliqués par thème |
| 9 | Exactitude médicale sourcée | CLAUDE.md:52 | CONTENU | INIT | OK | sources citées limitées au tabac |
| 10 | Contenu validé par Thibault avant câblage, sinon marqué « à revalider » | PROJECT_BRIEF.md:49 | CONTENU | AJOUT a8d5b4c 2026-09-24 | SUSPECTE | la pratique est inverse : câblage d'abord (STATUS.md:71) |
| 11 | Sobriété, lisible à ~1 m, interactif | CLAUDE.md:53 | UI | INIT | SUSPECTE | sans seuil : la revue a dû en inventer un (docs/revues/2026-10-06-courbes.md:14) |
| 12 | Bundle patient isolé, n'importe jamais la consultation | PROJECT_BRIEF.md:48 | ARCHI | AJOUT a8d5b4c (principe du 2026-07-13) | BLOCAGE | amendée : exception `outils-interactifs/` (decisions/2026-07-21-chantier-outils-interactifs:84-101) |
| 13 | « Aucune brique de persistance (invariant projet) » | docs/architecture.md:50 | DONNEES | INIT 331190b | SUSPECTE | copie jamais mise à jour, contredit la décision du 2026-07-15 |
| 14 | Hors périmètre : stockage consultation, comptes, suivi longitudinal, parcours adaptatif… | PROJECT_BRIEF.md:22-30,104-107 | PERIM | INIT | OK | |
| 15 | Critères avant ajout de feature | PROJECT_BRIEF.md:95-102 | PROCESS | INIT | SUSPECTE | gabarit, 3 puces sur 4 verbatim |
| 16 | N0 : pas de n0.json ; Preuve N0 0/8 | — | N0 | — | OK | gates décrites à la main |
| 17 | settings.json conforme au gabarit | .claude/settings.json | PERM | MIGR 0bf6ef9 | OK | |

### trieur-plex

Objectif : classer par âge minimal les films et séries jeunesse de Plex (étiquettes et
collections), en une commande. 25 commits, créé le 2026-10-08.

Note : un seul jour de recul.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Simulation avant toute écriture (`--oui`) ; ne toucher qu'aux étiquettes `trieur-age-*` | CLAUDE.md:36-37 | SECU | INIT 61a50c9 | OK | |
| 2 | Un âge imposé ou une retouche manuelle dans Plex n'est jamais écrasé | CLAUDE.md:38 | AUTRE (intégrité) | INIT → decisions/2026-10-08-sources-et-passe-plex.md | OK | |
| 3 | Aucun fichier du NAS renommé, déplacé ni supprimé | CLAUDE.md:39 | PERIM | INIT | OK | |
| 4 | NAS faillible : opérations reprenables, pas de charge SMB lourde | CLAUDE.md:40 | PLATEFORME | INIT | OK | |
| 5 | Jeton Plex et clé MDBList saisis par l'utilisateur, jamais lus par Claude | CLAUDE.md:41 | SECU | INIT | OK | |
| 6 | Règle d'âge : médiane des sources, tranche supérieure, écart ≥ 2 tranches → à vérifier | PROJECT_BRIEF.md:71-72 | CONTENU | INIT → decisions/2026-10-08-regle-age.md | OK | |
| 7 | Chaque âge porte sa source | PROJECT_BRIEF.md:77 | CONTENU | INIT | OK | |
| 8 | Hors périmètre : restriction d'accès, autres bibliothèques, âge par saison… | PROJECT_BRIEF.md:42-50 | PERIM | INIT | OK | |
| 9 | Interface TV compréhensible par un enfant de 5 ans | PROJECT_BRIEF.md:79 | UI | INIT | SUSPECTE | aucun critère mesurable |
| 10 | Page de relecture en français, hors ligne | PROJECT_BRIEF.md:78 | OFFLINE | INIT | OK | |
| 11 | Ni typecheck ni lint (Python, sans dépendance de plus) | CLAUDE.md:21-22 | TYPE | AJOUT a794330 | OK | |
| 12 | N0 = compileall + pytest ; Preuve N0 1/1 | .claude/n0.json | N0 | AJOUT a794330 | OK | |
| 13 | Critères avant ajout de feature | PROJECT_BRIEF.md:124-130 | PROCESS | INIT | SUSPECTE | gabarit verbatim |
| 14 | settings.json conforme au gabarit | .claude/settings.json | PERM | INIT | OK | l'allow `python -m pytest` ne couvre pas `.venv\Scripts\python` (pas de blocage prouvé) |

### cosme-diy

Objectif : app mobile-first de formules cosmétiques DIY (Markdown, mise à l'échelle, liste
d'achats, module huiles essentielles). 65 commits.

Notes :
- Clone de S&C le 2026-06-04, migré le 2026-07-07.
- Ni plans, ni n0.json, ni incidents.
- A hérité de S&C « authentification magic link », démentie par D7.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Jamais `service_role` côté client | CLAUDE.md:28 | SECU | AJOUT 08e7c6c 2026-06-17 | OK | |
| 2 | Toute évolution auth/RLS/Supabase cadrée avant | CLAUDE.md:65-66 | SECU | AJOUT 08e7c6c | OK | |
| 3 | Toujours lire STATUS.md puis les fichiers de référence de la zone | CLAUDE.md:37-46 | PROCESS | AJOUT 08e7c6c | OK | |
| 4 | Collecte HE : skill `recherche-he` ; mur anti-robot = arrêt | CLAUDE.md:47-48 | PROCESS | AJOUT add5e38 2026-08-28 | OK | |
| 5 | `pct` prioritaire sur `qty` ; Markdown brut conservé | CLAUDE.md:76-78 | ARCHI | INIT fe55a09 | OK | |
| 6 | Pas de parser séparé pour les soins sans décision | CLAUDE.md:80-81 | ARCHI | AJOUT 08e7c6c | OK | |
| 7 | Calcul SAP dans `sapCalculator.ts`, jamais dans les composants | CLAUDE.md:83-84 | ARCHI | AJOUT 08e7c6c | OK | |
| 8 | Achats non synchronisés : vérifier Realtime et policies avant le code | CLAUDE.md:86-87 | PROCESS | AJOUT 08e7c6c | OK | |
| 9 | Données HE : source unique, évolutions cadrées dans `he-curation/` | CLAUDE.md:89-96 | ARCHI | AJOUT 9822972 2026-06-20 | OK | |
| 10 | Parcours HE `Par domaine` | CLAUDE.md:99-100 | UI | AJOUT 9822972 | OK | |
| 11 | Ne jamais fusionner tradition, chimie et science ; HE jamais recommandation médicale | CLAUDE.md:101-103 | CONTENU | AJOUT f72d744 | OK | |
| 12 | Avant chaque commit : mise à jour obligatoire de STATUS.md | CLAUDE.md:105-109 | PROCESS | MIGR e097fbe | SUSPECTE | doublon de `/fin-de-tache` ; texte identique dans S&C |
| 13 | Simple et mobile-first ; pas de CMS ni d'éditeur riche | PROJECT_BRIEF.md:92-93 | PERIM | INIT / AJOUT | OK | |
| 14 | Tester les parsers sur les exemples avant de toucher au format | PROJECT_BRIEF.md:99 | TEST | AJOUT 08e7c6c | SUSPECTE | aucune suite branchée (STATUS.md:95) |
| 15 | Hors périmètre : magic link, multi-utilisateur, dosages, IA intégrée | PROJECT_BRIEF.md:101-108 | PERIM | INIT (clone S&C) | OK | « IA intégrée » héritée de S&C, qui l'a amendée |
| 16 | N0 : pas de n0.json, pas de plans | — | N0 | — | OK | |
| 17 | settings.json conforme au gabarit | .claude/settings.json | PERM | MIGR 32b4603 | OK | |

### S&C

Objectif : app mobile-first où des recettes Markdown deviennent des fiches qui alimentent une liste
de courses familiale partagée. 89 commits, créé le 2026-05-18, migré le 2026-07-07.

Note : `ARCHITECTURE.md` racine est un gabarit non rempli ; `docs/ARCHITECTURE.md` est périmé.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Ne pas simplifier les scripts npm : le `&` du chemin casse `cmd.exe` | CLAUDE.md:29-32 | PLATEFORME | AJOUT d5d9b1d 2026-08-27 | OK | née d'un blocage, n'en cause pas |
| 2 | Aucune clé secrète préfixée `VITE_` | CLAUDE.md:35-36 | SECU | AJOUT d5d9b1d → décision Gemini 2026-08-27 | OK | |
| 3 | Avant chaque commit : mise à jour obligatoire de STATUS.md | CLAUDE.md:46-48 | PROCESS | MIGR c057133 | SUSPECTE | doublon de `/fin-de-tache` ; identique à cosme-diy |
| 4 | Pas de section Ingrédients séparée : balises dans « Structure du plat » | CLAUDE.md:49-51 | CONTENU | INIT → decisions/2026-05-17 | OK | |
| 5 | Avant de modifier le parser : lire le format et tester avec l'exemple | CLAUDE.md:52-53 | TEST | INIT | OK | |
| 6 | `manualTags` et `tags` jamais fusionnés | CLAUDE.md:54-55 | ARCHI | AJOUT 383732d → decisions/2026-05-18 | OK | |
| 7 | Supabase seulement via `*Repository.ts` | CLAUDE.md:56 | ARCHI | AJOUT fdd05c6 / MIGR | SUSPECTE | enfreinte dans App.tsx, AuthContext.tsx et api/generate-recipe.ts ; rien ne la contrôle |
| 8 | `api/` seule zone serveur ; prompt synchronisé (test) | CLAUDE.md:57-59 | ARCHI | AJOUT d5d9b1d | OK | |
| 9 | Tout module pur sous `src/features/` a son `*.test.ts` | CLAUDE.md:60 | TEST | AJOUT d5d9b1d | OK | |
| 10 | Pas de migration Supabase sans préparation (SQL manuel) | CLAUDE.md:61-62 | PROCESS | AJOUT 31fa17f / MIGR | OK | |
| 11 | Hors périmètre : WYSIWYG, nutrition, OCR, plugins, partage ciblé | PROJECT_BRIEF.md:62-70,189-195 | PERIM | INIT | OK | |
| 12 | Pas d'IA au-delà de la génération depuis l'écran d'ajout (ex-« IA intégrée ») | PROJECT_BRIEF.md:71 | PERIM | INIT, amendée 3a00fca | BLOCAGE | levée pour Gemini (decisions/2026-08-27:7-10) ; brief amendé un mois après |
| 13 | Pas de dépendance lourde sans justification | PROJECT_BRIEF.md:97 | DEP | INIT | OK | règle souple, appliquée sans friction |
| 14 | Parser robuste mais limité ; erreurs compréhensibles | PROJECT_BRIEF.md:94-95 | ARCHI | INIT | OK | |
| 15 | Critères avant ajout de feature (5 questions dont « workflow IA simple ») | PROJECT_BRIEF.md:197-207 | PROCESS | INIT 2584ebf / MIGR | SUSPECTE | gabarit d'avant le plugin, jamais adapté |
| 16 | Aucune couleur hors `:root`, ni icônes, ni framework CSS, ni `@media` | DESIGN_SPEC.md:22,64,81-86 | UI | AJOUT e89b62f 2026-08-27 | OK | |
| 17 | Stockage local via un service dédié | docs/ARCHITECTURE.md:66-72 | ARCHI | INIT | SUSPECTE | périmé (Supabase), reconnu « non maintenu » |
| 18 | N0 : pas de n0.json ; Preuve N0 0/1 | plans/P1/index.md | N0 | — | OK | |
| 19 | settings.json conforme au gabarit | .claude/settings.json | PERM | MIGR | OK | |

### annuaire-msp

Objectif : répertoire partagé de correspondants pour la MSP (commentaires typés, impression d'une
liste pour un patient) ; priorité : l'adoption. 98 commits · création dffdcdb 2026-07-16.

Notes :
- Pas de n0.json ; Preuve N0 0/4.
- `PROJECT_BRIEF.md:69` renvoie à un `CONVENTIONS.md` absent.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Une coordonnée pro n'apparaît jamais sur la feuille patient | CLAUDE.md:32-34 | DONNEES | INIT dffdcdb | OK | |
| 2 | Adoption d'abord : très peu de champs requis | CLAUDE.md:35 | UI | INIT | OK | |
| 3 | Toute lecture et écriture par un membre authentifié (RLS) | CLAUDE.md:36 | SECU | INIT | OK | |
| 4 | Aucune donnée de santé de patient stockée | CLAUDE.md:37-38 | DONNEES | INIT | OK | |
| 5 | Une seule entité « contact » | CLAUDE.md:39 | ARCHI | INIT | OK | |
| 6 | Enrichissement web sur match fiable seulement ; hiérarchie des sources de T-005 | PROJECT_BRIEF.md:84-86 | CONTENU | AJOUT 3000d5f 2026-07-16 | BLOCAGE | T-005 point 5 amendé dès le lendemain (decisions/2026-07-17-la-source-datee) |
| 7 | Pas d'intégration Doctolib | PROJECT_BRIEF.md:52,155-157 | PERIM | INIT | BLOCAGE | réécrite en « intégration serveur » (139bd89) pour le bookmarklet P4 ; scraping serveur bloqué (403/CORS/CGU) |
| 8 | Pas d'import automatisé via l'UI ; pas de mémos orphelins | PROJECT_BRIEF.md:46-51 | PERIM | INIT | OK | |
| 9 | Hors-ligne et PWA hors v1 | PROJECT_BRIEF.md:48 | OFFLINE | INIT | OK | |
| 10 | Ne pas sur-structurer les infos pratiques | PROJECT_BRIEF.md:153 | PERIM | INIT | OK | |
| 11 | Pas de rôles ni de permissions complexes | PROJECT_BRIEF.md:154 | PERIM | INIT | SUSPECTE | contredite : rôle référent (2026-07-19), listes éditables par le seul créateur (2026-08-07) |
| 12 | Desktop-first, mobile pleinement utilisable | PROJECT_BRIEF.md:72,78 | PLATEFORME | INIT | OK | |
| 13 | Critères avant ajout de feature | PROJECT_BRIEF.md:145-149 | PERIM | INIT | SUSPECTE | gabarit reformulé |

### extension-firefox

Objectif : monorepo d'extensions Firefox personnelles ; la première ouvre un onglet par DOI collé.
29 commits, créé le 2026-10-06.

Note : `CLAUDE.md § Règles spécifiques` est vide.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Aucun appel réseau propre (ni télémétrie, ni tiers) | PROJECT_BRIEF.md:65 | DONNEES | INIT 85b9aee | OK | |
| 2 | Permissions minimales : `storage` seul (test) | PROJECT_BRIEF.md:66 | SECU | INIT | OK | |
| 3 | Accessible au clavier, libellés pour lecteur d'écran | PROJECT_BRIEF.md:67 | UI | INIT | OK | |
| 4 | Visuel sobre, suit le thème de Firefox | PROJECT_BRIEF.md:69 | UI | INIT | OK | |
| 5 | `core/` n'appelle jamais `browser.*` (test garde-fou) | PROJECT_BRIEF.md:70 | ARCHI | INIT | OK | |
| 6 | Clés AMO dans `.env` | PROJECT_BRIEF.md:72 | SECU | INIT | OK | |
| 7 | Aucune URL de site pirate dans le dépôt ; gabarits dans `storage.local` | PROJECT_BRIEF.md:46 | CONTENU | INIT, précisée b1f87f9 | OK | |
| 8 | Sans build, JS natif ; pas de framework avant une UI riche | PROJECT_BRIEF.md:52,137 | DEP | INIT | OK | |
| 9 | Firefox desktop Windows uniquement | PROJECT_BRIEF.md:16,45,140 | PLATEFORME | INIT | OK | |
| 10 | Une extension à la fois | PROJECT_BRIEF.md:83,138 | PERIM | INIT | OK | |
| 11 | Hors périmètre v1 : téléchargement, Zotero, historique, synchro | PROJECT_BRIEF.md:39-44 | PERIM | INIT | OK | |
| 12 | Critères avant ajout de feature | PROJECT_BRIEF.md:127-133 | PERIM | INIT | SUSPECTE | gabarit verbatim |
| 13 | Tout ce que l'extension charge reste dans son dossier ; code commun copié | ARCHITECTURE.md:32 | ARCHI | INIT b1f87f9 | OK | |
| 14 | Tests hors du dossier de l'extension | ARCHITECTURE.md:38 | ARCHI | INIT b1f87f9 | OK | |
| 15 | Un script npm par extension ; dispatcher à la 3e | ARCHITECTURE.md:41 | ARCHI | INIT b1f87f9 | OK | |
| 16 | `storage.js` seul accès au stockage ; seule la page d'options écrit | ARCHITECTURE.md:24,77 | ARCHI | INIT b1f87f9 | OK | |
| 17 | Background minimal ; listener déclaré au premier niveau | ARCHITECTURE.md:109-118 | ARCHI | INIT b1f87f9 | OK | |
| 18 | Gabarit `https://` + `{doi}` seulement | ARCHITECTURE.md:114,134 | SECU | AJOUT 04e2961 → decisions/2026-10-06-gabarit-https-seulement.md | OK | arbitré au plan, avant le code |
| 19 | Tests sur DOI réels piégeux (SICI), vérifiés sur doi.org | ARCHITECTURE.md:150 | TEST | INIT b1f87f9 | OK | |
| 20 | La signature AMO est un geste humain | CLAUDE.md:28 | PROCESS | AJOUT 2cc4f10 | OK | |
| 21 | N0 = typecheck, test, lint:doi ; Preuve N0 1/1 | .claude/n0.json | N0 | AJOUT 2cc4f10 | OK | |

### claude-mods

Objectif : mods Claude Code distribués par marketplace. Clos le 2026-10-06, absorbé par
`Templates/plugin/mods`. 2 commits.

Note : `CLAUDE.md`, STATUS et TASKS sont restés au gabarit ; pas de n0.json.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Activation uniquement en settings utilisateur via la marketplace | PROJECT_BRIEF.md:47,60-63 | PERM | INIT 68f5249 | BLOCAGE | decisions/2026-10-06-absorbe-par-le-workflow.md : un mod exige un plugin installé (mesure K) ; projet clos |
| 2 | En dev, mod coupé côté utilisateur et chargé via `CLAUDE_CODE_PLUGIN_DIRS` | PROJECT_BRIEF.md:64-66 | PROCESS | INIT | SUSPECTE | caduque, jamais retirée |
| 3 | Ne fait que lire le workflow vendoré, sans en modifier la mécanique | PROJECT_BRIEF.md:44-45 | PERIM | INIT | BLOCAGE | même décision : les mods sont construits dans le workflow |
| 4 | Chaque publication incrémente la version | PROJECT_BRIEF.md:67 | PROCESS | INIT | OK | |
| 5 | Ni backend, ni base, ni dépendance npm | PROJECT_BRIEF.md:56 | DEP | INIT | OK | |
| 6 | Dépôt hors de SynologyDrive | PROJECT_BRIEF.md:69 | PLATEFORME | INIT | OK | |
| 7 | `claude plugin test` par mod, `validate` avant publication, rendu vérifié à l'œil | PROJECT_BRIEF.md:82-89 | TEST | INIT | OK | |
| 8 | N0 : aucun | — | N0 | — | OK | clos avant le code |

### Veilleur

Objectif : mettre le PC en veille entre les sessions, le réveiller depuis le NAS, estimer sa
consommation. 1 commit (2026-10-06).

Notes :
- Commandes en placeholders.
- La sonde Wake-on-WLAN a échoué une fois (non commitée).

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Logique pure testée avec Vitest, sans réseau | CLAUDE.md:45-46 | TEST | INIT 8755d17 | OK | |
| 2 | Réveil, veille et QuickConnect testés à la main (VALIDATION.md) | CLAUDE.md:47-48 | TEST | INIT | OK | |
| 3 | La consommation est une estimation, jamais affichée comme une mesure | CLAUDE.md:49-50 | UI | INIT | OK | |
| 4 | Jamais d'endpoint sans authentification | CLAUDE.md:51 | SECU | INIT | OK | |
| 5 | Pas de prise connectée ni d'achat de matériel | PROJECT_BRIEF.md:56,122 | AUTRE (matériel) | INIT | OK | |
| 6 | Une seule interface (PWA) | PROJECT_BRIEF.md:61,120 | PERIM | INIT | OK | |
| 7 | kWh uniquement, pas d'euros | PROJECT_BRIEF.md:62,40 | PERIM | INIT | OK | |
| 8 | Tout hébergé à domicile | PROJECT_BRIEF.md:17,121 | DONNEES | INIT | OK | |
| 9 | Hors périmètre v1 : multi-machines, veille automatique, historique avancé… | PROJECT_BRIEF.md:34-40 | PERIM | INIT | OK | |
| 10 | Tester le Wake-on-WLAN avant tout code | PROJECT_BRIEF.md:67,98 | PROCESS | INIT | OK | |
| 11 | Critères avant ajout de feature | PROJECT_BRIEF.md:110-116 | PERIM | INIT | SUSPECTE | gabarit verbatim |
| 12 | N0 : pas de n0.json (prévu par T-005) | TASKS.md:34 | N0 | INIT | OK | |

### Interface-OE

Objectif : application Windows Electron d'accès à OpenEvidence derrière un routage hors UE, avec
une interface graphique et un CLI/MCP de collecte. 277 commits · instanciation 164fc24 2026-08-25.

Notes :
- `npm run lint` est rouge et exclu de N0.
- `CLAUDE.md:81-91` renvoie à une décision archivée.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Jamais l'API interne d'OE, seulement l'interface visible | CLAUDE.md:79 | AUTRE (accès OE) | INIT → decisions/2026-08-25-jamais-api-interne-rythme-humain.md | OK | |
| 2 | Un défi anti-robot arrête la session : ni résolu ni contourné | CLAUDE.md:83 | PROCESS | AJOUT 86bb19e 2026-08-26 | BLOCAGE | P5/S1.echec.md (supprimé en 498c79a) : arrêt sur DataDome ; DECISIONS.md:62 : P12 (DOI) abandonné |
| 3 | Pas d'usurpation d'identité ; mimétisme comportemental assumé | CLAUDE.md:85-91 | AUTRE (accès OE) | AJOUT 86bb19e → 2026-08-26-mimetisme-comportemental.md | BLOCAGE | règle 1 révisée, puis mimétisme archivé (DECISIONS.md:73) ; CLAUDE.md l'affirme encore |
| 4 | Une requête à la fois ; délai de 20 à 60 s retiré | CLAUDE.md:92 ; ARCHITECTURE.md:95 | AUTRE (cadence) | INIT, amendée 4417743 puis f36834a → 2026-09-17-une-a-la-fois-sans-delai-impose.md | BLOCAGE | délai réfuté (~20 min par lot) ; ARCHITECTURE.md:97 le prescrit encore |
| 5 | Diagnostics groupés ; fermer la page avant le tunnel ; jamais de kill forcé | CLAUDE.md:95-96 | PROCESS | AJOUT 4417743 | OK | |
| 6 | Aucune donnée personnelle de patient | CLAUDE.md:99 | DONNEES | INIT | OK | |
| 7 | Aucun secret en clair (DPAPI), jamais lu ni committé | CLAUDE.md:101,66 | SECU | INIT | OK | |
| 8 | Toute logique dans le noyau, exposée aux trois surfaces | CLAUDE.md:103 | ARCHI | INIT → 2026-08-25-noyau-unique-trois-surfaces.md | OK | |
| 9 | Archive en fichiers, pas de base | CLAUDE.md:105 | ARCHI | INIT → 2026-08-25-archive-en-fichiers.md | OK | |
| 10 | Pages de référence anonymisées | CLAUDE.md:107 | DONNEES | INIT | OK | |
| 11 | Pas de launch.json : N1 impossible, jugement en N2 | CLAUDE.md:68 | PROCESS | INIT 8b43861 → 2026-08-25-validation-visuelle-electron.md | BLOCAGE | amendée le 2026-08-27 : le pilotage du bureau atteint la fenêtre |
| 12 | Prettier ne touche ni au markdown ni à `.claude/` | CLAUDE.md:70 | TYPE | INIT 8b43861 | OK | |
| 13 | Échec fermé : pas de tunnel, pas de requête | ARCHITECTURE.md:72 | SECU | INIT d93e95d | OK | |
| 14 | Tube nommé Windows, aucun port HTTP | ARCHITECTURE.md:85 | SECU | INIT d93e95d | OK | |
| 15 | Hors périmètre : headless, réouverture du mimétisme, récupération par DOI | PROJECT_BRIEF.md:58-62 | PERIM | AJOUT 25c16e3 2026-09-15 | OK | |
| 16 | Hors périmètre : synchro, multi-utilisateur, macOS/Linux, LLM local | PROJECT_BRIEF.md:51-56 | PERIM | INIT | OK | |
| 17 | Tests sur la logique pure seulement ; réseau et tunnel en manuel | PROJECT_BRIEF.md:98-101 | TEST | INIT | OK | |
| 18 | Application résidente (barre des tâches) | PROJECT_BRIEF.md:94 | ARCHI | INIT | OK | |
| 19 | Critères avant ajout de feature | PROJECT_BRIEF.md:160-166 | PERIM | INIT | SUSPECTE | gabarit verbatim |
| 20 | N0 = build, typecheck, test (lint exclu) ; Preuve N0 0/12 | .claude/n0.json | N0 | AJOUT 7f7c36e 2026-10-03 | BLOCAGE | P12/S1.md:325 : n0.json « était absent », posé en cours de session ; lint exclu car rouge |

### trames-consultation

Objectif : trames de consultation IPA (première consultation et suivi) intégrées comme modèles
Doctolib, en équilibre entre exhaustivité et remplissage réel. 169 commits · instanciation
e3e58a6 2026-09-29.

Notes :
- Projet documentaire.
- Plusieurs textes du brief sont périmés après amendement (l. 63, 68, 79, 128).
- En `RETARD` sur son amont (26 commits, synthèse d'incidents du jour).

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Aucune donnée patient dans le dépôt | CLAUDE.md:21 | DONNEES | INIT e3e58a6 | OK | |
| 2 | Doctolib : l'utilisateur se connecte ; patient test uniquement | CLAUDE.md:23 | SECU | INIT | OK | |
| 3 | Création ou modification de modèle Doctolib : accord action par action | CLAUDE.md:25 | PROCESS | INIT | OK | |
| 4 | Trame écrite après une exploration sourcée et validée cliniquement | CLAUDE.md:27 | PROCESS | INIT (+ 2065f35) | OK | |
| 5 | Méthode d'exploration : sources FR > EU > US, « règle de deux », complétude | decisions/2026-09-29-methode-exploration.md:18-22 | CONTENU | AJOUT 2065f35 2026-09-29 | BLOCAGE | decisions/2026-09-29-bloc-risque-cardiovasculaire.md:21 « Dérogation à la règle de deux » ; P5/S1.md:49 : sinon la procédure « le lui interdit » |
| 6 | Grille de recueil pure : aucun seuil, aucune cible, aucune conduite à tenir | CLAUDE.md:29 | CONTENU | INIT | OK | |
| 7 | Français ; abréviations d'une liste fermée seulement | CLAUDE.md:30 | STYLE | INIT, amendée ace3ccb et 385f2bd | BLOCAGE | P4/S7.md:162 : « CV n'est pas dans la liste… dérogation notée » |
| 8 | Budget : suivi ≤ 30 lignes, première ≤ 50, moins de 5 min | CLAUDE.md:32 ; ARCHITECTURE.md:118 | UI | INIT (« un écran »), amendée 8ab5336 | BLOCAGE | decisions/2026-09-29-budgets-ecran-assouplis.md : plafond dépassé dès la validation clinique ; nouveaux plafonds « non mesurés » ; brief contradictoire (l. 68, 128) |
| 9 | Principes de rédaction (rubriques, items périodiques, zones) | docs/principes-redaction.md:10 | CONTENU | AJOUT 5157b9f 2026-09-29 | BLOCAGE | amendés 3 fois (trames allégées, plafond levé, §3 biologie) |
| 10 | Aucun code, aucun outil, aucun test automatisé | PROJECT_BRIEF.md:46,61-63,79 | PERIM | INIT | BLOCAGE | incident n0-projet-sans-commande + P1/S1.echec.md ; amendée par decisions/2026-10-01-page-visualisation-trames.md |
| 11 | N0 = `node --test` + `visualiser --controle` ; Preuve N0 requise 3/8, « non requise » par dérogation pour P1-P5 | .claude/n0.json | N0 | AJOUT b6fcad9 2026-10-01 | BLOCAGE | incident 2026-09-29-n0-projet-sans-commande : Preuve N0 requise sans commande, tâche invalidable |
| 12 | Critères avant ajout d'un item (source datée, 5 min, un écran) | PROJECT_BRIEF.md:125-129 | PERIM | INIT | SUSPECTE | seul gabarit adapté, mais « un écran » est contredit par la décision du 2026-09-29 |
| 13 | Hors périmètre : scores, documents patient, polypathologie | PROJECT_BRIEF.md:49-53 | PERIM | INIT | OK | |
| 14 | À éviter : automatiser le report dans Doctolib ; seuils « pour aider » | PROJECT_BRIEF.md:133-135 | PERIM | INIT | OK | |
| 15 | Format : renvoi caché `<!-- ID -->`, IDs jamais réutilisés | ARCHITECTURE.md:39-61 | ARCHI | AJOUT 6c1ff64 → 2026-09-29-format-trames-tracabilite.md | OK | |
| 16 | Rationnel EBM par item, signalé sans bloquer | ARCHITECTURE.md:104 | CONTENU | AJOUT 51e0af1 → 2026-10-01-rationnel-ebm-des-items.md | OK | |
| 17 | Valeurs biologiques en zone Biologie | PROJECT_BRIEF.md:71 | CONTENU | INIT + AJOUT 385f2bd | OK | |

### DrumsTraining

Objectif : parcours HTML progressif pour un batteur débutant au pad, 10 à 15 min par jour, sur
ordinateur et iPhone hors connexion. 94 commits · instanciation 8c3dac8 2026-09-24.

Notes :
- `AGENTS.md` est une copie intégrale de `CLAUDE.md` « pour Codex », non versionnée.
- Garde propre : `tools/verifier-liens.mjs`.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Aucune ressource réseau ; VexFlow et polices dans `assets/` | CLAUDE.md:37-38 | OFFLINE | INIT → decisions/2026-09-24-pwa-hors-connexion.md | OK | tenue : 0 requête hors origine |
| 2 | Ni package.json, ni build, ni framework | CLAUDE.md:39 | DEP | INIT → 2026-09-24-statique-avec-js.md | OK | |
| 3 | Pas de vidéo intégrée | CLAUDE.md:40 | PERIM | INIT | OK | |
| 4 | Incrémenter la version du cache du service worker à chaque modification | CLAUDE.md:41-42 | OFFLINE | INIT | OK | |
| 5 | Forme de `../Tuto-code/CONVENTIONS.md`, sauf l'interdit JavaScript | CLAUDE.md:32-33 | STYLE | INIT | SUSPECTE | dépôt voisin, absent en session cloud ; interdit JS levé le jour même |
| 6 | Tout point technique recoupé sur une source fiable | CLAUDE.md:46-49 | CONTENU | INIT | OK | |
| 7 | Chaque exercice écrit en texte et testé | CLAUDE.md:50-51 | TEST | INIT | OK | garde partiel (revue P2/S7) |
| 8 | La page rappelle qu'en cas de désaccord, le prof a raison | CLAUDE.md:52 | CONTENU | INIT | OK | |
| 9 | URLs seulement depuis `ressources-verifiees.md` | CLAUDE.md:53-54 | CONTENU | INIT | OK | a attrapé un 404 |
| 10 | Audio iOS : parade de `../Chords/static/audio_ctx.js` ; métronome en lookahead | CLAUDE.md:58-61 | PLATEFORME | INIT | OK | renvoie à un dépôt voisin |
| 11 | Ouvrable en `file://` : IIFE + CommonJS, pas de modules ES | ARCHITECTURE.md:8-14 | ARCHI | INIT 070d9ce | SUSPECTE | jamais vérifiée (ARCHITECTURE.md:168-171), dicte tout le format JS |
| 12 | Logique pure séparée du DOM et testée | ARCHITECTURE.md:15-17 | ARCHI | INIT | OK | |
| 13 | VexFlow vendoré non modifié ; hors-connexion vérifié en N1 | ARCHITECTURE.md:173-175 | OFFLINE | AJOUT 7e025aa | OK | |
| 14 | Lisible à 1 m, cibles ≥ 44 px, une étape = une séance | PROJECT_BRIEF.md:60-64 | UI | INIT | OK | |
| 15 | Téléphone d'abord ; pas de défilement horizontal | DESIGN_SPEC.md:98-101 | UI | AJOUT 49fafac | OK | |
| 16 | Hors périmètre : synchro, compte, micro, batterie électronique | PROJECT_BRIEF.md:37-43 | PERIM | INIT | OK | |
| 17 | Critères avant ajout de feature | PROJECT_BRIEF.md:104-110 | PERIM | INIT | SUSPECTE | gabarit verbatim |
| 18 | N0 = `node --test` ; Preuve N0 0/2 | .claude/n0.json | N0 | AJOUT 178752d | OK | |
| 19 | AGENTS.md duplique CLAUDE.md pour Codex | AGENTS.md | AUTRE (doublon) | non versionné | SUSPECTE | deux sources pour les mêmes règles |

### Chords

Objectif : « annoter une fois, puis jouer » — coller un lien Songsterr, annoter, puis travailler
le morceau dans l'app ; le PDF est secondaire. 654 commits.

Notes :
- Créé le 2026-05-22, migré le 2026-07-07, plugin le 2026-08-22.
- `ARCHITECTURE.md:189` renvoie à un `CONVENTIONS.md` absent.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Préserver la compatibilité des JSON de `data/` | CLAUDE.md:50-51 | ARCHI | INIT fd64890 | OK | |
| 2 | Tous les chemins via `scripts/config.py` | CLAUDE.md:52-53 | ARCHI | MIGR d9e0df4 | OK | |
| 3 | Lire `SPEC-training-exercices.md` avant de toucher aux moteurs Training | CLAUDE.md:54-56 | PROCESS | MIGR | OK | |
| 4 | Ne pas modifier `generate_docx.py`/`memo.py` en profondeur sans instruction | CLAUDE.md:57-58 | ARCHI | INIT | SUSPECTE | ancien garde-fou Codex ; le PDF est devenu secondaire |
| 5 | `vercel.json` intouchable | CLAUDE.md:59-60 | PLATEFORME | MIGR | OK | motivée par deux 404 en production |
| 6 | Ne pas modifier `Maquette-refonte-ui/` | CLAUDE.md:61-62 | ARCHI | MIGR | OK | |
| 7 | Suite Playwright prioritaire, « Codex l'utilise » | CLAUDE.md:63-65 | TEST | MIGR | SUSPECTE | vise Codex et un AGENTS.md central disparu |
| 8 | Jamais de recherche ni de scraping web autonome | CLAUDE.md:66-67 | DONNEES | MIGR | BLOCAGE | exceptions inscrites (brief:48-53, P33/P34/P54 ; ROADMAP:277-279) ; décision p51:110 ; principe « amendé explicitement ou non » (p50:58) |
| 9 | Pas d'analyse audio ni d'extraction PDF/MIDI/audio | PROJECT_BRIEF.md:55,162 | PERIM | INIT | BLOCAGE | exception P36 (brief:52-53) ; option audio écartée en partie pour ce principe (p51 D5) |
| 10 | Stabilisation : plus de nouvelle fonction | PROJECT_BRIEF.md:16-18 | PERIM | AJOUT da3f11f → revues/2026-09-10 | BLOCAGE | decisions/2026-09-23-corrections-d-usage:7 « à une exception près » ; fonction « Envoyer en prod » ajoutée le même jour |
| 11 | Le fichier annoté est la seule vérité éditable | PROJECT_BRIEF.md:22-29 | ARCHI | AJOUT 89d487c → 2026-09-07 | OK | |
| 12 | Jouer et Training à 375 et 768 px non négociables | PROJECT_BRIEF.md:65-66 | UI | AJOUT da3f11f | OK | violation constatée, pas un blocage |
| 13 | Pas d'authentification ; pas de base en local | PROJECT_BRIEF.md:158-159 | SECU | INIT | BLOCAGE | decisions/2026-09-23-pousser-un-morceau-local:14-20 : aucune route ne peut recevoir de morceau ; push contraint avec `SUPABASE_SERVICE_ROLE_KEY` en local |
| 14 | Pas de dépendance lourde, pas de framework frontend | PROJECT_BRIEF.md:164-165 | DEP | INIT | OK | |
| 15 | Progression Training côté client uniquement | ARCHITECTURE.md:120,169 | DONNEES | AJOUT 3eeb8b0 | OK | |
| 16 | « Feature-first : CONVENTIONS.md » | ARCHITECTURE.md:187-189 | ARCHI | MIGR | SUSPECTE | gabarit verbatim, contredit `app.py` monolithique ; CONVENTIONS.md absent |
| 17 | « La maquette devient la référence » | ARCHITECTURE.md:213-215 | UI | MIGR | SUSPECTE | gabarit verbatim, aucune maquette n'existe |
| 18 | N0 = pytest seul ; Preuve N0 0/15 | .claude/n0.json | N0 | AJOUT c475502 | OK | |
| 19 | `allow` « à étendre au fil de l'eau », sans pytest | .claude/settings.json | PERM | MIGR c59eba3 | BLOCAGE | incident 2026-09-09-headless-permissions-allow-sans-pytest : N0 impossible en headless, correction refusée deux fois par le classifier ; toujours pas corrigé |

### MYO

Objectif : app web où un enfant construit des modèles type LEGO pas à pas (3D et audio) ; le parent
importe les modèles en local. 863 commits.

Notes :
- Créé le 2026-05-15, migré le 2026-07-29, plugin le 2026-08-22.
- Seule garde propre : `tests/garde-bundle-notice.test.mjs`.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | `npm run lint` dans la N0 : 0 erreur | CLAUDE.md:22 | N0 | AJOUT 14a2c967 2026-09-02 | OK | |
| 2 | N0 = build, lint, test, test:py ; Preuve N0 0/38 | .claude/n0.json | N0 | AJOUT daeaed4a | OK | |
| 3 | Validation manuelle (parcours, observation de l'enfant) obligatoire | CLAUDE.md:25-27 | TEST | AJOUT 955f8b4d | OK | |
| 4 | Lire le guide Next.js de `node_modules` avant de coder | CLAUDE.md:45-49 | PROCESS | MIGR (texte create-next-app) | SUSPECTE | invérifiable |
| 5 | Stack figée (Next 16, React 19, Tailwind 4, Three.js) | CLAUDE.md:53 | DEP | INIT c84fba2a | OK | |
| 6 | Pas de dépendance lourde sans justification ; pipeline hors bundle (test garde) | CLAUDE.md:54 | DEP | INIT + AJOUT daeaed4a | OK | |
| 7 | Jamais `models.json` à la main quand une route admin existe | CLAUDE.md:55 | ARCHI | INIT | OK | |
| 8 | Public enfant : tactile, gros boutons, tablette d'abord | CLAUDE.md:56 | UI | INIT | OK | |
| 9 | IA : Gemini gratuit en priorité | CLAUDE.md:57 | AUTRE (coût IA) | INIT | SUSPECTE | dépassée par la décision du 2026-09-22 (plus d'IA distante) ; CLAUDE.md non réaligné |
| 10 | Préserver `.gitignore` (exclusion des `.stl`) | CLAUDE.md:58 | SECU | INIT | SUSPECTE | contredit le brief (« STL versionnés ») ; 7 `.stl` suivis |
| 11 | Escalader vers ChatGPT ; « pas de Codex » | CLAUDE.md:43,60-64 | PROCESS | MIGR | SUSPECTE | doublon de `/cadrer` ; `.codex/` et une branche codex/ existent |
| 12 | Générateur STL : assemblabilité par pavage seul, sans créer ni retirer de matière | PROJECT_BRIEF.md:7-11,45-47 | ARCHI | AJOUT 34c5f2eb → decisions/2026-09-13 | BLOCAGE | incident 2026-09-14-cinq-plans-sur-un-probleme-de-recherche : « l'espace des solutions a été vidé par accumulation » (5 plans, 5 `.echec.md`) ; règle maintenue, solution trouvée ensuite |
| 13 | Hors périmètre : comptes, BDD distante, import depuis l'app déployée | PROJECT_BRIEF.md:39-41 | PERIM | INIT + AJOUT 1918ee69 | OK | |
| 14 | Pas de génération ni d'identification entièrement automatiques | PROJECT_BRIEF.md:42-44 | PERIM | INIT + AJOUT 1918ee69 | OK | |
| 15 | Aucune IA payante dans la pipeline notice | PROJECT_BRIEF.md:71 | DONNEES | AJOUT 1918ee69 | OK | |
| 16 | Photos de l'enfant en IndexedDB, jamais envoyées | PROJECT_BRIEF.md:25 | DONNEES | MIGR → decisions/2026-05-19 | OK | |
| 17 | Pas d'app native, pas de gamification poussée | PROJECT_BRIEF.md:48-49 | PERIM | INIT | OK | |
| 18 | Simplicité, pas de refactor global du pipeline | ai-workflow.md:40-41 | PERIM | INIT | OK | |
| 19 | Skill `/notice-vers-ldr` : OMR d'abord, inventaire fermé | .claude/skills/notice-vers-ldr/SKILL.md | PROCESS | AJOUT 37a5395c | SUSPECTE | frontmatter décrit une chaîne dépréciée |
| 20 | `allow` minimale, « jamais élargie par précaution » | .claude/settings.json | PERM | MIGR f0471c8e | BLOCAGE | f2441226 : « deux refus de permission ont bloqué P3/S4 » ; puis d771989c ; manque toujours `git push` et `n0.mjs` |

### DoxUploader

Objectif : outil local semi-assisté qui complète les dossiers patients (Doctolib vers PSA/Asalée)
et collecte les factures. 60 commits.

Notes :
- Migré le 2026-09-11 ; pas d'histoire antérieure.
- Pas de n0.json ; Preuve N0 0/3.
- Registre `DECISIONS.md` incohérent.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Confidentialité stricte limitée au flux médical | CLAUDE.md:42-50 | DONNEES | MIGR fecdf30 | OK | |
| 2 | Ne pas logger de contenu médical complet | CLAUDE.md:54 | DONNEES | MIGR | OK | |
| 3 | Aucune donnée patient réelle dans le dépôt ; pas de `.p12` ni de mapping | CLAUDE.md:55,98-99 | DONNEES | MIGR | OK | |
| 4 | Validation explicite du récapitulatif avant toute écriture | CLAUDE.md:56,92 | PROCESS | MIGR → decisions/2026-08-27-gate-recapitulatif | OK | |
| 5 | Navigateur visible, pas de headless, pas de contournement anti-bot | CLAUDE.md:57,65-66 | SECU | MIGR → 2026-05-26 | OK | |
| 6 | MFA gérée manuellement | decisions/2026-05-26-navigateur-visible-mfa-manuelle.md:5 | PERIM | MIGR | BLOCAGE | amendée par 2026-08-27-mfa-imap-ovh (« encore souvent des erreurs ») |
| 7 | Pas de framework, base, serveur, Docker en MVP | CLAUDE.md:66 | DEP | MIGR | BLOCAGE | dérogation Electron (2026-08-05-gui-electron-derogation:20-25) |
| 8 | Aucune logique métier dans la GUI | CLAUDE.md:68-73 | ARCHI | MIGR | OK | |
| 9 | Phases dans l'ordre : dry-run, écriture contrôlée, automatisation | CLAUDE.md:79-80 | PROCESS | MIGR | OK | |
| 10 | `DRY_RUN` non défini = aucune écriture | PROJECT_BRIEF.md:23 ; CLAUDE.md:92-93 | PROCESS | AJOUT b151704 / MIGR | BLOCAGE | décision 2026-07-10 §3 : passage en production par défaut (runs planifiés sans effet) ; audit M-M7 ; divergence relevée en P3/S7.md:48-49 |
| 11 | `NODE_OPTIONS=--openssl-legacy-provider` requis | CLAUDE.md:30,61 | PLATEFORME | MIGR → 2026-06-16 | OK | |
| 12 | Un site = un fichier | CLAUDE.md:40 | ARCHI | MIGR | BLOCAGE | exception « logins mutualisés » (décision 2026-07-10 §1) |
| 13 | Interdits Playwright (`isVisible({timeout})`…) | decisions/2026-07-10:9 | AUTRE (Playwright) | MIGR | OK | |
| 14 | Un marqueur n'avance jamais au-delà de ce qui est écrit | ARCHITECTURE.md:37 | ARCHI | MIGR | OK | |
| 15 | Date de naissance concordante obligatoire ; sexe signalé sans bloquer | PROJECT_BRIEF.md:31-36 | DONNEES | AJOUT b151704 → 2026-09-21 | BLOCAGE | sexe-non-bloquant-import:5-9 : le garde-fou a bloqué plusieurs dossiers au premier run réel |
| 16 | Hors périmètre : base, serveur, cloud, OCR… | PROJECT_BRIEF.md:66-78 | PERIM | MIGR | OK | |
| 17 | Priorités : sécurité patient, exactitude, doublons | PROJECT_BRIEF.md:121-125 | AUTRE (priorités) | MIGR | OK | |
| 18 | 5 questions avant toute abstraction | ARCHITECTURE.md:83-89 | ARCHI | MIGR | SUSPECTE | checklist générique, invérifiable |
| 19 | Lire 5 fichiers avant chaque tâche | CLAUDE.md:37-39 | PROCESS | MIGR | SUSPECTE | doublon du chargement du workflow |
| 20 | Plan de 5 lignes, rapport en 6 rubriques | CLAUDE.md:84,103 | PROCESS | MIGR | SUSPECTE | doublon de `/nouveau-plan` et `/fin-de-tache` |
| 21 | Arbitrage produit : revenir vers ChatGPT | PROJECT_BRIEF.md:116-117 | PROCESS | MIGR | SUSPECTE | contredit `/cadrer` |
| 22 | Pas de launch.json : UI Electron jugée en N2 | CLAUDE.md:32-33 | PROCESS | MIGR | OK | |
| 23 | N0 = typecheck seul, « aucune suite de tests » | CLAUDE.md:22-26 | N0 | MIGR | BLOCAGE | TASKS.md:42 T-229 : n0.mjs refuse sans n0.json ; STATUS.md:74 compte 126 tests |

### vostfr-CLI

Objectif : transformer des vidéos anglaises du NAS en .mkv sous-titrés FR/EN (Whisper, Gemini,
MKVToolNix), prêts à publier via torrent-uploader. 43 commits · instanciation a5bfad0 2026-09-21.

Note : `CLAUDE.md § Règles spécifiques` était vide à l'instanciation ; il a été rempli en P1/S1.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | NAS en lecture seule, original jamais écrasé | CLAUDE.md:36 | AUTRE (NAS) | INIT a5bfad0 / AJOUT 3f6a58c | OK | |
| 2 | Zéro dépendance d'exécution | CLAUDE.md:37 | DEP | AJOUT 3f6a58c → decisions/2026-09-21-typescript-natif-sans-dependance.md | OK | |
| 3 | Imports locaux en `.ts` (type stripping) | CLAUDE.md:38 | STYLE | AJOUT 3f6a58c | OK | |
| 4 | N0 = typecheck, test ; Preuve N0 0/2 | .claude/n0.json | N0 | AJOUT 3f6a58c | OK | |
| 5 | Un seul traducteur (Gemini), sans couche d'abstraction | PROJECT_BRIEF.md:48 | PERIM | INIT → 2026-09-21-outil-cli-separe.md | OK | |
| 6 | Interface graphique ou web hors périmètre v1 | PROJECT_BRIEF.md (supprimée) | PERIM | INIT a5bfad0 | BLOCAGE | levée à J+1 : decisions/2026-09-22-interface-web-locale.md:18 (« levée par cette décision ») |
| 7 | Rien en Python/CUDA, exécution sur le PC | PROJECT_BRIEF.md:50,18 | PLATEFORME | INIT | OK | |
| 8 | Aucune modification de torrent-uploader | PROJECT_BRIEF.md:51 | PERIM | INIT | OK | |
| 9 | Relecture humaine dans Subtitle Edit avant publication | PROJECT_BRIEF.md:52 | PROCESS | INIT | OK | |
| 10 | Tests sur la logique pure ; outils externes testés en réel | PROJECT_BRIEF.md:68-71 | TEST | INIT | OK | |
| 11 | Annoncer le volume de requêtes Gemini avant envoi | PROJECT_BRIEF.md:35,76 | PROCESS | INIT | OK | |
| 12 | Messages d'erreur qui disent quoi faire | PROJECT_BRIEF.md:78 | UI | INIT | OK | |
| 13 | À éviter : GPU en parallèle, reprise riche, configuration élaborée | PROJECT_BRIEF.md:118-122 | PERIM | INIT | OK | |
| 14 | Critères avant ajout de feature | PROJECT_BRIEF.md:110-116 | PERIM | INIT | SUSPECTE | gabarit verbatim |
| 15 | L'état, ce sont les fichiers de sortie | ARCHITECTURE.md:16 | ARCHI | INIT 7bc56fd | OK | |
| 16 | Modèles Gemini figés, jamais `-latest` | ARCHITECTURE.md:133 | AUTRE (reproductibilité) | AJOUT 7174376 | OK | |
| 17 | Interface `gui` sur 127.0.0.1 uniquement | ARCHITECTURE.md:118 | SECU | AJOUT 5ace5ce | OK | |

### Lunii Studio upgrade

Objectif : améliorer l'ergonomie de STUdio (fork) pour importer et transférer des packs
d'histoires vers une Lunii. 67 commits propres au projet depuis le 2026-08-25.

Notes :
- Commandes de `CLAUDE.md` en placeholders ; pas de n0.json ni de launch.json.
- `CLAUDE.md` est en anglais, sans section de règles spécifiques.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Aucune commande N0 déclarée ; Preuve N0 0/1 | CLAUDE.md:3-16 | N0 | INIT 14f2fa7 | SUSPECTE | gabarit non rempli, `mvn` pourtant dans l'allow |
| 2 | Lire brief, DECISIONS, TASKS, STATUS avant toute implémentation | CLAUDE.md:21-27 | PROCESS | INIT (pré-existant) | SUSPECTE | doublon du contexte injecté |
| 3 | Le projet porte « ONLY » sur l'UI/UX | PROJECT_BRIEF.md:18 ; CLAUDE.md:36 | PERIM | INIT → DECISIONS 2026-05-16 | SUSPECTE | contredit P1 (trois sessions « Backend ») |
| 4 | Exclus : DRM, firmware, réécriture backend ; reverse engineering seulement pour l'interopérabilité | PROJECT_BRIEF.md:33-45 | PERIM | INIT ; volet « Allowed » AJOUT 978cde3 | BLOCAGE | exclusion « protocol reverse engineering » retirée par DECISIONS.md:13-22 (2026-08-26) pour l'étude FLAM |
| 5 | Choisir le modèle le moins coûteux | CLAUDE.md:38-41 | AUTRE (modèle) | INIT | SUSPECTE | concurrence la grille modèle/effort du workflow |
| 6 | L'utilisateur n'a pas à comprendre formats ni système de fichiers | UI_SPEC.md:5-10 | UI | INIT | OK | |
| 7 | Le stock en lecture seule n'est jamais écrit | INSTALL.md:55,83 | DONNEES | AJOUT e0d3091 → decisions/2026-08-25 | OK | |
| 8 | Toujours éjecter la Lunii avant de la débrancher | PROJECT_BRIEF.md:77-78 | PLATEFORME | AJOUT 3697a75 | OK | |
| 9 | `allow` « jamais élargie par précaution » | .claude/settings.json | PERM | INIT 8bc34f0 | BLOCAGE | 09dc1f6 : git add/commit absents, « cause du blocage headless de S2 » ; P1/S1.md:352-356 : ajout refusé par le classifier |

### Tuto-onshape

Objectif : guide HTML statique pour construire des pièces paramétriques robustes dans Onshape.

**Ce n'est pas un dépôt git valide.** `.git/` est vide, et seul
`_DESKTOP-DBJ4TBO_sept.-16-172001-2026_TYPECONFLICT.git` traîne, conflit de synchronisation. Les
origines sont donc inconnues ; seules les décisions datées du 2026-08-28 donnent un repère.

Autres notes :
- Pas de n0.json.
- `plans/P1/S12.echec.md` (déploiement Vercel) tient à un compte externe, pas à une règle.

| # | Règle | Fichier:ligne | Fam. | Origine | Drapeau | Preuve / motif |
|---|---|---|---|---|---|---|
| 1 | Pas de JavaScript, aucune ressource externe, pas de `<style>` inline | CLAUDE.md:35-36 | DEP | inconnue → decisions/2026-08-28-site-statique-pur.md | OK | |
| 2 | Aucune capture d'écran : SVG inline thémé | CLAUDE.md:37-38 | CONTENU | inconnue → 2026-08-28-aucune-capture-ecran.md | OK | |
| 3 | Ni package.json, ni runner, ni typecheck, ni lint | CLAUDE.md:8-10,39-40 | DEP | inconnue → 2026-08-28-pas-de-runner-de-tests.md | BLOCAGE | contrôles de débordement et de contraste impossibles sans dépendance, renvoyés en N1 (P1/S2.md:38-44), jamais faits (VALIDATION.md:75) |
| 4 | En cas de doute sur la forme, imiter `../Tuto-code/CONVENTIONS.md` | CLAUDE.md:30-31 | STYLE | inconnue | SUSPECTE | hors dépôt, absent en session cloud |
| 5 | Vérifier toute doctrine contre cad.onshape.com ou le forum | CLAUDE.md:48-49 | CONTENU | inconnue | BLOCAGE | brief:108 : site bloqué par le proxy ; P1/S3.md:230 : lu via des extraits indexés |
| 6 | FeatureScript : rien d'inventé ; tout extrait non exécuté bloque le chapitre | CLAUDE.md:50-51 | CONTENU | inconnue | BLOCAGE | P1/S10.md:143-153 : FsDoc bloquée (EGRESS_BLOCKED), échec de S10 ; brief:95 : « ne bloque plus le déploiement » |
| 7 | Plan Free : pas de fonction verrouillée, ni API ni MCP | CLAUDE.md:52-54 | PERIM | inconnue → 2026-08-28-mcp-onshape-hors-mvp.md | OK | |
| 8 | Tutoiement, ton affirmatif, pas d'emoji | CLAUDE.md:58 | STYLE | inconnue | OK | |
| 9 | Tout concept défini avant usage, avec son nom anglais | CLAUDE.md:59-61 | CONTENU | inconnue | OK | |
| 10 | Chaque chapitre tient seul | CLAUDE.md:62-63 | CONTENU | inconnue | OK | |
| 11 | Encadré `box robust` obligatoire (blocs C à E) | CLAUDE.md:64-66 | CONTENU | inconnue → 2026-08-28-structure-hybride.md | OK | |
| 12 | Navigation régénérée depuis `_gabarit.html` | CLAUDE.md:70-72 | ARCHI | inconnue | OK | |
| 13 | Structure de chapitre imposée ; échappement `< > &` | PLAN_CONTENU.md:32-46,65 | CONTENU | inconnue | OK | |
| 14 | SVG : viewBox de 700, pas de couleur en dur, rien sous 10 px | PLAN_CONTENU.md:50-53 | UI | inconnue | OK | |
| 15 | Jamais « Onshape recommande » sans source | PLAN_CONTENU.md:75-78 | CONTENU | inconnue | OK | |
| 16 | Hors périmètre v1 : surfacique, tôlerie, dessins, rendu, MCP | PROJECT_BRIEF.md:60-67 | PERIM | inconnue | OK | |
| 17 | Desktop et iPhone sans débordement horizontal | PROJECT_BRIEF.md:91-92 | UI | inconnue | OK | jamais vérifié (voir ligne 3) |
| 18 | N0 : pas de n0.json (N0 = `node tools/verifier.mjs`) | plans/P1/S2.md:90 | N0 | inconnue | SUSPECTE | hors du format : `n0.mjs` exige n0.json |
