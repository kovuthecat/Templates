#!/usr/bin/env bash
# Comparaison manuelle orchestrateur Haiku/Sonnet × effort — cas orchestrateur-suit-le-script.
# Lot 2 : outils réellement restreints, hooks coupés, git isolé (pas de remote, config globale jetable).
S="/c/Users/Kovu/AppData/Local/Temp/claude/C--Users-Kovu-Projets-Templates/00843d99-5a8f-4304-8958-4371b238f098/scratchpad"
PROMPT="$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2' "$S/base/plugin/evals/orchestrateur-suit-le-script/prompt.md")"
OUT="$S/out3"; RUNS="$S/runs3"
UNSET=$(env | grep -oE "^(CLAUDE_CODE_[A-Z_]+|DISABLE_MICROCOMPACT|CLAUDECODE)=" | tr -d = | sed "s/^/-u /" | tr "
" " ")
mkdir -p "$OUT" "$RUNS"
export GIT_CONFIG_GLOBAL="$S/gitconfig-jetable"
: > "$GIT_CONFIG_GLOBAL"

run_one() {
  local model=$1 effort=$2 i=$3
  local id="$model-$effort-$i" dir="$RUNS/$model-$effort-$i"
  rm -rf "$dir"; cp -r "$S/base" "$dir"
  git -C "$dir" remote remove origin 2>/dev/null
  git -C "$dir" config user.name eval; git -C "$dir" config user.email eval@localhost
  ( cd "$dir" && env $UNSET claude -p "$PROMPT" --model "$model" --effort "$effort" \
      --max-turns 10 --max-budget-usd 2 --strict-mcp-config --tools Read Bash Skill --allowedTools Read Bash Skill \
      --settings '{"disableAllHooks":true}' \
      --plugin-dir "$dir/plugin" --output-format stream-json --verbose \
      --no-session-persistence > "$OUT/$id.jsonl" 2> "$OUT/$id.err" )
}

for model in haiku sonnet; do
  for effort in low medium high; do
    ( run_one $model $effort 1; run_one $model $effort 2 ) &
  done
done
wait
echo DONE
