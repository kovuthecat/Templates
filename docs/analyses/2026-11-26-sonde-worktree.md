# Sonde P21/S5 — preuve N0 après fusion, dépendances, réveil d'une session qui délègue

> Session P21/S5 (T12), régime ouvert, 2026-11-25 (18h35-19h). Les mesures M1-M4 sont jouées sur des
> **clones locaux jetables** (`git clone`, dossier temporaire du système), pas sur des `git worktree` :
> voir « Écart au plan » plus bas. Chaque sortie est recopiée brute.

## Verdicts

| Mesure | Verdict | Ce que S7 (ou S6) doit en faire |
| --- | --- | --- |
| M1 — preuve N0 après fusion | **confirmé** (clones) : `{"ok":true}` après `merge --no-ff` au message `Fusion P99/S1` ; **réfuté seulement** si le message porte `Plan: P99/S1/` | S7 : le message de fusion ne contient **jamais** `Plan: P<n>/S<k>/` (contrainte de format). H1 tient : pas de `FAIL prémisse`. |
| M2 — deux copies, fichiers de suivi | **confirmé** : conflit (2 fichiers) quand deux copies touchent chacune sa ligne voisine d'`index.md` et la même ligne de `STATUS.md` ; fusion propre sans eux | S7 : la règle « la session ne coche pas, ne touche pas `STATUS.md` » suffit ; garder le contrôle de zones pour `CHANGELOG.md` / `TASKS.md` / `DECISIONS.md`. |
| M3 — réinstallation des dépendances | **confirmé** (clone en place de worktree) : `npm ci` aboutit dans la copie, 5 s, 92 paquets, 98 Mo, 5 413 fichiers (EBM-MSPv2) | S9 annonce : « une copie réinstalle ses dépendances : de l'ordre de 5 s et 100 Mo par session pour un petit projet, à multiplier par le nombre de sessions de la vague ». |
| M4 — réveil d'une session qui délègue | **confirmé pour une délégation attendue dans le tour ; indécidable au-delà** | S6 : garder « attendre la notification avant de finir son tour » ; ne pas autoriser une délégation qui survivrait au tour. |

**Ce qui a été réfuté** : (a) `n0.mjs --session` refuse l'identifiant `PSONDE/S1` du plan — le format est
`P<n>/S<k>` strict (`n0.mjs:98`) ; la sonde a utilisé `P99/S1` ; (b) la prémisse « les worktrees se créent
depuis cette session » : refusée par le classifieur du mode auto (voir plus bas) ; (c) `STATUS.md` n'existe
pas dans ce dépôt : le `STATUS.md` de M2 est factice, créé dans la base de la sonde. Aucune des quatre
hypothèses de fond (H1, H2, M2, M3) n'est réfutée.

## Écart au plan (à lire avant les verdicts)

1. **Aucun `git worktree add` n'a pu être joué.** Le prompt de lancement dit « n'ouvre AUCUN worktree » et le
   classifieur du mode auto a refusé l'appel (`git worktree add -b sonde/s-a …`) : « Destructive or Unwanted
   Actions ». Plutôt que de contourner, les trois mesures qui supposaient des worktrees (M1, M2, M3) ont été
   rejouées sur des **clones locaux** (`git clone <dépôt> <dossier-tmp>`), une branche par clone, la fusion se
   faisant dans le clone « cible » par `git fetch <clone> <branche>` puis `git merge --no-ff`. Le graphe de
   commits, les messages, `git log --grep`, `merge-base` et `hash-object` — tout ce dont `preuve-n0.mjs` dépend
   — sont identiques à ceux d'une fusion entre worktrees (même base d'objets, même algorithme `ort`). **Non
   couvert** : l'entrée `.git` en fichier d'un vrai worktree, et le partage du dépôt d'objets. S7 le vérifiera
   à son premier scénario réel (`isolation: "worktree"` côté `Agent`, déjà sondé au cadrage).
2. **`sonde/p21-worktree` n'est pas poussée.** `git push origin sonde/p21-worktree` a été refusé par le
   classifieur (mêmes termes). La branche existe en local (`29b766a`, jamais fusionnée, jamais utilisée pour un
   commit de sonde : les fusions de M1 ont eu lieu dans un clone de ce nom). À pousser par l'utilisateur s'il
   la veut sur `origin` : `git push origin sonde/p21-worktree`.
