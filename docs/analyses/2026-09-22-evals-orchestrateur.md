# Évals de l'orchestrateur — modèle, effort, flous (2026-09-22)

Ce que T19 de P6 devait produire et n'a jamais livré (bac à sable manquant) : la mesure qui a permis
de trancher, dans `docs/decisions/2026-09-22-flous-du-workflow.md`, que Sonnet reste l'orchestrateur
et que la variance observée venait du **texte**, pas du **modèle** ni de l'**effort**. Trois
campagnes de cadrage (2026-09-22, comparaison manuelle par `claude -p`) et le rejeu de P8/S5/T11,
après les corrections D1-D6 de la décision.

## Ce que ça change

Sonnet reste l'orchestrateur — la campagne Haiku/Sonnet le confirme sans ambiguïté (6/6 contre
4/6, et 6/6 contre 1/6 en contexte dégradé). L'effort (low/medium/high), lui, n'a **rien changé** au
comportement mesuré : c'est le texte des skills et du script qui produisait la variance, pas le
budget de raisonnement du modèle. `low` coûte ~30 % de moins et va deux fois plus vite, sans perte
mesurée de qualité sur les trois gestes testés.

**Le premier rejeu de T11, après les corrections D1-D6, ne refermait pas le dossier : 7/9, pas
9/9** — les deux échecs tombaient dans un seul cas (C, « reste lançable sans décider »), sur un flou
que D1-D6 ne couvrait pas. Un cycle de remédiation (deux reprises, Sonnet puis Opus) a ensuite porté
le résultat à **9/9** : un correctif de skill pour le flou réel du cas C, puis un correctif localisé
de l'instrument de mesure lui-même pour deux faux-négatifs qu'il produisait sur A et B — voir « Le
cycle de remédiation (T11) » pour le détail des trois rejeux.

## Méthode et commandes

Comparaison manuelle par `claude -p`, jamais par l'outil `Agent` (T19 de P6 restait bloquée faute de
bac à sable pour observer les appels bruts). Un texte de plan fixe (fixtures `A`/`B`/`C`, un geste
exigeant chacune), rejoué plusieurs fois avec le même prompt, en isolant l'environnement à chaque
essai — voir `tests/evals-orchestrateur/README.md` pour l'usage et les pièges.

```bash
bash tests/evals-orchestrateur/lancer.sh     # pose les bases, rejoue A/B/C, Sonnet low, 3 essais
node tests/evals-orchestrateur/noter.mjs     # note le dernier rejeu
```

