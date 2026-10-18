# Sonde — une session liée (`start_session`) peut-elle lancer le serveur de dev et le navigateur in-app ? (2026-10-18)

Protocole et constats (sonde jouée le 2026-10-18). Hors plan : mesure seule, aucun changement de `plugin/`.

## Pourquoi cette sonde

`docs/decisions/2026-10-06-apres-p15.md` a reporté « la session neuve à la place de la pastille »
jusqu'à un **signal double** :

1. une session sans surveillance peut lancer le serveur de dev et utiliser le navigateur in-app ;
2. une session lancée par une autre **prévient son lanceur à sa fin**, de façon documentée.

Au 2026-10-18, la condition 2 est remplie **sur le papier** : Desktop expose
`mcp__ccd_session__start_session` (absent aux sondes du 2026-09-17 et du 2026-10-05). Sa description
d'outil documente le retour : quand une session lancée finit un tour, le lanceur reçoit une note qui
cite les **400 premiers caractères** de son dernier rapport (récapitulatif de fin, puis message
final). Il est ensuite relancé par un message `<side-sessions-event>` une fois qu'aucune session
lancée ne travaille plus. L'annonce Claude Code du 2026-10-17 décrit la même chose (« nested
sessions »).

La condition 1 reste **non mesurée**. Le refus connu (EBM-MSPv2, P9/S3) vise « unattended
sessions (scheduled-task runs and remote-dispatched trees) ». Une session liée est-elle un
« remote-dispatched tree » ? Rien ne le dit. C'est l'objet de cette sonde.

## Contraintes déjà connues (descriptions d'outils, à confirmer en passant)

