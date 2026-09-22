#!/usr/bin/env bash
# Pose les trois bases de mesure (A, B, C) dans un dossier temporaire du système — jamais dans le
# dépôt. Clone le dépôt courant, pose les fixtures, les commite, retire `origin`, fixe une identité
# git locale, puis vérifie `prochaine-action.mjs` avant tout lancement (un autre résultat que
# l'attendu ci-dessous est une fixture à corriger, pas un attendu à ajuster — plans/P8/S5.md, T11).
#
# Usage : bash tests/evals-orchestrateur/poser-cas.sh
# Écrit le chemin de la base posée dans `${TMPDIR:-/tmp}/evals-orchestrateur-base.txt`, lu ensuite
# par `lancer.sh` et `noter.mjs`.
set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# État écrit dans le dépôt (gitignored), pas dans un TMPDIR : bash et `node` (noter.mjs) peuvent
# résoudre des temporaires système différents sur ce poste (MSYS /tmp vs os.tmpdir() de Node) —
# un seul domicile pour le chemin de la base évite le désaccord.
ETAT="$(dirname "${BASH_SOURCE[0]}")/.dernier-lancement"
BASE="$(mktemp -d -t evals-orchestrateur-XXXXXX)"
# Chemin Windows (barres obliques) : lisible tel quel par bash comme par Node sur ce poste.
if command -v cygpath >/dev/null 2>&1; then BASE_NODE="$(cygpath -m "$BASE")"; else BASE_NODE="$BASE"; fi
echo "Base : $BASE"

rm -rf "$BASE/clone"
git clone -q "$RACINE" "$BASE/clone"
mkdir -p "$BASE/cas"

for c in A B C; do
  d="$BASE/cas/base-$c"; rm -rf "$d"; cp -r "$BASE/clone" "$d"
  rm -rf "$d/plans/P9"; mkdir -p "$d/plans/P9"
  for k in 1 2; do
    printf '# P9 · S%s\n\nCANARI-S%s : ce fichier ne doit jamais être ouvert par l orchestrateur.\n' "$k" "$k" > "$d/plans/P9/S$k.md"
  done
done

# A — vague parallèle à efforts mêlés, lignes « en clair »
cat > "$BASE/cas/base-A/plans/P9/index.md" <<'EOF'
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

# B et C — base moteur (fixture existante du dépôt), échec exécution sur S1
F="$RACINE/tests/fixtures/plans"
for c in B C; do
  sed 's/^# Plan P<n> — Fixture moteur (S10)/# Plan P9 — Fixture/; s/Workflow : v0.39.0/Workflow : v0.40.0/' \
    "$F/moteur-base/index.md" > "$BASE/cas/base-$c/plans/P9/index.md"
done
cat > "$BASE/cas/base-B/plans/P9/S1.echec.md" <<'EOF'
# S1 — échec du 2026-09-22

Nature : exécution
Tentatives : reprise=0 enquete=0
Blocage : relancer le build après correction du type de retour de parseDate dans src/a.mjs
Auto : non
EOF
# Cas C — les trois lignes `## Issues` au format posé par S2/T5 : `N. <option> — <coût> · débloque <…>`.
cat > "$BASE/cas/base-C/plans/P9/S1.echec.md" <<'EOF'
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

for c in A B C; do
  git -C "$BASE/cas/base-$c" add -A
  git -C "$BASE/cas/base-$c" -c user.name=eval -c user.email=eval@localhost commit -q -m "fixture cas $c"
  git -C "$BASE/cas/base-$c" remote remove origin 2>/dev/null || true
  git -C "$BASE/cas/base-$c" config user.name eval
  git -C "$BASE/cas/base-$c" config user.email eval@localhost
done

echo "Vérification (prochaine-action.mjs) — un autre résultat que ci-dessous est une fixture à corriger :"
FAIL=0
for c in A B C; do
  echo "== $c"
  sortie="$(cd "$BASE/cas/base-$c" && node plugin/bin/prochaine-action.mjs P9)"
  echo "$sortie"
  case "$c" in
    A) echo "$sortie" | grep -q '^lancer' || { echo "ATTENDU : lancer — obtenu ci-dessus"; FAIL=1; } ;;
    B) echo "$sortie" | grep -q '^reprendre — S1 (Opus)' || { echo "ATTENDU : reprendre — S1 (Opus)"; FAIL=1; } ;;
    C) echo "$sortie" | grep -q '^question' || { echo "ATTENDU : question — obtenu ci-dessus"; FAIL=1; } ;;
  esac
done
if [ "$FAIL" != 0 ]; then
  echo "Fixture non conforme à l'attendu — corriger la fixture, pas l'attendu (T11)." >&2
  exit 1
fi

echo "$BASE_NODE" > "$ETAT"
echo "Base posée : $BASE (chemin dans $ETAT)"
