# 2026-09-13 — Vérifier ce qui se déclare soi-même

## Décision

Quatre mesures, une seule idée : **là où le workflow laisse quelqu'un juger son propre travail,
introduire un contrôle qui vient d'ailleurs, ou une trace que l'auto-déclaration ne peut pas
effacer.**

1. `## Compactage` de `CLAUDE-BASE.md` nomme les **repères mécaniques** à préserver (`Plan:`,
   `Nature :`, `Bloquant :`) ; `/migrer-projet` cesse de pointer une section `# Compact
   instructions` qui n'existe plus dans le gabarit.
2. Ligne **`Anti-raccourci`** dans le bloc `### Validation` du gabarit de tâche : le cadreur nomme
   le faux-vert de cette tâche, `relecteur-session` le vérifie en premier et le compte comme
   bloquant s'il le constate.
3. Nouvel agent **`verificateur-plan`** (Haiku, 6ᵉ agent), lancé par `/nouveau-plan` Étape 4b avant
   le commit du plan : quatre contrôles falsifiables, aucun jugement de conception.
4. Troisième statut **`[x]!`** dans l'`index.md` : session `PASS` dont la revue a trouvé au moins
   un bloquant. Ne bloque rien, ne relance rien ; disparaît au tri de clôture, qui verse le
   bloquant dans `TASKS.md`.

## Contexte

Trois articles du cookbook Anthropic, lus le 2026-09-13 :

- `tool-use-automatic-context-compaction` — compaction automatique côté API
  (`context_token_threshold`, `summary_prompt`, modèle de résumé).
- `managed-agents-cma-verify-with-outcome-grader` — un correcteur séparé, sans état, qui reçoit la
  rubrique mais **pas** la description de la tâche ; boucle noter → réviser → renoter.
- `managed-agents-cma-plan-big-execute-small` — un modèle cher planifie, des modèles bon marché
  exécutent en parallèle ; 84-98 % des tokens facturés au tarif exécutant.

Le troisième décrit le workflow tel qu'il est déjà (§1 « Opus pense, les autres font »), en moins
outillé. Le premier ne s'applique pas tel quel (voir *Écarté*). Le deuxième désigne le point
aveugle : **le verdict d'une session est rendu par la session elle-même** (`VERDICT: PASS|FAIL`),
et le seul regard indépendant — `relecteur-session`, qui n'a pas vu la conversation — arrive après
la clôture, dépose un fichier non commité, et est déclaré non bloquant. Un `Bloquant : 3` et un
`Bloquant : 0` laissaient le même `[x]` dans l'index.

Le piège n°6 du troisième article — *ne pas laisser le coordinateur valider sa propre
décomposition* — désigne le même défaut un cran plus haut : `/nouveau-plan` Étape 1 finit par
« plan rédigeable maintenant ? », question posée au rédacteur. Le coût de cette absence est déjà
écrit dans le workflow : le mode extension, et le plafond « une 3ᵉ vague de remédiation = la
prémisse est fausse » (Étape 0).

## Alternatives

- **Rendre la revue bloquante** (un `Bloquant ≥ 1` déclenche une reprise automatique, comme la
  boucle de l'article). Écarté pour l'instant : la revue non bloquante est une décision datée du
  2026-09-12 (collecte patiente), et la boucle ajouterait une reprise à chaque vague sur un verdict
  qui n'a encore jamais été mesuré. `[x]!` rend le défaut visible sans rien réordonner — si la
  marque se révèle fréquente et pertinente, la boucle sera cadrée sur des cas réels plutôt que sur
  un article.
- **Un contrôle de plan intégré à `/nouveau-plan`** plutôt qu'un 6ᵉ agent. Écarté : c'est
  exactement l'auto-validation que l'article décrit. Le coût du 6ᵉ agent est un préfixe de
  description dans chaque session ; il est payé une fois, la découpe fausse se paie deux plans.
- **Restaurer `# Compact instructions` dans le gabarit `CLAUDE.md`.** Écarté : la section a été
  centralisée dans `CLAUDE-BASE.md` (v0.29.0, mesure A2) ; la remettre dans le gabarit la fige à la
  version du jour de l'instanciation. C'est le pointeur de `/migrer-projet` qui était périmé.

## Raison

Les quatre mesures coûtent peu et ne changent aucun flux : une ligne par tâche, un agent mécanique
d'un tour, un caractère de statut, un paragraphe de consigne de compactage. Aucune n'introduit de
gate, de reprise ni de latence de vague. C'est délibéré : le workflow a déjà payé cher des
mécaniques ajoutées sur une analyse plutôt que sur un incident (voir la voie headless, retirée en
v0.30.0 après avoir produit sa propre classe d'incidents).

## Conséquences

- `WORKFLOW.md` §4a devient le domicile du **vocabulaire des statuts** (trois marques) ; §5 compte
  six agents.
- `/fin-de-tache` écrit `[x]!` (point 9 bis, section Relecture) et le résorbe (point 16) ;
  `/orchestrer-plan` l'écrit à la collecte des revues d'une vague.
- Les hooks ne changent pas : `lib.mjs` ne cherche que `[ ]` pour savoir ce qui reste à faire,
  `[x]!` en est exclu comme `[x]`.
- Un plan clos ne doit plus porter de `[x]!` : c'est un contrôle de plus à la clôture.

## Impact IA

Un exécutant ne voit qu'une ligne de plus dans sa Validation, qu'il **ne peut pas satisfaire en la
lisant** — elle ne s'adresse pas à lui. Le cadreur, lui, doit nommer le raccourci : c'est le seul
champ du gabarit qui demande de penser contre son propre plan, et un `—` honnête y vaut mieux
qu'une formule générique.
