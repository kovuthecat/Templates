# Plan P8 — Un geste par instruction   (rédigé par Opus)

Workflow : v0.40.0

## Objectif d'ensemble
Aujourd'hui, deux exécutants qui suivent le workflow à la lettre font des gestes différents au même
endroit — et trois de ces endroits cassent à coup sûr (lancement refusé par l'outil `Agent`, agent
retiré toujours prescrit, migration qui échoue sa propre vérification). À la fin : ce qui est
mécanique est calculé par `prochaine-action.mjs`, chaque instruction restante n'a qu'une lecture, et
la mesure qui a révélé ces flous est rejouable par un harnais commité. Décision :
`docs/decisions/2026-09-22-flous-du-workflow.md`.

**Risques du plan** : après correction, Sonnet `low` rejoue les trois cas de mesure à 9/9 (appel
exact, aucun préflight délégué, options recopiées à l'identique) — réfuté si un écart subsiste sur
l'un de ces trois points ; il se lit alors comme un flou non levé, pas comme un défaut de modèle.

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T2 | Le script rend l'appel prêt et garde l'arbre | Sonnet | high | — | — | `plugin/bin/prochaine-action.mjs` · `tests/tester-scripts.mjs` · `tests/fixtures/plans/` | [x] (2026-09-22) | T1 `feat(prochaine-action): appel d'agent prêt à recopier` · T2 `feat(prochaine-action): arrêt sur arbre sale dans la zone de la vague` |
| [S2](S2.md) | T3-T5 | L'orchestration recopie ce que rend le script | Sonnet | medium | — | S1 | `plugin/skills/orchestrer-plan/SKILL.md` · `plugin/skills/orchestrer-plan/references/remediation.md` · `plugin/skills/reprendre-echec/` · `plugin/EXECUTANT.md` | [x] (2026-09-22) | T3 `fix(orchestrer-plan): recopier l'appel rendu par le script, arbre sale au script` · T4 `fix(orchestrer-plan): canal court atteignable, verificateur-n0 retiré, replis d'agent` · T5 `fix(reprendre-echec): options au format de la question, Auto sur prémisse non vérifiée` |
| [S3](S3.md) | T6-T8 | Le cycle de plan sans double lecture | Sonnet | medium | — | — | `plugin/skills/nouveau-plan/` · `plugin/skills/fin-de-tache/` · `plugin/skills/reprendre/` | [x] (2026-09-22) | T6 `fix(nouveau-plan): sonde par n0, replis d'agent, dépôt source, messages de vague` · T7 `fix(fin-de-tache): bilan unique et N1 hors navigateur` · T8 `fix(reprendre): diff non commité renvoie à la session` |
| [S4](S4.md) | T9-T10 | Amorçage et migration disent le vrai | Sonnet | medium | — | — | `plugin/skills/migrer-projet/SKILL.md` · `plugin/skills/nouveau-projet/SKILL.md` · `plugin/templates/CLAUDE.md` · `plugin/bin/publier.mjs` | [x] (2026-09-22) | T9 `fix(migrer-projet): cinq hooks attendus` · T10 `fix(nouveau-projet): maj-workflow sur manifeste existant, routage des réponses` |
| [S5](S5.md) | T11-T13 | Rejouer la mesure, puis publier | Sonnet | medium | — | S1, S2, S3, S4 | `tests/evals-orchestrateur/` (nouveau) · `docs/analyses/2026-09-22-evals-orchestrateur.md` (nouveau) · `plans/P8/harnais/` (retiré) · `plugin/.claude-plugin/plugin.json` · `CHANGELOG.md` · `plugin/MIGRATION.md` | [x]! (2026-09-22) | T11 `test(evals): harnais de mesure de l'orchestrateur, rejeu Sonnet low` (+ correctif localisé `fix(evals): noter le geste quel que soit son canal, et dire les agents chargés`) · T12 `docs(analyses): évals de l'orchestrateur — modèle, effort, flous` · T13 `chore(plugin): 0.41.0 — un geste par instruction` |

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->
<!-- Vocabulaire complet : WORKFLOW.md §4a — ne pas inventer d'autre marque ici. -->

## Ordonnancement
- **Vague 1 — parallélisable** : S1 · S3 · S4 (zones disjointes, aucune dépendance).
  *Pourquoi maintenant* : S2 recopie ce que S1 fait rendre au script, elle attend donc S1 ; S3 et S4
  ne touchent que des textes sans lien avec le script — les lancer avec S1 fait gagner deux sessions
  d'horloge sur un plan séquentiel.
  - **S1** — Le script qui pilote l'orchestration rend désormais l'appel d'agent tel qu'il doit être
    écrit (modèle en minuscules, agent de session nommé), et refuse de lancer une vague dont les
    fichiers ont des changements non commités. Vous le verrez dans `node tests/tester-scripts.mjs` :
    de nouveaux cas, dont trois tirés de vrais index.
  - **S3** — `/nouveau-plan`, `/fin-de-tache` et `/reprendre` n'ont plus de passage lisible de deux
    façons : plus d'agent retiré prescrit, un repli quand un agent ne se trouve pas, un seul bloc de
    bilan par session. Visible à la relecture des trois skills ; aucun comportement nouveau.
  - **S4** — Une migration correctement câblée passe sa propre vérification (cinq hooks attendus,
    pas quatre), et `/nouveau-projet` sur un projet déjà outillé met le workflow à jour au lieu de
    le laisser vieillir.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : les textes d'orchestration doivent nommer les champs que S1 a réellement
  ajoutés au script — écrits avant, ils décriraient une sortie supposée.
  - **S2** — L'orchestrateur n'a plus rien à transformer ni à choisir entre déléguer et faire : il
    recopie l'appel que rend le script, les options d'une question arrivent déjà au bon format, et
    la reprise rapide d'une session redevient possible (elle était morte, faute d'agent).
- **Vague 3** : S5 (après toutes).
  *Pourquoi maintenant* : la mesure juge le tout — rejouée plus tôt, elle confondrait un flou pas
  encore corrigé avec un défaut du modèle.
  - **S5** — Les trois cas de mesure sont rejoués en Sonnet `low` par un harnais désormais commité ;
    le résultat est écrit dans une analyse. À 9/9, la version 0.41.0 est publiée ; en dessous, rien
    n'est publié et l'écart est rapporté comme un flou restant.
