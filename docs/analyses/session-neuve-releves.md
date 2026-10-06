# Preuve P15 — relevés de la branche `preuve/session-neuve`

## Base

- Hash de base (`git rev-parse origin/main` après fetch) : `b583538f4b78c4bcb90850c998e664dbcf616b34` ;
  contient le commit de S1 (`bbaa3a0`, `Plan: P15/S1/T1`).
- Plugin chargé (`claude.exe plugin list`) : `workflow@templates` 0.55.0, scope local, enabled.
- `~/.claude/preuves/p15-pose.txt` : `2026-10-06T11:22:11.525Z` (heure de la pose).
- Règles `allow` commençant par `P15 —` dans `claude auto-mode config` : 7 (attendu : 7).
- `modelSettings["claude-opus-5-5"].effortLevel` dans `~/.claude/settings.json` : `low` (attendu).
- Instrument : restauré depuis le commit orphelin `1759667` (`preuves/reglage/transcription.mjs`).
- Rejeu de contrôle sur `b15f6ba1-….jsonl` : 5 requêtes, `claude-opus-5-5`, effort `medium`,
  rapport max(cache 2..n)/cache 1 = 0.058 — identique au tableau de P14 (§ B).
- Revers du réglage d'effort : jusqu'au retrait en S6, toute session Opus ouverte sur ce poste dans un
  projet sans `modelSettings` propre tourne en `low`.
