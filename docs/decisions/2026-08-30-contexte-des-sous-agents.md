# 2026-08-30 — Contexte d'un sous-agent : fork hérité, mémoire accumulée

## Décision

**Fork — option C.** Autorisé pour une classe nommée : la tâche a besoin du contexte courant **et**
produit du bruit qu'on ne veut pas garder. Trois interdits : jamais pour une session de plan, jamais
pour une reprise d'échec, jamais pour une restitution pure sans appel d'outil. Critère : *le fork
sert à retenir du bruit hors du contexte principal, pas à éviter d'écrire.*

**Mémoire — option A.** Aucune mémoire sur les quatre agents mécaniques. Critère opposable : *une
mémoire d'agent n'est légitime que pour une information dont aucun fichier du dépôt n'est déjà la
source.*

Validé par Thibault le 2026-08-30.

## Question

Un sous-agent peut désormais arriver avec du contexte : **hérité** de la conversation (`fork`,
défaut actif en interactif depuis 2.1.232) ou **accumulé** entre sessions (`memory:` en frontmatter).
Lequel a-t-il le droit d'avoir dans ce workflow ?

**Critère de fin** : une règle écrite qui dit, pour chaque agent du plugin, s'il peut être forké,
s'il peut avoir une mémoire, et quel interdit protège l'invariant « un exécutant ne lit que son
`S<k>.md` ».

## Faits établis (doc officielle, `code.claude.com/docs/en/sub-agents`)

- **Fork** : *« A fork is a subagent that inherits the entire conversation so far instead of starting
  fresh. »* Sa première requête **réutilise le cache du parent** — prompt système et définitions
  d'outils identiques — donc forker est **moins cher que lancer un sous-agent neuf** pour une tâche
  qui a besoin du même contexte. Ses appels d'outils restent hors de la conversation ; seul son
  résultat final revient.
- **Mémoire** : `user` / `project` / `local` → `~/.claude/agent-memory/<agent>/`,
  `.claude/agent-memory/<agent>/`, `.claude/agent-memory-local/<agent>/`. Le scope `project` est
  **versionné avec le dépôt**, donc vendorable — contrairement aux règles `autoMode`. Les 200
  premières lignes (ou 25 Ko) du `MEMORY.md` de l'agent sont injectées dans son prompt système **à
  chaque démarrage**.

## Ce que ça fait à la règle de 0.4.0

`CLAUDE-BASE.md` porte : *« la délégation empêche le contexte d'entrer, elle ne l'évacue pas — un
agent devrait relire tout l'historique pour reconstruire ce que la conversation détient déjà, donc
rédiger soi-même coûte moins cher que déléguer la synthèse »*.

Le **motif** tombe pour un fork : il ne relit rien, il hérite d'un préfixe déjà en cache. Ce qui
survit, c'est le cas étroit de la **restitution pure** — une synthèse que la conversation détient
entièrement et qui ne demande aucun outil : la rédiger soi-même coûte les tokens de sortie, la
forker coûte les mêmes tokens **plus** un passage sur le préfixe, fût-il mis en cache. La règle est
donc **rétrécie**, pas abrogée.

## Options — fork

- **A. Interdit (statu quo).** Coût : toute exploration ou vérification accompagnant une synthèse
  reste dans le contexte principal, où elle se repaie à chaque tour suivant. Ne ferme rien.
- **B. Autorisé sans réserve.** Coût : une session de plan ou une reprise d'échec peut hériter de la
  conversation. L'invariant du workflow (`S<k>.md` seul) et le démarrage à froid de
  `/reprendre-echec` tombent tous les deux, sans que rien ne le signale.
- **C. Autorisé pour une classe nommée (recommandé).** Le fork est légitime quand la tâche a besoin
  du contexte courant **et** produit du bruit qu'on ne veut pas garder (appels d'outils, itérations).
  Trois interdits explicites :
  1. **jamais pour une session de plan** — l'exécutant ne lit que son `S<k>.md`, un fork le violerait
     par construction ;
  2. **jamais pour réparer** — `/reprendre-echec` impose le démarrage à froid précisément pour ne pas
     rapatrier les fausses pistes ;
  3. **jamais pour une restitution pure** — sans appel d'outil, rédiger soi-même reste moins cher.

**Recommandation : C.** Critère : le fork gagne quand il **retient du bruit hors du contexte
principal**, pas quand il évite d'écrire.

## Options — mémoire

- **A. Aucune mémoire sur les quatre agents mécaniques (recommandé).**
- **B. Mémoire `project` sur `verificateur-n0`** (retenir les commandes réelles du projet).
- **C. Mémoire sur `explorateur`** (retenir la carte du dépôt).

**Recommandation : A**, et le motif vaut plus que la conclusion : pour chacun des quatre agents,
l'information qu'il mémoriserait a **déjà une source dans le dépôt** — commandes → `CLAUDE.md`
§Commandes ; localisation → `PROJECT_MAP.md` ; état git → éphémère par nature ; doc externe → la
doc elle-même, qui bouge. Une mémoire d'agent y serait une seconde source, et
« une information écrite à deux endroits finit toujours par diverger » est déjà une règle du dépôt.

Pire pour B : un `verificateur-n0` qui mémorise une commande de `typecheck` la fige — y compris le
`typecheck` qui ne compile aucun fichier, le piège que `CLAUDE.md` documente. Si cet agent
redécouvre les commandes à chaque fois, le défaut est que `CLAUDE.md` §Commandes est faux ou non
lu ; une mémoire le recouvrirait au lieu de le corriger.

**Critère retenu** : *une mémoire d'agent n'est légitime que pour une information dont aucun fichier
du dépôt n'est déjà la source.* Cas réservé pour plus tard, qui remplirait ce critère : un agent de
relecture accumulant les défauts récurrents d'un projet — rien dans le dépôt ne porte ça aujourd'hui.

## Conséquences si adopté

- Une ligne dans `CLAUDE-BASE.md` §Avant de coder : le fork rejoint la table de délégation avec sa
  classe et ses trois interdits.
- `/reprendre-echec` et `/nouveau-plan` (bandeau du `S<k>.md`) portent l'interdit explicitement —
  le défaut étant désormais actif en interactif, se taire revient à autoriser.
- La phrase de 0.4.0 dans `CLAUDE-BASE.md` est reformulée : elle vise la restitution pure, pas la
  délégation en général.
