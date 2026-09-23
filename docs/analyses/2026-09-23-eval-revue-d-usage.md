# 2026-09-23 — Analyse : déclenchement de `/revue-d-usage`, cas positif et négatif

- Statut : **passe faite**, résultat complet des deux cas (aucun plafond de coût atteint,
  `"partial": false` sur les deux lancements — pas de `partialReason`).
- Workflow analysé : plugin **v0.41.0** (`plugin/.claude-plugin/plugin.json`), après le commit
  `f1ba104` (`plans/P9/S3/T7` — aiguillages posés).
- Claude Code : **2.1.280**.
- Poste : Windows, pas de bac à sable (`docs/workflow/incidents/2026-09-17-…`) — aucun cas
  n'accorde Bash/PowerShell (`allowed_tools: [Read, Glob, Grep, Skill]`), donc pas concerné.

## Commande exacte

`--case` ne s'est **pas répété** (un seul cas exécuté sur les deux passés en argument) : deux
lancements, un `--json` chacun (T8, étape 2, repli annoncé).

```
claude plugin eval plugin/ --trust-plugin --no-publish --max-cost-usd 3 --case revue-d-usage-jalon --case verif-visuelle-pas-revue-d-usage --json docs/analyses/evals-23.json
```
→ n'a exécuté que `verif-visuelle-pas-revue-d-usage`. Relancé isolément pour le second cas :
```
claude plugin eval plugin/ --trust-plugin --no-publish --max-cost-usd 3 --case revue-d-usage-jalon --json docs/analyses/evals-23-positif.json
```
Sorties brutes conservées à côté de cette analyse : `docs/analyses/evals-23.json` (cas négatif,
coût 0.597 $, durée 59 s) et `docs/analyses/evals-23-positif.json` (cas positif, coût 0.626 $,
durée 65 s). Ablation par défaut `with-without` (3 `runs` chacun, `max_turns: 3`).

## Table cas × score

| Cas | Score `with` | Score `without` | Seuil | Verdict |
| --- | --- | --- | --- | --- |
| `revue-d-usage-jalon` (grader `Skill revue-d-usage min: 1`) | **3/3** | 0/3 | `with` ≥ 2/3 | **tient** |
| `verif-visuelle-pas-revue-d-usage` (`verif-visuelle` min:1 **et** `revue-d-usage` min:0/max:0) | **3/3** | — (with-only, cf. note) | `with` 3/3 sans `revue-d-usage` | **tient** |

## Par cas

### `revue-d-usage-jalon` — tient
Prompt : « On arrive au MVP, fais une revue d'usage de l'app : parcours, ergonomie,
accessibilité. » Le plugin invoque `revue-d-usage` dans les **3/3** runs `with`
(« Skill called 1x », grader `skill-invoquee`), et dans **0/3** runs `without` (« Skill called
0x ») — Δ = 1, le plugin est bien la cause du déclenchement, la baseline sans plugin ne le
reproduit pas.

### `verif-visuelle-pas-revue-d-usage` — tient
Prompt : « J'ai fini la tâche T3 de `plans/P1/S2.md` qui change l'écran de connexion, vérifie-le
visuellement. » Les **3/3** runs `with` invoquent `verif-visuelle` (grader
`verif-visuelle-invoquee`, « Skill called 1x ») et **aucun** n'invoque `revue-d-usage` (grader
`pas-revue-d-usage`, « Skill called 0x », `max: 0` tenu). Les deux graders `tool_used: Skill`
sont marqués `withOnly` par l'ablation par défaut (note de l'outil : « graders marked with-only
… become a plugin-fired indicator rather than part of the score ») — c'est le score `with` seul
qui prouve la séparation, cohérent avec le seuil demandé par T8 (« `with` 3/3 sans
`revue-d-usage` », sans exiger de comparaison `without` pour ce cas). Chaque run `with` a atteint
`max_turns` (« Reached maximum number of turns (3) »), sans affecter le grader `tool_used`.

## Verdict

**PASS.** Les deux seuils de T8 sont atteints au premier tour, sans ambiguïté ni plafond de coût
atteint : la description de `/revue-d-usage` (jalon, parcours, ensemble de l'app) se distingue
bien de celle de `/verif-visuelle` (écran, après une tâche) pour le modèle qui décide de
déclencher une skill. Aucune modification de `description` nécessaire. S4 peut publier.
