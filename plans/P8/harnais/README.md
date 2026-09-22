# Harnais de mesure de l'orchestrateur — état brut du 2026-09-22

Copié tel quel depuis le scratch de la session de cadrage, pour ne pas le perdre. **Non portable en
l'état** : chemins du scratch codés en dur, `base/` = un clone du dépôt fait à la main. P8/S5 le
déplace dans `tests/evals-orchestrateur/` et le rend portable, puis supprime ce dossier.

- `cas-script/` — cas `orchestrateur-suit-le-script` (fixture P9 de `plugin/evals/…/prompt.md`,
  non commitée dans le clone), modèles × efforts × 2 essais. `run.sh` = lot 3 (le seul valide) ;
  `grade.mjs out3 [-v]`.
- `cas-abc/` — trois cas plus exigeants, Sonnet × efforts × 3 essais. `build.sh` pose les trois
  bases (A : vague parallèle à efforts mêlés et lignes « en clair », fichiers `S<k>.md` canaris ;
  B : reprise à froid ; C : question sur budget épuisé avec `## Issues`) ; `run.sh` ; `grade.mjs [-v]`.
  La notation de A dans `grade.mjs` est **trop stricte** (elle exige les deux appels ; la skill
  impose un préflight puis S1 seule) — la notation corrigée est décrite dans la décision.

Pièges tenus par `run.sh` (à garder) : variables `CLAUDE_CODE_*` et `DISABLE_MICROCOMPACT` retirées
(sinon héritage de la session Desktop et compactage vers 20 k tokens) ; `--strict-mcp-config` ;
`--tools` en plus de `--allowedTools` ; `--settings '{"disableAllHooks":true}'` ;
`GIT_CONFIG_GLOBAL` jetable, `origin` retiré et identité locale dans chaque copie (un agent Haiku
avait écrit `~/.gitconfig`) ; `--plugin-dir <copie>/plugin` (lit les textes du dépôt, pas le cache).
