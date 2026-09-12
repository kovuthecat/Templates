# 2026-09-12 — Fable et Codex sortent du workflow ; socle scindé d'un fichier d'exécutant

## Décision

1. **Fable hors workflow** : jamais dans une grille, une escalade ou une skill — lancé à la main
   par le mainteneur pour un cadrage ou une analyse. Escalade d'exécution :
   Haiku→Sonnet→Opus→`ARBITRAGE` (un échec Opus ne monte plus d'un cran).
2. **Codex hors workflow** : plus de régression visuelle scriptée déléguée ; l'interdit (jamais de
   Playwright ni de capture par script, seul le navigateur in-app fait le N1) reste seul.
   `plugin/AGENTS.md` supprimé.
3. **`WORKFLOW.md` §3b** (coût et cache) : faits vérifiés sur le prompt caching et leurs
   conséquences (réglage modèle/effort avant lancement, `/rewind` vs `/compact`, coût d'un
   `model:` de skill en cours de session, sous-agents à froid, vagues et commit).
4. **Socle scindé** (mesures A2/J0) : `CLAUDE-BASE.md` dédupliqué à 80 lignes ; nouveau
   `plugin/EXECUTANT.md` (39 lignes) porte ce qui ne sert qu'à une session d'exécution de plan.
5. **`relecteur-session`** lit l'Objectif et la Validation de chaque tâche avant le diff (A5).
   **Mémoire automatique** (B6) : `STATUS.md`/`index.md` font foi, jamais un souvenir.

## Contexte

`docs/analyses/2026-09-12-conseils-anthropic-contexte-skills-verification.md` confrontait le
workflow aux conseils Anthropic sur le contexte, les skills et la vérification. La mesure B1
proposait Fable en amont (cadrage) plutôt qu'en reprise d'échec ; le mainteneur tranche plus
largement — hors workflow, point. Codex n'avait plus de rôle réel depuis que le N1 in-app couvre
l'essentiel de son ancien périmètre (§6, depuis le 2026-07-28).

## Ce qui change

`plugin/WORKFLOW.md`, `CLAUDE-BASE.md`, `EXECUTANT.md` (nouveau), `AGENTS.md` (supprimé),
`bin/sync-workflow.mjs`, les skills `nouveau-projet`/`migrer-projet`/`maj-workflow`/
`orchestrer-plan`/`nouveau-plan`/`choisir-mecanisme`, `agents/relecteur-session.md`,
`templates/TASKS.md`, `README.md` (plugin et racine).

## Ce qui ne change pas

- La table de reprise par nature du 2026-09-09 (`environnement`/`exécution`/`prémisse`) : seule la
  case `exécution`/Opus perd son cran `Fable`.
- Les quatre agents mécaniques et `relecteur-session` : mêmes noms, même règle de premier plan.
- L'historique (`CHANGELOG.md`, décisions passées) : Fable et Codex y restent cités tels quels.

## Ce que les projets doivent faire

Dérouler `/maj-workflow`. Un `AGENTS.md` racine qui renvoie à `.claude/workflow/AGENTS.md` est
désormais signalé par la skill — fichier du projet, jamais touché par le sync : à supprimer ou à
réécrire à la main.
