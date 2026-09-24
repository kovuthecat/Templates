# Revue finale du workflow — 2026-09-24 (avant passage Max → Pro)

Plugin 0.44.0. Revue en lecture seule : incidents, cohérence, fiabilité/coût, clarté des consignes.
Incidents détaillés : `docs/incidents/2026-09-24-synthese.md`. Les points marqués **[V]** ont été
vérifiés dans le code ou en exécutant le script sur des fichiers de test. Les autres sont des
lectures croisées de deux textes.

## Verdict en trois lignes

1. **Un défaut mécanique rend le verrou de vague inopérant dans tous les projets** depuis le
   2026-09-15. C'est la cause des 6 incidents « commit sous verrou », pas un modèle qui désobéit.
2. **La fin d'une session orchestrée n'a pas de propriétaire clair.** Plusieurs textes se disputent
   le verdict, le commit des revues et la clôture du plan. C'est la cause des verdicts perdus, des
   revues supprimées et des bloquants de revue perdus (P8/S5).
3. **Le passage à Pro rend urgent un cas que le workflow ignore** : la session coupée par le quota.
   C'est déjà arrivé sur Max (ebm-msp, 24/09).

## Lot A — à corriger tant que le budget Max le permet (mécanique, forte valeur)

| # | Quoi | Où | Pourquoi maintenant |
| --- | --- | --- | --- |
| A1 | `racineDepot()` : `--show-toplevel`, sauf dans un worktree lié. Même correctif dans le script. Ajouter un test avec gitfile (`git init --separate-git-dir`). | `plugin/hooks/lib.mjs:175`, `plugin/bin/prochaine-action.mjs:71`, `tests/tester-hooks.mjs` | **[V]** 20 projets touchés. Tout ce qui en dépend se tait : le refus de commit sous verrou, l'exemption `Stop` (qui exige alors commit et push), `pousser` rendu sous verrou, le retard de version C4, le modèle hors plan, les revues manquantes, le témoin de synchro. Le journal des modèles s'écrit dans `C:/Users/Kovu/.gitdirs/.claude/`. |
| A2 | Écrire le verrou comme un test placé **en tête** : « `.claude/wave.lock` existe ? → ni commit ni push ». Le reprendre dans le prompt de lancement. Regex du hook : accepter `git -C <dir> commit`. | `plugin/EXECUTANT.md:67-71`, `plugin/skills/fin-de-tache/SKILL.md:8,25`, `plugin/hooks/pretooluse-git.mjs:55`, `plugin/skills/maj-workflow/SKILL.md` (Étape 0 : STOP sous verrou) | Le « sauf » placé en fin de phrase ne porte que sur le push. |
| A3 | **Fin de session orchestrée**, un seul bloc réutilisé partout : pas de bloc de relance, pas de `fin-de-plan.md`, aucune suppression de `.revue.md` ni de `.echec.md`, dernière ligne `VERDICT:`. Même phrase dans les agents `session-*.md` (« returns no conclusion » se lit « ne rends rien »). | `plugin/skills/orchestrer-plan/SKILL.md:110-119`, `plugin/skills/fin-de-tache/SKILL.md:59,62`, `plugin/skills/fin-de-tache/references/bloc-de-relance.md:5-9`, `plugin/agents/session-*.md:3` | Incidents vostfr-CLI 22/09, MYO 23/09, Chords 24/09. |
| A4 | **Un seul rédacteur pour `.revue.md`** : l'orchestrateur la committe après `relire`, ainsi que le passage `[x]`→`[x]!`. En chaînage manuel, ajouter à `/fin-de-tache` l'étape « Relecture » que quatre textes et le hook `Stop` citent sans qu'elle existe. | `plugin/agents/relecteur-session.md:118-119` ; `plugin/WORKFLOW.md:96,106,127` ; `plugin/EXECUTANT.md:54,67` ; `plugin/CLAUDE-BASE.md:43` ; `plugin/hooks/stop-contexte.mjs:77` | **[V]** Aujourd'hui, quatre textes donnent quatre réponses différentes. |
| A5 | `fini` → l'orchestrateur déroule `fin-de-plan.md` (le repère `cloture` est lu mais jamais utilisé). | `plugin/bin/prochaine-action.mjs:159,530`, `plugin/skills/orchestrer-plan/SKILL.md:49`, `plugin/skills/nouveau-plan/references/squelette-index.md:44` | **[V]** P8 rend `fini` avec un `Bloquant : 1` jamais versé. |
| A6 | Contrat entre le script et les squelettes : <br>• vagues avec parenthèses et suffixe « (ajoutée le …) » ; <br>• `Nature :` normalisée (backticks, casse, accents) ; <br>• `reprise=1 · enquete=0` ; <br>• `Auto : oui` ; <br>• sur `REFUTEE`, une ligne `Premisse : refutee` lue par le script ; <br>• session `[ ]` hors vague → `question`, jamais `fini`. <br>Ajouter un test qui fait passer **les squelettes eux-mêmes** dans le script. | `plugin/bin/prochaine-action.mjs:148,152,209-221,394-409`, `plugin/skills/nouveau-plan/SKILL.md:259`, `plugin/skills/nouveau-plan/references/squelette-index.md:40`, `plugin/skills/orchestrer-plan/references/remediation.md:27` | **[V]** Sur fichiers de test : S4 n'est jamais lancée, une prémisse est traitée comme une exécution (reprise Opus), le budget est remis à 0, et une prémisse `REFUTEE` boucle sans fin. |
| A7 | **Interruption par quota** comme état : reconnaître `session limit`/429 à la collecte, action « attendre la réinitialisation » plutôt que `FAIL` ou `pousser`. | `plugin/bin/prochaine-action.mjs`, `plugin/skills/orchestrer-plan/references/remediation.md` | Sur Pro, ce sera le cas le plus fréquent. |
| A8 | Collecteur : lire les champs `·` multiples sur une même puce. | `plugin/bin/collecter-incidents.mjs:61` | 9 faux ⚠ sur 11. |

