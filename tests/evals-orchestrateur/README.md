# Harnais de mesure de l'orchestrateur

Rejoue trois gestes de l'orchestrateur (`/orchestrer-plan`) contre un vrai `claude -p`, pour vérifier
qu'un texte sans flou produit **le même geste** à chaque essai — c'est la vérification de
`docs/decisions/2026-09-22-flous-du-workflow.md` (§ « Ce que ça oblige »). Portable : aucun chemin
codé en dur, tout se pose dans un dossier temporaire du système, jamais dans le dépôt.

## Usage

```bash
bash tests/evals-orchestrateur/lancer.sh                 # pose les bases, rejoue A/B/C, Sonnet low, 3 essais
node tests/evals-orchestrateur/noter.mjs                 # note le dernier rejeu
node tests/evals-orchestrateur/noter.mjs -v               # + le détail des appels et de la réponse finale

# Mesures futures (K5, un autre effort) :
bash tests/evals-orchestrateur/lancer.sh --model sonnet --effort medium --essais 3
```

`poser-cas.sh` peut aussi se lancer seul (pose les bases et vérifie `prochaine-action.mjs`, sans
appeler `claude`) — c'est ce que fait `lancer.sh` en premier geste.

## Les trois cas

- **A** — vague parallèle à efforts mêlés (fixture `Sonnet low` / `Opus high`), lignes « en clair »
  du plan recopiées mot pour mot. Attendu : premier geste = lancement de **S1 seule** (D4 : la
  première session seule dans un message, les autres dans le message suivant, sans attendre sa
  notification), bloc avec `subagent_type: "session-low"` et `model: "sonnet"` recopiés du champ
  `agent` rendu par le script ; aucun appel à `resumeur-git` ; aucun `S<k>.md` ouvert (canari absent
  — un orchestrateur qui suit le script n'a jamais besoin de l'ouvrir).
- **B** — reprise à froid sur `plans/P9/S1.echec.md` (`Nature : exécution`). Attendu :
  `subagent_type: "session-high"`, `model: "opus"`, `/reprendre-echec` invoquée sur ce fichier ;
  aucun `SendMessage` (canal court non applicable ici) ; aucun `fork`.
- **C** — budget de reprises épuisé sur S1 (`Tentatives : reprise=2 enquete=1`), rapport avec une
  section `## Issues` de trois options déjà au format posé par S2/T5
  (`N. <option> — <coût> · débloque <…>`). Attendu : question au format `❓ P9/S1`, les trois lignes
  recopiées **à l'identique** (égalité de ligne stricte — voir Pièges), une « Ma recommandation », et
  « reste lançable sans décider : rien ».

## Fixtures

Les trois index de `plans/P9/` sont écrits par `poser-cas.sh` (A) ou dérivés de
`tests/fixtures/plans/moteur-base/index.md` (B, C). `poser-cas.sh` vérifie, avant tout lancement de
`claude`, que `node plugin/bin/prochaine-action.mjs P9` rend bien A `lancer`, B
`reprendre — S1 (Opus)`, C `question` — un autre résultat est une fixture à corriger, pas un attendu
à ajuster.

## Pièges tenus (à garder en portant ce harnais ailleurs)

- Variables `CLAUDE_CODE_*` et `DISABLE_MICROCOMPACT` retirées avant `claude -p` : héritées d'une
  session Desktop, elles compactent le contexte vers ~20 k tokens et faussent la mesure.
- `--strict-mcp-config` et `--tools` (en plus de `--allowedTools`) : `--allowedTools` seul ne
  restreint pas vraiment l'outillage disponible.
- `--settings '{"disableAllHooks":true}'` : les hooks du dépôt cloné ne doivent pas s'exécuter dans
  la mesure.
- `GIT_CONFIG_GLOBAL` jetable, `origin` retiré et identité git locale dans chaque copie : un agent
  Haiku a un jour écrit dans `~/.gitconfig` de l'hôte pendant une mesure — jamais reproduire ça sur
  le poste qui mesure.
- `--plugin-dir <clone>/plugin` : lit les textes du clone (donc du dépôt tel qu'il est au moment de
  la mesure), jamais le plugin installé depuis `plugins/cache/`. `noter.mjs` alerte si l'événement
  `init` d'un essai ne semble pas pointer vers le clone — un 9/9 obtenu avec le plugin du cache ne
  mesure rien de ce chantier.
- **Le geste compte, pas le canal** : privé de l'outil `Agent`, un essai écrit le bloc en clair
  (ce que le prompt demande) — mais il peut aussi *tenter* l'appel et se faire refuser
  (« No such tool available: Agent »). `noter.mjs` rend alors ce tool_use dans la forme du bloc et
  le note comme le reste : sans ça, un geste juste est noté raté (mesuré sur l'essai B-3 du
  2026-09-22). Les attendus, eux, ne bougent pas.
- **Dire que les agents du plugin sont là** : l'outil `Agent` coupé, le modèle ne voit aucun
  `session-<effort>` et applique de bonne foi le préflight « agents du plugin absents du bac à sable »
  (repli `claude`, cran 3) — un artefact du bac à sable, pas un flou de la skill. Le prompt énonce
  donc que les agents *sont* chargés depuis `plugin/agents/` et que seul l'outil manque.
- Anti-raccourci du cas C : comparer les lignes de `## Issues` par **égalité stricte**, jamais après
  avoir normalisé les backticks ou les espaces — un check qui normalise avant de comparer reproduit
  exactement le flou que D3 (`docs/decisions/2026-09-22-flous-du-workflow.md`) supprime.

## Ce qui a changé depuis `plans/P8/harnais/`

Ce dossier remplace `plans/P8/harnais/` (état brut de la session de cadrage, chemins de scratch codés
en dur, non portable). La notation du cas A y était **trop stricte** — elle exigeait les deux appels
(S1 et S2) dans le même message ; corrigée ici : la skill impose un préflight puis S1 seule (D4).
