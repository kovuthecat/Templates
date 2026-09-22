#!/usr/bin/env bash
# Sonnet low/medium/high × cas A/B/C × 3 essais — environnement nettoyé, git isolé.
S="/c/Users/Kovu/AppData/Local/Temp/claude/C--Users-Kovu-Projets-Templates/00843d99-5a8f-4304-8958-4371b238f098/scratchpad"
C="$S/cas"; OUT="$C/out"; RUNS="$C/runs"; mkdir -p "$OUT" "$RUNS"
UNSET=$(env | grep -oE '^(CLAUDE_CODE_[A-Z_]+|DISABLE_MICROCOMPACT|CLAUDECODE)=' | tr -d = | sed 's/^/-u /' | tr '\n' ' ')
export GIT_CONFIG_GLOBAL="$S/gitconfig-jetable"; : > "$GIT_CONFIG_GLOBAL"
PROMPT="Tu orchestres le plan P9 de ce dépôt : déroule la skill /orchestrer-plan (plugin workflow, chargé depuis plugin/).

Contrainte de ce bac à sable : les outils Agent et SendMessage n'y existent pas. Déroule la skill jusqu'au PREMIER geste qui les demanderait, ou jusqu'à une question à l'utilisateur. Écris alors ce geste exactement comme tu l'exécuterais — le bloc d'appel complet dans un bloc de code, précédé de tout texte que la skill impose de montrer à l'utilisateur à ce moment — puis arrête-toi. Aucun autre geste après."

run_one() {
  local cas=$1 effort=$2 i=$3 id="$1-sonnet-$2-$3" dir="$RUNS/$1-sonnet-$2-$3"
  rm -rf "$dir"; cp -r "$C/base-$cas" "$dir"
  git -C "$dir" remote remove origin 2>/dev/null
  git -C "$dir" config user.name eval; git -C "$dir" config user.email eval@localhost
  ( cd "$dir" && env $UNSET claude -p "$PROMPT" --model sonnet --effort "$effort" \
      --max-turns 15 --max-budget-usd 2 --strict-mcp-config --tools Read Bash Skill --allowedTools Read Bash Skill \
      --settings '{"disableAllHooks":true}' --plugin-dir "$dir/plugin" \
      --output-format stream-json --verbose --no-session-persistence > "$OUT/$id.jsonl" 2> "$OUT/$id.err" )
}

for cas in A B C; do
  for effort in low medium high; do
    ( for i in 1 2 3; do run_one $cas $effort $i; done ) &
  done
done
wait
echo DONE
