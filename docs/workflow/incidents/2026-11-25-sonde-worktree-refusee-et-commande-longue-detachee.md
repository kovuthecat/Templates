# Incident workflow — 2026-11-25 — sonde de worktree refusée par le classifieur ; commande longue détachée par l'outil

- Projet : Templates · Workflow : 0.68.0 · Plan : P21/S5/T12
- Environnement : Desktop · sous-agent (orchestré), mode auto
- Étape : `plans/P21/S5.md` T12, étapes 1 et 3 · Nature : environnement

## Symptôme
1. La fiche S5 exige `git push origin sonde/p21-worktree` et `git worktree add -b … <tmp> HEAD`. Le prompt de
   lancement dit « n'ouvre AUCUN worktree ». Le classifieur du mode auto a refusé les deux gestes (« Destructive or
   Unwanted Actions »). Les mesures M1-M3 ont été rejouées sur des clones locaux ; la branche n'est pas poussée.
2. `node plugin/bin/n0.mjs --session P21/S5` (≈ 460 s) et un `until`-loop d'attente sont passés en arrière-plan
   après 180 s, sans choix de la session, alors que la consigne est « N0 au premier plan, aucune commande
   détachée » : il a fallu relire le fichier de sortie par appels de moins de 170 s. Même effet sur un `du` de
   `node_modules` sur 25 projets (arrêté à la main).
3. Un appel `Agent` a d'abord été refusé : « a hook changed this call's input after auto mode reviewed it » ; accepté à la
   réémission à l'identique.

## Preuve
- `Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Destructive or Unwanted Actions]`
  (`git push origin sonde/p21-worktree`, puis `git worktree add -b sonde/s-a …`).
- `Command was moved to the background (ID: btct2piar) after running for 180s.`
- tester-scripts → PASS (330.9s) : la durée seule dépasse le seuil de 180 s.

## Sur place
Clones jetables à la place des worktrees (analyse : `docs/analyses/2026-11-26-sonde-worktree.md`) ; attente du
fichier de sortie de N0 par boucles courtes. Pour S6/S7 : un plan dont les sessions lancent N0 plus de 180 s
(ici 460 s) subira ce détachement ; et une session de sonde qui exige worktree et push doit être lancée sans
l'interdit de worktree, ou avec une règle de permission pour `git worktree add` et `git push origin sonde/*`.
