# TASKS.md — bloquants et tâches en cours

## Bloquants de revue (à corriger avant prochaine vague)

- aucun (P8/S5 et P9/S3 fermés à la clôture du 2026-10-08, décision utilisateur)

## Revue des règles des projets (`docs/decisions/2026-10-08-regles-de-projet-validees.md`)

Inventaire : `docs/analyses/2026-10-08-regles-projets-inventaire.md`. Une séance par projet, choix
de l'utilisateur, commit `docs/decisions/2026-10-08-regles-revisees.md` dans le projet.

- [x] trames-consultation (`0326026`) · [x] DoxUploader (`a000543`) · [x] ebm-msp (`f13e220`)
- [x] EBM-MSPv2 (`551a5ef`) · [x] Interface-OE (`e515e3c`, lint en N0 : `95e9910`, `2eb1d79`) · [x] Chords (`0b63b8e`)
- [ ] ETP interactif · Tuto-onshape (dépôt git invalide d'abord) · torrent-uploader · annuaire-msp ·
  claude-mods · MYO · Lunii Studio upgrade · S&C · vostfr-CLI · EBM-perso
- [ ] Sans blocage, suspectes seules : cosme-diy · trieur-plex · extension-firefox · Veilleur · DrumsTraining
- [x] Plugin : points 1 à 5 de la décision → plan P17 (clos 2026-10-08, publié en 0.61.0) (`plans/P17/index.md`)
  - Preuve N0 non requise pour un projet sans commande (J14) · → plans/P17/S1.md
  - Permissions dérivées de la stack, allow en retard signalé · → plans/P17/S2.md
  - Interview : règles validées une à une, commandes et n0.json à l'instanciation, gabarits · → plans/P17/S3.md
  - Ligne `Règles :` des décisions contrôlée par brief-a-jour · → plans/P17/S4.md
  - Publication 0.61.0 · → plans/P17/S5.md
  - Constat pour S3 (outillage instancié) : Prettier sur poste Windows (`core.autocrlf=true`) signale
    tout fichier en CRLF — `"endOfLine": "auto"` (Interface-OE : 124 faux écarts sur 151, `95e9910`)

## Backlog de revue (non bloquant)

- **P9/S2** — `plugin/bin/brief-a-jour.mjs:105-115` : `aBriefApplique` boucle sur tout l'historique
  (un `git log -1` par commit) ; un seul `git log --grep="Brief-applique: <chemin>" -F` suffirait.
  Sans effet tant que les dépôts restent petits.
- **P9/S3** — `plugin/templates/VALIDATION.md:4-5` : « passe esthétique demandée » répété deux fois
  dans la même parenthèse, sans référent hors `/revue-d-usage` — simplifier en une mention.
- **P16/S1** — `plugin/mods/garde-fous/tests/garde-fous.test.ts` : pas de cas « `run_in_background:
  false` explicite conservé » pour O3 ; `register.ts:44` cherche la colonne Modèle dans le premier
  tableau trouvé (fragile si un autre tableau précède).
- **P16/S2** — wrapper `claude()` dupliqué (`installer-mods.mjs:98-103`, `tests/tester-mods.mjs:42-49`,
  `publier.mjs`) : factoriser au quatrième appelant ; marketplace `templates` pointant ailleurs non contrôlée.
- **P16/S3** — `sessionstart-contexte.mjs` (bloc mods) : un `plugin.json` de mod illisible fait taire
  le signal pour tous les mods (try global).
- **P16/S5-S6** — `plugin/mods/affichage/hooks/register.tsx` : `key` manquante sur le `<Box>` des
  dossiers et les `<Text>` du panneau plan ; `incidents.ts` duplique `lireIncident` de
  `collecter-incidents.mjs` — toute évolution du gabarit §9b se porte aux deux endroits.
- **P17/S2** — `plugin/bin/sync-workflow.mjs:145-147` : commentaire de tête collé à la phrase
  suivante, à reformater ; le filtre du socle (hors `Bash(npm ` / `Bash(npx `) est codé en dur —
  une autre stack dans le gabarit obligerait à toucher au script.
- **P17/S4** — `plugin/bin/brief-a-jour.mjs:~66` : le message « SANS OBJET — pas de PROJECT_BRIEF.md »
  ne dit pas que le contrôle porte aussi sur `CLAUDE.md` ; docs (skills, gabarit, agent) non relues.
