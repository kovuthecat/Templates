# CLAUDE.md

Instructions permanentes pour Claude Code. Seul fichier chargé automatiquement :
il pointe vers le reste, sans le recopier. Plafond : **200 lignes** — au-delà, le coût est payé
à chaque session de chaque projet.

## Commandes

> Remplir avec les commandes réelles du projet. Section la plus utile : évite à Claude de deviner.

```bash
# Dev / serveur local
<commande dev>

# Build
<commande build>

# Tests (toute la suite)
<commande test>

# Test unitaire ciblé
<commande test fichier/cas précis>

# Lint / format
<commande lint>

# Typecheck — VÉRIFIER À L'INSTANCIATION qu'elle compile vraiment quelque chose :
#   <commande typecheck> --listFiles | grep -v node_modules | wc -l   → doit être NON NUL.
# Piège : sur un scaffold Vite/TS, le tsconfig racine est en `files: []` + références de projet,
# et `tsc --noEmit` y compile 0 fichier — un vert vide qui ne bloque plus rien. Dans ce cas la
# commande est `tsc -b --noEmit`. (Constaté sur 3 projets, cf. Templates/DECISIONS.md 2026-08-02.)
<commande typecheck>
```

- Variables d'environnement : `<emplacement .env / .env.example>`
- Ne jamais committer de secret (`.env`, clés, tokens).
- Serveur dev déclaré dans `.claude/launch.json` (nécessaire à la validation N1 — `/verif-visuelle`).

<!-- Règles communes injectées à chaque session par le plugin `workflow` (hook SessionStart) — ne pas les recopier ici. -->

## Règles spécifiques au projet

> À remplir à l'instanciation.

- **Ce dépôt est la source du workflow, il n'est pas vendoré** : il charge son propre `plugin/`,
  par une installation **locale au poste** (`.claude/settings.local.json`, jamais commité — le
  chemin de la marketplace y est absolu). Sur un poste neuf, depuis la racine :
  `claude plugin marketplace add ./plugin --scope local` puis
  `claude plugin install workflow@templates --scope local`. Après un bump de version :
  `claude plugin update workflow@templates --scope local` (sans `--scope local`, la commande cherche
  au scope `user` et répond « Plugin "workflow" is not installed at scope user » — constaté le
  2026-09-22, à la publication de 0.41.0). Jamais de marketplace de **compte** (claude.ai) : elle
  s'applique à tous les projets et y double le workflow vendoré (constat du 2026-09-17).
