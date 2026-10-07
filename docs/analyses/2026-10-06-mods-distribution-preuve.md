# Preuve P16/S4 — les garde-fous sont installés, actifs dans un projet vendoré, et absents sans eux

Mesuré le 2026-10-07 par la session P16/S4, sur `main` après la publication de 0.56.0. Binaire utilisé pour
tout (installation, `plugin list`, sondes `-p`) : `$CLAUDE_CODE_EXECPATH`, soit
`...\claude-code\2.1.289\e1f0154146bb\claude.exe`. Premier geste : `auth status` → `loggedIn: true`
(`authMethod: claude.ai`, abonnement `max`), pas de session expirée.

Ce que ça change pour toi : un projet vendoré qui lance `/maj-workflow` reçoit les garde-fous et un
sous-agent lancé sur une session de plan prend le modèle de l'index, sans qu'il soit écrit dans l'appel.

## 1. Publication 0.56.0 (T6)

Commande : `node plugin/bin/publier.mjs` → sortie 0. Lignes citées :

- `publier: OK — v0.56.0 · 117 fichiers · 1ad63ad46f222ed83e93b97a32d29f32fa3a3e72 confirmé sur
  https://github.com/kovuthecat/claude-workflow.git · tag v0.56.0 posé`
- `publier: plugin local à jour — workflow@templates 0.56.0, enabled`
- `installer-mods: garde-fous@templates 0.56.0, enabled`
- Contrôles amont : `OK garde-fous : version 0.56.0 alignée sur le workflow`, `plugin validate`, `plugin test`.

Contre-lecture, qui n'est pas la sortie du script :
`git ls-remote --tags https://github.com/kovuthecat/claude-workflow.git v0.56.0` →
`1ad63ad46f222ed83e93b97a32d29f32fa3a3e72 refs/tags/v0.56.0`. `claude plugin list` :

```
❯ garde-fous@templates   Version: 0.56.0   Scope: local   Status: ✔ enabled
❯ workflow@templates     Version: 0.56.0   Scope: local   Status: ✔ enabled
```

**Risque 2 du plan** (un dossier `mods/` dans le plugin `workflow` gênerait son chargement) : réfuté. Une
session neuve (`claude -p --output-format stream-json --verbose`, lancée dans Templates) rapporte dans son
message `init` : `workflow@templates` version 0.56.0 et `garde-fous@templates` version 0.56.0 chargés, et
15 skills `workflow:*` présentes (`workflow:cadrer` … `workflow:verif-visuelle`).

## 2. Installation dans un projet vendoré de test

Fixture dans le scratchpad (jamais commitée), `git init`, vendorée depuis le cache 0.56.0 :
`node $CACHE/bin/sync-workflow.mjs --source $CACHE --projet .` → `écrit: 81 · manifeste v0.56.0`, dont
`.claude/workflow/mods/garde-fous/{.claude-plugin/plugin.json,hooks/hooks.json,hooks/register.ts,tests/*}`.
`plans/P1/index.md` (squelette, **S1 en Haiku**) et `plans/P1/S1.md` (trivial).

`node .claude/workflow/bin/installer-mods.mjs` (dans la fixture) → 0 :

```
installer-mods: mode vendoré · marketplace workflow-mods-p16-fixture-4c65b5 · binaire ...\2.1.289\...\claude.exe
installer-mods: garde-fous@workflow-mods-p16-fixture-4c65b5 0.56.0, enabled — redémarrer les sessions ouvertes pour le charger
```

`claude plugin list` depuis la fixture : `garde-fous@workflow-mods-p16-fixture-4c65b5`, `Version: 0.56.0`,
`Read from: ...\p16-fixture\.claude\workflow\mods\garde-fous`, `Scope: local`, `Status: ✔ enabled`.
`garde-fous@templates` y apparaît `✘ disabled` : le scope `local` est par projet, l'installation de Templates
ne déborde pas dans la fixture.

## 3. Sonde positive : O1 agit avec les mods

