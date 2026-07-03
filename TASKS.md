# TASKS.md

Index unique des tâches : backlog **et** tâches actives. Une ligne par tâche.
Le dossier de plan `plans/P<n>/` n'est créé qu'au **démarrage** du plan, pas en amont.

> **Frontières** — TASKS : le *quoi* (backlog + actif) · `STATUS.md` : l'état actuel (ce qui marche/casse) · `plans/` : le *comment* d'une tâche en cours · `VALIDATION.md` : checklist visuelle.

## Convention de ligne

`- [statut] T-ID — titre · modèle: X, effort: Y · plan: <lien ou —>`

- **statut** : ` ` à faire · `~` en cours · `x` fait
- **modèle** : Opus · Sonnet · Haiku (· Fable, rare · Codex pour l'audit visuel) — grille : `WORKFLOW.md` §2
- **effort** : `low · medium · high · xhigh · max` — suggestion à **vérifier manuellement avant de lancer la session** (pas de routing automatique). Repère : `WORKFLOW.md` §3
- **plan** : `—` tant que la tâche n'a pas démarré ; sinon `→ plans/P<n>/T<m>.md`

## Archivage

Purger les lignes `[x]` une fois leur plan clos — l'historique git suffit ; ce fichier doit rester court.

## Tâches

- [ ] T-001 — <titre> · modèle: Sonnet, effort: medium · plan: —
- [ ] T-002 — <titre> · modèle: Haiku, effort: low · plan: —
