# Haiku 5.5 en orchestrateur — mesure du 2026-10-12

## Ce que ça change

**Rien : Sonnet reste l'orchestrateur.** Haiku 5.5 réussit 5 gestes sur 9, contre 8 sur 9 pour
Sonnet 5.5 sur le même banc, au même effort (`medium`). Ses échecs restent du genre qui avait écarté
Haiku 4.5 : il **affirme un fait qu'il n'a pas vérifié** ou **ajoute ce que la source ne dit pas**.
Il est 15× moins cher par geste (≈ 0,008 $ contre ≈ 0,12 $), mais un orchestrateur qui invente lance la
mauvaise session, et l'économie ne couvre pas ce risque. À rouvrir à la génération Haiku suivante, ou
sur un texte de skill qui ferait tomber les échecs ci-dessous chez Haiku.

## Résultats

Banc `tests/evals-orchestrateur/` (cas A, B, C décrits dans son README), Claude Code 2.1.296
(`haiku` → `claude-haiku-5-5`, `sonnet` → `claude-sonnet-5-5`), effort `medium`, 3 essais par cas.

| Cas | Haiku 5.5 | Sonnet 5.5 |
| --- | :---: | :---: |
| A — vague parallèle à efforts mêlés | 2/3 | 3/3 |
| B — reprise à froid | 3/3 | 3/3 |
| C — question sur un budget épuisé | 0/3 | 2/3 |
| **Total** | **5/9** | **8/9** |
| Coût moyen d'un geste | ≈ 0,008 $ | ≈ 0,12 $ |

Échecs de Haiku, lus dans les sorties :

- **C, essai 1** : n'ouvre pas le rapport `S1.echec.md`, puis affirme qu'il n'a « aucune option à
  recopier ». Il recommande même de vérifier si ce rapport existe.
- **C, essais 2 et 3** : options reformulées. Haiku ajoute des « coût : … · débloque … » absents du
  rapport, dont une conséquence inventée.
- **A, essai 2** : lance les deux sessions dans le même message (règle D4 : la première seule), et
  annonce une « validation humaine » en fin de vague que le plan ne déclare pas.

Le seul échec de Sonnet (C, essai 2) ajoute « · débloque … » à chaque option. Voir le défaut de
l'instrument ci-dessous.

## Défauts de l'instrument trouvés en route

- **Corrigé : le plan fictif s'appelait `P9`.** Depuis, le dépôt a un vrai P9, et ses repères de
  commit, présents dans le clone, faisaient voir S1 comme déjà faite. La fixture passe en `P99`.
- **Corrigé : l'attendu de B datait d'avant la décision du 2026-09-24**, selon laquelle une première
  reprise garde le modèle de l'index. La fixture B passe S1 en Opus `high`, et l'attendu (session-high /
  opus) est inchangé.
- **Ouvert : les options de la fixture C n'ont pas de partie « · débloque … »**, alors que le format de
  question l'exige. Le texte pousse donc à en ajouter une, ce qui pénalise les deux modèles. À
  corriger avant la prochaine mesure, et à rejouer sur les deux modèles.
- **Ouvert : les fixtures déclarent `Workflow : v0.40.0`.** Le script le signale, et les deux modèles
  en parlent dans leur réponse. Ce bruit ne fait échouer aucun critère.

## Reproduire

```bash
bash tests/evals-orchestrateur/lancer.sh --model haiku --effort medium --essais 3
node tests/evals-orchestrateur/noter.mjs
bash tests/evals-orchestrateur/lancer.sh --model sonnet --effort medium --essais 3
node tests/evals-orchestrateur/noter.mjs
```

Le banc lance le `claude` du PATH : vérifier d'abord que `claude -p --model haiku` résout bien
`claude-haiku-5-5` (`modelUsage` en sortie JSON). Un `claude` 2.1.292 résout encore Haiku 4.5.
