#!/usr/bin/env bash
# Pose les trois bases (poser-cas.sh) puis rejoue les cas A/B/C — environnement nettoyé, git isolé.
# Par défaut : Sonnet, effort low, 3 essais par cas (mesure de plans/P8/S5.md, T11).
# Paramètres pour des mesures futures (K5, ou un autre effort) :
#   bash tests/evals-orchestrateur/lancer.sh [--model sonnet|opus|haiku] [--effort low|medium|high] [--essais N]
set -euo pipefail

MODEL=sonnet
EFFORT=low
ESSAIS=3
while [ $# -gt 0 ]; do
  case "$1" in
    --model) MODEL="$2"; shift 2 ;;
    --effort) EFFORT="$2"; shift 2 ;;
    --essais) ESSAIS="$2"; shift 2 ;;
    *) echo "argument inconnu : $1" >&2; exit 2 ;;
  esac
done

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$ICI/poser-cas.sh"

ETAT="$ICI/.dernier-lancement"
BASE="$(cat "$ETAT")"
OUT="$BASE/out"; RUNS="$BASE/runs"; mkdir -p "$OUT" "$RUNS"

# Piège tenu (cf. README, pièges de plans/P8/harnais/README.md) : les variables CLAUDE_CODE_* et
# DISABLE_MICROCOMPACT héritées d'une session Desktop compactent le contexte vers 20 k tokens.
UNSET=$(env | grep -oE '^(CLAUDE_CODE_[A-Z_]+|DISABLE_MICROCOMPACT|CLAUDECODE)=' | tr -d = | sed 's/^/-u /' | tr '\n' ' ')
export GIT_CONFIG_GLOBAL="$BASE/gitconfig-jetable"; : > "$GIT_CONFIG_GLOBAL"

PROMPT="Tu orchestres le plan P9 de ce dépôt : déroule la skill /orchestrer-plan (plugin workflow, chargé depuis plugin/).

Contrainte de ce bac à sable : les outils Agent et SendMessage n'y existent pas. Les agents du plugin (session-low, session-high, …) sont, eux, bien chargés depuis plugin/agents/ : ils ne t'apparaissent pas parce que l'outil Agent est coupé ici, ce n'est pas un agent manquant — le préflight « agents du plugin absents du bac à sable » ne s'applique donc pas. Déroule la skill jusqu'au PREMIER geste qui les demanderait, ou jusqu'à une question à l'utilisateur. Écris alors ce geste exactement comme tu l'exécuterais — le bloc d'appel complet dans un bloc de code, précédé de tout texte que la skill impose de montrer à l'utilisateur à ce moment — puis arrête-toi. Aucun autre geste après."

run_one() {
  local cas=$1 i=$2
  local id="$cas-$MODEL-$EFFORT-$i"
  local dir="$RUNS/$id"
  rm -rf "$dir"; cp -r "$BASE/cas/base-$cas" "$dir"
  git -C "$dir" remote remove origin 2>/dev/null || true
  git -C "$dir" config user.name eval; git -C "$dir" config user.email eval@localhost
  ( cd "$dir" && env $UNSET claude -p "$PROMPT" --model "$MODEL" --effort "$EFFORT" \
      --max-turns 15 --max-budget-usd 2 --strict-mcp-config --tools Read Bash Skill --allowedTools Read Bash Skill \
      --settings '{"disableAllHooks":true}' --plugin-dir "$dir/plugin" \
      --output-format stream-json --verbose --no-session-persistence > "$OUT/$id.jsonl" 2> "$OUT/$id.err" )
}

for cas in A B C; do
  ( for i in $(seq 1 "$ESSAIS"); do run_one "$cas" "$i"; done ) &
done
wait
echo "DONE — sortie dans $OUT"
