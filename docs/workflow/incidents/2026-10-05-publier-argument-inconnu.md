# Incident workflow — 2026-10-05 — `publier.mjs --help` publie pour de bon

- Projet : Templates (dépôt source) · Workflow : v0.53.0 · Plan : aucun (correctif du préalable preuve-n0)
- Environnement : Desktop (Windows 11), outil Bash · Claude
- Étape : avant le bump 8b, pour lire l'usage du script · Nature : environnement

## Symptôme
`node plugin/bin/publier.mjs --help 2>&1 | head -15` a déroulé la publication complète : tests des
hooks, construction du payload, push forcé vers `kovuthecat/claude-workflow` (commit du
2026-10-05 18:14:40 +0200, « v0.53.0 »), avec un correctif **non commité** de `plugin/bin/` et sans
bump de version. Le dépôt public a porté pendant quelques minutes un contenu différent de la 0.53.0
du dépôt source, sous la même étiquette.

## Preuve
`plugin/bin/publier.mjs:62` : seul `--dry-run` est lu (`process.argv.includes`) ; tout autre
argument est ignoré et le script publie. L'usage n'est écrit qu'en commentaire d'en-tête.

## Sur place
Bump 0.54.0, CHANGELOG, commit, puis publication normale : le dépôt public (artefact à commit unique,
`--force` assumé) est republié à l'identique du dépôt source.

## Corrigé
0.54.0 : un argument autre que `--dry-run` arrête le script avant tout geste (« Rien publié »,
sortie 1).
