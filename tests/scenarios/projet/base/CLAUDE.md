# CLAUDE.md

Mini-projet jetable des scénarios de bout en bout du workflow (`tests/scenarios/` du dépôt source).
Il n'a pas d'autre usage : de petites fonctions et leurs cas de test.

## Commandes

```bash
# Tests (toute la suite) — aucune dépendance
node test.mjs

# N0 (build + typecheck + tests du périmètre, ici : les tests)
node .claude/workflow/bin/n0.mjs
```

- Aucun secret, aucune variable d'environnement.

## Règles spécifiques au projet

- Une fonction par tâche, dans `src/ops.mjs`, et un cas de test dans `test.mjs` — motif : tâches
  déterministes mesurables — levée : sans objet.
