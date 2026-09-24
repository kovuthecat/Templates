# Incident workflow — 2026-09-24 — verificateur-plan épuise ses 20 tours sans rendre de verdict

- Projet : Templates · Workflow : v0.44.0 · Plan : P10
- Environnement : Desktop · à la main
- Étape : `/nouveau-plan` Étape 4b · Nature : orchestration

## Symptôme
L'agent `workflow:verificateur-plan` (Haiku, `maxTurns: 20`) s'est arrêté deux fois à sa limite de
tours sur un plan de 7 sessions. Premier lancement, puis reprise par `SendMessage` : aucun écart,
aucun RAS rendu.

## Preuve
Retour 1 : « this agent stopped at its 20-turn limit before finishing », 20 appels d'outils.
Retour 2, après `SendMessage` : même message, 20 appels, « had produced no report ».

## Sur place
Repli `general-purpose` (Sonnet) tenant le rôle décrit dans `plugin/agents/verificateur-plan.md` :
verdict rendu en 26 appels, un écart. Correction du plafond prévue dans P10/S6/T15.
