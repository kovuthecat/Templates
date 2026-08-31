# 2026-08-31 — Plomberie de la relecture de session : clôture d'abord, fichier ensuite

## Décision

**Option A du rapport d'expérience** (garder la revue par session, réparer sa plomberie), avec
quatre amendements. Amende `2026-08-30-branchement-code-review.md` — le déclencheur (fin de
session, si code produit) et l'interdit `VALIDATION.md` restent ; tout le circuit des résultats
change :

1. **Clôture d'abord, revue ensuite.** `/fin-de-tache` déroule statuts, commits et rapport AVANT de
   lancer `/code-review`. Le travail est commité, le verdict acquis : la revue ne peut plus coûter
   la session.
2. **Un fichier, pas une notification** : `plans/P<n>/S<k>.revue.md`, première ligne `Bloquant : <n>`
   (marqueur mécanique), non commité, consommé au tri de clôture du plan.
3. **Deux classes, un seuil** : **bloquant** = défaut réel dans le livré (résultat faux, crash, code
   de sortie erroné, régression — ce qu'un utilisateur rencontrerait) ; **backlog** = tout le reste.
   `/code-review` classe déjà par sévérité : le travail est un seuillage, pas un tri.
4. **Une ligne par vague vers l'orchestrateur.** `/orchestrer-plan` relaie
   `Revue S<k> : <n> bloquant(s) → <chemin>` en fin de vague et au rapport final — sans ouvrir les
   trouvailles, sans bloquer. Tri en clôture de plan : `.revue.md` → `TASKS.md` (bloquants en tête),
   puis suppression.

Exception mode solo (humain présent) : un bloquant peut se corriger sur-le-champ (commit correctif +
N0 rejoué). Un défaut qui invalide une hypothèse du plan reste une extension (`/nouveau-plan`
Étape 0).

## Contexte

Première traversée réelle d'un plan avec la revue branchée (rapport d'expérience du 2026-08-31).
Quatre trouvailles réelles — dont deux invisibles autrement (script sortant en code 1 à chaque run
réussi, cache pdftoppm mort) — mais trois défauts de plomberie :

1. **Elle bloquait en se disant non bloquante.** Deux sessions (S2b, S2e) arrêtées sans committer,
   en attente de leur propre revue. Cause racine : la skill disait à la fois « avant de clore »,
   « non bloquant » et « ce qui est dans le périmètre se corrige maintenant, puis N0 rejoué » —
   trois phrases incompatibles, appliquées à la lettre.
2. **Résultats sans domicile.** Une quinzaine de rapports dans le contexte de l'orchestrateur —
   l'endroit que le workflow veut mince et où il interdit d'agir. Violait le principe déjà écrit
   dans la décision d'origine : « sans destination nommée, la revue produit un texte que personne
   ne relit ».
3. **Rien n'était trié.** Un code de sortie faux arrivait au même poids qu'une fonction définie
   trois fois.

## Alternatives envisagées

- **B — revue unique en fin de plan** : moins de bruit, moins de tokens, mais perd la détection à
  chaud — le bug du code 1, introduit en S1, gênait dès S2 ; c'est l'argument qui avait déjà écarté
  l'option C de la décision d'origine. Redeviendrait la meilleure option si la mesure montrait que
  5 revues/plan coûtent plus que la détection précoce ne rapporte.
- **C — supprimer la revue** : contredit par les faits — 4 trouvailles réelles exploitées.

## Raison du choix

Le `.revue.md` est le point structurant : une notification meurt avec la conversation, un fichier
survit, se relit à froid et peut être trié par qui en a le rôle. Les autres changements sont
mécaniques. Le trou restant du rapport — qui agit sur un bloquant découvert après la clôture de la
session — est fermé par le relais d'une ligne par vague (arbitrage humain à chaud) plus le tri de
clôture (rien ne se perd à froid).

## Conséquences

- `/fin-de-tache` : section « Relecture de session » réécrite et déplacée après les modes de
  clôture ; point 14 tolère les `.revue.md` en attente ; point 16 gagne le tri.
- `/orchestrer-plan` : Étape 5 gagne « Revues de session — relayer, sans ouvrir » ; Étape 6 une
  ligne.
- `CLAUDE-BASE.md` : la ligne « la grille s'arrête à trois » décrit le nouveau circuit.
- Un `.revue.md` n'est jamais commité : il vit comme un `.echec.md`, dans `plans/P<n>/`, jusqu'à
  consommation.
