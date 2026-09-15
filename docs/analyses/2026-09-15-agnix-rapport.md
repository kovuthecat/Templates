# 2026-09-15 — Rapport agnix sur `plugin/` (rapport seul, non exécuté)

- Statut : **à arbitrer** — aucune assertion n'est ajoutée à `tester-renvois.mjs` par ce fichier ;
  c'est une entrée pour un cadrage futur, pas une modification (P5/S3, décision (g)).
- Workflow analysé : plugin à la révision `fc1556f504d62508eb184a8cc68dd453ab4367d0`.
- Produit par : session Claude Code Desktop (P5/S3/T9), à la demande du plan `plans/P5/S3.md`.
- Portée : `agnix` n'est **jamais** adopté comme gate ; on lit une fois ce qu'il voit et on garde
  ce qui est déterministe et vrai pour le runtime local. « Conforme à un linter » n'est pas
  « conforme au runtime ».

## Commande prévue

```
npx agnix --dry-run --show-fixes plugin/
```

(repli si `npx` refuse : installation globale d'`agnix` sur le poste, hors Git — cf. « Hors
périmètre » de `plans/P5/S3.md`.)

## Constat : non exécuté ici

`npx agnix --version` (sondage préalable, avant la commande ci-dessus) a été refusé par le
classificateur du bac à sable de cette session, motif `[Code from External]` — exécution de code
récupéré sur le réseau, hors permissions accordées à cette session. Tenté deux fois, via deux
outils différents (Bash et PowerShell) : même refus les deux fois, donc pas une panne d'outil mais
une politique de permission du bac à sable. Conforme au « Si bloqué » de T9 (`plans/P5/S3.md`) :
« Pas de réseau ou `npx` indisponible → contrainte d'outillage, pas un échec. »

**Non exécuté ici : permission d'exécution de code externe refusée par le bac à sable de la
session (`[Code from External]`).** Aucune version d'`agnix` n'a donc pu être résolue, et aucune
règle n'a été inspectée — la table ci-dessous est vide par construction, pas par tri.

## Table triée

| Règle agnix | Fichier | Ce qu'elle dit | Tri | Motif |
| --- | --- | --- | --- | --- |
| — | — | — | — | agnix non exécuté ici (voir « Constat » ci-dessus) |

Colonnes de tri prévues pour la prochaine exécution, inchangées : **devient une assertion
locale** (déterministe, vrai pour ce runtime, absent de `tester-renvois.mjs`) · **faux positif
pour ce format** (la règle suppose une convention qu'agnix ne connaît pas — ex. un format de
frontmatter, une structure de skill différente de celle du plugin) · **à ignorer (style)**
(esthétique, sans effet sur le runtime).

## Conclusion

0 règle candidate à une assertion locale — agnix n'a pas tourné. Le mainteneur relance
`npx agnix --dry-run --show-fixes plugin/` sur son poste (ou une session dont le bac à sable
autorise l'exécution de paquets npm distants) et remplit la table ci-dessus ; la commande, la
révision inspectée et le contrat (jamais une gate) restent valables tels quels.