## Cohérence globale — ce qui reste après le lot A

- **Filtre de contenu** : une décision en fait une nature à part, sans reprise. Or le gabarit
  `.echec.md` n'admet que trois natures, et le script reprend toute autre valeur un cran au-dessus.
  Le renvoi de `WORKFLOW.md:226` vers `references/remediation.md` est ambigu, faute de chemin complet.
- **Promesse C5** « bloquant de revue aux quatre conditions ⇒ reprise automatique »
  (`WORKFLOW.md:234,274`) : le script ne l'implémente pas. Soit on ajoute l'action, soit on retire
  la promesse.
- **`revuesManquantes()`** (`plugin/hooks/lib.mjs:218`) n'exempte pas les sessions `low`, alors que
  le relecteur et le script les exemptent. Le hook `Stop` réclame donc une revue qui ne viendra jamais.
- **Push** : `orchestrer-plan/SKILL.md:174` parle encore de « push groupé en dernier geste », ce qui
  contredit C3 (arbre poussé à chaque fin de tour).
- **Échec orchestré** : `WORKFLOW.md:112` demande une branche `wip/…`. Dans l'arbre partagé, tout
  l'orchestrateur bascule alors sur cette branche.
- **Lecture ouverte (C5)** contredite par `nouveau-plan/SKILL.md:288` et `bloc-de-relance.md:50`.
- **Renvois morts** : `orchestrer-plan` n'a plus que trois étapes. Pourtant « 5c », « 5d », « Étape 5 »
  et « Étape 6 » sont cités dans `WORKFLOW.md:129,285`, `reprendre-echec` (×9), `nouveau-plan:207,221,234`,
  `verif-visuelle:42` et `stop-contexte.mjs:79`. Restes de la voie headless : `reprendre-echec:15`
  (`claude --resume`, `.claude/vague/`).
