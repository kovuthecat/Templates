# 2026-08-24 — Bootstrap cloud : `--yes` et timeout

## Décision
Le hook de bootstrap cloud appelle `claude plugin install` avec `--yes`, un `timeout: 90`
(clone réseau) et une garde `command -v claude` avant l'appel.

## Contexte
Le hook introduit en 0.10.0 comblait le trou du cloud (une session cloud ne clone jamais la
marketplace au démarrage, donc `enabledPlugins` seul n'y active rien — voir
[2026-08-24-sessionstart-bootstrap-hook.md](2026-08-24-sessionstart-bootstrap-hook.md)) mais
appelait `claude plugin install` sans `--yes`. Or ce flag est documenté « required when stdin or
stdout is not a TTY » : un hook n'a jamais de TTY, donc l'appel restait bloqué.

## Alternatives envisagées
Aucune : correctif direct sur un hook déjà en place, pas de branche alternative évaluée.

## Raison du choix
`--yes` débloque l'appel en contexte non interactif. Le `timeout: 90` borne le clone réseau pour
ne pas suspendre indéfiniment le démarrage de session. La garde `command -v claude` évite un appel
voué à l'échec quand le binaire n'est pas sur le `PATH`.

## Conséquences
Corollaire consigné : le fichier `settings` **et** le hook doivent être versionnés en mode
exécutable (`100755`) — le cloud ne voit que le clone, jamais un `chmod` local. Le vocabulaire
d'environnement du workflow s'élargit au cloud/mobile ; la distinction reste binaire, Desktop
étant le seul environnement à disposer du navigateur in-app et de `spawn_task`.
