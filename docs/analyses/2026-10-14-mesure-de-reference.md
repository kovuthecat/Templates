# Mesure de référence — plans joués de bout en bout

Écrite par la session S6 du plan P19 (T12), le 2026-10-15. Reprise **hors budget, autorisée par
l'utilisateur** (2 reprises et la passe Opus du plan étaient consommées), qui a choisi l'option 3 du
rapport `plans/P19/S6.echec.md` : consigner que H1 est réfutée et jouer T12 tel quel.

**À retenir.** Cinq passages ont été joués, aucun n'est « abouti » au sens du harnais. Trois (deux
`nominal`, `revue-incomplete`) ont **fini le plan** (état final `fini`, preuves valides, tout poussé) mais
l'orchestrateur n'a pas rappelé le moteur après la clôture ; deux (`echec-reprise`, `interruption`)
s'arrêtent sur une question à l'utilisateur parce que les sessions de reprise lancées en arrière-plan se
voient refuser Bash. Le coût d'un plan de deux sessions, quand il va au bout, est de **0,12 à 0,15 USD**,
dont plus de la moitié pour le relecteur Sonnet. Les deux défauts constatés sont des constats pour le
plan 2 (section 6), pas des défauts du harnais.

## 1. Contexte

| Élément | Valeur |
| --- | --- |
| Date | 2026-10-15 (passages joués entre 09:39 et 09:53, heure locale) |
| Commit du dépôt mesuré | `e3d9188` (arbre propre : `meta.json` de chaque passage porte `sale: false`) |
| Version du plugin | 0.65.0 (instantané de `plugin/` copié hors du mini-projet, chargé par `--plugin-dir`) |
| Claude Code | 2.1.295 |
| Orchestrateur | `claude-haiku-5-5`, effort medium (`--model haiku --effort medium`) |
| Sessions du mini-projet | Haiku · medium (`session-medium`) ; reprise relancée en Sonnet par le moteur au 2e passage |
| Relecteur de session | `claude-sonnet-5-5` (vu dans `modelUsage`) |
| Plafond par passage | 3 USD, 200 tours, 45 min — jamais atteint |
| Mini-projet | vendoré par `sync-workflow.mjs`, `origin` = dépôt nu local, hooks du plugin actifs |