- **Seuil « nouveau plan vs cadrage »** : trois compteurs différents (`nouveau-plan:60,69`,
  `cadrer:134`, `WORKFLOW.md:16`). De plus, ils sont mesurés sur des `.echec.md` qui sont supprimés
  au PASS.
- **Mot « gate »** : il veut dire « refuse sans demander » (§9c), mais aussi « attendre le oui »
  (`migrer-projet:114`, `revue-de-conception:130`).
- **Plan Mode** exigé par `cadrer:18` et `revue-de-conception:235`, alors que leurs dernières étapes
  écrivent et committent. `revue-de-conception` interdit Bash mais lance `n0.mjs`.
- **`CLAUDE-BASE.md` en sous-agent** : d'après la décision du 2026-09-17, `SessionStart` ne se
  déclenche pas dans un sous-agent. Une session orchestrée n'a donc pas le socle, contrairement à ce
  qu'affirme `EXECUTANT.md:3`. *À vérifier par une sonde avant d'agir.*
- **Petits écarts** :
  - décompte des agents (« trois », « quatre » ou « huit » agents de délégation ; `critique-plan`
    oublié à `EXECUTANT.md:54`) ;
  - `nouveau-plan:44` sans `--scope local` ;
  - `hooks.json` et `project-settings.json` en désaccord sur l'endroit où sont câblés les hooks ;
  - modèles « Opus 5 / Sonnet 5 » en tête de `WORKFLOW.md` ;
  - plafond `.echec.md` jamais câblé (`WORKFLOW.md:196`).

## Fiabilité vs coût (passage à Pro)

Mesures sur les données réelles : dans les index, les sessions tournent à ~80 % en Sonnet. Sur 145
revues historiques, 40 portent au moins un bloquant (medium 22 %, high 31 %, Opus 35 %). Un plan de
4 sessions sans échec coûte ≈ 13 à 17 lancements d'agents, dont 2 à 3 passes Opus. Le poste le plus
cher est la **remédiation**, qui monte automatiquement en Opus : une session Opus en échec peut coûter
jusqu'à 1 enquête et 2 reprises, toutes en Opus.

Sur Pro, Opus reste accessible mais avec un quota serré, et les sous-agents puisent dans le même
quota que la session. Aucun repli n'est documenté quand ce quota Opus est épuisé, et le workflow n'en
prévoit pas non plus (ni « quota » ni « Pro » dans le plugin).

