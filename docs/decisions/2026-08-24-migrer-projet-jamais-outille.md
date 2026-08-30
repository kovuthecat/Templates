# 2026-08-24 — `/migrer-projet` couvre le projet jamais outillé

## Décision
`/migrer-projet` devient le point d'entrée unique pour tout projet existant à rattacher au
workflow, y compris celui qui a du code mais n'a jamais été outillé — fusionné le jour même avec
l'ébauche de skill séparée `/adopter-projet`.

## Contexte
Un trou existait entre `/nouveau-projet` (repo vide, interview de cadrage complète) et
`/migrer-projet` (workflow v1 déjà en place, bascule vers v2) : rien ne couvrait le projet qui a
déjà du code mais n'a jamais été outillé avec le workflow.

## Alternatives envisagées
- Option A : skill séparée `/adopter-projet` dédiée à ce cas — d'abord écrite ainsi, puis écartée
  le jour même. Choisir entre les deux skills exigeait de l'utilisateur un diagnostic que la
  Phase A des deux skills faisait déjà tourner en interne, et la skill séparée devait de toute
  façon porter une trappe « arrête-toi et lance l'autre » — signe que la coupure était placée au
  mauvais endroit.

## Raison du choix
Un seul point d'entrée, un diagnostic qui classe l'état du projet en 4 états, puis deux voies
(bascule / adoption) encadrées par une gate commune et une Phase D commune.

## Conséquences
Principe de la voie adoption : le contexte se **dérive du code** (inventaire délégué aux agents
`explorateur` et `resumeur-git`), l'interview utilisateur est réduite aux 6 choses qu'aucune
lecture du code ne peut donner — pourquoi le projet existe, où il en est, la suite.