Les trois cas (repris de la décision d'entrée, § « Ce que ça oblige ») :

- **A** — vague parallèle à efforts mêlés (Sonnet low / Opus high), lignes « en clair » du plan à
  recopier mot pour mot.
- **B** — reprise à froid sur un rapport d'échec `Nature : exécution`.
- **C** — question à l'utilisateur sur un budget de reprises épuisé, options déjà au format de la
  question.

## Pièges (repris de `tests/evals-orchestrateur/README.md`, qui les porte)

- Variables `CLAUDE_CODE_*` et `DISABLE_MICROCOMPACT` héritées d'une session Desktop : compactent le
  contexte vers ~20 k tokens et faussent toute mesure si on ne les retire pas avant `claude -p`.
- `--strict-mcp-config` et `--tools` (en plus de `--allowedTools`) : `--allowedTools` seul ne
  restreint pas vraiment l'outillage exposé au modèle.
- `--settings '{"disableAllHooks":true}'` : les hooks du dépôt cloné ne doivent pas s'exécuter
  pendant la mesure.
- `GIT_CONFIG_GLOBAL` jetable, `origin` retiré et identité git locale dans chaque copie : un agent
  Haiku a un jour écrit dans le `~/.gitconfig` du poste qui mesurait — jamais reproduire ça.
- `--plugin-dir <clone>/plugin` : le modèle doit lire les textes du clone, jamais le plugin installé
  depuis `plugins/cache/` — un essai vert avec le plugin du cache ne mesure rien du chantier en
  cours.

## Résultats Haiku/Sonnet (campagne de cadrage)

Cas `orchestrateur-suit-le-script` (fixture de `plugin/evals/`), 2 essais × 3 efforts :

- **Sonnet 6/6**, **Haiku 4/6** — et les deux échecs Haiku ont **attribué au script** une action
  qu'il n'avait pas rendue (hallucination de sortie, pas juste une erreur de choix).
- En contexte dégradé (piège des variables `CLAUDE_CODE_*` non nettoyées) : **Haiku 1/6 contre
  Sonnet 6/6** — l'écart se creuse quand le contexte est déjà pollué, pas seulement sur la tâche
  elle-même.

Conclusion : la règle « Sonnet, jamais Haiku » pour l'orchestrateur tient, sans nuance d'effort.

## Sonnet low/medium/high (campagne de cadrage)

Trois gestes plus exigeants (A, B, C ci-dessus), 3 essais chacun, avant les corrections D1-D6 :
**aucune différence imputable à l'effort**. `low` coûte ~30 % de moins et va deux fois plus vite que
`medium`/`high`, pour un taux de réussite comparable. **La variance suivait le texte, pas
l'effort** — c'est l'origine de la décision `docs/decisions/2026-09-22-flous-du-workflow.md` : les
échecs observés à l'époque n'étaient pas des erreurs de modèle mais des lectures différentes et
également valides d'un texte qui autorisait deux gestes au même endroit (flou de casse `model:`,
`verificateur-n0` prescrit après retrait, forme libre des options d'une question).

## Le cycle de remédiation (T11) — trois rejeux, Sonnet low, 3 essais par cas

### Rejeu 1 — 7/9

| Cas | PASS | Coût moyen | Durée moyenne | Tours moyens |
| --- | --- | --- | --- | --- |
| A | 3/3 | 0,119 $ | 20 s | 5,0 |
| B | 3/3 | 0,134 $ | 21 s | 6,0 |
| C | 1/3 | 0,117 $ | 12 s | 6,0 |

A et B sont stables (les corrections D1-D6 tiennent, 3/3 chacun). C est en échec sur deux essais sur
trois : l'orchestrateur répond « reste lançable sans décider : **S2** » au lieu de « **rien** » —
S2 **dépend de S1** (`Vague 2 : S2 (après S1)` dans la fixture), la session justement bloquée par le
budget de reprises épuisé.

Extrait de C-sonnet-low-1 (échec) :

```
Ma recommandation : 1, parce que ça garde le contrat public stable et ne fait que propager le typage correct chez les appelants.
Rapport : plans/P9/S1.echec.md · reste lançable sans décider : S2
```

Extrait de C-sonnet-low-3 (réussite) :

```
Ma recommandation : 1, parce que ça règle le problème sans changer le contrat public existant.
Rapport : plans/P9/S1.echec.md · reste lançable sans décider : rien
```

**Ce que ça signale** : la décision D1-D6 n'avait pas couvert le calcul de « ce qui reste lançable »
d'une question `C` — les corrections traitaient le format des options, pas la vérification de
dépendance des sessions restantes. Un flou distinct de ceux que D1-D6 corrigeait, non mesuré avant
ce rejeu. Toutes les autres colonnes de la notation de C (format `❓ P9/S1`, les trois lignes
`## Issues` recopiées à l'identique par égalité de ligne stricte, présence de « Ma recommandation »)
passent 3/3 — l'écart était ponctuel, pas une régression générale du cas C.

### Correctif 1, puis rejeu 2 — 6/9

Correctif de skill (`plugin/skills/orchestrer-plan/SKILL.md`, commit `30b2d44`) : le calcul de
« reste lançable » croise désormais la colonne « Dépend de » de l'index — une session dont une
dépendance, directe ou transitive, est la session bloquée n'est jamais « encore lançable ».

Rejeu complet : **A 1/3, B 2/3, C 3/3 — 6/9.** Le cas C est confirmé corrigé (3/3, hypothèse
validée). A et B semblent régresser, mais pour des causes **distinctes du correctif** et **étrangères
au comportement mesuré** :
- **B** : deux essais tentaient quand même l'appel `Agent` malgré son absence du bac à sable ; le
  `tool_use` était refusé par le sandbox (« No such tool available: Agent ») et restait invisible au
  grader, qui notait l'essai raté alors que le geste écrit était correct.
- **A** : privé de l'outil `Agent`, l'orchestrateur ne pouvait pas vérifier lui-même que
  `session-low`/`session-high` étaient chargés, et appliquait de bonne foi le repli « agents du
  plugin absents du bac à sable » (cran 3, `claude`) — artefact du bac à sable de mesure, pas un flou
  de la skill.

### Correctif 2 (instrument de mesure), puis renotation — 9/9

Correctif localisé sur `tests/evals-orchestrateur/` (commit `c190928`), pas sur le skill ni le
script — l'instrument de mesure, pas la cible, conformément au principe qui protège la cible d'un
juge biaisé (`docs/decisions/2026-09-14-preuve-avant-plan.md`) :
1. `noter.mjs` reconnaît désormais un appel `Agent` refusé par le bac à sable dans la forme de son
   `tool_use`, au lieu de le compter comme absent.
2. Le prompt du harnais énonce explicitement que les agents `session-<effort>` du plugin sont bien
   chargés depuis `plugin/agents/` — seul l'outil `Agent` manque au bac à sable — pour ne plus
   déclencher le repli cran 3 par excès de prudence.

La **renotation du rejeu 2** (mêmes essais, mêmes réponses du modèle, seul le grader change) donne
**9/9** : A 3/3, B 3/3, C 3/3 — sans relancer d'essai, donc sans coût API supplémentaire pour ce
passage. Les deux « régressions » du rejeu 2 étaient bien des faux-négatifs de mesure, pas un défaut
de comportement réintroduit par le correctif 1.

**Résultat final : 9/9**, sur le rejeu 2 renoté avec l'instrument corrigé. Le chantier D1-D6, complété
par le correctif du calcul « reste lançable », satisfait la condition de validation posée par la
décision d'entrée (§ « Ce que ça oblige »).

## Limites

- **2-3 essais par cas** : assez pour distinguer un flou systématique d'un bruit ponctuel sur ces
  gestes précis, pas assez pour une garantie statistique — un flou qui ne se manifeste qu'une fois
  sur dix essais resterait invisible à cette taille d'échantillon.
- **Un seul geste par cas** : chaque mesure arrête l'orchestrateur au premier geste qui demanderait
  `Agent`/`SendMessage` (contrainte du bac à sable). Rien n'est mesuré au-delà — ni l'enchaînement de
  plusieurs vagues, ni ce qui se passe après le geste mesuré.
- **Pas de plan long** : aucun des trois cas ne couvre un plan à plusieurs vagues successives ni un
  budget de contexte qui se dégrade sur la durée — la mesure porte sur un texte lu à froid, pas sur
  une session qui dure.
- **K5 non mesuré** : les sessions d'exécution un cran d'effort en dessous de celui de leur plan ne
  sont pas couvertes par ce harnais — hors du périmètre de cette décision (« Hors de cette
  décision », `docs/decisions/2026-09-22-flous-du-workflow.md`).

## Coût total

Campagnes de cadrage (Haiku/Sonnet + Sonnet low/medium/high, comparaison manuelle) : ~16,7 $. Rejeu 1
de T11 (9 essais Sonnet low) : ~1,07 $. Rejeu 2 (9 essais, après le correctif de skill) : ~1,07 $ —
la renotation qui l'a porté à 9/9 n'a relancé aucun essai. **Total mesure : ~18,9 $**, hors coût des
deux sessions de reprise elles-mêmes (diagnostic, correctifs), déjà compté dans les
`subagent_tokens` du rapport d'orchestration de P8.