| Recommandation | Revers |
| --- | --- |
| Vagues **séquentielles par défaut** (le parallèle concentre la dépense dans la fenêtre de 5 h) | Plan plus long en temps réel ; perte du gain de cache du lancement décalé |
| **Plafonner l'escalade** : 1re reprise sur le même modèle, Opus à la 2e seulement ; au-delà d'une passe Opus de remédiation par plan → `question` | Un aller-retour de plus sur un défaut qu'Opus aurait réglé d'emblée |
| **Relecteur en une seule passe** (retirer le `/code-review` interne, `relecteur-session.md:77-80`) ; garder medium relu | Moins de trouvailles de simplification ; baisse de rappel sur les bloquants non mesurée |
| `critique-plan` et reprises en **Sonnet xhigh** si Opus est rationné ; Opus gardé pour `/cadrer` et `/nouveau-plan` (là où il a rapporté : incident des 5 plans) | Une faille de conception attrapée plus tard |
| **Orchestrateur fixé en Sonnet** dans le bloc de relance, avec avertissement s'il tourne en Opus (enchaîné après `/nouveau-plan`, il hérite d'Opus) | Presque aucun |
| Lecture d'`EXECUTANT.md` réservée aux agents de session, de reprise et d'enquête (aujourd'hui imposée aussi au relecteur, qui y perd ses tours, et aux vérificateurs) | Adapter le contrôle de `publier.mjs` ; l'invariant n'est plus uniforme |
| Couper le style « Pedagogue », raccourcir les descriptions longues (`verificateur-plan` ~900 car.) | Gain modeste (1 à 2 k tokens par session) |

**Ne pas toucher**, car chacun protège d'une récidive constatée :

- dépôt du `.revue.md` avant toute lecture ;
- format de verdict contraint ;
- `run_in_background: false` ;
- `wave.lock` (une fois A1 fait) ;
- `verificateur-premisse` et `verificateur-plan` (Haiku, peu chers) ;
- porte de push du hook `Stop`.

## Clarté des consignes — motifs à corriger partout

1. **Exception placée en fin de phrase au lieu d'un test placé en tête.** Écrire « `wave.lock` ? oui → … / non → … »
   avant l'ordre principal.
2. **« Déroule la skill X » depuis un prompt** sans dire ce qui ne s'applique pas en mode orchestré.
   Il faut une branche standard « ton prompt exige `VERDICT:` → … ».
3. **Un domicile déclaré, mais le fait recopié ailleurs avec des valeurs différentes** : commit des
   revues, push en cloud, lecture ouverte, premier geste du relecteur. Il faut un seul énoncé, et
   partout ailleurs un simple chemin vers lui.
4. **Format montré par l'exemple, parsé à la lettre.** Les squelettes montrent des variantes que les
   regex refusent. Les exemples de `verificateur-premisse.md:70-71` ne concluent pas « l'affirmation
   est vraie/fausse », alors que la règle de la l.64 l'exige.
5. **Termes à plusieurs sens** : *gate*, *session*, *verdict*, *bloquant*, *contexte neuf*. Les
   définir une fois, ou les renommer.
6. **Tests indécidables** : « outils présents dans ta session ? » (un outil différé n'apparaît que
   par son nom), « dépôt cloné sur cette machine ? », « contexte > 70 % », « zone ».

Points isolés à forte probabilité de mauvaise lecture :

- `relecteur-session.md:24` : « premier geste » contredit par le prompt, qui fait lire
  `EXECUTANT.md` d'abord.
- `maj-workflow/SKILL.md:141` : la copie vendorée se prend pour sa propre source.
- `maj-workflow/SKILL.md:196` : un `git add -A` « de test » exécuté pour de vrai.
- `nouveau-projet:269` contre `:275` : `n0.json` n'est jamais créé.
- `migrer-projet:63` contre `:122` : point 5 ou point 8.
- `purge-contexte:9` contre `:39,48` : supprimer ou archiver.
- `verif-visuelle:29-39` : « gate… rends la main » en session orchestrée.
- `fin-de-tache:46` : la session coche `[x]!` sans pouvoir connaître la revue.
- `nouveau-plan:3` : la description se déclenche sur un scope flou, que le corps renvoie à `/cadrer`.
- `reprendre-echec:3` : l'orchestrateur peut la dérouler lui-même.

## Ménage du dépôt source

- `TASKS.md` :
  - retirer les bloquants P6/S3, S4 et S7, déjà corrigés ;
  - P6/S1 reste ouvert (`plans/P6/S1.md:95` `<à compléter>`) ;
  - retirer la liste P7 (plan exécuté) ;
  - verser le `[x]!` de P9/S3.
- **P7** : S5 est commitée mais reste `[ ]` dans l'index, et les revues de S2 à S4 n'ont jamais eu
  lieu. **P8/S5** : `Bloquant : 1` jamais versé. **P9/S5** (déroulé réel sur Chords) reste à lancer.
- `DECISIONS.md` : lignes périmées, non annotées :
  - l.37 « push toujours groupé » ;
  - l.44 « quatre agents mécaniques » ;
  - l.55 `verificateur-n0` ;
  - l.125 « cinq agents session ».
- ebm-msp a un `wave.lock` actif (P16 vague 7) : ses sessions ne sont pas protégées tant que A1
  n'est pas publié.
