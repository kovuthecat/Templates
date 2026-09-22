#!/usr/bin/env bash
# Construit trois bases (A, B, C) à partir de scratchpad/base, fixture P9 non commitée.
S="/c/Users/Kovu/AppData/Local/Temp/claude/C--Users-Kovu-Projets-Templates/00843d99-5a8f-4304-8958-4371b238f098/scratchpad"
F="$S/base/tests/fixtures/plans"
for c in A B C; do
  d="$S/cas/base-$c"; rm -rf "$d"; cp -r "$S/base" "$d"
  git -C "$d" rm -rq --cached plans/P9 2>/dev/null; rm -rf "$d/plans/P9"; mkdir -p "$d/plans/P9"
  for k in 1 2; do
    printf '# P9 · S%s\n\nCANARI-S%s : ce fichier ne doit jamais être ouvert par l orchestrateur.\n' $k $k > "$d/plans/P9/S$k.md"
  done
done

# A — vague parallèle à efforts mêlés, lignes « en clair »
cat > "$S/cas/base-A/plans/P9/index.md" <<'EOF'
# Plan P9 — Réservations : validation des dates

## Objectif d'ensemble
Refuser côté formulaire les réservations aux dates incohérentes.

Workflow : v0.40.0

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Règles de dates | Sonnet | low | — | — | `src/dates.mjs` | [ ] |
| [S2](S2.md) | T3 | Messages d'erreur | Opus | high | — | — | `src/messages.mjs` | [ ] |

## Ordonnancement
- **Vague 1 — parallélisable** : S1 · S2.
  *Pourquoi maintenant* : les deux zones sont disjointes et rien d'autre n'en dépend encore.
  - **S1** — Le formulaire refusera une date de départ antérieure à la date d'arrivée.
  - **S2** — Le client lira pourquoi sa réservation est refusée, dans ses mots à lui.
EOF

# B et C — base moteur, échec exécution sur S1
for c in B C; do
  sed 's/^# Plan P<n> — Fixture moteur (S10)/# Plan P9 — Fixture/; s/Workflow : v0.39.0/Workflow : v0.40.0/' "$F/moteur-base/index.md" > "$S/cas/base-$c/plans/P9/index.md"
done
cat > "$S/cas/base-B/plans/P9/S1.echec.md" <<'EOF'
# S1 — échec du 2026-09-22

Nature : exécution
Tentatives : reprise=0 enquete=0
Blocage : relancer le build après correction du type de retour de parseDate dans src/a.mjs
Auto : non
EOF
cat > "$S/cas/base-C/plans/P9/S1.echec.md" <<'EOF'
# S1 — échec du 2026-09-22

Nature : exécution
Tentatives : reprise=2 enquete=1
Blocage : le build casse toujours sur le type de retour de parseDate
Auto : non

## Issues
1. Typer parseDate en `Date | null` et traiter null chez les trois appelants — deux fichiers de plus hors zone.
2. Garder `Date` et lever une exception sur entrée invalide — change le contrat public de src/a.mjs.
3. Reporter T2 et livrer T1 seule — la validation des dates reste partielle.
EOF

for c in A B C; do echo "== $c"; (cd "$S/cas/base-$c" && node plugin/bin/prochaine-action.mjs P9); done
