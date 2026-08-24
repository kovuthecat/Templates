# 2026-08-24 — Hook `SessionStart` de bootstrap dans `project-settings.json`

## Décision

`plugin/templates/project-settings.json` porte désormais un bloc `hooks.SessionStart` unique,
pointant vers un script `.claude/hooks/session-start.sh` copié dans chaque projet (nouveau fichier
`plugin/templates/session-start.sh`). C'est une **exception ciblée** à D-P2-3 (2026-08-22) : « les
hooks voyagent dans le plugin, plus dans le settings du projet » reste la règle pour
`PreToolUse`/`PostToolUse`/`Stop` ; seul ce hook de bootstrap reste dans le projet, parce qu'il doit
tourner **avant** que le plugin lui-même soit chargé.

Le script ne fait rien en local (`CLAUDE_CODE_REMOTE` absent → sortie immédiate). En session cloud,
il détecte que `workflow@templates` n'est pas installé, ajoute la marketplace et installe le plugin
— best-effort : une panne réseau dégrade vers une session sans plugin plutôt que de bloquer le
démarrage.

## Contexte

D-P2-3 (2026-08-22) tenait pour acquis que `extraKnownMarketplaces` + `enabledPlugins` dans
`.claude/settings.json` suffisaient à charger le plugin partout, y compris en session cloud — ce
point restait explicitement à valider (« conditions réelles », gate humaine S9). Mesuré le
2026-08-24 dans MYO : c'est faux. Une session cloud (`CLAUDE_CODE_REMOTE=true`) ne clone jamais la
marketplace déclarée au démarrage — `enabledPlugins` n'a donc rien à activer, et les skills/agents/
hooks du plugin sont silencieusement absents de toute la session.

Le repo `kovuthecat/claude-workflow` est par ailleurs confirmé **public et joignable** depuis une
session cloud (mesuré le même jour) : l'authentification n'est pas en cause, seul le clone au
démarrage manque.

## Alternatives envisagées

- **Ne rien faire, documenter la limite** : écartée — le plugin (11 skills, 4 agents, garde-fous
  hooks) serait silencieusement absent de toute session cloud, sans signal pour l'utilisateur.
- **Détecter et avertir sans installer** : écartée — un simple message ne restaure pas les skills ni
  les garde-fous ; autant installer directement puisque le repo est public et l'opération idempotente.
- **Déplacer tout le câblage hooks dans le projet (retour avant D-P2-3)** : écartée — recrée le
  problème que D-P2-3 avait résolu (chemins absolus, câblage dupliqué par projet) pour les trois
  hooks qui, eux, n'ont pas besoin de tourner avant le chargement du plugin.

## Conséquences

- `migrer-projet` (Phase B étape 1, Phase D point 3) et `nouveau-projet` (Phase C) doivent copier /
  préserver ce hook au lieu de vider tout bloc `hooks` — mis à jour dans la même passe.
- Un projet déjà migré doit rapatrier `.claude/hooks/session-start.sh` et le bloc `hooks` minimal
  pour bénéficier du chargement en session cloud ; sans ça, il reste dans l'état d'avant ce constat
  (fonctionne en local, silencieux en cloud).
- Toute évolution future de ce script republie une version bumpée (`plugin/.claude-plugin/plugin.json`)
  suivie de la procédure de publication (`README.md` §Distribution) — sinon les projets déjà migrés
  ne verront jamais la mise à jour.
