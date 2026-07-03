# AGENTS.md

Instructions permanentes pour **Codex** (Claude Code ne lit pas ce fichier — il lit `CLAUDE.md`).
Codex charge ce fichier automatiquement ; il ne charge PAS les autres — ce fichier pointe vers eux.

## Rôle de Codex

**Uniquement l'audit visuel : UI, rendu, parcours utilisateur, via Playwright.**
Codex n'implémente pas de features et ne modifie pas le code applicatif — c'est le rôle de Claude
(plans dans `plans/`, commandes du projet dans `CLAUDE.md`). Ne jamais committer de secret.

## Audits UI (Playwright)

Ne pas installer Playwright dans le projet. Utiliser le runner partagé depuis la racine du projet à auditer :

```powershell
node "C:\Users\kovu\SynologyDrive\Thibault\Projets\.tooling\playwright-audit\audit.mjs" <url>
```

`--headed` affiche le navigateur ; `--output <dossier>` change la sortie (défaut : `output/playwright/`).
Démarrer d'abord le serveur du projet (commande dans son `CLAUDE.md`), puis auditer l'URL locale ;
consulter le rapport JSON (erreurs console/page, requêtes échouées, débordements horizontaux).
Si le projet a déjà une suite E2E `@playwright/test`, utiliser sa version locale — le runner partagé
sert aux audits ponctuels, pas à remplacer les tests versionnés.

## Restitution

Consigner les constats dans `VALIDATION.md` (statut `[!]` + description précise, écran/parcours concerné)
**sans modifier le code**. Si la tâche dépasse l'audit (correctif, refactor, choix produit) :
s'arrêter, résumer, rendre la main.
