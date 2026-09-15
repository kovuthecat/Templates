# 2026-09-15 — Analyse : première passe d'évals de déclenchement (`claude plugin eval`)

- Statut : **première passe faite**, résultat complet (pas de plafond de coût atteint).
- Workflow analysé : plugin **v0.36.0** (`plugin/.claude-plugin/plugin.json`), commit `dd825c8`
  (`plans/P5/S8/T26`).
- Claude Code : **2.1.270**.
- Commande exacte :
  ```
  claude plugin eval plugin/ --trust-plugin --no-publish --max-cost-usd 10 --json docs/analyses/evals-15.json
  ```
  Sortie brute conservée à côté de cette analyse : `docs/analyses/evals-15.json`.
- Coût affiché : **2.394681 USD**, durée 231 s, `"partial": false` (aucun `partialReason` — le
  plafond de 10 USD n'a pas été atteint).
- Ablation par défaut : `with-without` — chaque cas tourne deux bras, `with` (plugin chargé) et
  `without` (baseline sans plugin), 3 `runs` chacun, `max_turns: 3`.

## Table cas × verdict

| Cas | Score `with` | Score `without` | Δ | Conclusion |
| --- | --- | --- | --- | --- |
| `fin-de-tache-fin-de-session` | 1 (skill appelée 1×/1× sur les 3 runs) | 0 (skill jamais appelée) | +1 | **tient** |
| `orchestrer-plan-lancer-vague` | 0 (skill jamais appelée sur les 3 runs) | 0 (skill jamais appelée) | 0 | **ne tient pas** |
| `coquille-sans-skill` (4 graders : `fin-de-tache`, `orchestrer-plan`, `cadrer`, `nouveau-plan`) | 1 (0 appel sur les 4 skills × 3 runs = 12/12 restrictions tenues) | 1 (0 appel, structurellement impossible) | 0 | **ambigu** |

`aggregates` global : `casesTotal: 3`, `casesPassed: 2`, `overallScore: 0.667`, `meanDelta: 0.333`.

## Par cas

### `fin-de-tache-fin-de-session` — tient
Sur « J'ai terminé les tâches de `plans/P1/S2.md`, N0 est vert, tout est prêt à committer. Clos la
session. », la skill `fin-de-tache` est invoquée dans les 3 runs `with` (score 1, grader
`skill-invoquee` : « Skill called 1x »), et dans **aucun** des 3 runs `without` (score 0 : « Skill
called 0x »). Δ = 1, le maximum possible : le plugin est la cause du déclenchement, la baseline ne
le reproduit pas. Chaque run `with` a consommé les 3 tours autorisés (« Reached maximum number of
turns (3) ») — la skill est invoquée puis le budget de tours s'épuise avant qu'elle ne rende la
main, ce qui n'affecte pas le grader (`tool_used` ne regarde que l'appel, pas la suite).

### `orchestrer-plan-lancer-vague` — ne tient pas
Sur « Lance la vague 2 du plan P3. », la skill `orchestrer-plan` n'a été invoquée dans **aucun**
des 3 runs `with` (score 0, « Skill called 0x » à chaque fois) — et pas davantage dans les 3 runs
`without`, sans surprise puisque sans plugin la skill n'existe pas. Δ = 0. Les runs `with` épuisent
aussi les 3 tours (même erreur que ci-dessus) ; les runs `without` s'arrêtent seuls à 4-5 tours,
sans erreur. Lecture : soit le budget `max_turns: 3` est trop court pour que le modèle explore
(`plans/P3/index.md` n'existe pas dans ce bac à sable, cf. « Hors périmètre » du `S8.md` — la
session peut chercher le plan avant d'invoquer la skill et manquer de tours), soit la `description`
d'`orchestrer-plan` ne s'associe pas assez fort à ce tour de phrase. Les deux hypothèses ne sont pas
tranchées ici : ce n'est pas corrigé dans cette session (hors périmètre de S8), c'est une entrée
pour `/cadrer` ou `/analyser-incidents`.

### `coquille-sans-skill` — ambigu
Les 3 runs `with` obtiennent le score maximal sur les 4 graders négatifs (12/12 restrictions
tenues : aucune des skills `fin-de-tache`, `orchestrer-plan`, `cadrer`, `nouveau-plan` n'est
invoquée sur « Corrige la coquille « recieve » → « receive » dans `README.md`. »). Mais le bras
`without` obtient le **même score maximal** — anti-raccourci du plan (S8.md) : un score égal entre
les deux bras interdit de conclure « tient » directement. Ici l'égalité est **structurelle** et non
un signe que le plugin n'apporte rien par le jugement du modèle : sans plugin chargé, les quatre
skills n'existent pas, donc leur non-invocation dans `without` est acquise par construction, pas par
un raisonnement comparable à celui du bras `with`. Le signal informatif est uniquement celui du bras
`with` (12/12), mais la comparaison telle que l'outil la rend (`delta`) ne le distingue pas d'un cas
où le plugin n'aurait rien apporté — d'où **ambigu**, au sens strict de la règle anti-raccourci, et
non « tient ».

## Suites

- `orchestrer-plan-lancer-vague` (ne tient pas) et `coquille-sans-skill` (ambigu, lecture du bras
  témoin à muscler) : entrées possibles pour `/analyser-incidents` ou un prochain `/cadrer` — pas de
  correction de `description` de skill ici (hors périmètre de `plans/P5/S8.md`).
- Pas de plafond de coût atteint : rien à relancer pour compléter ce résultat.

## Lien avec B5
Voir `docs/analyses/2026-09-12-conseils-anthropic-contexte-skills-verification.md`, mesure B5 —
ligne « Statut » ajoutée par cette session.
