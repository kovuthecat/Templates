# 2026-09-12 — La revue dépose son fichier d'abord, l'orchestrateur attend ses enfants

## Décision

Quatre correctifs de prose, tirés de seize incidents réels remontés par Chords, DoxUploader et MYO
(plugin `workflow` 0.27.0) :

1. **`relecteur-session` écrit `plans/P<n>/S<k>.revue.md` en premier geste**, avant toute lecture —
   `Bloquant : 0`, `Couverture : en cours`, sections vides à `- aucun`. Réécrit en entier à la fin,
   `Couverture : complète`. Périmètre restreint au code : commits documentaires et fichiers de
   données (diff d'une ligne) ne se relisent plus, aucun script d'extraction.
2. **`/orchestrer-plan` réplique sur `general-purpose`** quand `Agent({subagent_type:
   "relecteur-session"})` échoue (agent absent du bac à sable) — même fichier d'agent, tenu par un
   agent générique.
3. **`/orchestrer-plan` attend les enfants encore en cours** (`ListAgents`) avant de conclure `FAIL`
   sur une réponse sans `VERDICT:` et sans commit : le symptôme d'une session qui a lancé une tâche
   de fond puis rendu la main.
4. **Le filtre de contenu devient une nature d'échec à part** dans la table de reprise
   (`/orchestrer-plan` 5c) : `ARBITRAGE` direct, jamais de reprise à mécanique d'écriture identique.

## Contexte

- **G1** (7 occurrences, Chords + DoxUploader) : `relecteur-session` (`maxTurns: 30`) épuise ses
  tours sans avoir écrit son fichier — il enquête avant d'écrire, relit des diffs à 34 `.revue.md`
  supprimés, ou des `data/truth/*.json` en écrivant des scripts d'extraction tour après tour. Une
  relance « écris le fichier avant d'approfondir » a abouti en 24 tours. Fichiers :
  `Chords/.../2026-09-09-relecteur-session-limite-de-tours.md`, `...-limite-de-tours-S11.md`,
  `2026-09-10-relecteur-session-limite-de-tours-S7.md`,
  `DoxUploader/.../2026-09-11-relecteur-session-tours-epuises.md`.
- **G2** (MYO ×2) : `Agent type 'relecteur-session' not found` dans l'orchestrateur lui-même.
  Fichiers : `MYO/.../2026-09-11-relecteur-session-absent.md`, `...-absent-s5.md`.
- **G3** (MYO + Chords) : une session orchestrée lance une tâche de fond puis rend la main sans
  `VERDICT:`. MYO S5 : `FAIL` conclu, reprise Opus lancée, `VERDICT: PASS` arrivé 40 min plus tard
  du même agent. Fichiers : `MYO/.../2026-09-11-verdict-perdu-en-route-s5.md`,
  `Chords/.../2026-09-10-session-sans-verdict-sous-agent-interne.md`.
- **G4** (Chords ×3) : sessions tuées par `Output blocked by content filtering policy`, reprise
  automatique « même modèle » relancée 4 fois à l'identique, toujours tuée. Fichiers :
  `Chords/.../2026-09-10-agent-content-filter-sessions-tuees-S4-S6.md`, `...-faux-positifs.md`,
  `2026-09-10-filtre-contenu-S6-pendant-lecture-page.md`.

## Ce qui change

`plugin/agents/relecteur-session.md`, `plugin/skills/orchestrer-plan/SKILL.md` (Étapes 3-5c),
`plugin/WORKFLOW.md` §9a, `plugin/skills/fin-de-tache/SKILL.md`, `plugin/skills/nouveau-plan/SKILL.md`
(gabarits `Latitude`/`Référence`), `plugin/agents/verificateur-n0.md` + `plugin/templates/CLAUDE.md`
(mesure A7), `plugin/skills/cadrer/SKILL.md` (mesure C2).

## Ce qui ne change pas

- Le format `Bloquant : <n>` en première ligne, les seuils bloquant/backlog, `maxTurns: 30`.
- La table de reprise par nature du 2026-09-09 (`environnement`/`exécution`/`prémisse`) — le filtre
  de contenu s'y ajoute, il ne la remplace pas.
- Fable et Codex, non touchés (vague suivante).
