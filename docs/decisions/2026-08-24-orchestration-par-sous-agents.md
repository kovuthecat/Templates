# 2026-08-24 — Orchestration par sous-agents : une vague sans intervention

Plugin `workflow` 0.14.0. Objectif posé par Thibault : qu'un orchestrateur puisse dérouler une vague,
voire un plan entier, sans que l'utilisateur ait à intervenir. La pastille `spawn_task` l'interdisait
par construction — un clic par session.

## Deux mesures avant de rien changer

La skill posait depuis le 2026-08-22 qu'« une session N1 ne peut pas tourner en headless : `claude -p`
n'a pas de navigateur ». C'était un postulat jamais vérifié, du même genre que ceux qui ont produit
les trois pannes de la journée. Vérifié, donc :

1. **`claude -p` n'a effectivement pas de navigateur.** Interrogée sur les outils
   `mcp__Claude_Browser__*` et `preview_start`, une session headless répond `NON`. Le postulat était
   juste ; le N1 y est réellement impossible.
2. **Un sous-agent hérite du navigateur.** Lancé depuis une session Claude Code Desktop via l'outil
   `Agent`, il reçoit les **18 outils** `mcp__Claude_Browser__*`, directement — pas en différé via
   `ToolSearch`.

C'est le second point qui débloque tout : la pastille n'existait que parce qu'on lançait des
*processus externes*, incapables de voir. Un sous-agent voit.

## La décision

La voie Desktop devient une **voie sous-agent** : outil `Agent`, `run_in_background: true`, un agent
par session de la vague. Contexte propre (donc « jamais deux sessions dans une conversation » tenu
aussi bien que par `claude -p`), navigateur hérité, notification automatique à la fin. Une vague
mixte se termine dans le même tour, sans un clic.

La pastille `spawn_task` est reléguée au **repli manuel**, pour un orchestrateur qui tourne hors
Claude Code Desktop — VSCode, terminal, session cloud — et n'a donc aucun navigateur à transmettre.

### Verdict : la ligne, recoupée par les commits

Le sous-agent rend une ligne au format imposé (`VERDICT: … · MOTIF: … · RAPPORT: …`), qui remplace le
schéma JSON de la voie headless. **Un `PASS` sans commit correspondant est traité en `FAIL`.**

C'est la leçon du matin même, transposée : une déclaration de fin n'est pas une preuve de fin, qu'elle
vienne d'un humain ou d'un agent. Seul compte ce que le dépôt porte.

## Ce que ça coûte, et qui n'est pas masqué

- **L'effort n'est pas réglable.** L'outil `Agent` accepte un `model`, pas un `effort` : une session
  `Env. = Desktop` en `high` tourne à l'effort ambiant. La skill impose de le signaler dans le
  rapport plutôt que de laisser croire que la colonne a été respectée. Deux issues quand le cas se
  présente : passer la session en headless si son N1 est dispensable, ou accepter et l'écrire.
- **La session d'orchestration doit rester ouverte** pendant la vague : les sous-agents vivent en
  elle. On lance quand on peut laisser la fenêtre tranquille — mais sans avoir à y revenir.

## Écarté en chemin

**Faire remonter la fin d'une session par `SendMessage`.** Le transport existe et fonctionne entre
sessions, mais aucune session ne peut s'identifier elle-même : `list_sessions` exclut la session
courante et `get_session` refuse son propre id. L'orchestrateur ne peut donc pas laisser son adresse,
et une session fille qui appelle `ListAgents` ne voit que des noms auto-générés qu'elle ne sait pas
rattacher. `notify_when_idle` va dans l'autre sens, mais exige une session **déjà ouverte** — or une
pastille n'est cliquée que plus tard. Et un message reste éphémère : ce serait un canal de verdict
pouvant silencieusement ne pas exister, exactement la panne réparée trois fois ce jour-là.

**N1 différé, tout en headless.** Écarté par Thibault : un défaut visuel découvert en fin de plan peut
invalider le travail de plusieurs sessions, ce que la règle « un défaut N1 se corrige maintenant »
existe pour éviter.

## Trouvé au passage

`claude -p` dans MYO affichait `Ignoring 10 permissions.allow entries: this workspace has not been
trusted`. La confiance est indexée sur la **chaîne** du chemin, pas sur le dossier : l'entrée
`C:\Users\...\MYO` était approuvée, mais un shell résolvant `C:/Users/.../MYO` en crée une distincte,
non approuvée. Toutes les sessions headless de la vague auraient tourné sans allowlist, bloquées sur
des outils refusés que personne n'était là pour autoriser. Contrôle ajouté au préflight (Étape 2c).
