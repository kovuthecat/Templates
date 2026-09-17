# Incident workflow — 2026-09-17 — bac à sable Windows absent pour `claude plugin eval`

- Projet : Templates (dépôt source) · Workflow : v0.38.1 (`plugin.json`) · Plan : P6/S8/T19
- Environnement : Desktop (Windows 11, Git Bash/MSYS) · à la main
- Étape : `/nouveau-plan` T19 (trois évals) · Nature : environnement

## Symptôme
`claude plugin eval` refuse tout cas dont un outil shell (Bash/PowerShell) est accordé via
`--allow-tools` : « sandbox required but unavailable ». Sans `--allow-tools`, le cas tourne mais
chaque appel Bash de l'agent est refusé — il épuise `max_turns` sans jamais accomplir le scénario
(coût payé : ~0,47 $ pour un run qui n'aboutit pas).

## Preuve
Commande : `claude plugin eval --trust-plugin --no-publish --allow-tools Bash --case
"executant-n0-premier-plan" plugin` (Claude Code 2.1.274, ce poste).
Sortie : `error exit 1: A shell tool (Bash or PowerShell) was granted but this machine cannot
confine it (no sandbox backend on this platform, or it is not installed) ... Windows sandbox is not
active on this session (feature gate off) ... sandbox.failIfUnavailable is set — refusing to start
without a working sandbox.`
`wsl --status` : « Le Sous-système Windows pour Linux n'est pas installé. »

## Sur place
Rien. Activer le bac à sable Windows (fonctionnalité optionnelle, admin + redémarrage) ou installer
WSL sont des changements de réglages système, hors portée d'une session et de tout correctif
automatique — un geste que seul l'utilisateur peut poser. Les trois suites d'éval de T19
(`plugin/evals/executant-n0-premier-plan/`, `plugin/evals/premisse-mesuree-amendement/`,
`plugin/evals/orchestrateur-suit-le-script/`) sont écrites ; leur exécution réelle attend un poste
où `claude plugin eval` dispose d'un bac à sable (Windows Sandbox activé, WSL installé, ou un poste
Linux/macOS).
