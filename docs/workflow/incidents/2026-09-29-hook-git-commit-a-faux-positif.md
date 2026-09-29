# Incident workflow — 2026-09-29 — refus `git commit -a` sur un drapeau d'une autre commande

- Projet : Templates (dépôt source) · Workflow : v0.49.0 · Plan : aucun (tâche directe)
- Environnement : Desktop (Windows 11), outil PowerShell · à la main
- Étape : commit de fin de tâche · Nature : environnement

## Symptôme
`git commit -q -F msg.txt; git log …; git status --short | Select-String -NotMatch '^\?\?'` →
refus « `git commit -a` interdit », alors qu'aucun `-a` n'est passé à `git commit`. Le même
commit, seul dans son appel, passe.

## Preuve
`plugin/hooks/pretooluse-git.mjs:47-48` : la présence de `git commit` est testée sur la commande
entière, puis `/\s-(?:a|[a-zA-Z]*a[a-zA-Z]*)\b|--all\b/` aussi sur la commande entière. Tout
drapeau contenant un « a » ailleurs dans la ligne (`-NotMatch`, `-Raw`, `-Pattern`, `-Last`) suffit.

## Sur place
Commit isolé dans son propre appel. Piste : n'appliquer le second test qu'au segment de la
commande qui suit `git commit`, jusqu'au prochain séparateur (`;`, `&&`, `|`, fin de ligne).

## Corrigé
0.50.0, le jour même : test limité au segment `git commit`, texte cité vidé avant (le message
« commit -a » d'un commit déclenchait aussi le refus). Cas de régression dans `tests/tester-hooks.mjs`.