3. Les commits de sonde (tâche factice, preuve factice, fusions) n'existent que dans les clones jetables ; `main`
   ne reçoit que ce fichier.

## M1 — preuve N0 après fusion

Montage (dans `…/Temp/s5/`) : `cible` = clone sur `sonde/p21-worktree` (`29b766a`) ; `a` = clone de `cible`, branche
`sonde/s-a`. Dans `a` : fiche `plans/P99/S1.md`, `.claude/n0.json` réduit à une commande factice
(`node -e "process.exit(0)"`), commit de tâche portant `Plan: P99/S1/T1`.

```
$ node plugin/bin/n0.mjs --session P99/S1
factice → PASS (0.1s)
preuve : plans/P99/S1.n0.json
code=0
```

Commit de la preuve (`preuve(sonde): N0 factice`, sans `Plan:`), contrôle dans `a` avant fusion
(`verifierPreuve(cwd, 'P99/S1')` de `plugin/bin/preuve-n0.mjs`, via un petit script jetable) :

```
{"ok":true,"commit":"6c7700445d3bb8673e5be470e05451ea5f7904a2"}
```

**Fusion sans `Plan:`** — `git merge --no-ff sonde/s-a -m "Fusion P99/S1"` dans `cible`, vérification depuis la
branche cible, après fusion :

```
*   829dba0 Fusion P99/S1
|\
| * 6c77004 preuve(sonde): N0 factice
| * 0ebb2b3 feat(sonde): tâche factice
|/
* 29b766a revue(P21): S4 relue, 0 bloquant(s)
{"ok":true,"commit":"6c7700445d3bb8673e5be470e05451ea5f7904a2"}
```

**Fusion avec `Plan:`** — `git reset --hard 29b766a` puis `git merge --no-ff sonde/s-a -m "Fusion P99/S1\n\nPlan: P99/S1/T1"` :

```
*   1fe06a0 Fusion P99/S1
|\
| * 6c77004 preuve(sonde): N0 factice
| * 0ebb2b3 feat(sonde): tâche factice
|/
* 29b766a revue(P21): S4 relue, 0 bloquant(s)
{"ok":false,"motif":"preuve N0 illisible ou postérieurement invalidée par un commit de tâche"}
```

Mécanisme (lecture de `preuve-n0.mjs:82-84`) : `git log -1 --grep="Plan: <session>/"` rend le commit de fusion, qui
n'est pas ancêtre du commit de la preuve ; `merge-base --is-ancestor` sort en 1, l'`execFileSync` lève, le `catch`
rend « illisible ou postérieurement invalidée ». Le verdict est donc bien celui de la critique du plan (constat 6),
et la contrainte tient : **message de fusion sans `Plan: P<n>/S<k>/`**.

Deux remarques pour S7 :
- La preuve certifie le **commit de la session** (empreinte de son arbre à elle, `preuve-n0.mjs:85`), pas le
  résultat de la fusion : deux sessions qui passent N0 chacune de leur côté peuvent casser ensemble. Un N0 après
  la dernière fusion de la vague est un filet à envisager, il ne remplace pas la preuve par session.
- `plans/` est exclu de l'empreinte (`suivi`, `preuve-n0.mjs:10`) : un `index.md` modifié par la fusion ne périme
  pas la preuve.

## M2 — deux copies, fichiers de suivi

Base `caa24f1` : `plans/P98/index.md` (lignes `| S1 | [ ] |`, `| S2 | [ ] |`, `| S3 | [ ] |`, adjacentes) et un
`STATUS.md` factice (`Derniere session : aucune`). Quatre clones : `b1`/`b2` (cas avec suivi), `c1`/`c2` (cas sans).

**Cas avec suivi** — `b1` coche S1 + écrit `STATUS.md` + `src1.txt` ; `b2` coche S2 + écrit `STATUS.md` + `src2.txt` ;
fusion de `b1` puis `b2` dans `cible` :

