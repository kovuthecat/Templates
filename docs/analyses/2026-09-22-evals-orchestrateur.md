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

**Le rejeu de T11, après les corrections D1-D6, ne referme pas complètement le dossier : 7/9, pas
9/9.** Les deux échecs restent dans un seul cas (C, « reste lançable sans décider »), et pointent un
flou que les corrections D1-D6 ne couvraient pas — voir « Rejeu après P8 ». C'est un résultat de
mesure, pas un défaut de cette session : la décision d'entrée avait explicitement posé l'attendu (9/9)
comme condition de validation du chantier, et le rejeu la met à l'épreuve pour de vrai.

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

## Rejeu après P8 (T11, Sonnet low, 3 essais par cas)

| Cas | PASS | Coût moyen | Durée moyenne | Tours moyens |
| --- | --- | --- | --- | --- |
| A | 3/3 | 0,119 $ | 20 s | 5,0 |
| B | 3/3 | 0,134 $ | 21 s | 6,0 |
| C | 1/3 | 0,117 $ | 12 s | 6,0 |

**Total : 7/9.** A et B sont désormais stables (les corrections D1-D6 — appel prêt à recopier,
`verificateur-n0` retiré, options d'une question au format de la source — tiennent sur ces deux
gestes, à 3/3 chacun). C reste partiellement flou : sur les trois essais, deux ont répondu
« reste lançable sans décider : **S2** » au lieu de « **rien** » — c'est-à-dire que l'orchestrateur a
jugé la session S2 lançable alors qu'elle **dépend de S1** (`Vague 2 : S2 (après S1)` dans la
fixture), la session justement bloquée par le budget de reprises épuisé. Un seul essai (C-3) a
correctement répondu « rien ».

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

**Ce que ça signale** : la décision D1-D6 n'a pas couvert le calcul de « ce qui reste lançable »
d'une question `C` — rien dans les corrections sans choix de la décision d'entrée ne porte sur cette
étape précise (elle traite le format des options, pas la vérification de dépendance des sessions
restantes). C'est un flou qui n'avait pas été mesuré avant ce rejeu, distinct de ceux que D1-D6
corrigeaient. Toutes les autres colonnes de la table de notation de C (format `❓ P9/S1`, les trois
lignes `## Issues` recopiées à l'identique par égalité de ligne stricte, présence de
« Ma recommandation ») passent 3/3 — l'écart est ponctuel, pas une régression générale du cas C.

Ce résultat ne referme pas le chantier à 9/9 comme la décision d'entrée le posait en condition de
validation (§ « Ce que ça oblige ») ; voir `plans/P8/S5.echec.md` pour la suite proposée à
l'utilisateur.

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

Campagnes de cadrage (Haiku/Sonnet + Sonnet low/medium/high, comparaison manuelle) : ~16,7 $. Rejeu
de T11 (9 essais Sonnet low) : ~1,07 $ (somme des coûts mesurés ci-dessus). **Total : ~17,8 $.**
