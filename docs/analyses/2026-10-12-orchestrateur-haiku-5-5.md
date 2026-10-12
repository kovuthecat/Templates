# Haiku 5.5 en orchestrateur — mesure du 2026-10-12

## Ce que ça change

**La mesure ne justifie plus « Sonnet, jamais Haiku ».** Sur le banc complet, Haiku 5.5 (`medium`)
fait jeu égal avec Sonnet 5.5 (`medium`) : **13 gestes réussis sur 14 chacun**, dont 5/5 sur le cas
qui avait fait tomber Haiku 4.5, un plan long repris en contexte chargé. Il coûte **14× moins cher
par geste** (0,024 $ contre 0,334 $ sur ce cas long).

**Haiku `high` n'apporte rien** : 12/14, plus lent, et pas plus fiable. `medium` suffit.

**Le seul cas encore raté par les deux modèles était un flou du texte, pas du modèle — corrigé
depuis (§ « Après correction du texte de C »).** Sur la
question « budget de reprises épuisé » (cas C), Haiku comme Sonnet répondent parfois sans ouvrir le
rapport d'échec, alors que les options s'y trouvent. Plusieurs disent s'en abstenir « comme la skill
l'interdit ». La commande qui lit ces options n'est écrite que dans l'annexe `remediation.md`, sous
un autre cas, et `SKILL.md` interdit en tête « d'ouvrir un `S<k>.md` ». Le rapport `S<k>.echec.md`
est lu comme couvert par cet interdit.

Ce que la mesure ne couvre pas : elle note le **premier geste** d'un orchestrateur, sur un état
posé. Une vraie orchestration enchaîne des dizaines de gestes et des retours d'agents réels. Le cas
D simule cette longueur (journal de ~24 k tokens, contexte de ~75 k tokens à la première requête) ;
il ne la rejoue pas.

## Résultats

Banc `tests/evals-orchestrateur/` (cas A à D, décrits dans son README), Claude Code 2.1.296
(`haiku` → `claude-haiku-5-5`, `sonnet` → `claude-sonnet-5-5`).

| Cas | Haiku `medium` | Haiku `high` | Sonnet `medium` |
| --- | :---: | :---: | :---: |
| A — vague parallèle à efforts mêlés | 3/3 | 3/3 | 3/3 |
| B — reprise à froid | 3/3 | 3/3 | 3/3 |
| C — question sur un budget épuisé | 2/3 | 1/3 | 2/3 |
| D — plan long repris, piège de mémoire | 5/5 | 5/5 | 5/5 |
| **Total** | **13/14** | **12/14** | **13/14** |
| Coût moyen, cas A-C | ≈ 0,007 $ | ≈ 0,009 $ | ≈ 0,11 $ |
| Coût moyen, cas D | 0,024 $ | 0,024 $ | 0,334 $ |

**Cas D — ce qu'il teste.** Plan de 8 sessions en 5 vagues, repris en vague 3. S1 à S5 sont faites
et relues. S6 (Haiku `low`) a échoué après sa 1re reprise. Le prompt commence par le journal des
tours précédents (`journal-d.mjs`) : vagues, appels d'agents, verdicts, sorties de N0. Ce journal se
termine sur la 1re reprise de S6, lancée en `session-low · haiku`. Le script, lui, rend désormais la
2e reprise un cran au-dessus (Haiku → Sonnet, `session-medium · sonnet`). Un orchestrateur qui se fie
à sa mémoire relance en Haiku ; c'est l'erreur de 2026-09 (« attribuer au script une action qu'il
n'a pas rendue »). Les trois configurations ont relancé le script et suivi sa sortie, 15 fois sur 15.

**Échecs de C, toutes configurations** : aucune option inventée par Haiku. Il répond sans ouvrir le
rapport (2 essais en `high`) ou recopie les options avec des backticks ajoutés (1 essai en
`medium`). Sonnet a une fois inventé trois options, en le disant, sans avoir ouvert le rapport.

**Première campagne** (avant la correction de la fixture C) : Haiku 5/9, Sonnet 8/9. Deux échecs de
Haiku y restent réels : un lancement des deux sessions dans le même message (cas A, règle D4) et un
rapport non ouvert (cas C). Les autres venaient de l'instrument.

## Après correction du texte de C (même jour)

Correctif `c759bde` dans `plugin/skills/orchestrer-plan/SKILL.md` : l'interdit « ne jamais ouvrir un
`S<k>.md` » précise que le rapport `S<k>.echec.md` n'en est pas un, et l'Étape 3 dit comment lire
les options d'une question sur une session en échec
(`sed -n '/^## Issues/,/^## /p' plans/P<n>/S<k>.echec.md`). Banc complet rejoué, 5 essais par cas :

| Cas | Haiku 5.5 `medium` | Sonnet 5.5 `medium` |
| --- | :---: | :---: |
| A | 5/5 | 5/5 |
| B | 5/5 | 5/5 |
| C | 3/5 | 5/5 |
| D | 5/5 | 5/5 |
| **Total** | **18/20** | **20/20** |
| Coût moyen d'un geste, A-C / D | 0,007 $ / 0,024 $ | 0,11 $ / 0,335 $ |

**Le correctif a pris** : sur C, les 10 essais lisent la section `## Issues` avec la commande de la
skill. Plus aucun modèle ne répond sans avoir ouvert le rapport, ni n'invente d'options.

**Les deux échecs restants de Haiku ne portent que sur la forme** : options exactes, dans le bon
ordre, mais avec des backticks ajoutés (`` `parseDate` ``, `` `src/a.mjs` ``). Le texte dit
« recopiées sans rien changer, ni la forme ni l'ordre », et le correcteur l'applique à la lettre.
Sur la copie stricte, Sonnet reste plus fidèle. Pour un humain qui lit la question, le choix offert
est le même.

## Défauts de l'instrument trouvés en route (tous corrigés)

- **Plan fictif `P9`** : le dépôt a eu depuis un vrai P9, et ses repères de commit, présents dans le
  clone, faisaient voir S1 comme déjà faite. Passé en `P99`.
- **Attendu de B antérieur à la décision du 2026-09-24**, selon laquelle une première reprise garde
  le modèle de l'index : S1 de la fixture B passe en Opus `high`, l'attendu reste inchangé.
- **Options de la fixture C sans « · débloque … »** alors que le format l'exige : elles poussaient à
  en inventer. Complétées, dans la fixture comme dans les lignes attendues.
- **Critère `s1Seule` jugé sur tout le texte** : annoncer en prose que S2 partira au message suivant
  comptait comme un lancement. Jugé désormais sur les seuls blocs `Agent({…})`.
- **Ouvert, sans effet sur la note** : les fixtures A-C déclarent `Workflow : v0.40.0` (D déclare la
  version courante). Le script le signale, et les modèles en parlent.

## Reproduire

```bash
bash tests/evals-orchestrateur/lancer.sh --model haiku --effort medium --essais 3 --cas "A B C"
bash tests/evals-orchestrateur/lancer.sh --model haiku --effort medium --essais 5 --cas D
node tests/evals-orchestrateur/noter.mjs        # après chaque lancement : il note le dernier
```

Le banc lance le `claude` du PATH : vérifier d'abord que `claude -p --model haiku` résout bien
`claude-haiku-5-5` (`modelUsage` en sortie JSON). Un `claude` 2.1.292 résout encore Haiku 4.5.
