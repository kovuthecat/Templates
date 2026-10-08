# 2026-10-08 — Les règles d'un projet se discutent à sa création, et se révisent dans les projets existants

> Issue d'une revue avec l'utilisateur, sur l'inventaire
> `docs/analyses/2026-10-08-regles-projets-inventaire.md` (21 projets vendorés, 364 règles, 51 ont
> bloqué, 52 suspectes) et la synthèse d'incidents `docs/incidents/2026-10-08-synthese.md` (J14).
> Brief : inchangé.

## Ce que ça change, en clair

- **À la création d'un projet, tu valides ses règles.** `/nouveau-projet` ne pose plus seul les
  interdits et les chiffres : il te les soumet, un par un, avant de les écrire. Ce que tu verras :
  une étape de plus dans l'interview, et des règles qui disent pourquoi elles existent et quand
  elles tombent.
- **Les 21 projets existants sont revus un par un, avec toi**, en commençant par les plus bloqués
  (trames-consultation, DoxUploader, ebm-msp, EBM-MSPv2, Interface-OE, Chords). Pour chaque règle
  bloquante ou suspecte : garder, assouplir ou retirer — tu tranches.

## Ce qui est tranché

1. **Interdit sur une famille de solutions** (dépendances, persistance, réseau, IA, interface,
   authentification…) : question explicite de l'interview ; s'il est gardé, il s'écrit avec son
   **motif** et sa **condition de levée** (« tant que… », « sauf si… »). Un interdit qui protège
   une donnée ou une action précise (données patient, secrets, NAS en lecture seule) reste absolu.
   Pourquoi : 24 des 51 blocages, souvent levés en quelques jours ; les interdits ciblés n'ont
   jamais bloqué.
2. **Chiffres, seuils, listes fermées issus de l'interview** : écrits « provisoire, à mesurer au
   premier plan », jamais en invariant ; un critère d'aspect sans seuil mesurable est un jugement
   humain (N2). Pourquoi : 12 blocages, presque tous révisés au premier contact avec le réel.
3. **Outillage instancié complet** : `.claude/n0.json` créé à l'instanciation, même minimal ; un
   projet sans aucune commande reçoit `Preuve N0 : non requise` de `/nouveau-plan` (règle J14) ;
   `permissions.allow` dérivé de la stack (runner de tests réel, `n0.mjs`, `git push`) ;
   `/maj-workflow` signale un `allow` en retard sur le gabarit. Pourquoi : 9 blocages mécaniques.
4. **Bloc « Critères avant ajout de feature » retiré** de `templates/PROJECT_BRIEF.md` : recopié
   dans 14 briefs, jamais appliqué.
5. **Une règle, un fichier** : la source est `CLAUDE.md § Règles spécifiques au projet` ; brief,
   architecture et design y renvoient sans recopier ; le relecteur vérifie qu'une décision qui
   amende une règle met cette source à jour. Pourquoi : 14 copies périmées après amendement.

Revers acceptés : interview plus longue ; moins de garde-fous chiffrés au départ ; une révision des
projets existants qui prend plusieurs séances.

## Suite

- Plan du dépôt source (points 1 à 5) : `/nouveau-plan`, en lisant ce fichier et l'inventaire.
- Revue des projets existants : une séance par projet, hors plan, chaque projet commitant ses
  propres changements de règles.
- Écarté : réviser seulement les futurs projets ; corriger les projets en bloc sans revue.

## Application (plan P17, validé par l'utilisateur le 2026-10-08)

- Point 5 : le contrôle n'est pas fait par le relecteur, qui ne voit ni les commits de `/cadrer` ni
  les commits sans code. Il est fait par `brief-a-jour.mjs`, à chaque `/nouveau-plan`, sur une
  ligne `Règles :` du fichier de décision (même mécanique que `Brief :`). Revers : l'écart n'apparaît
  qu'au plan suivant.
- Point 3 : un projet « sans aucune commande » le déclare dans `.claude/n0.json`
  (`"commandes": []`, `"sansCommande": "<motif>"`) ; une liste vide sans motif ne vaut pas
  déclaration.
