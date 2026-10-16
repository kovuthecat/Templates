# Remesure du plan 2 contre la référence

Écrite par la session S13 du plan P20 (T20). Passages joués le 2026-10-16, de 06:56 à 08:53 UTC, sur le dépôt
au commit `cb43266`. Le nom du fichier suit la fiche (`2026-10-15`) ; la référence est
`docs/analyses/2026-10-14-mesure-de-reference.md`, jouée le 2026-10-15.

**À retenir.**

- **Le plan 2 va au bout là où la référence s'arrêtait.** Les cinq scénarios de la référence finissent tous le
  plan (`fini`, preuves valides, tout poussé), contre trois sur cinq dans la référence — et aucun des cinq
  n'« aboutissait » au sens du harnais, tous les cinq le font maintenant. Deux scénarios (`echec-reprise`,
  `interruption`) ne s'arrêtent plus sur une question à l'utilisateur.
- **Le coût d'un plan de deux sessions ne bouge pas** : 0,130 et 0,135 USD pour `nominal`, contre 0,147 et 0,120
  dans la référence — dans la variance. Les cinq scénarios coûtent 0,466 USD au total, contre 0,517 : dans la variance.
  Le plan 2 n'a donc pas rendu un plan plus *cher*, et n'a pas non plus gagné sur le prix.
- **Le critère A n'est pas atteint** : les commandes `cd "<projet>" && …` de l'orchestrateur et du relecteur de
  session sont encore refusées sous les autorisations d'un projet. Les sessions d'exécution et de reprise, elles,
  ne reçoivent plus aucun refus. **B** : non au sens littéral (3 refus au passage), mais la reprise elle-même est
  sans refus. **C** : oui, partout où le plan finit. **H1 : confirmée** après 30,0 min d'attente.
- **Cinq défauts petits ont été corrigés en route** (section 2), dont deux du banc de mesure : sans eux, le coût
  affiché triplait et deux passages sur trois étaient perdus pour des raisons qui n'étaient pas celles du plan.

## 1. Contexte

| Élément | Valeur |
| --- | --- |
| Commit du dépôt | `cb43266` (`meta.json` : `sale: false` pour les cinq premiers passages ; `true` ensuite, voir ci-dessous) |
| Version du plugin | 0.66.0 (instantané de `plugin/` copié dans chaque dossier de passage) |
| Claude Code | 2.1.299 (la référence : 2.1.295) |
| Orchestrateur | `claude-haiku-5-5`, effort medium (`--model haiku --effort medium --max-budget 3`, comme la référence) |
| Sessions du mini-projet | Haiku · medium ; relecteur de session `claude-sonnet-5-5` (vu dans `modelUsage`) |
| Autorisations | `banc` (liste large du banc, comme la référence) pour les cinq premiers ; `projet` (le `permissions.allow` du gabarit, tel que vendoré) pour les trois suivants — jamais `bypassPermissions` |
| Authentification | `claude auth status` : `loggedIn: true` |

**État du plugin selon le passage.** Les correctifs de la section 2 modifient `plugin/` (deux fichiers de skill).
Les passages joués avant la modification portent `sale: false` ; ceux joués après portent `sale: true` — leur
instantané contient donc le correctif, ce qui est voulu, et est dit ligne par ligne en section 3. Le coût
**total** des treize passages (huit mesurés, cinq ratés ou rejoués) est de **1,032 USD** ; le plafond de 2 USD
n'a pas été approché.

