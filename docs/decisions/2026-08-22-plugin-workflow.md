# 2026-08-22 — Plugin `workflow@templates`

Couvre D-P2-1 (plugin sans déplacement de fichier), D-P2-2 (CLAUDE-BASE injecté par hook),
D-P2-3 (settings projet réduits).

## Décision

Le repo `Templates/` entier devient la marketplace Claude Code `templates` (GitHub privé
`kovuthecat/Templates`), exposant un plugin unique `workflow` dont la source est `./` —
`.claude-plugin/plugin.json` pointe vers les emplacements déjà existants (`.claude/skills/`,
`agents/`, `.claude/hooks/hooks.json`), sans déplacer un seul fichier. Un projet active le workflow
en ajoutant `"enabledPlugins": {"workflow@templates": true}` à son `.claude/settings.json`.

L'import `@C:\...\Templates\CLAUDE-BASE.md` dans le `CLAUDE.md` de chaque projet est remplacé par
une émission du même contenu par le hook `SessionStart` du plugin (`sessionstart-contexte.mjs`) —
source unique conservée, mais qui fonctionne aussi en cloud (un import par chemin absolu Windows
ne s'y résout pas). Le `.claude/settings.json` d'un projet se réduit à `enabledPlugins` +
`permissions` (allowlist) + `effortLevel` ; les hooks voyagent dans le plugin (`hooks.json`,
chemins `${CLAUDE_PLUGIN_ROOT}`), plus dans le settings du projet.

Les projets non encore migrés (chemins absolus, import `@CLAUDE-BASE.md`, jonctions NTFS pour les
skills) continuent de fonctionner tels quels — migration au fil de l'eau (`MIGRATION.md` §5), pas
de bascule forcée.

## Contexte

Le repo fonctionnait jusqu'ici par références à chemin absolu Windows (`C:\Users\kovu\...`) et par
jonctions NTFS pour exposer les skills au niveau utilisateur (`~/.claude/skills/<nom>` →
`Templates/.claude/skills/<nom>`, mis en place au plan P1). Ce mécanisme est local à une machine
Windows avec droits suffisants : il ne survit pas à une session Claude Code Desktop dans le cloud,
et un chemin absolu cassé silencieusement (repo déplacé, autre machine) ne signale rien tant que
personne ne remarque l'absence des règles injectées.

## Alternatives envisagées

- **Garder les chemins absolus et les jonctions, ne rien changer** : écartée — bloque tout usage
  cloud du workflow et reste fragile à un déplacement de repo ou changement de machine.
- **Dupliquer le contenu de `CLAUDE-BASE.md` dans chaque `CLAUDE.md` projet** : écartée — recrée le
  problème que l'import `@` avait justement résolu au plan P1 (perte de source unique).
- **Un plugin par mécanisme (skills, hooks, agents séparés)** : écartée — complexité de packaging
  et d'activation sans bénéfice ; un seul plugin `workflow` suffit et se désactive en un point.

## Conséquences

- Toute nouvelle règle commune passe par `CLAUDE-BASE.md` : elle est injectée automatiquement à
  chaque session d'un projet ayant activé le plugin, sans étape de copie.
- Un projet migré n'a plus de jonction NTFS ni d'import par chemin absolu à maintenir : seul
  `enabledPlugins` dans son `.claude/settings.json` le rattache au workflow central.
- Un projet déjà migré au plan P1 doit repasser par `MIGRATION.md` §5 pour retirer l'ancien import
  et activer le plugin — sans ça, les règles communes se chargent deux fois (import + hook) ou pas
  du tout (import retiré sans activer le plugin).
- Reste à valider en conditions réelles (S9, gate humaine) : le chargement du plugin depuis une
  marketplace GitHub **privée** en session cloud — si l'auth échoue, un arbitrage (repo public vs
  route de sync claude.ai) restera à trancher après ce constat, pas avant.
