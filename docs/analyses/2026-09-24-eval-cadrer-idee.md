# 2026-09-24 — Analyse : déclenchement de `/cadrer` sur une idée neuve, cas positif et négatif

- Statut : **passe faite**, résultat complet des deux cas (`"partial": false`, aucun plafond de
  coût atteint).
- Workflow analysé : arbre de travail de la branche `claude/cadrer-skill-exploration-ez46kx`, avant
  le bump de version — le manifeste lisait encore **0.43.0**, le texte évalué est celui de 0.44.0
  (description de `/cadrer` élargie, `model: opus`, annexe `deplier-une-idee.md`).
- Claude Code : **2.1.281**. Poste : session cloud Linux ; aucun cas n'accorde Bash
  (`allowed_tools: [Read, Glob, Grep, Skill]`).

## Commandes exactes

Un cas par lancement (`--case` ne se répète pas, constat du 2026-09-23) :

```
claude plugin eval plugin/ --trust-plugin --no-publish --max-cost-usd 2 --case idee-neuve-cadrer --json <scratch>/eval-positif.json
claude plugin eval plugin/ --trust-plugin --no-publish --max-cost-usd 2 --case feature-decidee-pas-cadrer --json <scratch>/eval-negatif.json
claude plugin eval plugin/ --trust-plugin --no-publish --max-cost-usd 2 --case coquille-sans-skill --json <scratch>/eval-coquille.json
```

Sorties brutes à côté de cette analyse : `evals-24-positif.json` (0,487 $, 72 s),
`evals-24-negatif.json` (0,710 $, 142 s) et `evals-24-coquille.json` (0,381 $, 37 s). Ablation
par défaut `with-without`, 3 `runs` par bras, `max_turns: 3`.

## Table cas × score

| Cas | Score `with` | Score `without` | Seuil | Verdict |
| --- | --- | --- | --- | --- |
| `idee-neuve-cadrer` (`Skill cadrer` min: 1) | **3/3** | 0/3 | `with` ≥ 2/3 | **tient** |
| `feature-decidee-pas-cadrer` (`Skill cadrer` min: 0 max: 0) | **3/3** | 3/3 | `with` 3/3 | **tient** |
| `coquille-sans-skill`, rejoué (`pas-cadrer` et trois autres gardes, max: 0) | **3/3** | 3/3 | `with` 3/3 | **tient** |

## Par cas

**`idee-neuve-cadrer`** — « J'ai une idée pour l'app : pouvoir partager une liste avec un proche.
Je ne sais pas encore si ça vaut le coup ni sous quelle forme — aide-moi à y réfléchir avant qu'on
en fasse quoi que ce soit. » Le plugin invoque `cadrer` dans les 3 runs `with`, aucun `without` :
Δ = 1, c'est la description qui déclenche. Chaque run `with` atteint `max_turns` après
l'invocation, sans effet sur le grader.

**`feature-decidee-pas-cadrer`** — « Ajoute un bouton « Exporter en CSV » à l'écran des factures,
à droite du bouton « Imprimer » : mêmes colonnes que le tableau affiché, séparateur
point-virgule. » Aucun run n'invoque `cadrer` : la mention « idée neuve à évaluer » n'aspire pas
une demande déjà spécifiée. Δ = 0, attendu pour un cas négatif.

**`coquille-sans-skill`** — cas existant, rejoué parce que la description de `/cadrer` a changé :
aucune des quatre skills gardées (`cadrer`, `fin-de-tache`, `nouveau-plan`, `orchestrer-plan`)
ne se déclenche sur une correction de coquille.

## Verdict

**PASS.** La description élargie sépare une idée à évaluer d'une fonctionnalité déjà décidée, et
n'aspire pas une correction triviale.