Les dossiers de passage vivent dans `%TEMP%\scenarios-templates\<id>\` (jetables) : cette page est la seule trace
durable, chaque ligne cite l'identifiant du passage dont elle vient.

## 2. Correctifs localisés posés pendant la mesure

Chacun : défaut **mesuré** dans un passage nommé, remède petit et réversible, test écrit, passage concerné rejoué.

1. **`noter.mjs` triplait le coût** (instrument). Un flux peut porter plusieurs événements `result` en fin de
   flux, tous au même `total_cost_usd` cumulé : passage `nominal-1-2026-10-16T06-56-22`, trois `result` à
   0,130096 USD, l'outil affichait 0,390. Le coût est maintenant la somme, par processus `claude -p`, du dernier
   `result` ; `modelUsage` est fusionné de même. `num_turns` et `duration_ms`, eux, sont par segment : inchangés.
   La référence n'est pas touchée (ses coûts égalent la somme de ses `modelUsage`). En revanche le « 0,042 USD »
   du temps 1 de H1 dans `plans/P20/S6.md` était le double de la réalité (0,021). Fichiers : `tests/scenarios/noter.mjs`,
   3 cas dans `tests/tester-scripts.mjs`.
2. **`noter.mjs` lisait le préfixe d'une commande enchaînée comme « le dernier appel du moteur »** (instrument).
   Passage `echec-reprise-1-2026-10-16T08-46-07` : l'orchestrateur a lancé `git commit … && node …/prochaine-action.mjs …
   --cloture-faite` ; la sortie commence par la ligne du commit, finit par `fini`, et l'outil lisait la ligne du
   commit (critère C faux). Vérifié à la main dans le flux : le moteur a bien rendu `fini`. Fichiers :
   `tests/scenarios/noter.mjs` (la lecture repart de la première ligne qui est du moteur), 1 cas.
3. **Le banc ne répondait pas comme un utilisateur** (instrument). Passage `arret-relaye-1-2026-10-16T07-35-15` :
   la réponse n'était que committée dans `S1.question.md` ; l'orchestrateur, voyant un commit qu'il n'avait pas
   écrit, a refusé de la transmettre (« rien ne me dit que ça vient de toi ») — H1 indéterminée. Le temps 2
   redonne maintenant la réponse **dans le message**, comme un utilisateur qui répond dans la conversation. Le mot
   à retenir n'y figure jamais. Fichiers : `tests/scenarios/lancer.mjs` (`promptTemps2`), `README.md`, 1 cas.
4. **`/reprendre-echec`, Étape 5, exigeait un `git rm` que les autorisations d'un projet refusent** (ligne de
   skill fausse — c'est la dette de S3 : « le rejeu sous autorisations projet »). Passage
   `echec-reprise-1-2026-10-16T07-16-57` : l'agent de reprise corrige, N0 vert, puis `git rm -q plans/P1/S1.echec.md`
   est refusé et il rend `DECISION`. L'Étape 5 dit désormais de committer la correction et de **ne pas supprimer** le
   rapport en mode orchestré : le moteur le retire (S7). Rejoué : `…08-46-07`, reprise sans refus, moteur
   « plans/P1/S1.echec.md supprimé ». Fichier : `plugin/skills/reprendre-echec/SKILL.md`.
5. **`fin-de-plan.md`, point 4, exigeait la même suppression, pour les `.revue.md`.** Trois passages `projet` sur
   trois ont subi ce refus à la clôture (`git rm` des revues) : `…07-19-21`, `…07-22-21` (l'orchestrateur a
   fini par `Remove-Item` en PowerShell, deux fois sur une seule commande), `arret-relaye-1-2026-10-16T08-12-34`
   (plan non clos). Une commande `rm <fichier>` seule est acceptée sous `acceptEdits`, puis `git add` du chemin :
   la phrase l'écrit ainsi. Rejoué : `echec-reprise-1-2026-10-16T08-46-07` et `nominal-1-2026-10-16T08-50-32`
   closent sans suppression refusée. Fichier : `plugin/skills/fin-de-tache/references/fin-de-plan.md`.

Aucun bump de version ni publication : c'est la tâche de S14 (0.67.0).

## 3. Les huit passages mesurés

Source de chaque ligne : le dossier de passage nommé (`out/stream*.jsonl`, `note.json`, `meta*.json`), lu par
`node tests/scenarios/noter.mjs --tous -v` après les correctifs 1 et 2 de la section 2. Aucun chiffre n'est estimé ni
recopié de la référence. « Refus Bash » : `permission_denials` du flux, avec entre parenthèses les refus que le
flux montre dans un retour d'outil (`requires approval`, `Permission to use … denied`) — ils diffèrent parce que
`permission_denials` ne retient pas tous les refus subis par un agent d'arrière-plan.

| Passage | Scénario · autorisations | Coût (USD) | Tours | Durée noter / mur (s) | Sessions | Reprises | Revues | Relances inutiles | Questions | Preuves valides | Poussé | Plan clos | Issue du moteur · dernier appel | Abouti | Refus Bash |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `nominal-1-2026-10-16T06-56-22` | nominal · banc | 0,130 | 25 | 108 / 199 | 2 | 0 | 2 | 0 | 0 | 2/2 | oui | oui | `fini` · `fini` | oui | 2 (3) |
| `nominal-1-2026-10-16T07-07-02` | nominal · banc | 0,135 | 38 | 133 / 222 | 2 | 0 | 2 | 0 | 0 | 2/2 | oui | oui | `fini` · `fini` | oui | 9 (5) |
| `echec-reprise-1-2026-10-16T07-10-55` | echec-reprise · banc | 0,078 | 23 | 65 / 124 | 0 | 1 | 1 | 0 | 0 | 1/1 | oui | oui | `fini` · `fini` | oui | 2 (1) |
| `interruption-1-2026-10-16T07-13-07` | interruption · banc | 0,080 | 23 | 92 / 158 | 0 | 1 | 1 | 0 | 0 | 1/1 | oui | oui | `fini` · `fini` | oui | 2 (3) |
| `revue-incomplete-1-2026-10-16T07-15-54` | revue-incomplete · banc | 0,043 | 10 | 52 / 55 | 0 | 0 | 1 | 0 | 0 | 1/1 | oui | oui | `fini` · `fini` | oui | 1 (1) |
| `echec-reprise-1-2026-10-16T08-46-07` | echec-reprise · projet | 0,071 | 21 | 107 / 170 | 0 | 1 | 1 | 0 | 0 | 1/1 | oui | oui | `fini` · `fini` | oui | 3 (3) |
| `nominal-1-2026-10-16T08-50-32` | nominal · projet | 0,100 | 28 | 98 / 163 | 2 | 0 | 2 | 0 | 0 | 2/2 | oui | oui | `fini` · `fini` | oui | 2 (4) |
| `arret-relaye-1-2026-10-16T08-12-34` | arret-relaye · projet, attente 30 min | 0,143 | 32 | 110 / 158 | 1 | 0 | 1 | 0 | 1 (a) | 1/1 | oui | non (b) | `cloturer` · refus `git rm` | non (b) | 5 (5) |

(a) La question a été relayée à l'utilisateur sans le signe « ❓ » dans le texte de l'orchestrateur : `noter` lit 0, le
flux en montre une (texte du temps 1, « Quel nom donner à la fonction… »). (b) Passage joué **avant** le correctif 5 :
le plan s'est arrêté à la clôture sur `git rm plans/P1/S1.revue.md` refusé. La mesure de H1, elle, ne dépend pas de
la clôture (section 6).

Notes de lecture : « durée noter » = somme des `duration_ms` des événements `result` ; « mur » = durée réelle de
`claude -p` (somme des deux temps pour `arret-relaye`, attente exclue). Pour `arret-relaye`, coût et tours sont ceux des
deux processus, sommés (correctif 1). Le passage `nominal-…07-07-02` a 9 refus au titre de `permission_denials` parce
que l'orchestrateur a retenté trois fois la suppression des revues en `git rm`, `rm` composé, puis PowerShell.

Coût par modèle (`modelUsage`, fusionné sur les processus) :

| Passage | `claude-haiku-5-5` | `claude-sonnet-5-5` |
| --- | --- | --- |
| nominal 06-56-22 | 0,046 | 0,084 |
| nominal 07-07-02 | 0,053 | 0,082 |
| echec-reprise 07-10-55 | 0,033 | 0,045 |
| interruption 07-13-07 | 0,042 | 0,038 |
| revue-incomplete 07-15-54 | 0,012 | 0,032 |
| echec-reprise projet 08-46-07 | 0,039 | 0,032 |
| nominal projet 08-50-32 | 0,043 | 0,057 |
| arret-relaye projet 08-12-34 | 0,069 | 0,074 |

H2 (le coût inclut-il les sous-agents ?) : **oui**, une fois de plus — chaque passage où le relecteur tourne porte
`claude-sonnet-5-5` dans `modelUsage` alors que l'orchestrateur est en Haiku. Le relecteur de session pèse plus
que Haiku dans six passages sur huit (constat D de la référence : inchangé).

### Passages ratés ou de mise au point, écrits comme tels

Aucune ligne de la section 3 ne vient de l'un d'eux. Ils sont cités pour que « un passage raté se rejoue ou s'écrit raté »
soit vérifiable.

| Passage | Pourquoi il n'est pas une mesure | Coût | Suite |
| --- | --- | --- | --- |
| `echec-reprise-1-2026-10-16T07-16-57` (projet) | Reproduit la dette de S3 : `git rm` du rapport refusé dans la reprise, issue `question` (« arbre non commité »). Mesure *avant* correctif 4. | 0,021 | rejoué : `…08-46-07` |
| `echec-reprise-1-2026-10-16T07-19-21` (projet) | Reprise propre après correctif 4, mais clôture bloquée sur `git rm` des revues, et preuve N0 lue « postérieurement invalidée » : l'orchestrateur a écrit `Plan: P1/S1/` (sans `T<m>`) sur son commit de clôture, que le moteur lit comme un commit de tâche (constat 3, section 8). Avant correctif 5. | 0,066 | rejoué : `…08-46-07` |
| `nominal-1-2026-10-16T07-22-21` (projet) | Plan fini (`fini`), mais avant correctif 5 : trois refus à la clôture, résolue par PowerShell. | 0,112 | rejoué : `…08-50-32` |
| `arret-relaye-1-2026-10-16T07-25-44` (projet) | L'orchestrateur s'est arrêté dès le départ sur l'avis du hook SessionStart « mods non installés » (il a voulu lancer `installer-mods.mjs`, refusé) — aucune session lancée, aucune question à attendre (constat 2). | 0,007 | rejoué : `…07-35-15` |
| `arret-relaye-1-2026-10-16T07-35-15` (projet) | Temps 1 correct (question relayée) ; temps 2 : l'orchestrateur refuse de transmettre une réponse qu'il n'a pas reçue dans la conversation. H1 « indéterminée » à cause du banc (correctif 3). 30,0 min d'attente jouées pour rien. | 0,044 | rejoué : `…08-12-34` |

## 4. Variance entre les deux passages `nominal`

Mêmes entrées, mêmes réglages, deux passages consécutifs (`…06-56-22` et `…07-07-02`) :

| Mesure | Passage 1 | Passage 2 | Écart |
| --- | --- | --- | --- |
| Coût | 0,130 USD | 0,135 USD | 0,005 USD, soit 4 % de la moyenne (0,133) |
| Tours | 25 | 38 | × 1,5 |
| Durée mur | 199 s | 222 s | + 12 % |

La variance de ce côté-ci est plus faible que celle de la référence (20 % en coût, × 3,3 en tours, + 26 % en
durée), sur deux échantillons de plus. **Les seuils de la référence sont conservés** pour juger (20 % ou ~0,03 USD en
coût, × 3 en tours, 26 % en durée) : deux paires ne font pas une loi, mais aucune ne les contredit.

## 5. Revérification à la main des trois lectures de `noter.mjs` (référence §6 E)

Avant toute comparaison, chaque lecture a été vérifiée dans le flux d'un passage.

- **E1 — verdict `DECISION` lu comme `PASS`.** `echec-reprise-…07-16-57` : le flux porte
  `VERDICT: DECISION · MOTIF: correctif fait … non commité : la permission Bash est refusée pour git rm …` ; l'outil
  lit `DECISION`. `echec-reprise-…08-46-07` et `…07-10-55` : le flux porte `VERDICT: PASS`, l'outil lit `PASS`.
  **Établie.** (Le correctif de S5 tient.)
- **E2 — « relance inutile ».** Les huit passages affichent 0 ; dans chaque flux, chaque session ou reprise n'est
  lancée qu'une fois (un seul `Agent` par description `P1/S<k>` ou `P1/S1 reprise`). **Établie.**
- **E3 — revues « pas de verdict lu ».** Le relecteur rend deux lignes (`plans/P1/S1.revue.md — Bloquant : 0 ·
  Couverture : complète`), jamais un `VERDICT:` : « pas de verdict lu » est exact. Ce n'est pas une lecture fausse, c'est
  une colonne qui n'a pas d'objet pour une revue ; elle n'entre dans aucun verdict ci-dessous. **Établie** (sans
  objet).

Aucune des trois colonnes n'est donc marquée « non établie ». En revanche la revérification a trouvé deux lectures
fausses **nouvelles** (correctifs 1 et 2) et un trou de comptage (note (a) de la section 3), traités plus haut.

## 6. Critères rendus

**A — aucun refus de commande composée `cd … &&` dans les passages `--autorisations projet` : NON.** Passages
`…08-46-07`, `…08-50-32`, `…08-12-34` (finaux), attribution par agent lue dans `parent_tool_use_id` :

- `echec-reprise …08-46-07` : orchestrateur `cd "<projet>" && node .claude/workflow/bin/installer-mods.mjs`, orchestrateur
  `cd "<projet>" && git reset --soft HEAD~1 && git status --short` ; relecteur `cd "<projet>"; grep -n … ; git log …`.
- `nominal …08-50-32` : orchestrateur `cd "<projet>" && ls plans …; node …` ; relecteur (×2) `cd "<projet>"; grep …`, et
  `git -C "<projet>" show <sha>`.
- `arret-relaye …08-12-34` : relecteur `cd "<projet>"; grep -n … ; git log …` ; orchestrateur `sed -i …` composé, `node test.mjs;
  echo …`, `git rm -q … && git add …`.

Aucun des refus ne vient d'une session d'exécution (S1, S2) ni de la reprise : la règle « Écrire ses commandes » de
`EXECUTANT.md` (S3) tient pour elles. Elle ne s'applique ni à l'orchestrateur ni au relecteur de session, qui
préfixent encore chaque commande d'un `cd "<projet>"` — et les parties `grep`, `cat`, `ls`, `git -C` ne sont de toute
façon pas dans le gabarit. Aussi dans le régime `banc` (liste large, `cd:*` autorisé) : `cd … && …` y est refusé
dès qu'une règle `Read()` deny existe (référence, constat A) — 2, 9, 2, 2 et 1 refus sur les cinq passages `banc`.

**B — `echec-reprise --autorisations projet` sans refus Bash, budget non brûlé par l'environnement : NON au sens
littéral, OUI pour ce que B vise.** `echec-reprise-…08-46-07` : 3 refus au passage, tous de l'orchestrateur (2) et du
relecteur (1) — voir A. La reprise, elle, n'en reçoit aucun ; son `git rm` du rapport (la cause du passage `…07-16-57`) est
remplacé par la suppression du moteur (« S1 : reprise réussie, plans/P1/S1.echec.md supprimé (090b2fc) ») ; budget :
`reprise=1` sur 1, aucune reprise brûlée par un refus d'environnement, le plan finit. Le « zéro refus » exact que S3
n'avait pas pu prouver n'est donc **pas** atteint, mais le blocage qui l'empêchait l'est.

**C — dernier appel du moteur → `fini` dans chaque passage qui finit le plan : OUI.** Huit passages sur huit qui finissent le
plan (cinq `banc`, `echec-reprise …08-46-07`, `nominal …08-50-32`, et `…07-22-21` hors table) ; dans la référence, trois
passages sur trois qui finissaient le plan échouaient à ce critère. Pour `…08-46-07`, le dernier appel est une commande
enchaînée dont la sortie finit par `fini` (correctif 2, vérifié à la main). `arret-relaye …08-12-34` ne finit pas le plan :
sans objet.

**H1 — mot retenu restitué après l'attente : CONFIRMÉE.** `arret-relaye-1-2026-10-16T08-12-34` : session persistée
`72d418da-c9b9-4afd-b0a8-4c66b777be93`, temps 1 de 0,021 USD ; attente réelle **30,0 min** (1 800 319 ms) ; temps 2 : le moteur rend
`transmettre`, l'orchestrateur envoie `SendMessage` à l'agent de S1, retour `{"success":true,"message":"Resuming agent afcc13e"}`, aucune erreur ;
la même session répond `VERDICT: PASS · MOTIF: mot=cormoran-9031 nom=fois2` sans relire `docs/mot.txt` (vérifié :
aucune lecture du fichier ni d'un diff après la reprise, le fichier ne contient plus que « (lu) »). Un premier essai,
`…07-35-15`, est resté indéterminé pour une raison de banc (correctif 3). Même conclusion que la mesure de S6 (`…16-01-01`).

## 7. Comparaison ligne à ligne, verdict par mesure

Seuils (référence §3) : coût — au-delà de 20 % de la moyenne ou d'environ 0,03 USD ; tours — au-delà de ×3 ; durée mur —
au-delà de 26 %. Une ligne dont la référence s'arrêtait en route n'est pas à travail égal : le verdict est dit, et la
réserve avec lui.

| Scénario (référence → remesure, régime `banc`) | Mesure | Référence | Remesure | Verdict |
| --- | --- | --- | --- | --- |
| nominal (moyenne de deux) | coût | 0,134 | 0,133 | dans la variance |
| | tours | 8 et 26 | 25 et 38 | dans la variance (× 1,5 au plus) |
| | durée mur | 214 et 269 s | 199 et 222 s | dans la variance |
| | revues · questions · relances inutiles · preuves | 2 · 0 · 0 · 2/2 | 2 · 0 · 0 · 2/2 | identique |
| | abouti (critère 2 de `noter`) | non, non | oui, oui | **gain** (critère C) |
| echec-reprise | issue | `question`, plan non clos, preuves 0/1 | `fini`, plan clos, preuves 1/1 | **gain** |
| | coût | 0,167 | 0,078 | gain apparent (− 53 %) — la référence s'arrêtait à 5 tours : pas à travail égal |
| | tours · durée mur | 5 · 98 s | 23 · 124 s | non comparable : travail différent |
| interruption | issue | `relancer-interrompue`, plan non clos, preuves 0/1 | `fini`, plan clos, preuves 1/1 | **gain** |
| | coût | 0,025 | 0,080 | perte apparente (× 3,2) — la référence s'arrêtait à 4 tours, la remesure va jusqu'à la revue et à la clôture : pas à travail égal |
| | tours · durée mur | 4 · 72 s | 23 · 158 s | non comparable : travail différent |
| revue-incomplete | coût | 0,058 | 0,043 | dans la variance (− 26 %, mais 0,015 USD, sous 0,03) |
| | tours | 21 | 10 | dans la variance (÷ 2,1) |
| | durée mur | 109 s | 55 s | gain (− 49 %, au-delà de 26 % ; un seul échantillon) |
| | abouti (critère 2) | non | oui | **gain** (critère C) |
| total des cinq | coût | 0,517 | 0,466 | dans la variance (− 10 %) |

Le régime `projet` n'a pas de référence : le tableau de la référence était joué en `banc`. Les trois lignes `projet`
de la section 3 se lisent seules, par les critères A, B, C, H1.

**Ce qui a gagné.** (1) La clôture du plan par l'orchestrateur : le rappel final du moteur (constat C de la référence)
est fait partout, et `--appliquer` enchaîne les gestes mécaniques. (2) `echec-reprise` et `interruption` finissent seuls : le
mur de refus Bash sur les reprises (constat B) a disparu en régime `banc` ; en régime `projet`, la reprise ne reçoit plus de
refus. (3) Le moteur supprime lui-même les rapports résolus (S7) — le seul geste que les autorisations d'un projet
ne laissaient pas faire à une session. (4) H1 : une session arrêtée sur une question reprend par message après 30 min, avec
son contexte.

**Ce qui a perdu.** Rien, mesuré à travail égal. Seule `interruption` coûte plus (0,080 contre 0,025), parce qu'elle va jusqu'au
bout là où la référence rendait la main ; ce chiffre ne dit pas que le plan 2 est plus cher, il dit que la référence ne
mesurait pas le plan terminé.

**Ce qui ne se distingue pas.** Le coût d'un plan nominal (0,13 USD) et sa durée (200-220 s) ; le poids du relecteur Sonnet
(plus de la moitié du coût dans six passages sur huit) ; le nombre de tours d'un `nominal` (25 à 38, dont la variance entre
deux passages est du même ordre que l'écart à la référence).

## 8. Constats pour la suite

À traiter dans un plan suivant ; aucun n'est une régression large, et aucun n'a été corrigé ici.

1. **L'orchestrateur et le relecteur de session préfixent leurs commandes d'un `cd "<projet>"`** et enchaînent
   (`&&`, `;`) des commandes dont aucune partie n'est au gabarit (`cat`, `grep`, `ls`, `sed`, `git -C`). La règle d'écriture de
   `EXECUTANT.md` ne les couvre pas ; les deux agents ont un `Read` et un `Grep` natifs qui n'ont pas besoin de permission.
   C'est la cause de l'échec du critère A. Piste, non vérifiée : la même règle dans `orchestrer-plan/SKILL.md` et dans
   `agents/relecteur-session.md`.
2. **L'avis « Mods non installés ou en retard » (hook SessionStart) pèse sur l'orchestrateur.** Il figure dans les treize
   passages (le mini-projet vendore des mods qu'aucun poste n'a installés) ; l'orchestrateur Haiku s'y arrête (1 passage,
   `arret-relaye-…07-25-44`, 0,007 USD perdus) ou tente `installer-mods.mjs`, refusé sous `projet` (2 passages), sinon
   l'ignore. À décider : le banc retire les mods du mini-projet, ou la skill dit d'ignorer l'avis en orchestration.
3. **Le moteur lit tout `Plan: P<n>/S<k>/` comme un commit de tâche, même sans `T<m>`.** Passage `…07-19-21` : l'orchestrateur
   a écrit `Plan: P1/S1/` sur son commit de clôture ; la preuve N0, antérieure, est jugée « postérieurement invalidée par un
   commit de tâche » et le moteur rend `valider-n0` sur un plan fini. Piste : `--grep "Plan: P<n>/S<k>/T"` dans
   `preuve-n0.mjs` (le repère d'une tâche porte toujours `T<m>`).
4. **Un `git reset --soft` de l'orchestrateur est refusé** (passage `…08-46-07`, il voulait fusionner deux commits de
   clôture) : la règle « versement et suppression dans le même commit » de `fin-de-plan.md` pousse l'orchestrateur à des gestes
   que son outillage n'a pas. Sans conséquence ici (commits séparés, rien de perdu).
5. **`interruption` : l'orchestrateur invente un identifiant d'agent** (`a0000000000000000`) pour son `SendMessage`
   (passage `…07-13-07`, 1 appel en erreur), puis reprend à froid : le repli fonctionne, le coût est borné, mais l'envoi
   n'avait aucune chance.
6. **Instruments.** `permission_denials` ne retient pas tous les refus subis par un agent d'arrière-plan (passage
   `…07-16-57` : 0 dans le résultat, 1 refus `git rm` visible dans le flux) : la colonne « Refus Bash » doit se lire avec le
   flux. `noter` ne compte une question que si le texte porte « ❓ » (note (a)). Le cache de `lancer.mjs` ne note
   `sale` que pour `plugin/` : un correctif de test ne le fait pas passer à `true`, c'est voulu.
7. **Durée.** L'écart noter / mur reste de 1× à 2× (constat F de la référence) ; la durée de comparaison est le mur.

## 9. Rejouer cette remesure

```bash
node tests/scenarios/lancer.mjs --scenario nominal           # × 2
node tests/scenarios/lancer.mjs --scenario echec-reprise
node tests/scenarios/lancer.mjs --scenario interruption
node tests/scenarios/lancer.mjs --scenario revue-incomplete
node tests/scenarios/lancer.mjs --scenario echec-reprise --autorisations projet
node tests/scenarios/lancer.mjs --scenario nominal --autorisations projet
node tests/scenarios/lancer.mjs --scenario arret-relaye --autorisations projet --attente 30 --pause-max 8   # puis --reprendre jusqu'au code 0
node tests/scenarios/noter.mjs --tous -v
```

Un appel de `lancer.mjs` dépasse le plafond d'une commande de 10 minutes dès qu'il enchaîne des tests ; lancer chaque passage
seul, et `arret-relaye` en trois ou quatre appels (`--pause-max 8`).
