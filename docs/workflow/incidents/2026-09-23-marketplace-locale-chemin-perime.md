# Incident workflow — 2026-09-23 — marketplace locale sur un chemin périmé, plugin non chargé

- Projet : Templates (dépôt source) · Workflow : v0.41.0 (`plugin.json`), cache poste 0.40.0 · Plan : P9 (cadrage)
- Environnement : Desktop (Windows 11) · à la main
- Étape : `/nouveau-plan` Étape 0 (contrôle de version) · Nature : environnement

## Symptôme
`claude plugin update workflow@templates --scope local` → « Plugin "workflow" not found ».
`claude plugin list` : `workflow@templates` 0.40.0, `✘ failed to load`, « Marketplace templates
failed to load: cache-miss ». Le dépôt a été déplacé ; la marketplace déclarée dans
`.claude/settings.local.json` pointait encore l'ancien dossier.

## Preuve
`.claude/settings.local.json` avant : `extraKnownMarketplaces.templates.source.path` =
`C:\Users\kovu\SynologyDrive\Thibault\Projets\Templates\plugin` ; dépôt réel :
`C:\Users\kovu\Projets\Templates`. Rien ne signale l'échec de chargement en ouverture de session :
les skills du cache 0.40.0 restent proposées.

## Sur place
`claude plugin marketplace remove templates --scope local`, puis
`claude plugin marketplace add ./plugin --scope local`, puis
`claude plugin install workflow@templates --scope local` → 0.41.0, `✔ enabled`. Piste : un
contrôle au `SessionStart` du dépôt source qui compare la version chargée à `plugin/.claude-plugin/plugin.json`.
