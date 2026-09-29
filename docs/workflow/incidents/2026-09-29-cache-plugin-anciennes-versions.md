# Incident workflow — 2026-09-29 — anciennes versions du cache plugin : tout vendoring refusé sur le poste source

- Projet : Templates (dépôt source) · Workflow : v0.47.0 (`plugin.json`), cache poste 0.40.0 → 0.47.0 · Plan : aucun (tâche directe)
- Environnement : Desktop (Windows 11) · à la main
- Étape : test à blanc de `/creer-projet` (amorçage `sync-workflow`) · Nature : environnement

## Symptôme
`node sync-workflow.mjs --source <payload 0.47.0> --projet <dossier vide>` → sortie 3, « cache
plugin périmé — rien écrit », cinq lignes `CACHE` (0.40.0, 0.41.0, 0.42.0, 0.45.0, 0.46.0 en cache
alors que la source est en 0.47.0). Même refus pour l'amorçage de `/nouveau-projet` et pour
`/maj-workflow` lancés depuis ce poste.

## Preuve
`~/.claude/plugins/cache/templates/workflow/` contient 0.40.0 à 0.47.0 : `claude plugin update
--scope local` ajoute la nouvelle version sans retirer l'ancienne. `cachesPlugin()`
(`plugin/bin/sync-workflow.mjs`) compare **chaque** dossier de version à la source, sans savoir
lequel est chargé ; or le plugin n'est actif que dans Templates (`--scope local`), pas dans le
projet vendoré.

## Sur place
Lanceur `/creer-projet` : lignes `CACHE` montrées, question à l'utilisateur (supprimer les dossiers,
ou relancer avec `--ignorer-cache`). Piste : ne compter que la version la plus récente de chaque
marketplace (les autres sont des restes de mise à jour), ou ne compter que les plugins activés pour
le projet cible.
