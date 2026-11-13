# Recommandations d'optimisation du workflow — 2026-11-13

- Version examinée : plugin `0.68.0` (commit `d990677`).
- Auteur : Claude Code (session cloud), à la demande de l'utilisateur.
- Méthode : lecture du dépôt source (`WORKFLOW.md`, `CLAUDE-BASE.md`, `EXECUTANT.md`, hooks, agents,
  en-têtes des skills, mods, CI, `TASKS.md`, décisions et analyses d'octobre) et du changelog de
  Claude Code de 2.1.285 à 2.1.323 (12 novembre 2026).
- Statut : **recommandations**. Ce n'est ni une décision, ni un plan. Rien n'a été codé.

## Limites de cette revue

- **Rien n'a été rejoué.** Aucun test, aucun scénario, aucune sonde n'a été lancé. Les points marqués
  « à sonder » sont des risques déduits du changelog, pas des pannes constatées.
- **Dépôt source seulement.** Les 21 projets vendorés n'ont pas été lus.
- **Historique tronqué.** Le clone de la session ne porte que 50 commits : les comptages sur
  l'historique (commits `Express :`, par exemple) n'ont pas pu être faits.
- La dernière mesure du workflow (`docs/analyses/2026-10-15-remesure-plan-2.md`) date de Claude Code
  2.1.299. Tout ce qui a changé depuis n'est couvert par aucune mesure.

## En bref

Le workflow est solide sur ses mécanismes : moteur d'état déterministe, preuve N0, nature de l'échec,
reprises bornées, incidents par fichier. Deux familles de recommandations :

- **Partie A — adaptations à Claude Code** : deux comportements de la plateforme ont changé sous des
  règles du workflow et demandent une sonde ; quatre réglages nouveaux remplacent de la discipline
  par un contrôle.
- **Partie B — améliorations de fond** : le workflow mesure la partie la moins chère d'un plan, change
  plus vite que ses projets ne l'éprouvent, et découvre les ruptures de la plateforme en pleine
  session.

Ordre conseillé : A1 et A2 (une heure, hors dépôt) → A3 → B1 → B3 → le reste selon les chiffres de B1.

---

## Partie A — Adaptations aux mises à jour de Claude Code

### Priorité 1 — ce qui peut fausser un plan aujourd'hui

#### A1. Re-sonder la règle « délégation au premier plan » — *à sonder*

**Constat.** Depuis 2.1.302, Desktop et VS Code lancent *toujours* en arrière-plan les sous-agents de
la conversation principale, et les appels `Agent` d'un sous-agent partent au premier plan par défaut.

**Conséquences possibles.**
- `run_in_background: false` n'aurait plus d'effet pour `/cadrer`, `/nouveau-plan` ou le relecteur
  lancé par l'orchestrateur : la règle de `WORKFLOW.md` §5 ne serait plus tenue en conversation
  principale.
- La consigne répétée dans `EXECUTANT.md` (l. 49) et la protection O3 du mod `garde-fous` seraient
  devenues inutiles côté sessions : une règle à retirer.

**Proposition.** Sonde hors dépôt, sur Desktop : un appel `Agent` avec `run_in_background: false`
depuis la conversation principale, puis depuis un sous-agent sans le paramètre. Le résultat décide
entre un correctif et un retrait de règle.

#### A2. Sonder un N0 long dans une session orchestrée — *à sonder*

**Constat.** Depuis 2.1.318, un sous-agent d'arrière-plan voit sa commande shell détachée au bout de
3 minutes.

**Risque.** Une session dont le build ou les tests dépassent 3 minutes pourrait rendre son verdict
avant la fin de N0, alors que `EXECUTANT.md` interdit toute commande détachée et que la session « n'a
aucun tour après sa réponse finale ».

**Proposition.** Sonde avec un `n0.json` dont une commande dure 4 minutes, dans une session lancée
par `/orchestrer-plan`.

#### A3. Corriger les constats de la remesure, ouverts depuis le 2026-10-16

**Constat.** `TASKS.md` porte cinq constats de `docs/analyses/2026-10-15-remesure-plan-2.md` §8, non
traités. Deux comptent vraiment :
- un commit `Plan: P<n>/S<k>/` sans `T<m>` invalide à tort la preuve N0 et fait rendre `valider-n0`
  sur un plan fini ;
- les `cd "<projet>" && …` de l'orchestrateur et du relecteur sont refusés sous les autorisations
  d'un projet : c'est la cause de l'échec du critère A.

**Pourquoi d'abord.** Ce sont des défauts mesurés, avec une piste déjà écrite dans l'analyse : le
meilleur rapport gain/effort du dépôt.

#### A4. Activer `permissions.denyInsteadOfPrompting` dans le gabarit de projet

**Constat.** Réglage ajouté en 2.1.319 : une demande de permission devient un refus immédiat, et le
tour continue.

**Gain.** En pilotage à distance, une demande de permission dans un sous-agent est une attente que
personne ne voit. Le refus, lui, tombe dans le circuit existant (nature `environnement`, incident).

**Revers.** En session à la main, vous perdez la possibilité d'accepter au vol. À limiter aux sessions
orchestrées si le réglage le permet — non vérifié.

### Priorité 2 — adaptations utiles, peu coûteuses

#### A5. Remplacer le seuil « contexte > 70 % » par un seuil en tokens

**Constat.** `WORKFLOW.md` §9a, `EXECUTANT.md` (l. 39) et `gabarit-echec.md` arrêtent une session à
« contexte > 70 % ». Avec des fenêtres de 1M sur tous les modèles, ce seuil ne se déclenche plus.
Haiku 5.5 coûte 5× plus cher au-delà de 100K de prompt (0,50/2,50 $ contre 0,10/0,50 $ par MTok).

**Proposition.** Mesurer où en est l'orchestrateur Haiku sur un plan long (P20 : 14 sessions), puis
fixer un seuil en tokens.

#### A6. Déclarer `engines["claude-code"]` dans les trois `plugin.json`

**Constat.** Champ ajouté en 2.1.323 : un plugin hors de sa plage de versions n'est ni installé ni
chargé.

**Gain.** Un poste trop ancien échoue clairement, au lieu de tourner de travers en silence (poste
resté en 2.1.292, décision du 2026-10-12).

**Limite.** Ne couvre pas les projets vendorés, qui ne passent pas par le manifeste.

#### A7. Rendre bloquants en cas de panne les deux hooks qui refusent

**Constat.** `onFailure: "block"` existe depuis 2.1.295 pour les hooks de commande. Aujourd'hui, si
`pretooluse-git.mjs` ou `stop-contexte.mjs` plante ou dépasse son délai, l'action passe.

**Revers.** Un bug du hook bloquerait tout Bash. Commencer par le hook git, le mieux testé.

#### A8. Remplir la section Commandes du `CLAUDE.md` de ce dépôt

**Constat.** Elle contient encore les `<commande …>` du gabarit, alors que les vraies commandes sont
dans `.claude/n0.json`. Le fichier est chargé à chaque session, et la règle « section la plus utile »
vient du gabarit lui-même.

#### A9. Rafraîchir les références périmées

- `WORKFLOW.md` l. 3 annonce Fable 5.1 ; le défaut est 5.2 depuis 2.1.321.
- `docs/references/claude-code-capabilities-2026-08.md`, que lit `/choisir-mecanisme`, précède les
  mods, le paramètre `effort` de l'outil `Agent` et tous les réglages cités ici. Le remplacer par un
  renvoi à `https://code.claude.com/docs/llms.txt`, lu par `lecteur-doc`.

### Priorité 3 — hygiène, quand un plan passe par là

#### A10. Trier le « backlog de revue »

Environ 35 constats non bloquants de P17 à P20 dans `TASKS.md`, jamais arbitrés ; la liste grossit à
chaque plan. Une passe « corriger / abandonner » en voie express la viderait.

#### A11. Vérifier les mods contre 2.1.323

`subagentStatusLine` est retiré et les hooks génériques sur `engine.create` ne font plus qu'observer.
Le code des mods n'utilise ni l'un ni l'autre d'après une recherche par motif ; la CI lance déjà
`claude plugin validate --strict`, qui contrôle désormais aussi les types du module de hooks.

#### A12. Archiver `rapport-amelioration-workflow-claude-code.md`

110 Ko à la racine, daté du 15 septembre, décrit la version 0.36. Sa place est dans `docs/analyses/`.

---

## Partie B — Améliorations de fond, indépendantes des mises à jour

### B1. Mesurer là où est le coût réel

**Constat.** Les scénarios mesurent l'orchestration d'un mini-plan de deux sessions : 0,13 USD, dont
plus de la moitié pour le relecteur. Le coût en amont n'a aucun chiffre : `/cadrer`, `/nouveau-plan`
et `critique-plan` tournent en Opus, et les 14 fiches de P20 pèsent 162 Ko, soit environ 11 Ko par
session. C'est probablement la plus grosse dépense d'un plan.

**Proposition.** Un bilan par plan clos, calculé par script depuis git comme `bilan-express.mjs` :
- sessions réussies du premier coup ;
- reprises, enquêtes et questions posées ;
- bloquants trouvés par relecture ;
- taille des fiches.

**Pourquoi d'abord.** B4 en dépend : sans ces chiffres, alléger est un pari.

### B2. Ralentir et regrouper les versions

**Constat.** 68 versions en dix semaines, 20 plans presque tous sur le workflow lui-même. Dans la
synthèse du 2026-10-08, 8 des 18 nouveaux incidents viennent de Templates : le workflow est son
premier client et sa première source de pannes. Chaque version se propage à 21 projets vendorés.

**Proposition.** Des versions groupées, déclenchées par les incidents des projets aval plutôt que par
l'auto-revue.

**Revers.** Une correction utile attend parfois deux ou trois semaines.

### B3. Un test de non-régression périodique contre Claude Code

**Constat.** Le workflow repose sur des comportements observés, pas garantis : reprise par
`SendMessage`, arrière-plan des sous-agents, API des mods, navigateur in-app. Claude Code a sorti
près de 40 versions en six semaines. Une rupture se découvre aujourd'hui en pleine session, puis
devient un incident (A1 et A2 en sont deux candidats).

**Proposition.** Rejouer les cinq scénarios chaque semaine, en tâche planifiée : environ 0,47 USD le
passage.

**Revers.** Ils tournent sur le poste (dépôt nu local, Windows) : il faut une machine allumée, ou un
portage vers la CI.

### B4. Alléger selon les chiffres de B1

- **Fiches de session.** Une fiche de 11 Ko écrite par Opus pour une session Haiku ou Sonnet est
  disproportionnée quand la session change peu de choses. Entre la voie express et le plan complet,
  il n'y a rien. Si le bilan confirme que les petits plans réussissent du premier coup, un plafond de
  taille par fiche suffirait.
- **Relecture.** Elle produit surtout du « non bloquant » (A10). Si le bilan montre moins d'un
  bloquant pour dix relectures, la limiter aux chemins sensibles et faire rendre au relecteur les
  bloquants seuls.
- **Règles des projets.** 15 projets attendent encore une revue règle par règle avec l'utilisateur
  (`TASKS.md`). Les trois critères de `docs/decisions/2026-10-08-regles-de-projet-validees.md` sont
  assez mécaniques pour qu'un script propose un diff par projet, validé en bloc.

### B5. Question ouverte — l'orchestrateur doit-il être un modèle ?

**Constat.** L'orchestrateur « ne décide rien » : il relaie le moteur. Ses écarts mesurés
(identifiant d'agent inventé pour `SendMessage`, `cd` refusés, arrêt sur l'avis « mods non
installés ») viennent tous du fait qu'un modèle exécute une tâche de script.

**Piste.** Un pilote en script supprimerait cette classe de défauts.

**Revers.** Il perdrait le navigateur in-app et la reprise avec contexte. **Non recommandé sans
mesure** ; à garder en tête si les écarts de Haiku persistent après A3.

---

## Ce qui n'est pas recommandé

- **Nouveaux agents, mémoire, parallélisme.** La revue du 2026-10-13 a raison : le gain vient des
  règles supprimées ou transformées en scripts.
- **Découper `prochaine-action.mjs` (2 525 lignes).** Coûteux, sans défaut mesuré derrière.

## Récapitulatif

| # | Recommandation | Priorité | Nature | Effort |
| --- | --- | --- | --- | --- |
| A1 | Sonder la délégation au premier plan | 1 | sonde | faible |
| A2 | Sonder un N0 de plus de 3 minutes | 1 | sonde | faible |
| A3 | Corriger les constats de la remesure | 1 | correctif | moyen |
| A4 | `denyInsteadOfPrompting` au gabarit | 1 | réglage | faible |
| B1 | Bilan par plan clos | 1 | script | moyen |
| B3 | Scénarios rejoués chaque semaine | 1 | tâche planifiée | moyen |
| A5 | Seuil de contexte en tokens | 2 | mesure puis texte | faible |
| A6 | `engines["claude-code"]` | 2 | manifeste | faible |
| A7 | `onFailure: "block"` sur le hook git | 2 | réglage | faible |
| A8 | Commandes du `CLAUDE.md` | 2 | texte | faible |
| A9 | Références périmées | 2 | texte | faible |
| B2 | Versions groupées | 2 | gouvernance | — |
| B4 | Alléger fiches, relecture, règles | 2 | selon B1 | moyen |
| A10 | Trier le backlog de revue | 3 | hygiène | faible |
| A11 | Mods contre 2.1.323 | 3 | vérification | faible |
| A12 | Archiver le rapport de septembre | 3 | hygiène | faible |
| B5 | Orchestrateur en script | ouverte | conception | élevé |
