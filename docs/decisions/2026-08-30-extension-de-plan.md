# 2026-08-30 — Corriger un échec de prémisse étend le plan, ne crée pas le plan suivant

## Décision

`/nouveau-plan` gagne une **Étape 0** qui aiguille entre deux modes : plan neuf, ou **extension**
d'un plan en cours. Critère unique : *la correction débloque-t-elle une session restante de `P<n>`,
l'« Objectif d'ensemble » de `P<n>` restant vrai tel qu'il est écrit ?* Si oui, les sessions
correctives sont ajoutées à `plans/P<n>/` (table, vague de remédiation datée dans l'ordonnancement,
statuts en aval remis à `[ ]` si leur résultat reposait sur l'hypothèse invalidée). Sinon, plan neuf.

Plafond : une **troisième** vague de remédiation sur le même plan n'est plus une extension — c'est
la prémisse du plan qui est fausse, et ça se traite par `/cadrer`.

`/reprendre-echec` renvoie vers ce mode au lieu de tenter la correction ou de laisser dériver vers
un plan suivant.

## Contexte

Deux échecs distincts n'avaient qu'un seul traitement.

- **Échec d'exécution** — la session n'atteint pas son but (N0 rouge, bug). Couvert : rapport de
  passation `S<k>.echec.md` + `/reprendre-echec`. Ni nouvelle session, ni nouveau plan.
- **Échec de prémisse** — la session réussit techniquement, mais son résultat invalide une
  hypothèse dont dépendent les sessions suivantes. Non couvert.

Le second cas tombait donc dans `/nouveau-plan`, seule skill autorisée à découper. Constaté sur
P19 (MYO) : la mesure de S5 invalidait la vérité d'annotation et une règle d'artefact, et la
correction partait pour être `P20` — soit `P20` pour finir `P19` pour finir `P16`. Un plan bloqué
ne se ferme alors qu'après un plan qui ne se ferme qu'après un autre : la récursion n'a pas de fond,
et « P16 terminé » cesse d'être mesurable.

## Alternatives envisagées

- **Donner le droit d'extension à `/reprendre-echec`** — plus court en tours (pas de re-cadrage),
  mais met de l'écriture d'`index.md` et de `S<k>.md` dans une skill exécutante Sonnet. Deux skills
  produiraient alors des `S<k>.md` : les gabarits divergent à la première évolution de l'un.
  Écartée ; `/reprendre-echec` **pointe** vers le mode extension, il ne l'exécute pas.
- **Systématiser sans critère** : tout échec devient une session du même plan. Écartée — les plans
  ne se ferment plus, l'`index.md` devient le backlog et double `TASKS.md`.
- **Statu quo** : chaque correction est un plan. Écartée — c'est la récursion constatée.

## Raison du choix

Le découpage reste centralisé dans une skill unique et un modèle unique (`/nouveau-plan`, Opus),
règle déjà posée par `CLAUDE-BASE.md`. Un échec de prémisse demande un vrai cadrage — c'est une
hypothèse qui tombe, pas un correctif mécanique — donc le passage par la skill de découpage est le
coût juste, pas une formalité à contourner.

## Conséquences

- Un plan peut grandir après son cadrage initial ; son ordonnancement doit dire **quelle vague est
  une remédiation, de quelle session, et à quelle date**.
- Une session `[x]` peut redevenir `[ ]`. C'est explicitement autorisé, et à annoncer.
- La numérotation des sessions reste continue et sans suffixe (`S8`, jamais `S5bis`) : le repère
  `Plan: P<n>/S<k>/T<m>` des commits doit rester unique.
- Deux remédiations sur un plan = signal ; la troisième est interdite et bascule sur `/cadrer`.
