# Incident workflow — 2026-10-06 — hook Stop : revue réclamée pour des commits tirés par `git pull`

- Projet : Templates · Workflow : v0.54.0 · Plan : — (cadrage de P14)
- Environnement : Desktop · à la main
- Étape : hook Stop (`plugin/hooks/stop-contexte.mjs`) · Nature : orchestration

## Symptôme
Session de cadrage sans aucun commit. Après `git pull --rebase` (15 commits rattrapés), le hook Stop
bloque : « Revue de session absente ou incomplète — P12/S1. Des commits de cette session portent du
code sous `Plan: P12/S1/` ».

## Preuve
`plugin/hooks/lib.mjs:291` — `revuesManquantes(cwd, depuis)` lit `git diff --name-only ${depuis}..HEAD`
et `git log ${depuis}..HEAD`, `depuis` = HEAD noté au début de la session. Un `pull` avance HEAD :
les commits d'autrui entrent dans « les commits de cette session ».

## Sur place
Réponse explicite au hook (« faux positif, aucun commit dans cette session ») ; il ne s'est pas
redéclenché. Piste : ne compter que les commits dont l'auteur-date est postérieure au début de
session, ou exclure ceux déjà présents sur `origin` au moment du repère.
