# 2026-09-09 — La nature de l'échec décide de la reprise ; les incidents de workflow remontent par fichier

## Décision

Cinq changements, tirés d'une même relecture des échecs réels (`plugin` 0.27.0) :

1. **Diagnostiquer avant de conclure.** Une session qui casse nomme la **nature** de son échec —
   `environnement` (l'outillage a empêché la tâche), `exécution` (tentée, N0 toujours rouge),
   `prémisse` (une hypothèse du plan est fausse) — en ligne mécanique `Nature :` de son
   `S<k>.echec.md`. Environnement à portée → elle corrige et continue ; exécution → **une**
   correction, N0 juge ; prémisse → `FAIL` sans corriger. Domicile : `WORKFLOW.md` §9a.
2. **La reprise automatique suit la nature, pas un cran par réflexe** (`/orchestrer-plan` 5c) :
   environnement → même modèle, en sous-agent (héritage des permissions) ; exécution → un cran
   au-dessus (règle du 2026-08-30, inchangée) ; prémisse → `ARBITRAGE` direct, aucune reprise.
   Amende `2026-08-30-reprise-automatique-echec.md` sur le seul choix du modèle.
3. **Le hook `Stop` se tait sous `.claude/wave.lock`** hors plafonds, et ne rappelle un manquement
   que quand la liste change. Un diff non commité et une revue absente y sont le fonctionnement
   normal (§4b), pas un manquement à répéter à chaque tour de l'orchestrateur.
4. **La revue d'une session orchestrée se lance depuis l'orchestrateur** quand la session n'a pas
   pu la déposer (bac à sable sans outil `Agent`). Une revue absente n'est plus seulement relayée :
   elle est lancée, au premier plan, après les commits de la vague.
5. **Une session `claude -p` reçoit de quoi écrire** : socle `Edit`/`Write`/`git add`/`git commit`
   dans l'allowlist du gabarit, `--permission-mode acceptEdits` + `--allowedTools` git au lancement,
   sonde d'écriture au préflight. Et le headless n'est plus requis que pour un effort **strictement
   supérieur** à celui de la conversation d'orchestration — le sous-agent hérite de l'effort ambiant.

Et un canal nouveau : **un incident de workflow = un fichier** `docs/workflow/incidents/<date>-<slug>.md`
dans le projet, commité et poussé avec lui, ramassé depuis le dépôt source par
`bin/collecter-incidents.mjs` et analysé par la skill locale `/analyser-incidents`. Domicile :
`WORKFLOW.md` §9b, rappel dans `CLAUDE-BASE.md`.

## Contexte

Quatre signalements le même jour, et neuf `S<k>.echec.md` relus dans Chords, Interface-OE et MYO :

- **La reprise coûtait cher pour rien.** La majorité des rapports étaient des prémisses fausses
  (« la détection est correcte, seul le nommage est en cause » — faux ; « 37 étapes dans le PDF »
  — il y en a 32) ou des blocages d'environnement (permission `Edit` absente en headless ; session
  qui exige un humain présent, lancée en automatique). Chacun avait déclenché une reprise un cran
  au-dessus — Fable sur Opus pour l'un — qui n'a fait que refaire le diagnostic avant de rendre
  `ARBITRAGE`. Le modèle n'était jamais la cause.
- **Le hook `Stop` polluait l'orchestrateur** : sous verrou, chaque tour recevait « fin de session
  non consignée », alors que ne pas committer est précisément ce que le verrou impose.
- **Quatre revues d'une même vague perdues** : « leur bac à sable n'exposait pas l'outil de
  sous-agent requis par `/fin-de-tache` ». La revue dépendait d'un outil que l'exécutant orchestré
  n'a pas toujours, alors que l'orchestrateur l'a toujours.
- **Une session headless entière en `FAIL` sur un refus d'`Edit`** : l'allowlist du gabarit ne
  portait ni `Edit` ni `Write` ni `git commit`, et `claude -p` refuse tout ce qui n'y est pas.
- **Les échecs du workflow ne remontaient pas.** Ils vivaient dans des conversations closes et des
  captures d'écran ; le mainteneur ne maîtrise pas le contexte de chaque projet, et la remontée à
  la main était laborieuse, non systématique et imprécise.

## Alternatives envisagées

- **Laisser la session juger si « elle a besoin d'un modèle au-dessus ».** Écarté : un modèle
  n'évalue pas ses propres limites de façon fiable, mais il classe sans peine « permission
  refusée » contre « test encore rouge après ma correction ». La nature est observable, le besoin
  de jugement ne l'est pas.
- **Autoriser la session à se corriger sans plafond.** Écarté : c'est l'anti-pattern de §3 (tourner
  en rond), et c'est exactement ce qu'un modèle au-dessus règle mieux qu'une troisième tentative.
  Une correction, N0 juge — puis le rapport porte la tentative, ce qui rend l'escalade rentable.
- **Faire relire la session par elle-même quand `Agent` manque.** Écarté : la revue vaut par
  l'indépendance du relecteur. L'orchestrateur a l'outil, et lancer-collecter est son rôle.
- **`--dangerously-skip-permissions` en headless.** Écarté : trop large ; `acceptEdits` borne aux
  chemins du projet, et les commandes git de base sont énumérées.
- **Incidents dans `TASKS.md`, ou dans une issue GitHub.** Écarté : `TASKS.md` est le backlog du
  projet et se purge ; une issue demande un réseau et un compte que la session cloud ou le
  sous-agent n'a pas toujours. Un fichier commité voyage avec le clone, comme le workflow lui-même.

## Raison du choix

Trois principes déjà en place rendent chaque changement local : *le fichier est le livrable* (la
nature, l'incident et la revue sont des fichiers, pas des notifications) ; *l'orchestrateur lance
et collecte* (il lit une ligne `Nature :` comme il lit `Bloquant :`, et lance une revue comme il
lance une reprise) ; *une règle qui compte est appliquée* (l'allowlist et la sonde de préflight,
pas une consigne). L'évidence des échecs relus fait le reste : la plupart n'avaient rien à
demander à un modèle plus cher.

## Conséquences

- `WORKFLOW.md` : §4a (ligne incident), §4b (ce qu'une session committe), §5b (effort hérité,
  permissions headless), §7 (Stop), §8 (trois anti-patterns), **§9 nouveau**.
- `/reprendre-echec` : gabarit avec `Nature :` et remédiation ; Étape 1 oriente par nature.
- `/orchestrer-plan` : préflight (sonde d'écriture, effort ambiant), prompt de lancement, bloc
  headless, Étape 5 (revues lancées, incidents commités), 5c (table par nature), Étape 6.
- `/fin-de-tache` : point 8 (incident), relecture sans outil `Agent`, point 14.
- `/nouveau-plan` : bandeau du `S<k>.md`, colonne `Env.`.
- `CLAUDE-BASE.md` : section « Échecs et incidents ».
- `hooks/stop-contexte.mjs` : muet sous verrou hors plafonds, rappel seulement au changement.
- `templates/project-settings.json` : socle d'allowlist. **À reporter dans les projets équipés**
  (`/maj-workflow` signale la divergence du bloc hooks, pas celle des permissions : c'est une
  édition manuelle, une fois par projet).
- `bin/collecter-incidents.mjs` (source seulement) ; skill locale `.claude/skills/analyser-incidents`.
- Coût accepté : un fichier de plus par incident dans chaque projet, et une revue lancée par
  l'orchestrateur au lieu de la session — au premier plan, donc une vague un peu plus longue.
