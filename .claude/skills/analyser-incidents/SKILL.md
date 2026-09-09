---
name: analyser-incidents
description: Ramasser les incidents de workflow déposés par tous les projets (docs/workflow/incidents/) et en tirer des corrections du plugin. Skill propre au dépôt source Templates — à dérouler périodiquement, ou quand un projet signale un incident.
model: opus
---

# Analyser les incidents de workflow

Chaque projet équipé dépose ses incidents de workflow dans `docs/workflow/incidents/`
(`plugin/WORKFLOW.md` §9b) et les pousse avec son travail. Ils ne valent que relus **ensemble** :
c'est ici, et seulement ici, qu'un refus vu dans trois projets devient un défaut du gabarit.

Cette skill ne tourne que dans le dépôt source (`bin/collecter-incidents.mjs` n'est pas vendoré).
Elle produit des **décisions et des corrections du plugin**, jamais des correctifs dans les projets.

## Étape 1 — Ramasser

```bash
node plugin/bin/collecter-incidents.mjs --fetch --depuis <date de la dernière synthèse>
```

La date vient du dernier fichier `docs/incidents/YYYY-MM-DD-synthese.md` de ce dépôt (aucun →
sans `--depuis`). Des projets en `RETARD` sur leur amont peuvent cacher des incidents : le dire à
l'utilisateur avec la liste, et lui laisser faire le `git pull` — ce script ne touche à rien.

## Étape 2 — Lire les fichiers, regrouper

Ouvrir chaque incident listé (ils tiennent en 25 lignes). Regrouper par **cause probable**, pas
par projet : même étape + même symptôme = un groupe. Un incident à l'en-tête incomplet (⚠) est
lui-même un signal — le gabarit ou la consigne qui l'a produit n'est pas assez contraignant.

Pour chaque groupe, une ligne : `<n> incident(s) · <étape> · <ce qui casse> · projets : …`.

## Étape 3 — Décider, groupe par groupe

Trois issues, et une seule par groupe :

- **Correction directe du plugin** — la cause est localisée et le remède mécanique (allowlist du
  gabarit, ligne de skill, condition de hook) : faire la correction sous `plugin/`, bump de
  version, `CHANGELOG.md`, publication (`/fin-de-tache` point 8b).
- **Cadrage** — la cause est un choix de conception du workflow : `/cadrer`, avec les incidents
  du groupe comme entrée. Ne pas trancher ici.
- **Bruit** — incident isolé, cause propre au projet : le dire, ne rien changer.

## Étape 4 — Synthèse écrite

`docs/incidents/YYYY-MM-DD-synthese.md` dans ce dépôt : les groupes, l'issue choisie pour chacun,
et la liste des fichiers d'incident couverts (chemin complet). C'est ce fichier qui borne la
prochaine passe (`--depuis`). Commit dédié, push en fin d'unité de travail (`WORKFLOW.md` §4b).