Commande qui reproduit (depuis la fixture ; le prompt passe par stdin parce que `--allowedTools` avale
l'argument suivant) :

```bash
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 "$CLAUDE_CODE_EXECPATH" -p --model sonnet --output-format json \
  --allowedTools "Agent Read" < prompt.txt
# prompt.txt : Lance l'outil Agent avec subagent_type general-purpose, SANS aucun paramètre model ni
# run_in_background, et le prompt exact : Lis plans/P1/S1.md et réponds OK. Puis rends en une ligne ce
# que le sous-agent a répondu.
```

Transcription de la session (`~/.claude/projects/<fixture>/ae4d0290-….jsonl`), appel `Agent` tel qu'écrit :

```
tool_use Agent {"description":"Lire S1.md","subagent_type":"general-purpose","prompt":"Lis plans/P1/S1.md et réponds OK."}
```

Aucun paramètre `model`. Modèles lus dans les transcriptions :

- session principale (`isSidechain: false`) : `claude-sonnet-5-5` — lancée en Sonnet (`--model sonnet`) ;
- sous-agent (`subagents/agent-ac869773cbaf76a57.jsonl`, `isSidechain: true`) : `claude-haiku-4-5-20251001`
  sur ses quatre réponses ; `modelUsage` du résultat : `claude-sonnet-5-5` **et** `claude-haiku-4-5-20251001`.

**Verdict** : positif. Le sous-agent a tourné en Haiku, le modèle de la colonne Modèle de l'index, alors que
l'appel ne portait pas de `model` et que la session était en Sonnet.

## 4. Témoin négatif : sans les mods, le modèle de la session

`claude plugin disable garde-fous@workflow-mods-p16-fixture-4c65b5 --scope local` (→ `Status: ✘ disabled`),
même sonde, même prompt. Transcription (`d96c90be-….jsonl`) : même appel `Agent` sans `model` ; session
principale `claude-sonnet-5-5` ; sous-agent (`agent-a06dd02254302f3c0.jsonl`) `claude-sonnet-5-5` sur ses
deux réponses ; `modelUsage` : `claude-sonnet-5-5` seul, plus aucune trace de Haiku.

**Verdict** : positif (le témoin se comporte comme prévu). Seul le mod fait la différence : même fixture,
même prompt, même binaire. Puis `plugin enable` → `✔ enabled`.

## 5. Remise en ordre

`plugin uninstall garde-fous@workflow-mods-p16-fixture-4c65b5 --scope local` → désinstallé ;
`plugin marketplace remove workflow-mods-p16-fixture-4c65b5` → retirée ; fixture et son dossier de
transcriptions supprimés. `known_marketplaces.json` : `claude-plugins-official`, `templates` — exactement
les entrées d'avant. `plugin list` : `garde-fous@templates`, `workflow@templates` enabled, `design@synced`
loaded.

## Réfuté

- « Un module installé `--scope local` depuis `.claude/workflow/mods/` n'est pas chargé par une session `-p` »
  (risque 1 du plan) : réfuté, §3 et §4 — Haiku avec le mod, Sonnet sans.
- « Un dossier `mods/` dans le plugin `workflow` gêne son chargement » (risque 2) : réfuté, §1.
- « La session OAuth du `claude` en ligne de commande a expiré » (risque 4) : réfuté, `loggedIn: true`.

## Reste ouvert

- **O3** (premier plan par défaut) n'est prouvé que par ses tests (`plugin/mods/garde-fous/tests/`) et par la
  preuve P13 : cette session ne l'a pas mesuré en session réelle (la transcription ne rejoue pas l'entrée
  modifiée par un mod).
- **O1 sur une session lancée par `/orchestrer-plan`** (prompt de lancement réel) n'est pas rejoué : la sonde
  porte un prompt minimal contenant `plans/P1/S1.md`, forme que lit le mod.
- Risque 3 du plan (ligne d'état et panneau dans Desktop et sur téléphone) : hors périmètre ici, S7.
