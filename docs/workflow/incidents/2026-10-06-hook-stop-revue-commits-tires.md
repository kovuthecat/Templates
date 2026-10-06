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

## Récidive — 2026-10-06, v0.55.0
Session de lecture seule (« que donnent les résultats des protocoles de preuve ? »), aucun commit.
Après `git pull --rebase` (13 commits, dont les reports de P14 et P15 sur `main`), le hook Stop
réclame les revues de `P15/S6` et `P14/S4`. Le correctif n'est pas encore fait : `lib.mjs:287-306`
lit toujours `${depuis}..HEAD`. Réponse explicite au hook, comme la première fois.
Second défaut visible ici : les commits signalés sont des **reports de mesures** (un seul fichier
`docs/analyses/…`, poussé par index temporaire depuis une branche de preuve) ; le hook les compte
comme « du code » sous `Plan:` alors que la session qui les a faits vit sur une branche jetable.
