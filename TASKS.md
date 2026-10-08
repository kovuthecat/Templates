# TASKS.md — bloquants et tâches en cours

## Bloquants de revue (à corriger avant prochaine vague)

- aucun (P8/S5 et P9/S3 fermés à la clôture du 2026-10-08, décision utilisateur)

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
