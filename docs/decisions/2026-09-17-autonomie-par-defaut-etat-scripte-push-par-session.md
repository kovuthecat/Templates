# Autonomie par défaut, état scripté, push par session (2026-09-17)

## Ce que ça change

Relecture critique globale du workflow (session du 2026-09-17), 36 recommandations approuvées en
bloc par l'utilisateur. Six changements de fond, mis en œuvre par `plans/P6/` (plugin 0.39.0) :

1. **L'autonomie devient le défaut, l'arrêt l'exception nommée.** Une session s'arrête sur
   l'irréversible, un contrat public / schéma / dépendance à changer, un objectif qui bouge, un
   jugement N2 — et sur rien d'autre. `Latitude` absente ne vaut plus « aucune » mais « moyens
   libres, objectif et contrats fixes ». La lecture est ouverte (la liste « Lire » est un point de
   départ), seule l'écriture est bornée.
2. **Ce qui est déterministe sort des modèles.** N0 passe par un script (`bin/n0.mjs`) au lieu
   d'un sous-agent ; l'état d'une orchestration se calcule par un script
   (`bin/prochaine-action.mjs`) depuis les seuls fichiers commités. L'agent `verificateur-n0`
   est retiré.
3. **Toute fin de tour qui rend la main ou demande une session neuve laisse un arbre propre et
   poussé.** Le « push groupé en fin d'unité de travail » est abandonné : le travail se répartit
   entre plusieurs postes et le cloud.
4. **L'exploration ouverte est orchestrable et arrive plus tôt** : dès la première prémisse
   comportementale non sondable, en sous-agent, sur branche jetable poussée.
5. **Le workflow vendoré vérifie sa version** : détection au `SessionStart` (une fois par 24 h),
   mise à jour aux frontières de plan seulement.
6. **Les textes chargés portent la norme, pas l'historique** : `WORKFLOW.md` sous 300 lignes,
   `/fin-de-tache` scindée en cœur + annexes.

## Pourquoi