- **K1** — L'app **refuse** `start_session` sur un tour déclenché par le message d'une autre session
  ou par un évènement automatique ; elle n'accepte alors qu'une *proposition* (carte que
  l'utilisateur clique). Si c'est confirmé, un orchestrateur réveillé par la fin de la vague N ne
  peut pas lancer seul la vague N+1.
- **K2** — Le retour au lanceur est tronqué à 400 caractères : un `VERDICT:` doit tenir en tête du
  récapitulatif.
- **K3** — Après « beaucoup » de réveils consécutifs sans message de l'utilisateur, les notes
  attendent le tour suivant.

## Cible

`C:\Users\Kovu\Projets\EBM-MSPv2` : le projet de l'incident d'origine, avec `.claude/launch.json`
(configuration `dev`, `npm run dev`, port 5173) et `node_modules` présent. Arbre propre au
2026-10-18 (`0f1c1cb`).

## Déroulé

**Lanceur** : une session Desktop sur Templates, en mode de permission habituel. Le lanceur ne
touche pas à EBM-MSPv2.

**M1 — lancement à la demande (tour ouvert par l'utilisateur).**
L'utilisateur écrit en clair « lance la sonde ». Le lanceur appelle `start_session` avec :
`initiation: "user_asked"`, `context: "fresh"`, `cwd` = EBM-MSPv2 (nom pris dans
`list_start_targets`), `use_worktree: false`, `model: "haiku"`, et le prompt ci-dessous.

**Prompt de la session sondée** (lecture seule) :

```
Sonde de mesure, lecture seule : ne modifie, ne committe et n'installe rien.
1. preview_start { name: "dev" }. Cite mot pour mot le retour de l'outil, succès ou refus.
2. Si le serveur tourne : read_page sur la page d'accueil (résume en une ligne ce que tu vois),
   read_console_messages { onlyErrors: true }, puis preview_stop.
3. Appelle mcp__ccd_session_mgmt__get_session sur toi-même si l'outil le permet, et relève le mode
   de permission et le modèle.
Ta réponse finale commence EXACTEMENT par cette ligne, avant tout autre texte :
SONDE: SERVEUR=OK|REFUS · NAVIGATEUR=OK|REFUS|NON-ESSAYE · PERMISSION=<mode> · MODELE=<modèle>
puis, en dessous, la citation du retour de preview_start.
```

**M2 — retour au lanceur.** Le lanceur ne demande rien et termine son tour. On relève si la note de
fin arrive d'elle-même, si elle contient la ligne `SONDE:` (K2), et si le lanceur est relancé par un
`<side-sessions-event>`.

**M3 — enchaînement depuis un réveil (K1).** Dans le tour ouvert par ce `<side-sessions-event>`, le
lanceur tente un second `start_session` (`initiation: "user_asked"`, même prompt, autre `title`). On
relève le refus ou l'acceptation, mot pour mot. S'il refuse, le lanceur tente une proposition
(`initiation: "own_initiative"`) et on note si la carte apparaît. **Personne ne la démarre.** Ensuite :
`dismiss_task`.

**M4 — permissions.** Si la session sondée a demandé une approbation (outil, commande, site),
noter laquelle et qui a dû cliquer.

**Rangement.** Le serveur est arrêté par la session sondée (sinon `preview_stop` depuis le lanceur).
L'archivage de la session sondée n'a lieu **que sur accord de l'utilisateur**. On vérifie ensuite que
`git -C EBM-MSPv2 status --short` est vide.

## Lecture des résultats

| Constat | Conséquence pour la décision du 2026-10-06 |
| --- | --- |
| M1 `SERVEUR=OK` et `NAVIGATEUR=OK`, M2 retour reçu | Signal double **rempli** → rouvrir l'idée par `/cadrer` (la pastille Desktop pourrait devenir une session liée qui rend son verdict seule). M3 et M4 en sont les contraintes de conception. |
| M1 `SERVEUR=REFUS` avec le même message que P9/S3 | Condition 1 **non remplie** → l'idée reste reportée ; noter qu'une session liée compte comme « sans surveillance ». |
| M1 OK, M2 sans retour | Condition 2 contredite par les faits malgré la doc → incident d'environnement, idée reportée. |
| M3 refus confirmé | Quelle que soit l'issue, une vague ne peut pas en lancer une autre sans clic : la session liée remplace au mieux **une pastille**, pas l'orchestrateur. |

## Constats

| # | Mesure | Constat | Preuve (citation) |
| --- | --- | --- | --- |
| M1 | Serveur de dev / navigateur depuis une session liée | **OK, avec une réserve sur le navigateur** | `preview_start` : « Server started on port 5173. Opened tab "seed" at http://localhost:5173. » Aucun refus « unattended ». Navigateur : le volet de la session liée est **masqué** (`tabs_context` : « The Browser pane is currently hidden »). Au premier essai, `read_page` a rendu « (empty page) », viewport 0x0. Au second (`resize_window` desktop, `navigate`, attente 3 s), `get_page_text` et `screenshot` ont **lu la page** (onglets « Pathologies » et « Dossiers de preuve », trois cartes, cadre 800x600). `read_page` restait vide (0x0). |
| M2 | Note de fin et réveil du lanceur, `SONDE:` lisible | **CONFIRMÉE** | La note de fin est arrivée seule et le lanceur a été relancé par `<side-sessions-event>` sans geste humain. La ligne `SONDE:` tenait dans les 400 caractères cités. Le rapport entier se lit par `list_events`. Une relance par `SendMessage` vers la même session a marché aussi (second réveil, même mécanisme). |
| M3 | `start_session` depuis un tour de réveil | **REFUSÉ (K1 confirmé)** | « Start sessions only on the user's own words to you here; this turn runs an automated event, another session's message, or the task another session gave you. Propose the session instead (initiation "own_initiative"), or start it once the user asks you here. » La proposition **ne peut pas viser un autre dossier** : « A proposal card cannot carry a host, folder, environment or preset yet ». Une carte pour le projet courant s'affiche (`task_55b972a6`), puis a été retirée par `dismiss_task`. |
| M4 | Approbations demandées, mode de permission | **Aucune approbation** | La session liée a hérité du mode du lanceur (`permissionMode: auto`, `claude-haiku-5-5`, effort `medium`). Démarrage du serveur, navigation et arrêt sont passés sans confirmation. Après coup, `git status` d'EBM-MSPv2 est vide et le port 5173 est libéré. |

## Bilan

- **Condition 1 du signal (2026-10-06) : remplie pour une session liée.** Une session lancée par
  `start_session` n'est pas « sans surveillance » : elle démarre le serveur de dev et lit la page.
  Réserve pour le N1 : volet masqué, donc `read_page` (arbre d'accessibilité) est inutilisable. Il
  faut passer par `get_page_text` et `screenshot`, après un `resize_window`. Le contrôle responsive
  reste à vérifier dans ces conditions. `/verif-visuelle` devra en tenir compte.
- **Condition 2 : remplie** (M2).
- **Le signal double est là, mais l'idée n'a plus d'objet.** La sonde a été préparée sur la
  décision du 2026-10-06 sans voir celle du **2026-10-14**
  (`docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md`), qui supprime la
  `pastille` des sessions orchestrées (N1 en sous-agent, N2 non bloquant, choix relayés par
  `SendMessage`) et déclare la session neuve « sans objet ». `/cadrer` du 2026-10-18 s'est arrêté à
  l'Étape 0, issue **Rien à faire** (registre `DECISIONS.md`).
- **Ce qui reste utile si le sujet revient** (chaînage à la main de `/fin-de-tache`, hors
  orchestration, seul usage restant d'une pastille) :
  1. **Pas d'enchaînement autonome** (M3) : un réveil ne peut pas lancer la session suivante ; il
     faut la parole de l'utilisateur, ce qui ne gagne rien sur un clic.
  2. **Le verdict tient en tête du récapitulatif** (400 caractères), le reste se lit par `list_events`.
  3. **Une carte ne vise que le projet courant.**
  4. **Mode de permission hérité** : `auto` ici.
- **Constat à vérifier ailleurs** : volet du navigateur masqué ⇒ `read_page` rend une page vide
  (0x0) alors que `get_page_text` et `screenshot` lisent la page. Si un sous-agent qui joue le N1
  sous orchestration tombe sur le même cas, `/verif-visuelle` conclurait à tort « contenu absent ».
  Non mesuré en sous-agent.
