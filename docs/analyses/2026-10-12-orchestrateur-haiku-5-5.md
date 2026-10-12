# Haiku 5.5 en orchestrateur — mesure du 2026-10-12

## Ce que ça change

**Sur les trois gestes du banc, Haiku 5.5 fait jeu égal avec Sonnet 5.5 : 8 sur 9 chacun, pour un
coût 15× plus bas par geste** (≈ 0,007 $ contre ≈ 0,11 $). Après correction de l'instrument, la
mesure ne retrouve plus le décrochage de Haiku 4.5 en septembre (4/6 contre 6/6).

**Sonnet reste pourtant l'orchestrateur, pour l'instant.** Le banc ne joue que des gestes courts, en
contexte frais. Or c'est sur un plan long à plusieurs vagues, en contexte dégradé, que Haiku 4.5
s'effondrait (1/6 contre 6/6), et ce cas n'a pas été rejoué. La bascule se décide sur ce cas-là, pas
sur celui-ci.

Prochaine mesure : un cas « contexte dégradé / plan long » ajouté au banc, joué par les deux
modèles. Si Haiku y tient, la bascule devient une décision à prendre ; sinon, la question est close
pour cette génération.

## Résultats

Banc `tests/evals-orchestrateur/` (cas A, B, C décrits dans son README), Claude Code 2.1.296
(`haiku` → `claude-haiku-5-5`, `sonnet` → `claude-sonnet-5-5`), effort `medium`, 3 essais par cas.

**Mesure retenue** (fixture C corrigée, correcteur corrigé) :

| Cas | Haiku 5.5 | Sonnet 5.5 |
| --- | :---: | :---: |
| A — vague parallèle à efforts mêlés | 3/3 | 3/3 |
| B — reprise à froid | 3/3 | 3/3 |
| C — question sur un budget épuisé | 2/3 | 2/3 |
| **Total** | **8/9** | **8/9** |
| Coût moyen d'un geste | ≈ 0,007 $ | ≈ 0,11 $ |

Les deux échecs restants ne sont pas de même gravité :

- **Haiku, C** : options recopiées fidèlement, mais avec des backticks ajoutés (`` `parseDate` ``,
  `` `src/a.mjs` ``). C'est une faute de forme ; le fond est juste.
- **Sonnet, C** : n'ouvre pas le rapport d'échec et **invente trois options** (il le dit
  honnêtement). Faute de fond.

**Première campagne** (fixture C fautive, voir plus bas) : Haiku 5/9, Sonnet 8/9. Deux échecs de
Haiku y restent réels après correction du correcteur. Sur A, il a lancé les deux sessions dans le
même message (règle D4 : la première seule). Sur C, il n'a pas ouvert le rapport et a affirmé
n'avoir aucune option. Les échecs de C sur les deux autres essais venaient de la fixture.

Sur les deux campagnes, chaque modèle a donc fait au moins une fois l'erreur la plus grave : ne pas
ouvrir le rapport d'échec et répondre quand même. Haiku est le seul à avoir enfreint D4.

## Défauts de l'instrument trouvés en route (tous corrigés)

- **Plan fictif `P9`** : le dépôt a eu depuis un vrai P9, et ses repères de commit, présents dans le
  clone, faisaient voir S1 comme déjà faite. Passé en `P99`.
- **Attendu de B antérieur à la décision du 2026-09-24**, selon laquelle une première reprise garde
  le modèle de l'index : S1 de la fixture B passe en Opus `high`, l'attendu reste inchangé.
- **Options de la fixture C sans « · débloque … »**, alors que le format de question l'exige : le
  texte poussait les deux modèles à en inventer une. Complétées, ici et dans les lignes attendues.
- **Critère `s1Seule` jugé sur tout le texte** : annoncer en prose que S2 (`session-high`, `opus`)
  partira au message suivant, ce que D4 demande, comptait comme un lancement. Il est désormais jugé
  sur les seuls blocs `Agent({…})`. Un essai Haiku de la mesure retenue en était victime.
- **Ouvert, sans effet sur la note** : les fixtures déclarent `Workflow : v0.40.0`. Le script le
  signale et les deux modèles en parlent.

## Reproduire

```bash
bash tests/evals-orchestrateur/lancer.sh --model haiku --effort medium --essais 3
node tests/evals-orchestrateur/noter.mjs
bash tests/evals-orchestrateur/lancer.sh --model sonnet --effort medium --essais 3
node tests/evals-orchestrateur/noter.mjs
```

Le banc lance le `claude` du PATH : vérifier d'abord que `claude -p --model haiku` résout bien
`claude-haiku-5-5` (`modelUsage` en sortie JSON). Un `claude` 2.1.292 résout encore Haiku 4.5.
