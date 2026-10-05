# 2026-10-05 — Preuve mods : mesures M1 à M4

> Plan P12/S1, branche jetable `preuve/mods`. Décision d'origine :
> `docs/decisions/2026-10-05-preuve-mods.md`. Moteur Desktop 2.1.286 (SDK 0.3.286), CLI du PATH 2.1.274.

## Ce que ça change, en clair

- **On peut voir l'orchestration pendant qu'elle tourne.** Un panneau dans l'onglet Code de
  Desktop affiche l'état d'un plan et se met à jour seul, à chaque session lancée ou terminée (M4 positif).
- **On peut chiffrer un plan, session par session.** Le mod relève les tokens de l'orchestrateur et
  de chaque sous-agent séparément. Le seul déroulé fait montre que **l'orchestrateur coûte plus
  que les sessions** (M3 : premier chiffre, écart entre deux déroulés non mesuré).
- **Une garde git par mod n'apporte rien** : le hook classique refuse déjà le commit d'un sous-agent
  au premier plan sous verrou (M2 négatif, prémisse de l'incident du 2026-09-17 réfutée dans ce cas).
- **On ne sait toujours pas si un mod se distribue sans réglage** (M1 non conclu) : les deux essais
  portaient sur un module que le moteur refusait, et aucun outil du workflow ne l'avait vu.
- Revers : le mod ne charge aujourd'hui qu'à chaud, depuis le dossier des mods de la session, sur
  « Enable for this session » accepté par l'utilisateur, conversation par conversation.

## M1 — Le mod charge-t-il sans réglage ?

**Critère (décision § M1)** : positif si « `session.start` du mod s'exécute et les cinq hooks
restent actifs » ; négatif s'« il faut une variable, un hot-reload ou un second fichier, ou un hook
casse ».

**Protocole exécuté** :
1. Conversation 2 (neuve, plugin `workflow@templates` 0.53.0 installé `--scope local` avec
   `observateur.tsx` et `"modules"` dans `hooks.json`) : journal absent, `/etat-plan` inconnue.
2. Conversation 3 (neuve, `CLAUDE_CODE_PLUGIN_DIRS=C:/Users/Kovu/Projets/Templates/plugin` dans
   `~/.claude/settings.json` `env`, présente dans le processus) : journal absent après 8 appels
   d'outils, `/etat-plan` inconnue, aucune ligne grisée dans le fil.
3. Diagnostic : le module de T1 est **refusé par le moteur**.
   `"$CLAUDE_CODE_EXECPATH" plugin validate ~/.claude/plugins/cache/templates/workflow/0.53.0/.claude-plugin/plugin.json`
   → `✘ … $ is passed to "noter", which is not a function declared at the top of this file`.
4. Module corrigé (commit `2e67004`) : validé par le moteur 2.1.286. Pas de nouvelle conversation à
   froid pour le remesurer (choix utilisateur : budget).

**Verdict : non conclu.** Les deux négatifs mesurent un module invalide, pas la distribution.
Seul fait acquis : le module **corrigé**, copié sous un autre nom dans le dossier des mods de la
session, charge à chaud — `{"evt":"session.start","plugin":"observateur-preuve","surface":null,"interactif":false}`.
`interactif: false` : le moteur Desktop tourne en mode non interactif (SDK).

**Reproduire** : remettre `CLAUDE_CODE_PLUGIN_DIRS` (ou réinstaller le plugin `--scope local` après
`uninstall`), ouvrir une conversation Desktop neuve, lire `~/.claude/preuves/mods/journal.jsonl`
et taper `/etat-plan`. Coût de distribution déjà constaté : `claude plugin update` répond « déjà
à jour » à version égale et ne copie pas le module — il faut `uninstall` + `install`.

## M2 — Le mod voit-il les outils des sous-agents ?

**Critère (décision § M2)** : positif si « `agentId` est présent et le hook classique reste
muet » ; négatif si « `agentId` est absent, ou le hook classique se déclenche déjà ».

**Protocole exécuté** : `.claude/wave.lock` factice (« preuve P12 M2 »), puis
`Agent({ subagent_type: "workflow:session-low", run_in_background: false })` qui exécute
`git commit --allow-empty -m 'preuve M2'`.

**Relevé** :
- Sortie du sous-agent : `PreToolUse:Bash hook error: Vague parallèle en cours (.claude/wave.lock présent) : ni commit ni push…`
- `git log -1` : `2e67004 fix(preuve): …` — aucun commit `preuve M2`.
- Journal : `{"evt":"tool.call","outil":"Bash","agentId":"ace5b9c411e40977f","resultat":"ok"}` —
  le `Bash` **du sous-agent**, `agentId` présent.

**Verdict : négatif** (le hook classique se déclenche déjà). La prémisse de l'incident
`2026-09-17-commit-sous-verrou-non-bloque` est **réfutée** pour un sous-agent au premier plan, dans
Desktop, avec les hooks du plugin installé. Non testé : sous-agent en arrière-plan, session cloud.

**Reproduire** : `echo x > .claude/wave.lock` (commande à part), puis le même appel `Agent` ;
retirer le verrou ensuite.

## M3 — Combien coûte un plan, et où ?

**Critère (décision)** : positif si « écart < 15 % entre les deux exécutions et poste dominant
identifié » ; négatif si « usage absent ou incomplet pour les sous-agents ».

**Protocole exécuté** : P90 (2 sessions Haiku `low`, séquentielles, une ligne de fichier chacune,
preuve N0 requise), orchestré par cette conversation (Opus 5.5, contexte déjà long). **P91 non
joué** (budget, choix utilisateur). M3b non joué.

**Usage P90**, fenêtre `1791211360300` → fin de vague 2 (somme des `turn.complete`) :

| Poste | Modèle | Tours | Outils | Input | Output | Cache read | Cache creation |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Orchestrateur | Opus 5.5 | 5 | 22 | 54 | 8 809 | 4 411 905 | 23 999 |
| Session S1 | Haiku 4.5 | 1 | 22 | 189 | 5 825 | 1 352 641 | 68 311 |
| Session S2 | Haiku 4.5 | 1 | 30 | 252 | 7 124 | 1 859 723 | 68 477 |

- Usage présent pour chaque sous-agent : la condition du négatif n'est pas remplie.
- Poste dominant : **cache read de l'orchestrateur**, 58 % des tokens lus en cache, et au prix
  Opus. Biais connu : l'orchestrateur était cette conversation longue, en Opus au lieu de Sonnet ;
  le chiffre est une borne haute.
- Chaque session prend ≈ 68 k de cache creation : le préfixe système + `EXECUTANT.md` + skills,
  payé une fois par session.
- Indication seulement : S1 et S2 font la même tâche, et S2 coûte 37 % de cache read de plus (8 outils de plus).
- Durées : S1 8 min 13 s, S2 8 min 8 s, dont ≈ 3 min 20 s de N0 complet chacune (toute la suite pour
  une ligne de texte). L'orchestrateur a dû relancer N0 trois fois (≈ 10 min) : voir Défauts relevés.

**Verdict : non conclu, un seul déroulé** (clause « Si bloqué » de T4). Le poste dominant est
identifié ; l'écart entre deux déroulés n'est pas mesuré.

**Reproduire** : `node ~/.claude/preuves/mods/agreger.mjs <debut_ms> <fin_ms> [sortie.json]` (hors
dépôt ; lit `~/.claude/preuves/mods/journal.jsonl`) ; relevé brut : `~/.claude/preuves/mods/usage-P90.json`.

## M3b — Un levier de réduction

Non mesuré (budget).

## M4 — L'état du plan s'affiche-t-il dans Desktop ?

**Critère (décision)** : positif si « l'état est visible et à jour sans rien demander, et aucune
ligne de refus n'apparaît dans le transcript » ; négatif si « rien n'est rendu dans Desktop, ou
`$.process` est refusé et `$.fs` ne suffit pas ».

**Relevé** (captures de l'onglet Code par l'utilisateur) : `/etat-plan` ouvre un panneau latéral
« État P90 » avec la sortie JSON de `prochaine-action.mjs P90 --json` (`$.process.run` accepté).
Il passe seul de `lancer / vague 1 / S1` à `lancer / vague 2 / S2`, puis à `pousser`, sans geste
de l'utilisateur. Aucune ligne de refus dans le fil.

**Verdict : positif.** Limite : l'ouverture demande `/etat-plan` (un panneau ouvert sans geste
attend 144 colonnes, d'après la doc).

## Réfuté

- **« Le hook classique ne voit pas les sous-agents »** (incident 2026-09-17) : réfuté pour un
  sous-agent au premier plan dans Desktop (M2).
- **« `claude plugin validate plugin` passe, donc le module est valide »** (Bilan T1) : réfuté.
  Sur `plugin/`, la commande ne lit que `marketplace.json`. Et le `claude` du PATH (2.1.274) refuse
  l'exemple officiel `pane.tsx` que le moteur 2.1.286 accepte.
- Non réfuté, à noter : le moteur Desktop se déclare non interactif (`interactif: false`), mais il
  charge le mod à chaud sans `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`.

## Mod candidat

- Chemin : `plugin/hooks/observateur.tsx` sur `preuve/mods` (+ `plugin/types/index.d.ts`, champ
  `types` de `plugin.json`, `"modules"` dans `hooks.json`). Copie chargée à chaud :
  `~/.claude/dev-mods/<session>/observateur-preuve/`.
- Ce qu'il fait : journal `session.start` / `tool.call` / `turn.complete` (usage par `agentId`)
  hors dépôt ; commande `/etat-plan` → panneau de l'état du plan, rafraîchi sur `Agent` et sur la
  fin de tour d'un sous-agent. Il ne refuse ni ne réécrit rien.
- Coût de distribution :
  - **Projets plugin** : inconnu (M1 non conclu). Au minimum `uninstall` + `install` à chaque
    changement du module à version égale.
  - **Projets vendorés** : `sync-workflow.mjs` ne copie pas `hooks.json` ; il faudrait soit le
    plugin installé par projet, soit `CLAUDE_CODE_PLUGIN_DIRS` dans les réglages utilisateur (vaut
    pour tous les projets du poste), soit un plugin de dossier skills `.claude/skills/<nom>/` — non testé.

## Défauts relevés (sans correctif)

1. **Validation du mod creuse** : `claude plugin validate plugin` ne valide que le manifeste de
   marketplace ; il faut `"$CLAUDE_CODE_EXECPATH" plugin validate plugin/.claude-plugin/plugin.json`
   (version du moteur qui chargera le module). La gate N0 de T1 l'a laissé passer.
2. **Un module refusé est muet dans Desktop** : ni ligne grisée, ni erreur ; seul `validate` le dit.
3. **Le mod rate les refus du hook classique** : il note `resultat: "ok"` car il teste `r.deny` ; un
   refus PreToolUse arrive comme résultat en erreur (`isError`).
4. **Preuve N0 et fichier non suivi** : `empreinte()` sur l'arbre compte les fichiers non suivis
   non ignorés, comme `.claude/journal-modeles.jsonl` (écrit par le hook PostModelSwitch) ; au
   commit, l'empreinte diffère → `valider-n0` boucle (`plugin/bin/preuve-n0.mjs`). Contourné en
   déplaçant le fichier le temps de N0.
5. **Session Haiku `low`** : S2 a calculé sa preuve N0 avant l'état final → preuve périmée,
   revalidée par l'orchestrateur ; message de commit écrit sur une seule ligne (`Plan:` dans le titre).
6. **N0 complet pour une ligne de texte** : ≈ 3 min 20 s par session, puis autant à chaque
   revalidation.
7. Le sous-agent `workflow:session-low` lancé sans `model` a tourné en Opus 5.5 (M2) : l'effort
   `low` ne fixe pas le modèle.

## Tours consommés

≈ 38 (conversations 1 et 2) + ≈ 50 (conversation 3) = **≈ 88 / 60**. Dépassement accepté par
l'utilisateur pour dérouler P90.
