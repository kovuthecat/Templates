# Incident workflow — 2026-10-06 — shim `claude` introuvable, `claude.exe` marche

- Projet : Templates · Workflow : v0.52.0 → 0.54.0 · Plan : — (cadrage de P14)
- Environnement : Desktop · à la main
- Étape : `/nouveau-plan` Étape 0 (`claude plugin update workflow@templates --scope local`) · Nature : environnement

## Symptôme
Depuis le Bash du Desktop, `claude plugin update …` répond : « aucune installation de Claude Code
trouvee (ni sous $APPDATA/Claude, ni sous $LOCALAPPDATA/Packages/Claude_*) ». Le moteur existe
pourtant : `$CLAUDE_CODE_EXECPATH` pointe sur
`…/Packages/Claude_pzs8sxrjxfjjc/LocalCache/Roaming/Claude/claude-code/2.1.286/635c1867224a/claude.exe`.

## Preuve
- `type -a claude` → `/c/Users/kovu/.local/bin/claude` (script bash) ; il cherche `claude-code/*/claude.exe`
  (lignes 22 et 25), alors que le moteur est un niveau plus bas : `claude-code/2.1.286/635c1867224a/claude.exe`.
- `~/.local/bin/claude.exe plugin update workflow@templates --scope local` → « updated from 0.52.0 to 0.54.0 ».

## Sur place
Commandes passées par `claude.exe` ; le plan P14 prescrit `"$CLAUDE_CODE_EXECPATH" plugin …`.
`publier.mjs` et `/nouveau-plan` Étape 0 appellent `claude` nu : ils échoueront de même sur ce poste.
