# 2026-08-22 — DESIGN_SPEC.md & validation N2

Couvre D-P2-6 (`VALIDATION.md` = N2 en attente uniquement), D-P2-7 (`DESIGN_SPEC.md`), D-P2-8
(rapport capacités archivé et distillé).

## Décision

`VALIDATION.md` ne porte plus que les items N2 (jugement humain) **en attente** ; un item tranché
devient une ligne supprimée — git reste l'archive. Son plafond passe de 120 à 60 lignes.

`DESIGN_SPEC.md` est un nouveau fichier, auto-suffisant, envoyé tel quel à Claude Design : brief UI
(écrans, navigation, données affichées à l'écran, contraintes UI) + état du Design Sync (kit de
composants synchronisé). `ARCHITECTURE.md` redevient un document strictement technique
(découpage feature-first, état/persistance, entités & flux de données côté code) — la maquette n'y
vit plus.

Le rapport de capacités Claude Code (llms.txt, features, plugins, agent teams…) est archivé, daté,
dans `docs/references/claude-code-capabilities-2026-08.md`, et distillé en skill
`/choisir-mecanisme` (arbre de décision + audit express + table d'URLs de vérification). Toute
question pointue et à jour renvoie à l'agent `claude-code-guide`, pas au rapport figé.

## Contexte

`VALIDATION.md` gonflait au fil des tâches car les items déjà `[x]` n'étaient jamais retirés, et le
fichier mélangeait du jugement humain réel (esthétique, ton) avec des constats qu'un navigateur
peut faire seul (erreur console, élément absent, 404) — ces derniers avaient déjà été redirigés
vers le N1 lors de la refonte du 2026-07-28, mais le plafond (120) restait calibré sur l'ancien
usage.

`ARCHITECTURE.md` mélangeait jusqu'ici réflexion technique et brief UI (écrans, navigation), ce qui
posait un problème concret pour Claude Design : lui envoyer `ARCHITECTURE.md` tel quel l'obligeait
à trier le technique du visuel avant de dessiner.

Le rapport de capacités Claude Code avait été produit à un instant donné (2026-08) mais risquait
d'être lu comme une vérité permanente alors que la plateforme évolue vite — un problème déjà
rencontré ailleurs dans le workflow (cf. la note sur `tsc -b --noEmit` dans `CLAUDE.md`, un piège
constaté puis documenté après coup plutôt qu'anticipé).

## Alternatives envisagées

- **Scinder `VALIDATION.md` en registre + détail**, sur le modèle de `DECISIONS.md`
  (registre une-ligne + fichiers dans `docs/`) : écartée en conversation le 2026-08-22. Une
  décision reste valide indéfiniment une fois tranchée (le détail n'a de valeur qu'en cas de
  remise en jeu), alors qu'un item `VALIDATION.md` est par nature transitoire : il disparaît dès
  qu'il est tranché. Scinder aurait créé une asymétrie de relecture (des fichiers de détail
  jamais relus une fois l'item traité) sans bénéfice, pour un gain de lignes que la simple purge
  des items tranchés obtient déjà. Le plafond a donc été abaissé (120 → 60) plutôt que le fichier
  scindé.
- **Garder le brief UI dans `ARCHITECTURE.md`** et simplement l'organiser en sections : écartée —
  ne résout pas le besoin d'un fichier auto-suffisant à envoyer tel quel à Claude Design sans
  qu'il ait à trier le technique.
- **Laisser le rapport de capacités vivre dans `WORKFLOW.md` ou `CLAUDE-BASE.md`** : écartée — un
  rapport de plusieurs pages chargé à chaque session coûte cher pour un contenu consulté rarement ;
  l'archive datée + skill de distillation sépare le detail (consulté à la demande) de l'essentiel
  (arbre de décision, chargé seulement quand la skill est invoquée).

## Conséquences

- `VALIDATION.md` doit être relu et purgé des items `[x]` en fin de tâche UI (`/verif-visuelle`,
  `/fin-de-tache`) — le hook de plafond (60) le rappellera si la purge est oubliée.
- Un nouveau projet avec UI copie `DESIGN_SPEC.md` en plus du socle habituel ; un projet sans UI ne
  le copie pas (cf. `README.md` §Copiés dans le projet, `nouveau-projet` Q13).
- Un projet déjà migré doit, s'il a une UI, déplacer les sections écrans/navigation/maquette de son
  `ARCHITECTURE.md` vers un nouveau `DESIGN_SPEC.md` (`MIGRATION.md` §5, point 4).
- Le rapport `docs/references/claude-code-capabilities-2026-08.md` est figé à sa date : ne pas le
  traiter comme à jour au-delà de quelques mois — repasser par la table d'URLs de
  `/choisir-mecanisme` ou l'agent `claude-code-guide` pour toute vérification.