Les dossiers de passage vivent dans `%TEMP%\scenarios-templates\<id>\` (jetables, effaçables par
`lancer.mjs --nettoyer`) : cette page est la seule trace durable. Chaque ligne cite l'identifiant du
passage dont elle vient.

## 2. Les cinq passages mesurés

Source de chaque ligne : le dossier de passage nommé (`out/stream.jsonl`, `note.json`, `meta.json`),
lu par `node tests/scenarios/noter.mjs --tous -v`. Aucun chiffre n'est estimé.

| Passage | Scénario | Coût (USD) | Tours | Durée noter / mur (s) | Sessions | Reprises | Revues | Relances inutiles | Questions | Preuves valides | Poussé | Plan clos | Issue du moteur | Abouti |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `nominal-1-2026-10-15T09-39-36` | nominal | 0,147 | 8 | 44 / 214 | 2 | 0 | 2 | 0 | 0 | 2/2 | oui | oui | `fini` | non (critère 2) |
| `nominal-1-2026-10-15T09-43-26` | nominal | 0,120 | 26 | 261 / 269 | 2 | 0 | 2 | 0 | 0 | 2/2 | oui | oui | `fini` | non (critère 2) |
| `echec-reprise-1-2026-10-15T09-48-09` | echec-reprise | 0,167 | 5 | 19 / 98 | 0 | 2 | 0 | 1 (voir 6, K) | 1 | 0/1 | oui | non | `question` | non |
| `interruption-1-2026-10-15T09-50-00` | interruption | 0,025 | 4 | 20 / 72 | 0 | 1 | 0 | 0 | 1 | 0/1 | oui | non | `relancer-interrompue` | non |
| `revue-incomplete-1-2026-10-15T09-51-28` | revue-incomplete | 0,058 | 21 | 102 / 109 | 0 | 0 | 1 | 0 | 0 | 1/1 | oui | oui | `fini` | non (critère 2) |

Total des cinq passages : **0,517 USD**. Colonnes : « durée noter » = `duration_ms` de l'événement
`result` du flux ; « mur » = durée réelle de `claude -p` (`dureeMurMs` de `meta.json`) — les deux
divergent beaucoup (sessions en arrière-plan attendues après le `result`), le mur est la durée vécue.
« Critère 2 » = `noter.mjs` exige que le dernier appel du moteur par le modèle rende `fini`.

Coût par modèle (`modelUsage`) :

| Passage | `claude-haiku-5-5` | `claude-sonnet-5-5` |
| --- | --- | --- |
| nominal 09-39-36 | 0,049 | 0,098 |
| nominal 09-43-26 | 0,056 | 0,064 |
| echec-reprise 09-48-09 | 0,028 | 0,140 |
| interruption 09-50-00 | 0,025 | — |
| revue-incomplete 09-51-28 | 0,020 | 0,037 |

Lecture : Sonnet (relecteur de session, et la reprise en Sonnet de `echec-reprise`) pèse plus que Haiku
dans chaque passage où il apparaît. Le réglage Haiku des sessions n'est donc pas la part principale du
coût d'un plan ; la revue l'est.

## 3. Variance entre les deux passages `nominal`

Mêmes entrées, mêmes réglages, deux passages consécutifs (`…09-39-36` et `…09-43-26`) :

| Mesure | Passage 1 | Passage 2 | Écart |
| --- | --- | --- | --- |
| Coût | 0,147 USD | 0,120 USD | 0,027 USD, soit 20 % de la moyenne (0,134) |
| Tours | 8 | 26 | × 3,3 |
| Durée mur | 214 s | 269 s | + 26 % |

Même issue de plan (deux PASS, deux revues propres, 2/2 preuves, poussé), même défaut final (rappel du
moteur omis). **Un gain annoncé par le plan 2 ne compte qu'au-delà de ~0,03 USD (20 %) de coût et d'un
facteur 3 en tours** — sur deux échantillons seulement : c'est une borne basse de la variance, pas une
mesure fine. Un passage de mise au point (`nominal-1-2026-10-15T09-02-32`, 0,149 USD, 18 tours, 95 s)
va dans le même sens, mais n'entre pas dans cette mesure.

## 4. H2 — le coût inclut-il les sous-agents ?

**Oui.** Dans quatre des cinq passages, `modelUsage` porte `claude-sonnet-5-5` en plus de
`claude-haiku-5-5`, alors que l'orchestrateur est en Haiku : le relecteur de session (et, pour
`echec-reprise`, la reprise relancée en Sonnet) y est compté. `total_cost_usd` est donc le coût du plan
entier, sous-agents compris. Dans `interruption`, une seule reprise Haiku, aucun autre modèle : H2
indécidable pour ce passage seul (le noter l'écrit ainsi).

## 5. Sonde du point 9 (recopiée de `plans/P19/S6.md`)

Faite le 2026-10-14 par le cadreur, Claude Code 2.1.293 : depuis la conversation principale,
`Agent({ subagent_type: "workflow:session-high", model: "haiku", effort: "low", run_in_background: false })`,
alors que le frontmatter de `session-high` porte `effort: high` et que la conversation tournait en
`high`. Transcription du sous-agent (`~/.claude/projects/<projet>/<conversation>/subagents/agent-<id>.jsonl`) :
ses tours portent `"effort":"low"`, et le fichier `.meta.json` porte `"effort":"low"`. Contrôle : un
agent lancé dans la même conversation sans paramètre `effort` (`analyste-flux`, sans `effort` en
frontmatter) porte `"effort":"high"`, celui de la conversation. **Conclusion : positive** — le paramètre
`effort` de l'outil `Agent` est appliqué et prime le frontmatter de l'agent. Non testé : depuis un
sous-agent (session) qui lance son propre sous-agent ; sous Claude Code < 2.1.292. Suite : plan 2
(retrait des agents `session-<effort>`, `WORKFLOW.md` §3 et §5b à corriger — ils disent que seule
`CLAUDE_CODE_EFFORT_LEVEL` bat le frontmatter).

## 6. Constats pour le plan 2

**H1 réfutée** (« le `nominal` va jusqu'au bout sans humain », décision du 2026-10-15, option 3). Sur
les 8 passages joués au total (3 de mise au point, 5 mesurés), **aucun n'est « abouti »** au sens du
harnais : quatre ont fini le plan sur le disque (les deux `nominal` et `revue-incomplete` mesurés, plus `…09-02-32` en mise au point), mais aucun ne satisfait le critère (2). Les deux
passages de mise au point `nominal-1-2026-10-15T09-08-03` et `…09-10-31` se sont arrêtés sur une
question de l'utilisateur (S1 en échec `environnement`, aucun commit tenté). Ces trois passages de mise
au point ne figurent pas comme lignes de la section 2 ; ils sont cités ici comme constats.

**A. Commande Bash composée `cd <dir> && …` refusée en arrière-plan** (scénarios `nominal`,
`echec-reprise`, `interruption`, `revue-incomplete`). Mesuré à la mise au point (sonde `claude -p` Haiku,
0,007 USD) : `cd <dir> && cat <chemin relatif>; …` demande une approbation dès qu'une règle `Read()` deny
est configurée — celles du mini-projet viennent de `plugin/templates/project-settings.json` (l. 107-111,
`Read(.env*)`, `Read(**/*.pem)`, `Read(**/secrets/**)`), donc d'un projet vendoré réel — même avec
`Bash(cd:*)` et `Bash(cat:*)` autorisés. Message : « cat reads a file by a relative path after a cd in
a compound command; which file that is cannot be resolved statically while a Read() deny rule is
configured, so this needs approval ». Un agent d'arrière-plan ne peut pas répondre : la commande est
refusée. Dans les passages mesurés : `nominal-…09-43-26` a trois `permission_denials` Bash (dont
`cd "<projet>" && cat plans/P1/index.md; echo ---; git status --short; …`), `revue-incomplete-…09-51-28`
une (`cd "<projet>"; grep -n … ; git log … ; git show …`). Le plan s'en sort quand l'agent reformule ;
quand il ne le fait pas, c'est l'arrêt (B). **Constat** : les agents préfixent leurs commandes d'un
`cd "<projet>"` ; le workflow devrait leur demander des chemins absolus sans `cd`, ou traiter la règle
Read deny autrement pour ces commandes (piste, non vérifiée).

**B. Les reprises d'arrière-plan sont privées de Bash et brûlent le budget de reprises**
(`echec-reprise-1-2026-10-15T09-48-09`, `interruption-1-2026-10-15T09-50-00`). Les agents de reprise
tentent `cd "<projet>" && git status --short && …` puis `node test.mjs; node …/n0.mjs --session P1/S1`,
reçoivent « Permission to use Bash has been denied », PowerShell aussi (absent de la liste autorisée).
Ils corrigent le fichier (`n * 2`) mais ne peuvent ni lancer N0 ni committer, et rendent `VERDICT:
DECISION` (remédiation d'environnement hors de portée). Le moteur compte chaque reprise dans
`Tentatives :`; après deux reprises (Haiku puis Sonnet, `reprise=2`) il rend `question — budget de
reprises épuisé`, que l'orchestrateur transmet à l'humain **sans options** (le rapport de passation du
mini-projet n'a pas de section `## Issues`). Le correctif `n * 2` reste dans l'arbre, non commité ;
la session n'est pas finie. **Constat** : un échec `environnement` (permission) consomme le budget de
reprises prévu pour l'`exécution`, et la question rendue n'a aucune option — à traiter dans le plan 2
(ne pas compter une reprise `DECISION` d'environnement ; ou donner les mêmes permissions Bash aux
reprises qu'aux sessions). Dans `interruption`, la reprise unique est refusée de la même façon : le
moteur finit sur `relancer-interrompue` (l'action n'a pas été menée) et l'orchestrateur rend la question.

**C. Rappel final du moteur omis par l'orchestrateur Haiku** (`nominal-1-2026-10-15T09-39-36`,
`…09-43-26`, `revue-incomplete-1-2026-10-15T09-51-28` ; aussi le passage de mise au point
`…09-02-32`). Après `cloturer`, la table de `orchestrer-plan` demande de rappeler le script ; le
modèle conclut directement. Le dernier appel du moteur lisible dans le flux rend « Current branch main
is up to date. » (`moteurDernierAppelModele` de `note.json`), pas `fini`. L'état final est pourtant
`fini` (relancé par `noter.mjs`), les preuves sont 2/2 (nominal) ou 1/1, tout est poussé. Défaut de
l'orchestrateur Haiku, pas du harnais ; c'est exactement ce que le critère (2) de `noter.mjs` détecte.

**D. Coût du relecteur de session.** Le relecteur Sonnet pèse 0,098 USD sur 0,147 (nominal 1) et 0,064
sur 0,120 (nominal 2) ; une seule revue (`revue-incomplete`) coûte 0,037 USD. À mettre en regard du gain
attendu des « plans plus courts » : la revue est un coût par session, pas par plan.

**E. Heuristiques de `noter.mjs` à la mise à l'épreuve (instrument).** (1) Pour `echec-reprise`, le
tableau affiche les deux reprises avec le verdict `PASS`, alors que le flux porte deux `VERDICT:
DECISION` : cause non établie (peut-être le gabarit `PASS|FAIL|ENQUETE|DECISION` du prompt lu comme une
valeur). (2) La « relance inutile » `S1@89` de ce passage en découle probablement et est à
considérer comme **non établie** (lue par l'outil, non confirmée à la main). (3) Les revues affichent
« pas de verdict lu » : le relecteur rend des chemins de fichiers, non un `VERDICT:`. Aucune de ces trois
lectures n'a été corrigée ici (hors périmètre de la reprise) ; chaque ligne de la section 2 porte la
valeur telle que l'outil l'a produite.

**F. Durée.** `duration_ms` de l'événement `result` ne couvre pas l'attente des sous-agents
d'arrière-plan : l'écart noter/mur va de 1× à 5×. Pour comparer avant/après, utiliser la durée mur.

**G. Valeurs de base à battre** (plan 2, plan de deux sessions, Haiku/Sonnet réglage courant) :
0,12-0,15 USD, 8-26 tours, 214-269 s, 2 sessions et 2 revues, 0 question — quand le chemin n'est pas
interrompu par A ou B.

## 7. Rejouer la mesure en fin de plan 2

Depuis la racine du dépôt, authentifié (`claude auth status` → `loggedIn: true`) et arbre propre, l'un
après l'autre, jamais en parallèle (quota Pro) :

```bash
node tests/scenarios/lancer.mjs --scenario nominal
node tests/scenarios/lancer.mjs --scenario nominal
node tests/scenarios/lancer.mjs --scenario echec-reprise
node tests/scenarios/lancer.mjs --scenario interruption
node tests/scenarios/lancer.mjs --scenario revue-incomplete
node tests/scenarios/noter.mjs --tous -v      # tableau et détail des lancements, par dossier de passage
```

Mêmes réglages que ci-dessus (`--model haiku --effort medium --max-budget 3`, valeurs par défaut de
`lancer.mjs`). À comparer ligne à ligne avec la section 2, la section 3 donnant l'écart en dessous
duquel une différence n'est pas un gain.