```
--- merge b1
Merge made by the 'ort' strategy.
 STATUS.md          | 2 +-
 plans/P98/index.md | 2 +-
--- merge b2
Auto-merging STATUS.md
CONFLICT (content): Merge conflict in STATUS.md
Auto-merging plans/P98/index.md
CONFLICT (content): Merge conflict in plans/P98/index.md
Automatic merge failed; fix conflicts and then commit the result.
exit=1
UU STATUS.md
UU plans/P98/index.md
A  src2.txt
```

```
| S1 | [x] 2026-11-25 |        <<<<<<< HEAD / ======= / >>>>>>> sonde/b2  (lignes S1 et S2 en conflit)
Derniere session : P98/S1 | P98/S2   (même ligne, conflit)
```

**Cas sans suivi** — `c1` et `c2` n'écrivent que `src1.txt` / `src2.txt` ; fusion des deux dans `cible` :

```
Merge made by the 'ort' strategy.
 src1.txt | 1 +
Merge made by the 'ort' strategy.
 src2.txt | 1 +
exit=0     (git status --short : vide)
```

Positif confirmé : conflit dans le premier cas, fusion propre dans le second. **Réserve anti-raccourci** : les
vraies sessions écrivent aussi leur propre `S<k>.md` (Bilan) et `S<k>.n0.json` — deux fichiers par session,
disjoints d'une session à l'autre, donc sans conflit ; et, selon leur tâche, des fichiers partagés
(`CHANGELOG.md`, `TASKS.md`, `DECISIONS.md`) qu'un contrôle de zones doit continuer à repérer.

## M3 — réinstallation des dépendances

Projet : `C:/Users/Kovu/Projets/EBM-MSPv2` (`package-lock.json` suivi, 70 844 octets, 4 dépendances + 10 de
développement, aucun script `postinstall`/`prepare`), cloné par `git clone` ; `npm 11.20.0`, Node v26.12.1.

```
# clone (cache npm froid)
$ npm ci --no-audit --no-fund
added 92 packages in 5s          (taille node_modules : 100 748 Ko ; 5 413 fichiers)

# deuxième clone de ce clone, branche sonde/copie — stand-in du worktree (cache npm chaud)
$ npm ci --no-audit --no-fund
added 92 packages in 5s
copie_duree_s=5   (node_modules : 100 748 Ko ; 5 413 fichiers ; git status vide : node_modules ignoré)

# même commande rejouée dans le premier clone, node_modules supprimé (cache chaud)
added 92 packages in 5s
clone_duree_s=5
```

Seul avertissement : `EBADENGINE` (le projet demande Node 24.x, le poste a 26) — sans effet sur l'installation.
Positif confirmé : `npm ci` aboutit dans la copie, coût chiffré **≈ 5 s et ≈ 100 Mo par copie** pour ce projet
(petit : 92 paquets). Limites : un clone ordinaire, pas un worktree (chemin `.git` différent, mais `npm ci` ne lit
pas `.git`) ; un seul projet mesuré — les 25 projets du dossier ont un `package-lock.json`, les plus lourds se
mesureront au premier plan parallèle réel.

## M4 — réveil d'une session qui délègue

La ligne « M4 : réveil NON constaté (écrit avant délégation, 18:36) » a été commitée avant l'appel (`fc1133e`),
puis l'agent `workflow:explorateur` a été lancé sur une question courte (fichiers `*n0*` de `plugin/bin/`).

M4 : réveil constaté, 18:37, délai ~5 s (agent `workflow:explorateur`, question sur les fichiers `*n0*`
de `plugin/bin/`). **Réserve** : l'appel `Agent` a rendu la main de façon synchrone avec la fin de l'agent
(5,3 s, 3 appels d'outils) ; le rapport est arrivé à la fois comme résultat de l'appel et comme message
« Subagent hand-back ». Le cas dur — la session qui termine son tour *avant* la fin de l'agent puis est
réveillée — n'a pas été joué (une réponse finale clôt le tour de l'orchestrée, `EXECUTANT.md`). Verdict :
**confirmé pour une délégation courte attendue dans le tour ; indécidable pour une délégation qui dépasserait
le tour.** Pour S6 : « attendre la notification avant de finir son tour » reste la règle sûre.
Note : l'outil `Agent` de cette session n'expose pas `run_in_background` (constat L9) ; le classifieur du
mode auto a d'abord refusé l'appel parce qu'un hook en avait modifié l'entrée, il est passé à la
réémission à l'identique.
