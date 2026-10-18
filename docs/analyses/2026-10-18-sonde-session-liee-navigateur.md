# Sonde — une session liée (`start_session`) peut-elle lancer le serveur de dev et le navigateur in-app ? (2026-10-18)

Protocole, puis constats à remplir. Hors plan : mesure seule, aucun changement de `plugin/`.

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
| M1 | Serveur de dev / navigateur depuis une session liée | _à remplir_ | |
| M2 | Note de fin et réveil du lanceur, `SONDE:` lisible | _à remplir_ | |
| M3 | `start_session` depuis un tour de réveil | _à remplir_ | |
| M4 | Approbations demandées, mode de permission | _à remplir_ | |