- Interface-OE P10/S6 (3 exécutions Opus, 2 enquêtes, 2 questions pour deux défauts mesurés) et
  MYO P30→P34 (5 plans, 0 geste réalisable, débloqués en une matinée d'exploration libre) sont le
  même symptôme : l'autonomie accordée par exception.
- 5 verdicts perdus et 4 des 6 `fix:` de `WORKFLOW.md` portent sur « premier plan / arrière-plan »
  d'un sous-agent dont le travail (lancer trois commandes, filtrer la sortie) est déterministe.
- L'orchestrateur déroule ~570 lignes de branchements en prose ; le frontmatter `model: haiku` ne
  vaut que pour le tour d'invocation (doc Skills, vérifié) : il tourne de fait sur le modèle de la
  session. Les textes qui disent « l'orchestrateur tourne sur Haiku » sont faux.
- `.revue.md`, jamais commité, est invisible d'un autre poste ; le push de fin de plan laisse des
  jours de travail sur un seul clone.

## Vérifié le 2026-09-17 (faits, ne pas resonder)

| Fait | Source |
| --- | --- |
| `SessionStart` ne se déclenche que pour la session de premier niveau ; les sous-agents ont `SubagentStart` | doc hooks |
| `Stop` = session principale, `SubagentStop` = sous-agents ; `hooks.json` ne câble que `Stop` → la gate de push n'atteint pas un sous-agent, sans code d'exemption | doc hooks + `plugin/hooks/hooks.json` |
| `model:`, `allowed-tools`, `effort:` d'un frontmatter de skill ne valent que pour le tour d'invocation | doc skills |
| L'outil `Agent` n'a pas de paramètre d'effort (schéma de l'outil) | session |
| Sous-agents imbriqués permis, 3 niveaux sous la conversation principale | doc sub-agents |
| Desktop expose `set_session_model` / `set_session_effort` — pour une **autre** session seulement, refusé sur soi-même ; sans invite pour une session qu'on a démarrée, à modèle moins cher / effort ≤ | schémas d'outils |
| `send_message` (inter-sessions) : « not to orchestrate background work », indisponible en session non surveillée | schéma d'outil |
| Un outil `start_session` est **cité** par ces schémas mais n'est **pas exposé** dans la session testée | recherche d'outils |
| Le dépôt public n'a **aucun tag** ; `publier.mjs` pousse `HEAD:main` en `--force` depuis un dépôt temporaire | `git ls-remote --tags` |
| L'orchestrateur sous verrou prend « message et repère dans le `S<k>.md` » (Étape 5.2) alors que ses interdits disent de ne jamais l'ouvrir | `orchestrer-plan/SKILL.md` |
| Le hook qui tourne sur ce poste signale « STATUS.md 136 commits de retard » alors que le fichier est supprimé depuis `f0444c6` et que le hook source teste son existence → **cache plugin périmé sur ce poste** (les skills `cadrer`, `orchestrer-plan`, `maj-workflow` n'y sont pas listées non plus) | session |
| Le résultat d'un appel `Agent` porte `subagent_tokens` — le coût par session est lisible par l'orchestrateur sans outil de plus | session |

## À sonder (prémisses comportementales — P6/S1, avant tout le reste)

| # | Hypothèse | Réfutée si | Conséquence |
| --- | --- | --- | --- |
| A | `effort:` en frontmatter d'**agent** est honoré | `/tasks` n'affiche pas l'effort déclaré | honoré → agents `session-low/medium/high`, fin du couplage à l'effort ambiant ; sinon → effort annoncé **une fois** à l'Étape 1 |
| B | `start_session` est disponible depuis une session Desktop ordinaire | l'outil n'apparaît dans aucune recherche d'outils | disponible → extension de P6 (enchaînement sans humain) ; sinon → bloc de relance inchangé, contrainte d'outillage maintenue |
| C | Une session cloud exécute les hooks du `settings.json` du dépôt et peut pousser sur `main` | hook muet, ou push refusé | refusé → règle « branche nommée dans la relance » seule voie en cloud |
| D | L'entrée JSON du hook `Stop` porte `agent_id` en contexte de sous-agent | champ absent | sans objet tant que `SubagentStop` n'est pas câblé — à noter seulement |

## Contrats (les `S<k>.md` de P6 y renvoient, ne les recopient pas)

### C1 — `plugin/bin/n0.mjs`

- Entrée : `.claude/n0.json` du projet — `{ "commandes": [{ "nom": "build", "cmd": "…" }, …],
  "testCible": "<cmd avec {fichier}>" }`. Absent → sortie `2`, message « déclarer les commandes
  dans .claude/n0.json (les reprendre de CLAUDE.md § Commandes) » : la session le crée, le
  committe, relance. Jamais de commande devinée.
- `node .claude/workflow/bin/n0.mjs [--seulement <nom>] [--cible <fichier>]` (dépôt source, non
  vendoré : `node plugin/bin/n0.mjs`, avec son propre `.claude/n0.json`).
- Sortie, et rien d'autre : une ligne `nom → PASS|FAIL (durée)` par commande ; si FAIL, 5 lignes
  au plus `fichier:ligne — message` ; chemin du log complet (`.claude/n0/dernier.log`, ignoré
  par git). Code `0` tout vert, `1` un rouge, `2` configuration.
- Délai par commande (défaut 10 min, surchargeable dans `n0.json`). S'exécute **au premier
  plan**, comme toute commande : plus de frontière de tour à traverser.

### C2 — `plugin/bin/prochaine-action.mjs`

- `node … prochaine-action.mjs P<n> [--json]`. **Lecture seule.** L'état se dérive des fichiers
  commités : table et ordonnancement de l'`index.md`, lignes mécaniques des `S<k>.echec.md`
  (`Nature`, `Tentatives`, `Blocage`, `Mesure`, `Auto`), première ligne des `.revue.md`,
  `git log --grep "P<n>/S<k>/T<m>"`, `git status`, retard/avance sur l'amont.
- Rend **une** action : `regler-effort` · `lancer` (sessions, modèle, parallèle oui/non) ·
  `verifier-premisse` · `reprendre` (modèle, option `Auto`) · `enqueter` · `relire` (vague) ·
  `pousser` · `validation-humaine` · `question` (motif + source des options) · `fini`.
- Porte : budget (§9c), table nature → modèle, dépendances, recoupement du verdict par les
  commits, mots `validation-humaine` / `reprise-manuelle`, écart `Workflow : v` index ↔ manifeste.
- `.claude/wave.lock` présent au démarrage ⇒ `question` (« vague interrompue sous verrou : diff non
  commité dans l'arbre ») — sous verrou rien n'est commité, l'état ne se dérive pas.
- L'orchestrateur exécute l'action, recopie les lignes, rappelle le script. Il ne décide plus.

### C3 — Règle de push (`WORKFLOW.md` §4b, domicile)

- Fin de tour qui rend la main à un humain ou demande une session neuve ⇒ arbre propre + poussé.
- Hook `Stop` : refuse si commits non poussés ou fichiers suivis modifiés. Exemptions : pas de
  remote · `wave.lock` · push tenté et échoué hors ligne (signale, ne bloque pas).
- Orchestrateur : `pousser` après chaque vague collectée et avant toute question.
- `git pull --rebase` avant de pousser ; conflit ⇒ question.
- **Sous `wave.lock`, la règle est suspendue** (le hook `pretooluse-git` y refuse commit et push,
  inchangé) : l'orchestrateur l'applique dès le verrou retiré, en fin de vague. Une question ne se
  pose qu'une fois la vague close — donc verrou retiré, donc poussée.
- Arrêt **en cours de tâche** (question d'arrêt, interruption) ou N0 rouge ⇒ branche `wip/P<n>-S<k>` poussée avec le `.echec.md`, jamais `main`.
- Push sur `main` impossible (cloud) ⇒ pousser la branche courante et la **nommer** dans la relance.
- Bloc de relance : deux lignes de plus, `Commit : <sha> poussé sur <branche>` ; premier geste de
  la session suivante : `git merge-base --is-ancestor <sha> HEAD`.
- `.revue.md` et `.echec.md` sont **commités**. Le repère `Revues:` disparaît ; `[x]!` reste.

### C4 — Contrôle de version du workflow vendoré

- `publier.mjs` pose et pousse le tag `v<version>` à chaque publication.
- `sessionstart-contexte.mjs` : `git ls-remote --tags <dépôt public>` plafonné à 3 s, résultat
  mis en cache 24 h dans `.git/workflow-version.json` ; muet si à jour ou hors ligne ; une ligne
  sinon. Jamais dans un sous-agent (fait vérifié : `SessionStart` ne s'y déclenche pas).
- Action aux frontières seulement : `/nouveau-plan` Étape 0, `/orchestrer-plan` avant la première
  vague, `/nouveau-projet`, `/migrer-projet`. Sans `DÉRIVE` : mise à jour sans question (mécanique,
  réversible, jugée par `--check`) et rapportée. Avec `DÉRIVE` : question.
- `plugin.json` peut porter `correctifCritiqueDepuis: "<version>"` : un projet vendoré en dessous
  se met à jour entre deux vagues.
- L'`index.md` porte `Workflow : v<x>` à sa création.
- Parc existant : un projet vendoré ≤ 0.38.1 exécute l'ancien hook ; sa première mise à jour reste
  manuelle (`MIGRATION.md` le dit en tête).
- `manifest.json` porte `source` sous forme de slug ; l'URL interrogée est `https://github.com/<slug>`.

### C5 — Autonomie de session (`WORKFLOW.md` §9a, `EXECUTANT.md`)

- **Budget en hypothèses** : jusqu'à 3 hypothèses **distinctes** dans le contexte chaud, chacune
  inscrite dans « Déjà écarté » avant la suivante ; arrêt sur hypothèse répétée, ou contexte > 70 %.
- **Amendement de session** : prémisse fausse **avec mesure commitée**, objectif du plan inchangé,
  remède dans la zone du plan, aucun critère d'arrêt de C5 touché ⇒ la session écrit l'amendement
  dans « Écarts au plan » de son `S<k>.md` (commit séparé, repère `Amendement :`), continue ; le
  relecteur juge après.
- **`Auto : oui`** peut être écrit par la session en échec elle-même, mêmes critères que l'enquête.
- **Bloquant de revue** qui tient les quatre conditions du correctif localisé ⇒ reprise
  automatique, pas un `[x]!` qui attend la clôture.

### C6 — Exploration ouverte

- Déclencheurs : première prémisse comportementale non sondable en lecture ; enquête `OPTIONS`
  sans option satisfaisante ; deuxième plan tué sur la zone (inchangé).
- Session de type `exploration` dans un plan (bandeau `Régime : ouvert`) : branche jetable
  **poussée**, budget écrit, N0 à la fin, livrable = mesure + réfuté + code candidat. Lancée en
  sous-agent : l'humain lit le résultat, pas le processus.
- Option « exploration ouverte » dans la table des questions d'arrêt ; éligible `Auto : oui`.
- `/cadrer` et `/nouveau-plan` Étape 1 : la sonde jetable est autorisée explicitement (via `n0.mjs`
  ou un script du scratch), l'interdit d'écriture dans le dépôt demeure.

### C7 — Coût de contexte

- Revue **par vague** (un `relecteur-session` sur le diff de la vague, repères `Plan:`), sessions
  `low` exemptées.
- Découpage **par zone de contexte** (lectures partagées) ; un changement de modèle ne force plus
  une session à lui seul.
- **Séquentiel par défaut** ; parallèle = option déclarée au cadrage. Les messages de commit d'une
  vague verrouillée vivent dans l'`index.md` (fin de la contradiction de l'Étape 5.2).
- Rapport final d'orchestration : `subagent_tokens` par session.
- Orchestrateur : **Sonnet**, écrit tel quel ; bascule Haiku conditionnée à une éval comparée.

## Écarté / reporté

- **Remontée d'incidents pour un workflow partagé** (issues GitHub + consentement + `--issues` au
  collecteur) : approuvée sur le principe, **reportée** — sans objet tant qu'un seul mainteneur
  peut tirer tous les dépôts.
- **Retrait du canal court `SendMessage`** : non tranché. Instrumenté (une ligne au rapport final à
  chaque usage), revu à la synthèse d'incidents suivant le 2026-10-17.
- **Enchaînement de sessions sans humain** (`start_session`) : dépend de la sonde B.
- **Haiku en orchestrateur** : après C2, sur éval comparée, pas avant.
