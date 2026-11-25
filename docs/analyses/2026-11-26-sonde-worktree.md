# Sonde P21/S5 — preuve N0 après fusion, dépendances, réveil d'une session qui délègue

> Session P21/S5 (T12), régime ouvert, 2026-11-25. Branche jetable `sonde/p21-worktree`.
> Mesures M1-M4 ; chaque sortie est recopiée brute.

## M4 — réveil d'une session qui délègue

M4 : réveil constaté, 18:37, délai ~5 s (agent `workflow:explorateur`, question sur les fichiers `*n0*`
de `plugin/bin/`). **Réserve** : l'appel `Agent` a rendu la main de façon synchrone avec la fin de l'agent
(5,3 s, 3 appels d'outils) ; le rapport est arrivé à la fois comme résultat de l'appel et comme message
« Subagent hand-back ». Le cas dur — la session qui termine son tour *avant* la fin de l'agent puis est
réveillée — n'a pas été joué (une réponse finale clôt le tour de l'orchestrée, `EXECUTANT.md`). Verdict :
**confirmé pour une délégation courte attendue dans le tour ; indécidable pour une délégation qui dépasserait
le tour.** Pour S6 : « attendre la notification avant de finir son tour » reste la règle sûre.
Note : l'outil `Agent` de cette session n'expose pas `run_in_background` (constat L9) ; le classifieur du
mode auto a d'abord refusé l'appel parce qu'un hook en avait modifié l'entrée, il est passé à la
réémission à l'identique.
