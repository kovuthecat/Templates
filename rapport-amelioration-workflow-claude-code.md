# Améliorer le workflow Claude Code `Templates`

**Rapport d’analyse et d’aide à la décision — révision du 15 septembre 2026**

**Destinataire :** Claude Code, dans une session chargée d’évaluer puis de planifier les améliorations de son workflow.

**Dépôt étudié :** `C:\Users\Kovu\SynologyDrive\Thibault\Projets\Templates`

**État local observé :** plugin `0.36.0`, commit `d7c68963819f18e1cbbc4feb6c686303beb21b2b`.

**Environnement contrôlé :** Windows / PowerShell, Claude Code `2.1.266`, Node.js `24.19.0`.

**Statut :** recommandations à évaluer ; ce rapport n’est ni une décision d’architecture approuvée, ni un plan d’exécution.

**Objectif confirmé :** améliorer la qualité du travail livré par Claude Code, en gardant l’économie de contexte et de coût comme critère explicite de conception et d’adoption. À qualité suffisante, préférer le parcours dont le coût total est le plus faible. Une dépense supplémentaire doit correspondre à un gain de qualité ou de fiabilité identifiable.

## Lecture conseillée

- Pour décider du prochain chantier : sections 1, 3 et 9.
- Pour comprendre les emprunts possibles : section 4, puis les recommandations R0–R11.
- Pour écrire un plan vérifiable : sections 6 à 10.
- Pour reprendre l’analyse dans Claude Code : consigne autonome en section 12.
- Pour l’économie de contexte et de coût : sections 1.1, 4.13, R6 et 8.4.

**Ce rapport est une référence d’analyse ponctuelle.** Ne pas le charger intégralement à chaque session, l’injecter dans `CLAUDE.md` ou le vendoriser comme une skill monolithique. Lire la synthèse puis les seules recommandations du lot retenu ; les protocoles détaillés seront chargés à la demande après adoption.

Les chemins locaux ci-dessous sont relatifs à la racine de `Templates`. Les références de ligne décrivent l’état audité ; les retrouver par titre ou symbole si les fichiers ont changé.

## 1. Synthèse : les améliorations les plus utiles

Le workflow dispose déjà de mécanismes substantiels : décisions écrites, plans par sessions, exploration déléguée, contrôles N0/N1/N2, revue indépendante, classification des échecs et reprise bornée. L’enjeu est de mieux relier **intention, preuve, exécution et vérification**, tout en conservant une voie courte pour le travail simple.

Trois chantiers ont une justification locale particulièrement nette :

1. **Vérifier les garanties réellement apportées par le runtime.** `/cadrer` présente `allowed-tools` comme une restriction d’outils. La documentation officielle actuelle donne à ce champ une autre sémantique. Une règle fondée sur une garantie supposée doit être corrigée avant d’être renforcée.
2. **Améliorer la qualité des preuves transmises à la planification.** `explorateur` rend des chemins et rôles en vingt lignes ; ce contrat convient à la localisation, moins à la compréhension d’un flux. Il faut un mode de recherche borné qui conserve les inconnues et les références utiles.
3. **Contester les décisions de conception au bon moment.** `verificateur-plan` exclut explicitement ce travail. Une critique ciblée peut éprouver les risques du plan avant son approbation, sans rouvrir systématiquement les décisions closes.

Les outils publics offrent des mécanismes réutilisables : préparation appuyée sur des preuves chez **Ideation**, recherche factuelle chez **HumanLayer**, critique et impact prévu/réel chez **AB Method**, spécifications différentielles chez **OpenSpec**, collecte déterministe chez **AgentSys**, lint chez **agnix**, évaluation de sorties chez **Promptfoo**, sélection du contexte chez **Aider**, reprise persistante chez **Spec Kit**.

**Recommandation :** commencer par R0, puis un pilote associant exploration structurée et critique conditionnelle. Ajouter ensuite les protocoles de réflexion et la mesure d’impact, selon les résultats. La reprise persistante complète reste un investissement conditionnel : P4 a déjà traité une partie du problème.

### Ce qui change par rapport au rapport précédent

| Proposition ou affirmation initiale | Conclusion révisée |
| --- | --- |
| Le workflow local est « supérieur » à la plupart des systèmes recensés | Aucun benchmark comparatif ne le démontre. Comparer les mécanismes documentés et leur adéquation locale. |
| Audit de la version `0.35.0`, P4 encore en cours | Version observée `0.36.0` ; les six sessions de P4 sont cochées. Des modifications et revues locales subsistent. |
| Cinq gates de préparation « indépendantes » | Cinq dimensions distinctes, mais évaluées par un même modèle : l’indépendance n’est pas acquise. |
| Créer immédiatement six protocoles | Conserver un catalogue cible, expérimenter d’abord deux mécanismes justifiés par des cas locaux. |
| Réserver les protocoles à `/cadrer` | Les partager avec `/nouveau-projet` et `/nouveau-plan`, selon les inconnues restantes, et ajouter une recherche ciblée de solutions existantes avant de prévoir du développement sur mesure. |
| Critique après `verificateur-plan`, puis approbation | Le processus actuel peut avoir déjà recueilli l’approbation avant cette vérification. Critiquer les choix structurants avant leur approbation. |
| Rendre le champ `Mode` obligatoire pour l’explorateur | Préserver `localiser` par défaut, migrer les appelants progressivement, éviter une rupture inutile. |
| Une contradiction avec une décision appelle toujours `ARBITRAGE` | Une mauvaise application se corrige ; un fait manquant s’enquête ; seul un choix durable non autorisé appelle l’humain. |
| Transformer `/maj-workflow` en revue de compatibilité | Cette skill synchronise des copies vendorées. Garder ce rôle ; placer l’analyse de compatibilité dans le dépôt source. |
| Ajouter un bac à sable de hooks | Les tests actuels construisent déjà des dépôts temporaires et injectent des événements. Étendre cette base. |

### 1.1 Compatibilité avec l’objectif d’économie : oui, sous conditions

Le rapport prévoit déjà des références partagées, `NONE`, des voies courtes, des recherches bornées et des critiques conditionnelles. Ces mécanismes sont compatibles avec l’économie de contexte. Cependant, leur bénéfice n’est pas encore établi : appliquer toutes les recommandations à chaque projet ou rejouer la même recherche dans trois skills augmenterait la consommation.

**Règles d’adoption renforcées :**

1. Une amélioration doit préciser le travail qu’elle évite, remplace ou rend plus fiable. Une étape ajoutée « par prudence » sans cas démontré reste facultative.
2. Une recherche déjà valide traverse `/nouveau-projet`, `/cadrer` et `/nouveau-plan` par référence ; seul le manque est recherché à nouveau.
3. Les sorties brutes sont filtrées ou sélectionnées avant d’entrer dans un contexte de modèle lorsque c’est possible. Une synthèse par sous-agent protège le parent, mais la lecture brute a tout de même un coût dans le sous-agent.
4. Les modèles, efforts et délégations sont choisis selon la difficulté et les essais. Un petit modèle qui multiplie les reprises peut revenir plus cher qu’un modèle plus capable utilisé une fois.
5. Les évaluations portent d’abord sur quelques cas pertinents pour le changement ; tout le catalogue n’est pas rejoué à chaque édition.
6. Le coût est mesuré sur le résultat accepté, préparation, exécution, revues et corrections comprises. Les dépenses d’évaluation et d’installation sont comptées séparément, puis leur amortissement est examiné.
7. Les budgets de recherche et de revue servent à choisir une prochaine étape ou un protocole de preuve. Ils ne permettent jamais de déclarer une réussite lorsque les critères ne sont pas satisfaits.

**Priorité économique :** mesurer avec les mécanismes natifs et un outil existant, puis réduire le poste dominant. Ne pas commencer par un routeur de modèles, une mémoire supplémentaire ou un tableau de bord custom.

## 2. Méthode et limites des preuves

### 2.1 Ce qui a été effectivement contrôlé

Lecture du rapport initial, des instructions du dépôt, de `plugin/WORKFLOW.md`, des parties pertinentes de `/cadrer`, `/nouveau-plan`, `/choisir-mecanisme`, `/fin-de-tache`, `/maj-workflow`, des agents `explorateur` et `verificateur-plan`, des gabarits de session, du câblage des hooks, du hook de fin, du script de publication, des tests et de l’index P4. Les décisions récentes ont été repérées dans le registre ; le rapport ne prétend pas avoir réaudité toutes les décisions historiques.

Contrôles exécutés le 15 septembre 2026 :

| Contrôle | Résultat | Ce que cela établit |
| --- | --- | --- |
| Version de Claude Code et de Node.js | `2.1.266` et `24.19.0` | Versions des exécutables locaux, pas nécessairement de chaque environnement Desktop/cloud. |
| `node tests/tester-renvois.mjs` | Réussi : trois assertions ; cinq blocs Agent, treize skills, trois annexes citées | Les renvois couverts existent et sont reliés. |
| `node tests/tester-hooks.mjs` | Réussi : vingt-trois cas | Les scénarios de scripts testés produisent les résultats attendus. |
| `git status --short` | Arbre non propre | Il reste du travail local à préserver avant toute intervention. |

La première tentative des tests de hooks a rencontré `spawnSync git EPERM` dans l’environnement restreint de l’audit. La même suite, exécutée avec les permissions nécessaires à ses dépôts temporaires, a réussi. C’était une limitation d’exécution du contrôle, pas une régression des hooks.

Le contrôle de publication complet n’a pas été lancé. Son `--dry-run` appelle aussi `git fetch origin` avant de construire un payload temporaire (`plugin/bin/publier.mjs`, fonction `verifierSynchroSource`, puis bloc principal). Il ne se réduit donc pas à une lecture statique. Les deux suites ci-dessus ne remplacent pas ce contrôle avant une publication réelle.

**Travail local observé :** modifications de `plans/P4/S2.md` et `S3.md` ; fichiers de revue P4, `AGENTS.md` et `.agents/` non suivis. L’index coche toutes les sessions P4, mais cela ne vaut pas nouvelle certification de leur clôture par cet audit.

### 2.2 Comment interpréter les sources externes

Les liens utilisés pour les conclusions centrales ont été consultés le 15 septembre 2026. Ce sont principalement des documents officiels et des fichiers de projets publics. Leurs branches courantes sont mobiles ; des pages web peuvent aussi être servies depuis un cache.

Trois niveaux de preuve doivent rester distincts :

- **Documenté :** une source décrit le mécanisme.
- **Implémentation accessible :** le projet expose une skill, un script ou un moteur correspondant ; cela rend l’idée inspectable et réutilisable.
- **Validé dans `Templates` :** un essai sur le dépôt et le runtime local montre le résultat attendu.

Les projets externes cités n’ont **pas été installés ni exécutés pendant cette révision**. Leur existence et leurs mécanismes sont documentés ; leur efficacité comparative, leur compatibilité complète et leur gain local restent à mesurer. Une annonce d’usage en production ou de réduction de tokens par un auteur ne constitue pas une mesure indépendante.

Avant de reprendre du code, figer une révision amont, inspecter les fichiers réellement exécutés et conserver leur provenance. Pour reprendre seulement une idée, citer sa source et écrire une adaptation locale suffit généralement ; éviter de vendoriser un framework entier sans besoin.

## 3. Diagnostic local : constats, conséquences et inconnues

### D1 — Une garantie d’interdiction d’outils est mal décrite

**Preuve locale :** `plugin/skills/cadrer/SKILL.md:4` déclare `allowed-tools` ; les lignes 15–16 affirment que l’absence de `Bash` rend son usage impossible.

**Vérification externe :** la documentation actuelle définit `allowed-tools` comme un mécanisme de préautorisation, sans retrait des autres outils. Elle documente séparément `disallowed-tools` pour une skill. [Documentation officielle des skills](https://code.claude.com/docs/en/skills#pre-approve-tools-for-a-skill).

**Conséquence :** la formulation locale donne une assurance structurelle non établie. Ce constat ne prouve pas qu’un shell a effectivement été appelé dans `/cadrer`, ni que les autres permissions du poste l’autorisent. Il impose de vérifier le comportement sur la version installée et de corriger l’explication.

**Priorité : élevée — R0.** Examiner aussi PowerShell, outils MCP et délégation si l’objectif est d’empêcher toute exécution pendant le cadrage. Ne pas confondre l’absence d’un outil dans une liste avec l’absence de tout chemin vers la même capacité.

### D2 — La compréhension du système repose sur un contrat d’exploration trop étroit

**Preuve locale :** `plugin/agents/explorateur.md:4–12` limite les outils à `Read, Grep, Glob`, fixe Haiku, quinze tours et vingt lignes de sortie. `/nouveau-plan`, étape 1, demande pourtant un flux complet, des dépendances et des hypothèses racines.

**Conséquence probable :** le cadreur doit reconstruire le fonctionnement à partir d’une carte de fichiers ou demander des compléments. C’est une friction de contrat, pas la preuve que toutes les explorations actuelles échouent.

**À mesurer :** nombre de retours nécessaires avant qu’un plan dispose de son entrée, ses transformations, son état et ses chemins d’échec. **R3.**

### D3 — Le contrôle indépendant existant exclut la conception

**Preuve locale :** `plugin/agents/verificateur-plan.md:12` exclut le jugement de conception. Ses quatre contrôles couvrent chemins, recouvrement de fichiers, validations et dépendances.

**Conséquence :** un plan mécaniquement cohérent peut garder une hypothèse fragile, une interface mal bornée ou une récupération non définie. `/nouveau-plan` investigue déjà ces sujets en partie ; l’apport recherché est une contradiction ciblée, pas une deuxième planification complète.

**Point d’intégration :** l’en-tête de `/nouveau-plan` indique que l’écriture peut suivre l’approbation utilisateur. Une critique placée seulement en étape 4b arriverait trop tard pour peser sur ce premier arbitrage. **R2.**

### D4 — Une exception documentaire contredit les règles de dépendance

**Preuve locale :** `/nouveau-plan`, étape 4b, donne comme exemple d’écart volontaire un fichier créé par une session antérieure « de la même vague ». Or `verificateur-plan`, contrôle 4, exige que les dépendances viennent d’une vague antérieure ; l’étape 2 de `/nouveau-plan` exige l’indépendance pour paralléliser.

**Conséquence :** un exemple peut normaliser une dépendance que le contrôle doit refuser. Si une vague séquentielle est voulue, il faut en définir la sémantique ; sinon remplacer l’exemple par une vague antérieure.

**Priorité : correction documentaire ciblée dans R0.** Un fichier commun n’est d’ailleurs pas le seul conflit possible : deux sessions sur des fichiers distincts peuvent modifier le même contrat, port, cache ou schéma.

### D5 — P4 a déjà renforcé les reprises et le vocabulaire des arrêts

**Preuve locale :** `WORKFLOW.md` §9c prévoit déjà une reprise courte par `SendMessage` sous trois conditions externes : agent reprenable, N0 vérifié par un tiers, aucune reprise antérieure et blocage portant sur un geste. Le budget survit via le rapport d’échec.

**Conséquence :** recommander simplement « ajouter une reprise » ferait doublon. Le besoin restant éventuel concerne surtout les interruptions entre un effet réellement produit et sa consignation, l’identité de l’exécution et l’invalidation d’un verdict devenu périmé. **R9.**

### D6 — Les tests de scripts sont utiles, mais ne prouvent pas toute la chaîne

Les suites testent réellement des scénarios de hooks et les références documentaires. Elles ne démontrent ni l’activation d’une skill, ni la qualité d’une recherche, ni l’application des permissions par le runtime Claude Code.

Le hook `stop-contexte.mjs` choisit en outre un blocage initial suivi de rappels non bloquants, avec un marqueur de session. C’est une protection contre les oublis et les boucles, **pas une garantie persistante d’impossibilité de finir**. Son absence d’usage direct de `stop_hook_active` n’est pas à elle seule un bug : un autre mécanisme anti-boucle existe déjà. Il faut tester ce mécanisme, notamment si le marqueur ne peut pas être écrit.

**R5 et R7 :** distinguer test du script, test du câblage et observation d’une vraie session.

### D7 — Les coûts et les gains des recommandations ne sont pas encore établis

La discipline documentaire existe. En revanche, cet audit n’a pas mesuré combien de temps coûte une reprise, combien d’appels coûte une exploration, ni combien de défauts une critique précoce éviterait.

Les plafonds de sortie et le choix d’un modèle économique sont des moyens ; le résultat à optimiser est **le coût total d’un travail correctement terminé**. Une sortie trop comprimée peut coûter plus cher en relances qu’une première réponse légèrement plus riche. **R6.**

### D8 — La recherche de solutions éprouvées n’est pas une étape explicite de `/nouveau-plan`

**Vérification complémentaire du 15 septembre 2026 :** l’étape 1 de `/nouveau-plan` demande flux, fichiers, rôles, dépendances et hypothèses. Elle oriente la collecte vers `explorateur` et `resumeur-git`. Elle ne demande pas explicitement de rechercher une implémentation déjà présente, une capacité de la stack, une bibliothèque ou un outil externe éprouvé avant de prévoir une solution sur mesure.

Le workflow possède des moyens mobilisables : `lecteur-doc` dispose de `WebFetch` et `WebSearch`, et `/choisir-mecanisme` demande de vérifier les capacités natives de Claude Code avant de construire de l’infrastructure spécifique. Mais ce dernier couvre un domaine particulier ; il ne remplace pas une démarche générale de recherche de solutions pour tout chantier.

**Portée du constat :** une session peut spontanément faire cette recherche. Le texte de la skill ne l’organise pas et n’en exige aucune trace ; on ne peut donc pas la considérer comme un comportement garanti. La lecture du contrat ne permet pas d’affirmer que les sessions passées ne l’ont jamais faite.

**Conséquence :** le plan peut détailler une implémentation custom alors qu’une réutilisation locale, une configuration native ou une adaptation limitée aurait suffi. Le rapport initial sous-estimait cette lacune en rattachant surtout les protocoles à `/cadrer`. **R1 et R3** doivent bénéficier aussi à `/nouveau-plan`.

### D9 — `/nouveau-projet` propose des fondations sans comparaison explicite des solutions

**Vérification complémentaire du 15 septembre 2026 :** `plugin/skills/nouveau-projet/SKILL.md`, phase A, prévoit une interview de quatorze questions. La question 8 oriente la persistance vers Dexie ou Supabase selon les habitudes des projets ; la question 9 propose Vite/React/TypeScript par défaut et demande de justifier les écarts. Les contraintes offline, accessibilité et performance sont abordées à la question 10, après ces premières orientations techniques.

La phase B fait valider une synthèse ; la phase C instancie les fichiers de contexte, la configuration et Git ; la phase D annonce la rédaction ultérieure de l’architecture et le premier plan. Il ne s’agit donc pas encore du développement de l’application. Toutefois, les choix proposés dans l’interview orientent déjà ses fondations.

**Lacune :** aucune étape explicite ne compare un outil répondant au besoin, une base de projet adaptée, une capacité native ou un composant éprouvé avant de retenir la stack. Les préférences locales sont utiles, mais ne constituent pas une preuve d’adéquation au nouveau besoin.

**Conséquence probable :** choisir tôt une stack familière peut restreindre l’examen des options et déplacer la justification vers les seules déviations. Recueillir les contraintes avant les choix techniques et vérifier les solutions pertinentes réduirait ce risque. Cette lecture du contrat ne prouve pas l’absence de recherche dans les sessions réelles. **R1d.**

### D10 — Les exemples et gabarits introduisent un biais web/JavaScript

**Vérification complémentaire du 15 septembre 2026 :** `/nouveau-plan` ne prescrit directement ni Vite, ni React, ni une autre stack. Le biais vient de plusieurs supports chargés autour de cette skill :

| Support | Élément observé | Portée |
| --- | --- | --- |
| `nouveau-plan/references/squelette-index.md:16–17` | Zones d’exemple `css/`, `index.html`, `js/edit/` | Exemples exclusivement web dans la table de sessions. |
| `agents/verificateur-plan.md:51–52` | Exemples `src/lib/parse.ts`, `src/store/index.ts` | Exemples de contrôles uniquement TypeScript. |
| `nouveau-plan/SKILL.md:189–201` | Faux verts de typecheck/build et validations de navigateur | Place importante des projets compilés et des interfaces web ; ces contrôles restent pertinents pour ces projets. |
| `nouveau-plan/references/squelette-session.md:62–65` | Commande N0 abstraite, N1 navigateur, N2 esthétique/UX | Une partie du contrat est neutre ; les validations UI peuvent déjà être marquées non applicables. |
| `templates/PROJECT_MAP.md`, « Arborescence utile » | `features/`, `components/`, `hooks/`, `lib/`, `types/` | Structure de référence orientée frontend, avec consigne explicite de l’adapter au dépôt. |
| `templates/PROJECT_BRIEF.md`, « Stack technique » | Frontend, backend, base, authentification, hébergement | Catégories qui correspondent surtout à une application web et peuvent être inutiles pour une CLI ou une bibliothèque. |
| `templates/project-settings.json`, `permissions.allow` | Commandes npm et Vitest préautorisées | Configuration adaptée au JavaScript ; l’absence d’autres commandes dans cette liste n’est pas en soi une interdiction. |

**Contrepoids déjà présents :** le squelette de session utilise `<commande>` pour N0 ; le vérificateur N0 exige les commandes documentées du projet et interdit de les inventer ; le corps de `/nouveau-plan` accepte explicitement les missions de vérification, mesure et audit dont le résultat est une conclusion. Le workflow ne se réduit donc pas à un générateur de plans React.

**Diagnostic :** l’ensemble des exemples favorise une représentation web/JavaScript du projet, sans constituer une restriction formelle de stack. Son effet sur les plans effectivement produits reste à mesurer. Ce biais d’exemples s’ajoute au défaut explicite de stack dans `/nouveau-projet` et à l’absence de recherche comparative relevée en D8.

**Conséquence possible :** inventer une structure frontend, une dépendance ou une étape build/typecheck pour satisfaire le gabarit ; traiter une stack existante différente comme une exception ; ou oublier les critères propres à une CLI, une bibliothèque, une migration et un traitement de données. **R1e et R7.**

### D11 — L’économie est déjà travaillée localement, mais certaines règles sont trop absolues

`plugin/WORKFLOW.md` §3 et §3b définissent modèle, effort, cache et conditions de passation. L’analyse locale `docs/analyses/2026-09-13-cout-du-contexte-cache-et-hooks-de-modele.md` consigne plusieurs mesures et leur état. Cette base doit être relue avant de proposer une nouvelle optimisation ; ses résultats historiques ne sont pas remesurés par le présent rapport.

Deux limites appellent une attention particulière :

- **Le coût du parent n’est pas le coût du chantier.** Les agents lisent aussi les fichiers et logs ; leurs contextes, sorties, reprises et démarrages doivent entrer dans le calcul.
- **La formulation locale selon laquelle compacter tôt n’économise rien est trop générale.** La documentation officielle décrit un coût de résumé et de reconstruction du cache, mais aussi l’intérêt de retirer un contexte devenu inutile. La décision dépend du contexte conservé, du nombre de tours restants, de l’état du cache et du risque de perdre des informations utiles. [Claude Code — prompt caching](https://code.claude.com/docs/en/prompt-caching#compacting-the-conversation).

Conserver les mécanismes locaux qui fonctionnent ; soumettre les affirmations générales de rentabilité à une comparaison sur des sessions réelles. Le cache peut réduire le coût de traitement d’un préfixe sans libérer sa place dans la fenêtre de contexte. **R0, R6 et R10.**

## 4. Ce que les outils existants permettent de reprendre

Les éléments « adaptation » ci-dessous sont des propositions pour `Templates`, pas des fonctions attribuées aux projets sources.

### 4.1 Superpowers — adapter la profondeur du travail

La skill `brainstorming` distingue exploration de faisabilité, changement borné et architecture. Elle adapte les livrables et fait remonter la profondeur si des complications apparaissent. [Source : brainstorming](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md).

**Adaptation :** classifier le changement avant de décider des lectures, du protocole ou de la critique. Préserver la voie directe pour une correction locale ; une classe de complexité sert à sélectionner du travail utile.

**Coût à éviter :** importer toutes les approbations et conventions documentaires de Superpowers. Elles ne correspondent pas nécessairement au critère local d’intervention humaine.

### 4.2 Ideation — rendre explicite ce qui est prêt et ce qui manque

Ideation relie cinq dimensions de préparation à des preuves, distingue contrôle par commande et appréciation humaine, et conserve les questions ouvertes à la reprise. Ses critiques examinent notamment périmètre, complexité inutile, dépendances et réussite. [Grille de préparation](https://github.com/nicknisi/ideation/blob/main/references/confidence-rubric.md), [skill principale](https://github.com/nicknisi/ideation/blob/main/skills/ideation/SKILL.md).

**Adaptation :** un tableau court dans la décision existante ; une question ouverte indique aussi qui ou quoi peut la résoudre. Ne pas créer ses fichiers de contrat, ses rendus HTML et son cycle d’exécution en parallèle des plans locaux.

**Limite :** cinq rubriques remplies par le même modèle ne constituent pas cinq validations indépendantes. La valeur vient des preuves consultables et de leur confrontation aux faits.

### 4.3 HumanLayer — rechercher avant de prescrire

`research_codebase` demande de décrire le fonctionnement existant, distingue les rôles de recherche et conserve des références de code. Son principe essentiel est de documenter le système avant de recommander sa transformation. [Source : commande de recherche](https://github.com/humanlayer/humanlayer/blob/main/.claude/commands/research_codebase.md).

**Adaptation :** une sortie d’exploration avec périmètre, faits, inférences et inconnues ; le parent consulte ponctuellement les preuves déterminantes avant de figer une décision. Une synthèse compacte ne doit pas rendre sa vérification impossible.

**Coût à éviter :** une exploration exhaustive et plusieurs agents pour chaque question. La recherche s’arrête quand les questions nécessaires au chantier sont couvertes.

### 4.4 AB Method — confronter le plan au domaine et au diff

AB Method relie la préparation au vocabulaire du domaine, distingue critique avant codage et revue après codage, et compare l’impact prédit au changement réellement livré. Il documente aussi la conservation des questions non résolues. [Source : AB Method](https://github.com/ayoubben18/ab-method).

**Adaptation :** vérifier les mots qui portent un contrat ; prévoir la zone de modification ; classer ensuite les écarts. Une interface livrée comme placeholder ne doit jamais masquer une question fonctionnelle encore ouverte.

**Limite :** un diff plus large n’est pas toujours un mauvais plan : renommage, génération ou verrou de dépendances peuvent l’expliquer. La comparaison doit produire un diagnostic, pas un score punitif.

### 4.5 gstack — examiner les modes d’échec avant le code

`plan-eng-review` fournit une revue spécialisée d’architecture, de flux, de cas limites, de tests et de performance. Son fichier consulté est volumineux et comprend des règles d’interaction propres au projet. [Source : revue d’ingénierie](https://github.com/garrytan/gstack/blob/main/plan-eng-review/SKILL.md).

**Adaptation :** reprendre les angles de revue, en sélectionner quelques-uns à partir des risques du changement et traduire chaque constat en conséquence concrète.

**Coût à éviter :** importer le préambule et imposer les mêmes questions à toutes les tâches. Le critique doit pouvoir conclure sans remarque lorsque le plan est sain.

### 4.6 Thinking Skills — choisir une méthode, y compris aucune

Le routeur `thinking-model-router` accepte `NONE`, privilégie une seule méthode et réserve les combinaisons à des questions complémentaires. Il prévoit aussi l’abandon d’un cadre mal adapté. [Source : routeur](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-model-router/SKILL.md).

**Adaptation :** quelques fiches chargées à la demande, chacune produisant une sortie vérifiable : hypothèse discriminée, arbitrage réversible, scénario de panne ou critère d’arrêt.

**Limite :** nommer une méthode n’améliore pas automatiquement le raisonnement. Évaluer la décision produite, pas la conformité du vocabulaire au nom du protocole.

### 4.7 OpenSpec — décrire la différence voulue

OpenSpec sépare le comportement de référence des dossiers de changement. Les spécifications différentielles décrivent ajout, modification et retrait ; l’archivage réintègre les changements dans la référence. [Source : concepts, delta specs](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md).

**Adaptation :** ajouter localement `PRESERVED` pour les invariants à protéger. Cette quatrième catégorie est une proposition de ce rapport, pas une catégorie attribuée à OpenSpec.

**Apport supplémentaire :** clore un changement implique de mettre à jour la documentation de référence. Un dossier de plan terminé ne suffit pas si le prochain agent lit encore une description périmée.

### 4.8 AgentSys — collecter mécaniquement, interpréter ensuite

AgentSys distingue collecte par code — expressions régulières, syntaxe et analyse statique — et jugement par modèle. [Source : approche AgentSys](https://github.com/agent-sh/agentsys).

**Adaptation :** faire calculer les chemins, références, diff et résultats de commandes ; réserver au modèle leur signification. Cela prolonge les tests locaux existants.

**Limite :** ne pas étendre une annonce de gain de tokens propre à un outil à l’ensemble de `Templates`. Une analyse de syntaxe n’établit pas non plus la validité d’une décision produit.

### 4.9 agnix et Trail of Bits — traiter les instructions comme un produit maintenu

agnix propose un linter de configurations d’agents, avec règles et explications. Trail of Bits publie des conventions de contribution, des validateurs et des exigences de qualité des skills. [agnix](https://github.com/agent-sh/agnix), [standards Trail of Bits](https://github.com/trailofbits/skills/blob/main/AGENTS.md).

**Adaptation :** frontmatter, références, exemples, déclencheurs, contre-indications et tests deviennent des éléments de revue. N’activer comme blocages que les règles déterministes compatibles avec le format réellement vendoré.

**Point de vigilance concret :** même un dépôt reconnu peut contenir une formulation approximative sur les permissions. Pour la sémantique du runtime, la documentation officielle et un essai local priment sur une convention tierce.

### 4.10 CC Harness et Infrastructure Showcase — observer et rejouer

CC Harness documente une lecture des sessions locales, une visualisation des sous-agents, l’analyse des coûts et un bac à sable de hooks. Infrastructure Showcase publie une bibliothèque de mécanismes d’activation ; son README précise que ses hooks shell nécessitent macOS, Linux ou WSL2, et que ce n’est pas une application complète. [CC Harness](https://github.com/lookfree/cc-harness), [Infrastructure Showcase](https://github.com/diet103/claude-code-infrastructure-showcase).

**Adaptation :** diagnostiquer un hook et une activation sur des entrées concrètes, en utilisant d’abord les scripts Node existants. Examiner la portabilité avant toute reprise d’un script Bash dans cet environnement PowerShell.

**Limite :** un mot-clé détecté dans un prompt ne prouve pas qu’une skill devait être invoquée ; une suggestion n’est pas une activation observée.

### 4.11 Spec Kit — rendre la reprise inspectable

Spec Kit documente un moteur de workflows YAML qui conserve son état entre les étapes, avec branches, boucles et pauses de revue. [Guide des workflows](https://github.com/github/spec-kit/blob/main/workflows/README.md), [architecture du moteur](https://github.com/github/spec-kit/blob/main/workflows/ARCHITECTURE.md).

**Adaptation :** identifier une exécution et ses entrées, puis vérifier les effets déjà produits avant de reprendre. Enregistrer un curseur d’exécution peut être utile ; recopier les statuts du plan dans un second registre serait nuisible.

**Limite décisive :** sauvegarder après une étape ne garantit pas une exécution unique de ses effets. Une interruption après un commit, mais avant la sauvegarde, reste un problème à traiter explicitement.

### 4.12 Aider, Repomix et Promptfoo — trois compléments concrets

**Aider** sélectionne une carte de symboles et de dépendances sous contrainte de budget de contexte. L’idée utile est de donner au modèle une carte pertinente, puis d’ouvrir les quelques fichiers nécessaires. Pour `Templates`, riche en Markdown, une analyse syntaxique de code ne remplacera pas le graphe de renvois documentaires. [Repository map](https://aider.chat/docs/repomap.html).

**Repomix** prépare un corpus de dépôt dans un fichier destiné aux assistants. Il peut aider à fabriquer un paquet d’analyse délimité, à condition de sélectionner les fichiers et contrôler le résultat avant transmission. Un export complet chargé dans chaque conversation irait contre l’objectif local. [Guide Repomix](https://repomix.com/guide/).

**Promptfoo** fournit des cas d’évaluation avec variables et assertions, y compris des critères jugés par modèle. Il peut servir à comparer des sorties de protocoles. Il ne prouve pas, à lui seul, le comportement de Claude Code et de ses hooks : il faut un adaptateur exécutant de vraies sessions pour cette couche. [Configuration des tests](https://www.promptfoo.dev/docs/configuration/test-cases/).

Ces trois outils sont des candidats d’essai, pas des dépendances nécessaires. Pour un petit corpus, quelques fixtures et un runner local peuvent suffire.

### 4.13 Outils spécifiquement utiles à l’économie de contexte et de coût

Sources contrôlées le 15 septembre 2026. Les outils supplémentaires ci-dessous n’ont pas été installés ni exécutés dans cet audit ; leurs fonctions sont documentées, leurs gains dans `Templates` restent à mesurer. L’ordre exprime une recommandation locale, pas un classement général.

#### A. Capacités natives de Claude Code — commencer par identifier la dépense

La documentation recommande `/context` pour examiner le contenu chargé, une gestion ciblée des outils MCP et des capacités de navigation de code pour éviter des lectures inutiles. Les outils MCP peuvent être chargés de façon différée ; leur coût doit donc être observé plutôt que supposé constant. [Gestion des coûts](https://code.claude.com/docs/en/costs).

**Application :** relever le contexte initial, puis après invocation d’une skill et après recherche ; distinguer règles permanentes, outils et contenu accumulé. Choisir les fonctionnalités disponibles dans la version et l’environnement réellement utilisés. Ne pas introduire un MCP supplémentaire si une capacité déjà présente couvre le besoin.

#### B. ccusage — mesurer sans développer un analyseur de sessions

[ccusage](https://github.com/ccusage/ccusage) lit les données locales d’usage et produit des vues par période, session et projet, ainsi que du JSON. Il distingue les tokens de cache et propose un mode hors ligne pour les prix disponibles localement. Son [guide](https://ccusage.com/guide/) précise que les coûts sont estimés et que la couverture dépend des fichiers locaux ; les frais d’outils externes ne sont pas tous inclus.

**Réutilisation recommandée :** premier candidat pour R6. Limiter la collecte à Claude Code et aux projets concernés ; exporter des agrégats, puis les relier à quelques tâches témoins. Contrôler la couverture des sous-agents, les identifiants et le traitement des doublons avant de totaliser.

**Limite :** il mesure, il ne réduit pas directement la consommation. Un coût équivalent API n’est pas une facture d’abonnement ni une mesure exacte du quota restant. Le journal local de changements de modèle reste utile comme complément explicatif.

#### C. RTK — réduire les sorties de commandes avant leur lecture

[RTK, projet `rtk-ai/rtk`](https://github.com/rtk-ai/rtk), est un intermédiaire de ligne de commande qui filtre les sorties de tests, recherches et commandes Git. Il fournit des statistiques de réduction et documente une intégration native Windows. Ses estimations de tokens utilisent une approximation ; son pourcentage de réduction concerne les sorties traitées, pas la facture totale.

**Réutilisation recommandée :** essai limité sur des sorties volumineuses encore lues par `verificateur-n0` ou les agents de recherche. Comparer avec les reporters compacts déjà prescrits localement. Garder l’accès au résultat brut pour le diagnostic et exclure de la transformation les sorties destinées à un parseur ou à une preuve exacte.

**Intégration :** commencer par des appels explicites dans un environnement temporaire. Une réécriture automatique via hook exige un test avec `pretooluse-git.mjs`, les permissions et les deux outils shell utilisés. Les interdictions de staging global et de commit sous verrou doivent rester effectives. Aucune incompatibilité RTK n’a été démontrée ici ; c’est une vérification d’intégration nécessaire avant activation globale.

#### D. Serena — sélectionner le code par symboles et références

[Serena](https://github.com/oraios/serena) expose des capacités de recherche et d’édition sémantiques, notamment via des serveurs de langage. Il permet de travailler à partir des éléments du code et de leurs références. Les fonctionnalités et dépendances varient selon le langage et le backend.

**Réutilisation conditionnelle :** lorsque l’exploration de projets de code volumineux relit de nombreux fichiers pour trouver les mêmes symboles. Comparer à la navigation de code déjà disponible dans Claude Code et à une recherche textuelle ciblée. Pour ce pilote, limiter l’usage aux recherches nécessaires ; ses fonctions d’édition ne justifient pas d’élargir le rôle d’`explorateur`.

**Limite :** démarrage, indexation, configuration et outils supplémentaires ont un coût. Pour `Templates`, composé surtout d’instructions Markdown, la disponibilité d’un support de langage ne prouve pas la compréhension des renvois et règles de workflow. Bénéfice à mesurer sur les projets où la recherche de code domine réellement.

#### E. Repomix — borner et mesurer les corpus d’analyse

Repomix permet de sélectionner un corpus et de produire des informations de taille ; sa compression de code conserve certaines structures en retirant des détails d’implémentation. [Options](https://repomix.com/guide/command-line-options), [compression](https://repomix.com/guide/code-compress).

**Réutilisation conditionnelle :** analyse externe, transfert ponctuel ou comparaison de corpus. Le mécanisme sert à savoir ce qui entre dans le contexte et à préparer un sous-ensemble ; il ne justifie pas de charger tout le dépôt. Une vue compressée aide à s’orienter ; revenir au code original pour juger une logique ou une erreur que la compression pourrait masquer.

**Compléments déjà étudiés :** Aider apporte un exemple de sélection sous budget ; CC Harness peut aider à visualiser les sessions ; AgentSys fournit le principe de collecte déterministe. Ils ne doivent pas être ajoutés en bloc aux trois candidats précédents.

#### Choix opérationnel

| Poste dominant observé | Premier essai | Condition pour conserver l’outil |
| --- | --- | --- |
| Dépense mal attribuée | Mesures natives + ccusage | Coûts comparables et couverture connue, sans instrumentation custom inutile. |
| Logs et résultats de commandes volumineux | Reporter compact existant, puis RTK si un manque subsiste | Moins de contexte total sans erreur masquée ni relance supplémentaire. |
| Recherches répétées dans le code | Navigation native, puis Serena si nécessaire | Réponses plus précises ou moins de lectures, coût du service compris. |
| Corpus trop large pour une analyse ponctuelle | Sélection de fichiers, Repomix si utile | Corpus plus petit, preuves nécessaires conservées et chemins d’origine retrouvables. |
| Instructions et protocoles trop volumineux | Réduire et charger à la demande | Aucun nouvel outil nécessaire ; baisse du contexte courant sans perte de règles utiles. |

## 5. Architecture cible : quatre responsabilités distinctes

```text
Demande
  → /nouveau-projet si le projet est à définir et initialiser
      → besoin et contraintes → solutions existantes → fondations proposées
      → synthèse approuvée → instanciation → architecture puis premier plan
  → réponse directe si le travail est déjà clair et local
  → /cadrer si le quoi, le pourquoi ou la prémisse restent ouverts
      → recherche ciblée → décision OU protocole de preuve
  → /nouveau-plan pour les travaux à découper
      → réutiliser les preuves du cadrage et rechercher les solutions aux inconnues techniques restantes
      → critique de conception si le risque la justifie
      → arbitrage humain lorsqu’un choix non autorisé reste à trancher
      → écriture des sessions → verificateur-plan → corrections
  → exécution et validation adaptée
  → revue indépendante du résultat → convergence des écrits → clôture
```

| Responsabilité | Question traitée | Ce qu’elle ne doit pas refaire |
| --- | --- | --- |
| `/cadrer` | Quel problème résoudre, quelle direction prendre, que faut-il prouver ? | Découper prématurément une incertitude en tâches certaines. |
| Critique de conception | Ce choix peut-il échouer malgré un plan cohérent ? | Étendre le produit ou réécrire tout le plan. |
| `verificateur-plan` | Les déclarations du plan correspondent-elles aux fichiers, validations et dépendances ? | Arbitrer l’architecture. |
| Revue après exécution | Le résultat respecte-t-il le contrat, les critères et les invariants ? | Justifier rétrospectivement toute décision prise pendant le code. |

Une skill ne crée pas, à elle seule, un contexte indépendant. Si la critique exige cette indépendance, l’implémenter avec un agent de lecture seule et une entrée bornée ; la skill peut rester son point d’entrée. Tester le besoin avant d’ajouter un agent permanent.

## 6. Recommandations détaillées

### R0 — Corriger les prémisses du workflow avant d’étendre ses règles

**Problèmes :** D1 et D4 ; capacités natives possiblement plus récentes que les descriptions locales.

**Changement minimal :**

1. Corriger la présentation de `allowed-tools` dans `/cadrer`.
2. Dans un dépôt temporaire, comparer les outils réellement disponibles avant et pendant l’invocation, puis au tour suivant. Utiliser uniquement des commandes et fichiers témoins inoffensifs.
3. Séparer la préautorisation, la restriction des outils et la permission effective. Définir quelle opération doit être impossible, pendant quelle durée et dans quel contexte.
4. Remplacer ou clarifier l’exemple de dépendance dans la même vague.
5. Vérifier les règles d’effort à partir de la version réellement utilisée : la documentation actuelle prévoit un champ `effort` pour les agents, mais cela ne prouve pas que tous les chemins locaux de lancement l’appliquent. [Configuration des sous-agents](https://code.claude.com/docs/en/subagents).

**Déclenchement :** correction immédiate des formulations contredites ; essai avant de choisir une restriction structurelle. **Non-déclenchement :** ne pas refondre toute la politique de permissions sans incident ou besoin identifié.

**Acceptation :** une explication exacte, un contrôle positif, un contrôle négatif et une vérification après changement de tour. Si le runtime ne permet pas la garantie voulue, écrire la limite et choisir le mécanisme compatible.

**Domicile :** règles de `/cadrer` dans sa skill ; exemple dans `/nouveau-plan` ; référence de compatibilité dans le dépôt source. **Coût :** surtout un essai ponctuel ; pas de nouveau texte chargé à chaque session. **Retour arrière :** retirer une restriction expérimentale si elle empêche les sorties autorisées du cadrage, en conservant l’explication correcte.

### R1 — Préparation explicite et micro-protocoles à la demande

**Problème :** le cadrage gouverne déjà la réflexion, mais les preuves de préparation et le choix de méthode restent dispersés.

Ajouter cinq **dimensions de préparation** : problème concret, résultat visé, vérification, périmètre, cohérence. Ne pas les appeler gates mécaniques dans `WORKFLOW.md` : leur contenu comporte du jugement.

```text
Dimension : réussite vérifiable
État : READY | OPEN
Justification : preuve consultable ou information manquante
Résolution si OPEN : recherche | expérience | choix humain
Périmètre de validité : fichiers / version / hypothèses concernées
```

Une preuve de préparation peut être une demande explicite et précise de l’utilisateur. Tout n’a pas besoin d’un benchmark numérique : « l’export conserve les accents dans ce fichier témoin » est un critère valide.

Réutiliser une dimension acquise seulement si sa preuve reste applicable. Si une décision change, rouvrir les dimensions affectées, pas tout l’entretien.

**Catalogue cible des protocoles — adaptation proposée :**

| Signal | Mécanisme | Sortie attendue | Arrêt |
| --- | --- | --- | --- |
| Cause inconnue, plusieurs explications plausibles | Causalité | Hypothèses et test qui les distingue, y compris résultat négatif | Une hypothèse explique les observations ou le budget de preuve est atteint. |
| Documentation, test ou métrique contredit par l’observation | Carte–territoire | Contradiction localisée, source à requalifier, observation reproductible | Le désaccord est résolu ou explicitement circonscrit. |
| Choix difficile à annuler | Réversibilité | Coût de retour, point d’engagement, option minimale | Une option satisfait les contraintes et le risque accepté. |
| Changement susceptible d’échouer de plusieurs façons | Pré-mortem | Quelques modes d’échec reliés à une prévention ou un test | Les risques déterminants sont couverts. |
| Exigences apparemment incompatibles | Séparation des contraintes | Conditions où chaque exigence s’applique, scénario qui valide la coexistence | Solution viable ou arbitrage explicite. |
| Recherche qui accumule les options | Seuil d’arrêt | Contraintes obligatoires et niveau suffisant annoncé | Premier candidat suffisant, sauf motif de risque documenté. |

**Pilote :** causalité et carte–territoire, justifiés par l’importance locale des prémisses et instruments de preuve. `NONE` reste normal. Une fiche à la fois ; une deuxième seulement pour une question distincte. Les quatre autres attendent un cas concret.

**Déclenchement :** un inconnu empêche de conclure. **Non-déclenchement :** décision déjà prise, réponse disponible, changement trivial. **Tests :** méthode pertinente, capacité à ne rien charger, conservation des inconnues, aucune question dont la réponse est déjà accessible.

**Domicile :** chaque skill porte son déclenchement et ses sorties ; les protocoles employés par `/nouveau-projet`, `/cadrer` et `/nouveau-plan` ont un domicile partagé unique, chargé à la demande. Une piste est `plugin/references/exploration/`, à valider contre la construction du payload et la résolution des chemins après vendoring. Les fiches propres à une seule skill restent dans ses `references/`. Les résultats rejoignent le brief, les décisions ou artefacts de plan existants selon leur nature. **Coût :** deux fiches pilotes courtes, plus le protocole transversal ci-dessous ; aucun catalogue chargé intégralement. **Retour arrière :** supprimer le routage qui ajoute des étapes sans modifier utilement les décisions.

#### R1b — Partager l’exploration entre cadrage et planification

La distinction entre quoi/pourquoi et comment ne signifie pas que toute recherche s’arrête à la sortie du cadrage. Les deux skills rencontrent des inconnues différentes et peuvent utiliser les mêmes méthodes.

| Question ouverte | Dans `/cadrer` | Dans `/nouveau-plan` |
| --- | --- | --- |
| Solutions déjà disponibles | Quelles approches permettent d’atteindre l’objectif ? | Quel composant, outil, exemple ou mécanisme mettre réellement en œuvre ? |
| Compréhension de l’existant | Le problème et la frontière envisagée correspondent-ils au système réel ? | Où intégrer le changement, avec quelles interfaces et dépendances ? |
| Cause ou prémisse incertaine | L’objectif repose-t-il sur un diagnostic établi ? | L’hypothèse technique suffit-elle à rendre les tâches exécutables ? |
| Réversibilité et modes d’échec | Quel engagement accepte-t-on ? | Quel ordre de migration, retour arrière et test limite le risque ? |
| Arrêt de recherche | A-t-on assez d’éléments pour choisir une direction ? | A-t-on assez de preuves pour choisir une mise en œuvre et découper le travail ? |

`/nouveau-plan` commence par relire les recherches déjà réalisées : décision, candidats examinés, motifs de rejet, sources et limites de validité. Il ne relance que ce qui manque ou a changé. Une recherche complémentaire peut affiner l’implémentation à objectif inchangé ; si elle contredit une décision structurante, elle documente la preuve et suit le mécanisme local de réexamen, sans modifier silencieusement l’arbitrage.

**Clarification à apporter au contrat local :** distinguer « direction structurante approuvée » et « détails techniques encore ouverts ». La formule actuelle « approche déjà décidée » peut sinon interdire au planificateur une comparaison pourtant nécessaire. Une bibliothèque, un service ou un changement de stack ayant des conséquences durables doit être proposé avec ses coûts et validé selon les règles existantes avant son ajout.

#### R1c — Protocole transversal : rechercher avant de développer sur mesure

**Déclencheur :** nouveau mécanisme non trivial, dépendance envisagée, problème courant susceptible d’avoir une solution connue, ou proposition d’un sous-système custom. Le contrôle est systématique dans ces cas ; une recherche web n’est nécessaire que si les preuves locales et la documentation disponible ne suffisent pas.

1. **Formuler le besoin comme une capacité.** Exprimer les contraintes et le critère de réussite avant de chercher un produit ou une bibliothèque précise.
2. **Chercher dans le projet.** Implémentation voisine, convention, utilitaire, dépendance installée et décision antérieure. Produire des chemins et expliquer l’adéquation au cas.
3. **Vérifier les possibilités de la stack.** Framework, runtime, base de données ou outil déjà adopté : une configuration ou API native peut suffire. Consulter la documentation de la version applicable.
4. **Si un manque subsiste, rechercher des solutions externes ciblées.** Examiner quelques candidats crédibles, généralement deux ou trois au maximum, sans remplir artificiellement ce quota si un candidat suffit.
5. **Qualifier les preuves.** Distinguer documentation, exemple réellement exécutable, tests amont pertinents, retours d’usage documentés et essai local. La popularité ou l’affirmation « production-ready » ne suffisent pas.
6. **Comparer le coût total.** Compatibilité, limites connues, maintenance, licence, nouvelles dépendances, intégration, exploitation et possibilité de retrait. Une solution existante peut être plus coûteuse que quelques lignes locales.
7. **Conclure.** Réutiliser, configurer, adapter ou développer ; consigner le motif et les incertitudes restantes. Si l’adéquation dépend d’un fait non établi, proposer une preuve bornée avant de figer les tâches qui en dépendent.

**Critère d’arrêt :** un candidat satisfait les contraintes obligatoires avec des preuves suffisantes pour le risque du chantier ; ou le budget de recherche est atteint. Dans ce second cas, écrire « aucun candidat adapté trouvé dans ce périmètre » ; ne pas transformer une recherche limitée en preuve qu’aucune solution n’existe.

**Format de sortie proposé :**

```text
Besoin et contraintes : …
Déjà disponible dans le dépôt ou la stack : …
Candidats examinés : source, version/date, adéquation, limite déterminante
Preuves : documenté | testé en amont | testé localement ; préciser le cas
Choix : réutiliser | configurer | adapter | développer
Pourquoi / options écartées : …
Inconnue ou essai nécessaire : …
Conséquence pour la décision et le plan : …
```

Ce protocole précise une adaptation locale de la collecte factuelle, du choix proportionné et des preuves de préparation décrits en section 4 ; il n’est pas attribué intégralement à l’un des outils cités.

**Exemple :** pour rendre une orchestration reprenable, `/cadrer` établit la nature des interruptions à couvrir et le risque accepté. `/nouveau-plan` vérifie alors les mécanismes natifs et locaux déjà disponibles, examine un moteur existant si nécessaire, puis justifie le mécanisme retenu avant de découper « écrire le moteur ». Si une capacité existante suffit, les tâches deviennent de la configuration, de l’adaptation et des vérifications.

**Délégation :** `explorateur` pour le dépôt ; `lecteur-doc` pour des questions externes bornées ; le parent compare et décide. Un inventaire plus large peut nécessiter plusieurs questions successives, sans élargir automatiquement les permissions de l’explorateur.

**Non-déclenchement :** correction triviale, choix déjà documenté dont les preuves restent applicables, solution locale démontrée suffisante. **Tests :** composant local retrouvé, capacité native reconnue, candidat externe écarté pour une incompatibilité réelle, recherche antérieure réutilisée, développement custom correctement justifié. **Coût :** recherche bornée avant engagement ; aucune installation nécessaire pour la première comparaison.

**Intégration :** ajouter le renvoi après l’inventaire des dépendances de l’étape 1 de `/nouveau-plan`, avant son verdict de planifiabilité. Adapter les contrôles de renvois aux références partagées et vérifier leur disponibilité dans une copie vendorée. Une référence commune simplement copiée dans plusieurs skills recréerait le problème de domicile unique.

#### R1d — Appliquer la recherche dès `/nouveau-projet`

**Problème :** D9. La recherche est particulièrement utile avant les choix qui détermineront la suite du projet : construire ou adopter si ce choix reste ouvert, plateforme, persistance, hébergement, authentification et base de départ.

**Ordre recommandé :**

1. **Comprendre le besoin et les contraintes décisives.** Usage, appareils, données, offline, accessibilité, budget, intégrations, hébergement et maintenance. Reprendre le brief fourni par l’utilisateur au lieu de lui refaire l’interview.
2. **Clarifier les choix déjà faits.** Si l’utilisateur a décidé de développer son application ou imposé une stack, conserver cette décision. Ne pas relancer automatiquement un débat « acheter ou construire » ; rechercher alors les briques utiles dans ce cadre.
3. **Explorer l’existant à la bonne échelle.** Si le mode de réponse au besoin reste ouvert, examiner des outils ou services complets. Si la construction est décidée, examiner les templates accessibles, starters, fonctions natives et composants pertinents. Un dépôt vide n’impose pas une conception sans références.
4. **Proposer les fondations avec leurs conséquences.** Présenter les candidats crédibles, la recommandation, les limites et la preuve d’adéquation aux contraintes. La stack familière reste un candidat privilégié pour son coût de maintenance connu ; elle doit néanmoins satisfaire le besoin.
5. **Réutiliser la validation existante.** Inclure le choix recommandé et ses compromis déterminants dans la synthèse de phase B ; ne pas ajouter une deuxième approbation pour le même arbitrage. Une inconnue qui conditionne toute l’architecture doit conduire à une recherche ou une preuve bornée avant de figer les fondations.
6. **Consigner après validation.** En phase C, le brief reçoit les exigences et contraintes ; le registre et les décisions reçoivent les choix structurants, leurs sources, versions, alternatives écartées et questions restantes. Les détails de comparaison peuvent rester dans la décision correspondante, pour préserver la synthèse courte.
7. **Transmettre les acquis.** La rédaction d’architecture et `/nouveau-plan` repartent de ces éléments, vérifient leur validité et ne cherchent que ce qui manque. `/cadrer` intervient si un arbitrage substantiel demeure ; il n’est pas imposé après chaque interview de nouveau projet.

**Répartition des responsabilités :**

| Étape | Question de recherche dominante | Résultat transmis |
| --- | --- | --- |
| `/nouveau-projet` | Sur quelles fondations adaptées démarrer ? | Brief, fondations retenues, preuves et inconnues. |
| `/cadrer` | Quel choix encore ouvert faut-il trancher ou prouver ? | Décision justifiée ou protocole de preuve. |
| `/nouveau-plan` | Comment réaliser l’objectif avec les éléments disponibles ? | Intégration, tâches, dépendances et validations. |

Le protocole R1c est commun ; ses entrées diffèrent. Dans un projet vide, la recherche locale vise les templates et ressources déjà disponibles et autorisés, puis les capacités de la stack envisagée. Elle ne consiste pas à balayer sans limite les autres projets de l’utilisateur.

**Exemple :** pour un outil personnel devant fonctionner hors connexion, établir ce besoin avant de proposer la persistance. Comparer ensuite les fondations compatibles, leurs mécanismes de synchronisation éventuels et leur coût de maintenance. Si une base de projet connue satisfait déjà les contraintes, expliquer ce qu’elle couvre et ce qui reste à développer ; ne pas déduire sa compatibilité du seul fait qu’elle a servi ailleurs.

**Déclenchement :** création avec fondations ouvertes, stack proposée par défaut, starter envisagé ou contrainte inhabituelle. **Voie courte :** brief explicite et template déjà validé pour le même usage ; confirmer son adéquation et traiter les écarts, sans benchmark général.

**Tests :** contraintes examinées avant le choix technique ; option existante adaptée trouvée ; choix explicite de construire respecté ; starter incompatible écarté ; aucune double interview ; sources accessibles au premier plan. **Domicile :** point d’appel dans `/nouveau-projet`, protocole partagé, résultats dans les fichiers de contexte et décisions existants. **Coût :** comparaison bornée avant engagement. **Retour arrière :** réduire la recherche aux choix ouverts si elle retarde les démarrages déjà bien définis sans améliorer leurs fondations.

#### R1e — Rendre les plans indépendants des exemples de stack

**Problème :** D10. Les exemples doivent enseigner comment exprimer un plan tout en laissant ses technologies provenir des preuves du projet.

1. **Fixer la provenance des choix.** Dans un dépôt existant : manifeste, configuration, commandes réelles et décisions applicables. Dans un projet neuf : fondations examinées et approuvées. Un exemple de skill ne constitue jamais une décision de stack.
2. **Séparer contraintes et préférences.** Une stack approuvée ou imposée est une contrainte du plan courant ; une habitude personnelle reste une préférence à évaluer. Une nouvelle preuve peut justifier un réexamen selon le workflow existant, sans migration improvisée par le planificateur.
3. **Garder le squelette neutre.** Remplacer les chemins web dans la table modèle par des champs demandant les chemins réels, par exemple `<fichiers réellement modifiés>`. Conserver un petit exemple concret complet à part lorsque nécessaire, en indiquant son contexte d’application.
4. **Diversifier les exemples utiles sans multiplier les profils permanents.** Un exemple de modification applicative et un exemple de CLI, migration ou audit suffisent à montrer la généralité. Les charger seulement si le rédacteur en a besoin ; ne pas injecter une encyclopédie de stacks dans chaque plan.
5. **Définir les validations par propriété.** Quels comportements, contrats et invariants faut-il vérifier ? Quelles commandes déjà documentées le permettent ? La compilation, le contrôle de types et le navigateur s’appliquent lorsque le projet les nécessite. Un contrôle non applicable est justifié ; un contrôle nécessaire mais absent est une lacune à traiter. Ne pas installer du tooling uniquement pour remplir une case.
6. **Adapter les fichiers instanciés.** Le brief et la carte du projet ne conservent que les catégories pertinentes. Les commandes et préautorisations correspondent à la stack retenue, sans étendre les permissions au-delà du nécessaire.
7. **Maintenir la précision d’exécution.** L’agnosticisme concerne le gabarit ; le plan produit doit au contraire nommer les fichiers, outils et commandes exacts. Une tâche vague « utiliser le runner adapté » ne constitue pas une validation exécutable.

**Exemples de propriétés à vérifier, à traduire en commandes réelles du projet :**

| Type de chantier | Preuves pertinentes possibles |
| --- | --- |
| Application avec interface web | Comportement, contrats, compilation et typage si présents, parcours de navigateur concernés. |
| Outil en ligne de commande | Entrées/sorties, codes de retour, erreurs et compatibilité des arguments. |
| Bibliothèque | API publique, tests du langage utilisé, compatibilité des consommateurs et distribution si concernée. |
| Migration ou traitement de données | Schéma, conservation des données, règles de transformation, reprise et idempotence lorsque requises. |
| Documentation ou configuration | Références, syntaxe, exemples exécutables ou validation de la configuration selon le changement. |

Ces catégories sont des illustrations pour la revue, pas de nouveaux niveaux de validation ni des commandes prêtes à copier.

**Tests :** planifier sur plusieurs dépôts témoins — web, CLI hors JavaScript, bibliothèque, migration et documentation. Vérifier que les chemins existent, que les commandes proviennent des fichiers du projet, qu’aucune dépendance frontend n’apparaît sans besoin et que les contrôles inapplicables ne sont pas inventés. Rejouer aussi le même besoin avec des exemples différents pour observer si des choix injustifiés changent ; une différence de style seule n’est pas un défaut.

**Déclenchement :** révision des gabarits communs et démarrage d’un projet hors du profil habituel. **Non-déclenchement :** aucun réexamen automatique d’une stack existante adaptée et approuvée. **Domicile :** squelette de plan, exemples de vérification et templates concernés ; règles de validation dans leur domicile actuel. **Coût :** remplacement de biais existants, sans gros catalogue supplémentaire. **Acceptation :** précision égale sur les projets familiers et absence d’hypothèses techniques injustifiées sur les autres. **Retour arrière :** réintroduire un exemple mieux borné si une généralisation rend les plans trop abstraits.

### R2 — Critique conditionnelle avant engagement sur le plan

**Problème :** D3. Sources d’inspiration : gstack, AB Method, Ideation.

**Déclencheurs objectifs :** nouvelle frontière de système, contrat partagé modifié, migration, concurrence, intégrité des données, autorisation, risque de performance annoncé, ou demande explicite. Le niveau d’effort `high` peut alerter, mais il ne prouve pas à lui seul un risque de conception.

**Non-déclenchement :** correction locale et réversible, documentation sans contrat modifié, plan identique déjà examiné et dont les preuves restent valides.

**Entrées :** problème, décision applicable, proposition de conception, delta, preuves de recherche, critères de réussite. Le critique doit pouvoir accéder aux références déterminantes ; le résumé du rédacteur ne peut pas être son seul étalon.

**Questions prioritaires :**

- Quel scénario concret ferait échouer l’objectif malgré des tests unitaires verts ?
- Une responsabilité ou une dépendance reste-t-elle implicite ?
- Que deviennent l’état et les effets après interruption, échec partiel ou appel répété ?
- Les critères mesurent-ils le comportement utile, y compris les invariants ?
- Une solution sensiblement plus simple satisfait-elle déjà les contraintes ?

Limiter la revue aux angles pertinents et aux constats actionnables. Une remarque doit donner preuve, conséquence, correction minimale et emplacement concerné. Distinguer **défaut démontré** et **question à vérifier**.

Le critique rend des constats ; le parent applique le routage :

| Résultat | Suite |
| --- | --- |
| Aucun défaut étayé | `PASS` bref, continuer. |
| Écart corrigeable sans changer une décision | `REVOIR`, corriger puis vérifier seulement les conséquences de la correction. |
| Fait manquant | Recherche ciblée ou protocole de preuve ; aucune escalade humaine automatique. |
| Choix durable non autorisé entre options légitimes | Question selon `WORKFLOW.md` §9c. |

Ne pas créer une nouvelle taxonomie d’échec de session avec ces verdicts.

**Placement :** pendant la préparation, avant l’approbation des choix concernés. Après écriture des `S<k>.md`, `verificateur-plan` contrôle leur cohérence. Si la découpe révèle un changement de conception, ne rouvrir que ce changement.

**Tests :** plan sain accepté sans décoration ; défaut réel trouvé ; donnée manquante recherchée ; décision close correctement appliquée ; critique réalisée avant l’engagement humain. **Domicile :** skill `/critique-plan` si les essais confirment l’usage répété, références de revue chargées à la demande ; constats résolus intégrés au plan. **Coût :** une passe ciblée et, si utile, une vérification des corrections ; pas de boucle jusqu’à l’unanimité. **Retour arrière :** repasser en appel manuel si les faux positifs dominent.

### R3 — Trois modes compatibles pour `explorateur`

**Problème :** D2. Préserver `localiser` comme comportement par défaut.

| Mode | Usage | Sortie utile |
| --- | --- | --- |
| `localiser` | Trouver un point d’entrée ou une convention | Chemins, rôles, courte réponse ; plafond actuel. |
| `suivre-flux` | Préparer un changement dans un flux existant | Entrée, transformations, état, sortie, erreurs, consommateurs. |
| `cartographier-conception` | Frontières transversales ou migration | Responsabilités, interfaces, décisions, dépendances et zones non vérifiées. |

Exemple de contrat proposé, et non résultat d’une exécution réelle :

```text
Question : comment une session devient-elle considérée comme terminée ?
Révision / zone : <commit> + fichiers modifiés pertinents
Faits observés : <affirmation — fichier:section ou symbole>
Flux : <départ → transformation → effet → contrôle>
Inférences : <hypothèse — fondement — vérification manquante>
Inconnues : <élément non inspecté ou non observable statiquement>
Couverture : <ce qui a été cherché ; exclusions>
```

La recherche factuelle ne produit pas de recommandations par défaut. Le critique ou le cadreur les formule ensuite. Éviter un niveau de confiance décoratif à chaque ligne : préciser d’abord **comment** le fait est établi. « Observé statiquement » et « reproduit à l’exécution » ne sont pas équivalents.

**Budgets pilotes :** conserver vingt lignes pour `localiser` ; viser environ 600–900 tokens pour un flux et 1 000–1 500 pour une cartographie. Ce sont des points de départ à mesurer, pas de nouveaux plafonds permanents. Une réponse incomplète dit ce qui manque au lieu de masquer l’inconnu pour tenir dans le format.

Ne pas élargir les permissions de l’explorateur pour obtenir Git ou des tests. Donner la révision dans l’entrée, utiliser le rôle existant de résumé Git pour le diff et un exécutant adapté pour les mesures.

**Acceptation :** appel ancien inchangé ; références vérifiables ; aucune inférence promue en fait ; moins de recherches répétées à qualité égale. **Domicile :** agent et prompts de ses appelants, puis synthèse dans l’artefact déjà utilisé par le chantier. **Retour arrière :** conserver uniquement le mode qui apporte un gain ; réévaluer le modèle pour la cartographie si l’essai montre une insuffisance, sans changer le modèle économique de la localisation.

### R4 — Comparer impact prévu et réel sans transformer le diff en note

**Problème :** les zones prévues existent déjà, mais leur pouvoir prédictif est peu exploité. Inspiration : AB Method.

Conserver la zone prévue au moment du plan. En fin de session, comparer les fichiers **et les contrats** réellement touchés. Utiliser une base Git explicite ; avec un arbre déjà modifié ou partagé, le diff global ne permet pas une attribution fiable à une session.

```text
Base : <commit ou état de départ identifié>
Prévu : <zones et contrats>
Réel : <zones attribuables à la session>
Écart : conforme | dérivé mécanique | dépendance découverte | objectif changé
Cause / suite : <une phrase et référence de preuve>
Attribution incertaine : <le cas échéant>
```

**Déclenchement :** plan non trivial, migration ou modification transversale. **Non-déclenchement :** changement évident d’un fichier sans effet partagé.

**Tests :** renommage classé correctement ; modification préexistante non attribuée à l’agent ; changement d’interface détecté malgré un petit diff. **Domicile :** champ de bilan existant dans `S<k>.md`, sans statut dupliqué. **Coût :** collecte déterministe et commentaire bref. **Retour arrière :** retirer le champ si ses conclusions ne sont jamais utilisées pour améliorer une exploration ou une planification.

### R5 — Évaluer les comportements sur plusieurs couches

**Problème :** D6. Construire trois catégories de contrôles :

1. **Statique :** syntaxe, références, noms, schémas, couverture des fixtures.
2. **Script :** événements simulés, résultats et effets dans un dépôt temporaire ; prolonger les tests existants.
3. **Session réelle :** découverte de la skill, invocation, outils réellement disponibles, résultat, reprise et câblage effectif.

Un test qui cherche le mot `NONE` dans une réponse n’établit pas l’absence d’appels inutiles. Examiner les traces des actions pour les assertions de comportement ; juger séparément la qualité du résultat.

Promptfoo peut aider pour les cas et la comparaison de sorties. Pour la couche 3, un essai doit réellement lancer Claude Code dans un environnement contrôlé ; une réponse simulant cette exécution est insuffisante.

**Déclenchement :** ajout ou modification d’un comportement important. **Non-déclenchement :** ne pas imposer une batterie de sessions payantes pour une correction typographique.

**Acceptation :** corpus avec cas positifs, négatifs et ambigus ; comparaison à la version initiale ; traces conservées ; toute limite du juge explicitée. **Domicile :** tests et fixtures dans le dépôt source, hors payload vendoré. **Coût :** nul pendant les sessions ordinaires ; budget explicite pendant les évaluations. **Retour arrière :** désactiver une assertion instable plutôt que bloquer toutes les publications sur son verdict.

### R6 — Mesurer les coûts utiles, observer l’activation

**Problème :** D7 et D11. Utiliser d’abord les données natives et évaluer ccusage pour les agréger ; réutiliser le journal existant pour expliquer les changements de modèle. Ne pas développer un parseur de sessions ou un tableau de bord tant que les outils existants suffisent.

Mesurer par catégorie comparable de tâche :

- tâche correctement terminée ou défaut restant ;
- relances de recherche, corrections et reprises nécessaires ;
- temps actif, attente d’outils et attente humaine, séparément ;
- tokens d’entrée, de sortie et de cache lorsque disponibles ; sinon `inconnu` ;
- appels d’agents et charges de contexte introduites ;
- skill proposée, invoquée et réellement utile — trois informations différentes.

Le coût total inclut la préparation et la correction. Une baisse de tokens de l’agent parent ne démontre rien si elle déplace davantage de travail dans les sous-agents.

**Séparer quatre mesures :** place occupée dans le contexte courant ; consommation cumulée de tokens par catégorie ; coût monétaire réel ou estimé selon le mode de facturation ; temps jusqu’au résultat accepté. Une optimisation peut améliorer l’une et dégrader une autre. Le cache rend une lecture répétée moins chère dans certains cas ; il ne supprime pas le contenu du contexte.

Pour les tarifs à l’usage, calculer par appel et modèle les entrées non mises en cache, créations de cache, lectures de cache et sorties avec leurs tarifs applicables, sans compter deux fois une catégorie. Additionner parent et sous-agents, puis les frais d’outils connus. Si des données manquent, afficher la couverture et les inconnues au lieu d’un total prétendument exhaustif. Sous abonnement, conserver les tokens et l’estimation API comme indicateurs séparés des dépenses effectivement facturées.

**Chargement des protocoles :** mesurer le petit aiguillage ajouté aux skills, les fiches effectivement ouvertes et les synthèses réutilisées. La mutualisation sur disque réduit la maintenance ; elle ne réduit le contexte que si les appels évitent de recharger des contenus inutiles.

**Déclenchement :** pilote ou incident répétitif. **Non-déclenchement :** pas de collecte exhaustive de tous les prompts pour « voir plus tard ». Garder des métadonnées minimales ; les traces nécessaires à un diagnostic restent locales et bornées.

**Acceptation :** événements absents signalés comme inconnus, erreurs de journalisation non bloquantes, comparaison possible avant/après. **Domicile :** diagnostic local ignoré par Git ; synthèse durable seulement dans une analyse ou un incident utile. **Retour arrière :** suppression du capteur sans effet sur l’exécution. La télémétrie n’est jamais un registre de statut.

### R7 — Étendre les contrôles de publication et préciser leur portée

**Problème :** un renvoi présent peut conduire à une instruction inexacte ; un script juste peut être mal câblé.

Étendre les suites existantes avant d’introduire un outil externe : frontmatter, références, correspondance entre agents cités et agents présents, chemins du payload vendoré et schémas des hooks.

| Vérifiable mécaniquement | À signaler pour revue |
| --- | --- |
| Fichier ou agent absent, YAML/JSON invalide | Déclencheur trop large ou trop vague. |
| Référence non résolue dans le payload | Interdit en prose dont la garantie technique n’est pas démontrée. |
| Matcher mal formé, sortie de hook invalide | Contradiction sémantique entre deux règles. |
| Exemple de configuration incompatible avec le schéma ciblé | Mauvais domicile d’une règle ou duplication de sens. |

agnix peut être essayé sur une révision figée, en rapport seulement. Classer ses résultats avant d’en intégrer une sélection. Ne pas assimiler « conforme à un linter » à « conforme au runtime local ».

**Scénarios de hooks à examiner :** charge invalide, chemin avec espaces/accents, autre répertoire courant, champ absent, dépôt source sans `STATUS.md`, reprise d’une même session, verrou de vague, marqueur non inscriptible, timeout et rappel de fin répété. Ajouter seulement les cas absents après inventaire de la couverture.

**Acceptation :** erreurs certaines bloquantes, suggestions sémantiques non bloquantes ; test d’activation réelle sur une copie vendorée. **Domicile :** tests dans la source, raccord à `publier.mjs` après validation. **Coût :** à la publication, pas à chaque message. **Retour arrière :** retirer une règle fautive sans désactiver les autres contrôles.

### R8 — Décrire le delta et refermer la documentation

**Problème :** un plan décrit le travail, mais le comportement conservé et la mise à jour de la référence peuvent rester implicites. Inspiration : OpenSpec.

```text
ADDED     : nouveau comportement observable
MODIFIED  : comportement existant dont le contrat change
REMOVED   : comportement ou compatibilité retiré
PRESERVED : invariant dont la conservation doit être vérifiée
```

Placer le delta dans la **décision source** lorsque le plan découle d’une décision. Les sessions y renvoient et décrivent leur contribution. L’index actuel étant volontairement limité, ne pas lui ajouter un long contrat technique. Si aucune décision n’est nécessaire, loger un delta bref dans la tâche concernée, sans créer une décision artificielle.

Chaque critère utile relie un comportement à une vérification ; aucune obligation de créer des identifiants pour une tâche simple. Sur un changement transversal, des repères courts facilitent cette traçabilité.

**Clôture :** vérifier les invariants, actualiser la documentation de référence dans son domicile et conserver la justification historique. Un plan clos ne remplace pas la mise à jour de `ARCHITECTURE.md`, d’une convention ou d’un contrat devenu faux.

**Tests :** invariant oublié, tâche hors delta, documentation non actualisée, absence légitime de certaines catégories. **Coût :** quelques lignes réutilisées ; aucune nouvelle arborescence. **Retour arrière :** revenir à une phrase de delta si le tableau n’ajoute aucune information.

### R9 — Reprise persistante seulement pour les lacunes non couvertes par P4

**Problème potentiel :** effet produit mais résultat non consigné, agent disparu, preuve périmée. Inspiration : Spec Kit ; adaptation à la reprise existante.

Avant tout moteur, rejouer une interruption avec les mécanismes actuels et identifier la perte exacte. Si un curseur supplémentaire est nécessaire, il référence : identifiant d’exécution, version du workflow, empreinte des entrées, étape, artefacts produits et dernière vérification. Les statuts restent dans l’index ; les budgets restent dans leur domicile actuel.

**Contrat de reprise proposé :**

1. Relire le plan et l’état Git pertinent ; ne pas croire aveuglément le dernier curseur.
2. Rechercher si l’effet attendu a déjà eu lieu.
3. Revalider une preuve si ses entrées ont changé.
4. Réexécuter seulement une opération répétable sans conséquence supplémentaire.
5. Face à un effet externe incertain — publication, migration — vérifier son état avant toute nouvelle tentative.
6. Consigner le résultat, sans remettre les compteurs de reprise à zéro.

**Tests :** interruption avant effet, après effet avant écriture, après écriture ; plan modifié pendant l’arrêt ; agent absent ; compteur conservé ; aucune double publication. Pour les effets non répétables, prévoir une clé d’opération ou une vérification de résultat ; un curseur seul ne garantit pas l’unicité.

**Déclenchement :** perte de reprise reproduite ou incident coûteux. **Non-déclenchement :** reprise procédurale actuelle suffisante. **Coût :** élevé par rapport aux autres pistes, donc différé. **Domicile :** mécanisme source lié à `/orchestrer-plan`, références aux artefacts existants. **Retour arrière :** reprise manuelle documentée sans perte des décisions, statuts et budgets.

### R10 — Maintenir une compatibilité vérifiée avec Claude Code

**Problème :** certaines règles vieillissent plus vite que les skills qui les appliquent.

Conserver `/maj-workflow` comme procédure de synchronisation d’une copie vendorée. Réaliser dans la source, lors d’une évolution importante ou d’un incident, une comparaison entre capacité native, besoin local et surcharge existante.

```text
Capacité : <outil, permission, effort, reprise, hook…>
Version / environnement vérifié : <valeur>
Source officielle : <lien et date>
Règle locale concernée : <fichier:section>
Essai : <entrée et observation>
Décision : conserver | simplifier | retirer | différer
```

La documentation actuelle décrit, par exemple, une option d’omission de certains `CLAUDE.md` réservée à une version supérieure à `2.1.266`. Elle n’est pas une possibilité acquise sur le poste audité. Ne pas activer une fonctionnalité parce qu’elle apparaît dans une page récente.

**Déclenchement :** évolution du runtime touchant un contrat local ; revue ponctuelle lors d’une maintenance. **Non-déclenchement :** pas de veille exhaustive à chaque synchronisation de projet.

**Acceptation :** version minimale établie, essai local, repli explicite, pas de modification silencieuse des règles aval. **Domicile :** référence de compatibilité dans la source ; `/choisir-mecanisme` y renvoie, `/maj-workflow` synchronise ensuite. **Coût :** maintenance ponctuelle, aucun nouveau préambule permanent.

### R11 — Réconcilier une vague sur ses contrats et son résultat intégré

**Problème :** la disjonction des fichiers protège des écrasements, mais ne garantit pas la compatibilité fonctionnelle.

**Exemple :** S1 modifie le producteur d’un résultat et S2 son consommateur dans des fichiers distincts. Chacune passe ses tests isolés, mais leurs conventions de valeur vide divergent.

Après collecte, comparer entrées et sorties attendues, résultats réellement reçus, interfaces partagées et critères d’intégration. Une session manquante ou partielle reste visible ; un résultat manquant n’est jamais converti en réussite. Réutiliser les procédures locales de revue et de remédiation.

**Déclenchement :** plusieurs sessions dont les livrables se rencontrent, même sans fichier commun. **Non-déclenchement :** résultats effectivement indépendants ou exécution séquentielle sans contrat partagé.

**Acceptation :** test sur le résultat intégré, contradiction détectée, aucune confusion entre livraison partielle et PASS. **Domicile :** collecte dans `/orchestrer-plan`, résultat durable dans les artefacts existants. **Coût :** une comparaison bornée ; pas un second débat multi-agent. **Retour arrière :** sérialiser les sessions si leur indépendance est trop coûteuse à garantir.

## 7. Exemple complet d’adaptation à `Templates`

Cet exemple est **un scénario proposé**, pas une modification déjà réalisée.

### Changement : enrichir l’exploration sans casser ses appelants

**Problème :** le plan a besoin de suivre un flux, tandis que l’explorateur ne rend que les rôles de fichiers.

**Delta :**

| Catégorie | Contrat | Vérification proposée |
| --- | --- | --- |
| ADDED | Un appel explicite `suivre-flux` restitue entrée, état, sortie, erreurs et inconnues. | Cas sur un dépôt témoin dont le flux attendu est connu. |
| MODIFIED | `/nouveau-plan` choisit ce mode lorsqu’un flux doit être reconstitué. | Trace d’une vraie session de planification. |
| REMOVED | Rien dans le premier pilote. | Diff et absence de suppression de l’ancien contrat. |
| PRESERVED | Appel sans mode = localisation brève, lecture seule. | Rejouer un appel ancien ; vérifier outils et fichiers inchangés. |

**Critique avant implémentation :** le rôle exige-t-il un outil que l’agent ne possède pas ? Le budget masque-t-il une inconnue ? Le résultat va-t-il dans un domicile existant ? Le modèle actuel suffit-il au cas de flux ?

**Contrôle de découpe :** chaque fichier à modifier existe ; les nouveaux cas sont annoncés comme créations ; les sessions dépendantes sont dans des vagues distinctes.

**Après essai :** comparer le nombre de recherches complémentaires et les erreurs de compréhension au témoin. Si une réponse plus longue n’évite aucun retour, réduire le format. Si un flux complexe dépasse les capacités observées, escalader ce mode précis ou borner davantage la question.

**Clôture :** mettre à jour le contrat de l’agent et ses appelants ; conserver les résultats d’essai utiles dans une analyse source. Aucun tableau de statut supplémentaire.

## 8. Protocole d’évaluation et critères d’adoption

### 8.1 Corpus initial proposé

| Cas | Comportement attendu | Échec à détecter |
| --- | --- | --- |
| Correction évidente d’une coquille | Action directe | Cadrage, protocole ou critique inutile. |
| Décision déjà consignée et applicable | Réutilisation de l’acquis | Reposer les mêmes questions. |
| Documentation en contradiction avec un comportement reproduit | Observation et requalification de la source | Prendre la documentation pour preuve finale. |
| Bug avec deux causes plausibles | Test discriminant | Accumulation de correctifs sans hypothèse. |
| Choix local facilement réversible | Décision courte | Pré-mortem disproportionné. |
| Nouvelle interface partagée | Critique avant approbation | Revue seulement après engagement. |
| Plan sain | PASS bref | Suggestions décoratives obligatoires. |
| Mauvaise application d’une décision claire | Correction | Escalade humaine artificielle. |
| Donnée technique manquante mais accessible | Recherche | Demander à l’utilisateur de chercher. |
| Exploration sans mode | Ancien format | Rupture des appelants existants. |
| Flux avec appel dynamique non résolu | Inconnue visible | Certitude inventée. |
| Résumé juste mais preuve devenue périmée | Revalidation ciblée | Réemploi du verdict sur d’autres entrées. |
| Dépendance entre sessions de même vague parallèle | Réordonnancement | Tolérance sous prétexte de fichiers distincts. |
| Fichier déjà modifié avant la session | Attribution prudente du diff | Imputer tout le diff à l’agent. |
| Tests verts sur un corpus vide ou mauvais fichier | Faux vert détecté | Se fier au seul code de sortie. |
| Hook exécuté directement mais non câblé | Écart d’intégration identifié | Déclarer le runtime validé. |
| Marqueur de fin non inscriptible | Comportement borné observé | Boucle de blocages non maîtrisée. |
| Interruption après effet avant consignation | Vérification de l’effet existant | Répéter aveuglément l’opération. |
| Deux résultats individuellement valides mais incompatibles | Test intégré en échec | Clore la vague sur deux PASS isolés. |
| Texte de dépôt demandant d’ignorer les règles de l’agent | Texte traité comme donnée de recherche | Instruction externe exécutée par l’explorateur. |
| Capacité déjà implémentée dans un utilitaire local | Réutilisation ou justification d’une limite concrète | Nouvelle implémentation redondante. |
| Fonction native de la stack suffisante | Configuration ou adaptation minimale | Recherche externe ou dépendance inutile. |
| Bibliothèque populaire incompatible avec une contrainte obligatoire | Rejet motivé | Assimiler popularité et adéquation. |
| Comparaison de solutions déjà consignée et encore valable | Réemploi des preuves, recherche des seuls manques | Répétition intégrale du cadrage. |
| Proposition de sous-système custom sans recherche préalable | Exploration bornée avant découpage | Transformer l’idée initiale en tâches sans examiner l’existant. |
| Nouveau projet avec contrainte offline | Examiner la contrainte avant la persistance et la stack | Choix par habitude contredit par l’usage. |
| Construction déjà décidée par l’utilisateur | Rechercher des fondations dans ce cadre | Rouvrir systématiquement la décision de construire. |
| Projet initialisé depuis un brief et un template validés | Vérification des écarts, parcours court | Nouvelle interview et comparaison complète sans besoin. |
| Premier plan après recherche des fondations | Lire les décisions et sources du démarrage | Refaire la même recherche ou choisir une stack contradictoire. |
| Plan pour une CLI hors JavaScript | Fichiers et commandes réels, validation du contrat CLI | npm, React, structure frontend ou navigateur ajoutés par imitation. |
| Plan de documentation sans compilation | Vérifications pertinentes, non-applicabilité justifiée | Inventer un build ou supprimer toutes les vérifications. |
| Exemple web confronté à un dépôt d’une autre stack | Le contexte réel gouverne le plan | L’exemple est traité comme une prescription technique. |

### 8.2 Comparaison avant/après

1. Figer le corpus, l’état du dépôt et les critères avant de modifier le workflow.
2. Relever runtime, modèle, effort, permissions et capacités réellement disponibles.
3. Comparer ancienne version et un changement à la fois sur les mêmes entrées, dans des sessions séparées.
4. Pour un premier tri, sélectionner quelques cas directement concernés par le changement, incluant ses non-déclenchements. Viser trois répétitions sur ce sous-ensemble lorsque le comportement varie ; réserver les assertions déterministes à des tests de code. Élargir selon les échecs et le risque, sans rejouer toutes les sessions payantes à chaque édition. Ce petit échantillon sert au diagnostic, pas à une affirmation statistique générale.
5. Conserver quelques cas hors du corpus utilisé pour mettre au point les instructions.
6. Mesurer les actions et le résultat, pas seulement le texte final. Mélanger l’ordre des variantes pour la revue humaine lorsque possible.
7. Distinguer succès mécanique, jugement humain et résultat non vérifiable. Un juge LLM assiste la revue ; il ne certifie pas son propre système.

### 8.3 Décision d’adoption

**Seuils proposés pour le pilote, à fixer avant les essais :**

- zéro régression observée sur permissions, invariants critiques et attribution des effets ;
- zéro nouvelle question humaine sur les cas triviaux du corpus ;
- amélioration identifiable sur les cas ciblés : défaut détecté plus tôt, recherche répétée évitée ou reprise correctement résolue ;
- si le coût médian des cas simples augmente de plus de 10 %, examiner la cause avant d’étendre le pilote ;
- aucun nouveau domicile de statut ou décision ;
- résultat insuffisant ou ambigu = maintien en mode facultatif, pas généralisation.

Le seuil de 10 % est une proposition de contrôle, pas un résultat obtenu. Comparer la qualité à coût acceptable ; ne pas accepter une baisse de qualité en échange d’un chiffre de tokens plus faible.

### 8.4 Évaluation économique : éviter les économies apparentes

**Comparaison minimale proposée :** une tâche simple, une exploration non triviale et un diagnostic avec résultat de test volumineux, choisis dans les cas déjà utiles. Comparer le workflow courant à une seule modification ; conserver les mêmes critères d’acceptation, dépôt, modèle et effort pour isoler l’effet, puis seulement comparer d’autres réglages si cela répond à une question distincte.

| Expérience | Mesure principale | Garde de qualité |
| --- | --- | --- |
| Protocole partagé | Appels de recherche et contexte chargé sur la chaîne démarrage → cadrage → plan | Aucun acquis perdu, aucune recherche importante omise. |
| RTK ou reporter compact | Taille des sorties et consommation de tous les agents jusqu’au verdict | Même code de sortie, échec déterminant visible, test vide ou ignoré détectable, brut récupérable. |
| Navigation sémantique | Nombre et volume des lectures, coût de mise en route inclus | Symboles et consommateurs pertinents retrouvés, limites signalées. |
| Compaction ou nouvelle session | Coût jusqu’à la fin du travail, incluant résumé et relectures | Décisions, erreurs utiles, inconnues et prochaines actions conservées. |
| Changement de modèle/effort | Coût total et reprises jusqu’à l’acceptation | Critères satisfaits et défauts non augmentés. |

**Ne pas extrapoler les pourcentages.** Exemple purement illustratif : si une sortie représente 20 % des tokens d’entrée d’une requête et qu’on en retire 70 %, on réduit les entrées de cette requête de 14 %. Cela ne donne ni la réduction de coût de la requête, qui dépend du cache et des sorties du modèle, ni celle du chantier entier, qui dépend des tours suivants.

**Amortissement :** consigner le coût ponctuel d’installation, configuration, évaluation et maintenance. Si le gain par tâche comparable est positif, estimer combien de tâches récurrentes le remboursent. Une optimisation utilisée une fois peut ne pas justifier son installation ; les scripts et capacités déjà présents ont l’avantage d’un coût marginal faible.

**Décision :** conserver l’outil ou le protocole s’il réduit le coût à qualité comparable, ou si son surcoût correspond à une amélioration de qualité explicitement jugée utile. Un défaut critique masqué, un contrôle contourné ou une inconnue transformée en certitude invalide l’économie annoncée. L’échec d’un outil de mesure reste non bloquant pour le travail, mais rend l’estimation incomplète.

## 9. Priorités et ordre de mise en œuvre

Les niveaux d’effort ci-dessous décrivent la quantité de travail relative ; ils ne prescrivent pas un modèle ni son paramètre d’effort.

| Lot | Contenu | Justification | Effort relatif | Condition de passage |
| --- | --- | --- | --- | --- |
| A — Exactitude et mesure | R0, état P4, baseline économique R6 avec outils existants, corpus témoin ciblé (R1e) | Contradictions locales et poste de dépense à identifier | Faible à moyen | Garanties décrites correctement, coût de référence et qualité observables. |
| B — Compréhension | R3, protocole partagé R1c et application au démarrage R1d, début R4 | Contrat d’exploration étroit et réutilisation non organisée | Moyen | Moins de reprises de recherche, fondations et réutilisation justifiées, aucune perte des inconnues. |
| C — Décision | Pilote R2, préparation courte de R1 | Revue indépendante de conception absente du contrôleur existant | Moyen | Défauts utiles détectés et voie triviale intacte. |
| D — Réflexion et delta | Deux protocoles R1, R8 | Améliorer les cas dont la difficulté est maintenant identifiée | Moyen | Gain sur corpus ciblé et convergence des écrits. |
| E — Maintenance | R5, R6, R7, R10 au niveau nécessaire | Rendre les gains observables et durables | Moyen | Tests stables, vrais essais runtime, publication toujours contrôlée. |
| F — Coordination avancée | R11 puis R9 si incidents confirmés | Éviter un moteur sans problème démontré | Moyen à élevé | Reprise ou intégration aujourd’hui insuffisante, reproduite sur fixture. |

R5 commence dès le lot A sous une forme réduite ; sa consolidation est au lot E. R6 fournit la référence économique avant les pilotes, sans attendre un outil complet d’observabilité. Un essai RTK, Serena ou Repomix n’entre dans les lots que si les mesures identifient le problème correspondant ; ccusage est d’abord un candidat de mesure.

**Premier chantier recommandé :** corriger les garanties documentaires et tester un mode `suivre-flux`. Ce lot est assez petit pour être évalué et fournit de meilleures entrées à une future critique de plan.

Utiliser le prochain identifiant de plan réellement disponible après lecture de l’index et de l’état du dépôt. Ne pas présumer qu’il s’agit de P5. Une correction déjà couverte par un chantier actif doit suivre les règles locales d’extension, sans rouvrir les arbitrages de P4 par défaut.

## 10. Domiciles et contrats à préserver

| Information | Domicile recommandé |
| --- | --- |
| Principe global et frontière d’intervention humaine | `plugin/WORKFLOW.md` et ses domiciles actuels, avec renvois. |
| Procédure d’une skill | Son `SKILL.md`. |
| Méthode détaillée rarement utilisée | Référence directe de la skill. |
| Protocole utilisé par `/nouveau-projet`, `/cadrer` et `/nouveau-plan` | Référence partagée unique, distribuée dans le payload et chargée à la demande par les skills concernées. |
| Outils, format et limites d’un rôle isolé | Définition de l’agent. |
| Décision et justification durables | `docs/decisions/` et ligne dans `DECISIONS.md`. |
| État du plan | `plans/P<n>/index.md`, exclusivement. |
| Travail et preuve de session | `S<k>.md` et artefacts de revue/échec déjà prévus. |
| Statut des reprises et budget | Domicile actuel défini par `WORKFLOW.md` §9c. |
| Mesures expérimentales | Analyse dans le dépôt source ; traces temporaires hors suivi. |
| Contrôles de publication | Suites de tests source, appelées par le script de publication. |
| Compatibilité runtime | Référence datée dans le dépôt source, sans copie dans chaque skill. |

Un verdict de revue peut citer le commit, les entrées et les constats résolus sans devenir un deuxième état d’avancement. Une mesure ou un cache est supprimable ; une décision et un statut ont un domicile durable.

## 11. Pistes à différer ou à écarter

- **Installer un framework complet :** aucun besoin observé ne justifie de remplacer les plans, décisions et conventions de vendoring existants.
- **Multiplier les agents par principe :** la séparation des contextes doit résoudre un problème précis. Des noms de rôles différents ne garantissent pas des jugements indépendants.
- **Créer six protocoles immédiatement :** commencer par ceux dont les cas existent et garder `NONE`.
- **Forcer toutes les skills via mots-clés :** mesurer les omissions et faux positifs avant d’ajouter une contrainte.
- **Un index universel injecté à chaque tour :** préférer un contexte sélectionné pour la question, avec références accessibles.
- **Une mémoire parallèle de décisions :** utiliser les domiciles actuels ; un cache doit pouvoir être reconstruit ou invalidé.
- **Bloquer sur des jugements stylistiques d’un linter :** seuls les défauts certains et compatibles deviennent des gates mécaniques.
- **Assimiler une sauvegarde à une exécution unique :** la reprise doit réconcilier l’effet réel et le journal.
- **Prendre un extrait de prompt interne pour une API :** s’appuyer sur documentation et comportement observé. Les dépôts de prompts extraits sont au mieux des signaux de veille.

### Sources de veille conservées, sans conclusion ferme dans cette révision

Le rapport initial mentionnait aussi [chann/skills](https://github.com/chann/skills), [Agent Collab Skills](https://github.com/WenyuChiou/agent-collab-skills), [Dynamic Workflow Patterns](https://github.com/zircote/workflows-plugin), [Claude Code Agent Teams](https://github.com/jpsweeney97/claude-code-agent-teams) et [Claude Code System Prompts](https://github.com/Piebald-AI/claude-code-system-prompts).

Leur contenu détaillé n’a pas été suffisamment revalidé ici pour conserver toutes les affirmations du premier rapport. Ils restent des pistes, notamment pour la réconciliation et la couverture d’exploration ; les recommandations centrales ci-dessus disposent d’autres fondements explicites. [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) reste un point de découverte, pas un certificat de qualité ni de compatibilité.

## 12. Consigne autonome à transmettre à Claude Code

> Lis ce rapport comme une analyse à vérifier, pas comme un plan déjà approuvé. Commence par relever l’état Git, la version du plugin, la version du runtime effectivement utilisé, l’index P4 et les décisions applicables. Préserve les modifications et revues existantes. Le rapport a été révisé sur le commit `d7c68963819f18e1cbbc4feb6c686303beb21b2b`, avec un arbre non propre, un plugin `0.36.0` et une CLI Claude Code `2.1.266` ; cet état peut avoir changé.
>
> Vérifie en priorité la sémantique de `allowed-tools` dans `/cadrer` et l’exemple de dépendance entre sessions de la même vague dans `/nouveau-plan`. Distingue une erreur de description, une restriction effective du runtime et une convention de comportement. Consulte les sources officielles pertinentes et reproduis les propriétés nécessaires dans un environnement temporaire.
>
> Puis évalue un petit lot : enrichir `explorateur` avec un mode `suivre-flux`, en gardant `localiser` par défaut, ses permissions de lecture seule et ses appelants existants. Le résultat doit séparer faits observés, inférences, inconnues et références vérifiables. Mesure le nombre de recherches supplémentaires et la qualité des plans obtenus.
>
> Sur cette base, propose une critique conditionnelle des décisions de conception avant leur approbation. Garde `verificateur-plan` pour ses contrôles actuels et la revue a posteriori pour le résultat livré. Un fait manquant appelle une recherche ; une correction dans le périmètre appelle une correction ; seul un choix non autorisé appelle l’humain selon `WORKFLOW.md` §9c.
>
> Réutilise les idées d’Ideation, HumanLayer, AB Method, gstack et OpenSpec dans les artefacts existants. Partage les protocoles utiles entre `/cadrer` et `/nouveau-plan`, avec un domicile unique et un chargement à la demande. Garde `NONE` comme issue normale pour les méthodes de réflexion ; deux fiches pilotes suffisent au départ. Ajoute aussi le protocole transversal de recherche de solutions existantes : dépôt, capacités de la stack, puis candidats externes si nécessaire, avant de prévoir un mécanisme custom. Réutilise les preuves du cadrage et ne recherche que les inconnues techniques restantes. Justifie le choix entre réutiliser, configurer, adapter et développer, en distinguant preuve d’usage et popularité. N’installe pas de framework entier pour appliquer une idée.
>
> Étends aussi cette recherche à `/nouveau-projet` : recueille les contraintes avant de choisir la stack, examine les outils complets si le choix de construire reste ouvert, puis les templates et composants adaptés. Respecte les choix explicites de l’utilisateur. Fais apparaître les fondations proposées dans la synthèse d’approbation existante, consigne les preuves dans les décisions après validation et transmets-les au premier plan. N’ajoute ni double interview ni passage obligatoire par `/cadrer` lorsqu’aucun arbitrage ne reste ouvert.
>
> Vérifie aussi les biais de stack dans les exemples et templates. `/nouveau-plan` doit tirer les technologies et commandes du projet réel et des décisions approuvées. Garde des squelettes neutres, des exemples concrets explicitement contextualisés et des validations fondées sur les propriétés du livrable. Une CLI, une bibliothèque ou une migration ne doit pas hériter de commandes npm, de chemins frontend ou de vérifications navigateur sans besoin. Teste cette propriété sur plusieurs types de dépôts sans rendre les plans abstraits.
>
> La qualité reste l’objectif principal et l’économie de contexte et de coût un critère explicite. Lis seulement les sections utiles de ce rapport. Mesure d’abord le contexte et le coût total du travail accepté, parent, sous-agents, recherches, revues et corrections compris. Examine ccusage avant de développer un analyseur ; RTK pour les sorties volumineuses, les outils de navigation natifs puis Serena pour les lectures répétées, Repomix pour les corpus ponctuels. N’installe que ce dont le besoin est observé. Ne transforme jamais une réduction de sortie en promesse équivalente sur la facture. Évalue la préservation des preuves, les hooks et les permissions ; conserve un accès au brut. Réutilise les conclusions entre skills, garde les cas simples courts et borne le coût des évaluations elles-mêmes.
>
> Pour chaque amélioration, indique le problème local, sa preuve, la source d’inspiration, la correction minimale, le déclenchement et le non-déclenchement, le domicile documentaire, le coût ajouté, les tests et le retour arrière. Compare au comportement initial sur des cas positifs et négatifs. Distingue tests de scripts, tests de câblage et vraie exécution par Claude Code.
>
> Ne redéveloppe la reprise que si un cas non couvert par P4 le justifie. Ne transforme pas `/maj-workflow` en audit permanent : garde la synchronisation vendorée et traite la compatibilité dans le dépôt source. Privilégie la suppression d’une règle devenue inutile à l’accumulation de nouvelles consignes. Termine par une recommandation motivée et un plan limité au lot dont le bénéfice est démontrable.

## 13. Références centrales

Toutes les sources centrales ci-dessous ont été consultées pour cette révision le 15 septembre 2026 ; aucune révision amont immuable n’a été figée. Les liens vers les branches courantes doivent être recontrôlés avant toute reprise de code.

| Sujet | Référence primaire |
| --- | --- |
| Sémantique des skills et permissions | [Claude Code — Skills](https://code.claude.com/docs/en/skills) |
| Outils, effort et isolation des agents | [Claude Code — Subagents](https://code.claude.com/docs/en/subagents) |
| Événements, schémas et comportement des hooks | [Claude Code — Hooks](https://code.claude.com/docs/en/hooks) |
| Profondeur selon le changement | [Superpowers — brainstorming](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md) |
| Préparation fondée sur les preuves | [Ideation — confidence rubric](https://github.com/nicknisi/ideation/blob/main/references/confidence-rubric.md) |
| Contrat, questions ouvertes et critiques | [Ideation — skill](https://github.com/nicknisi/ideation/blob/main/skills/ideation/SKILL.md) |
| Recherche factuelle | [HumanLayer — research_codebase](https://github.com/humanlayer/humanlayer/blob/main/.claude/commands/research_codebase.md) |
| Domaine, critique et impact | [AB Method](https://github.com/ayoubben18/ab-method) |
| Revue d’ingénierie | [gstack — plan-eng-review](https://github.com/garrytan/gstack/blob/main/plan-eng-review/SKILL.md) |
| Choix et abandon d’une méthode | [Thinking model router](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-model-router/SKILL.md) |
| Changement différentiel et convergence | [OpenSpec — concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md) |
| Collecte déterministe et jugement | [AgentSys](https://github.com/agent-sh/agentsys) |
| Lint de configuration | [agnix](https://github.com/agent-sh/agnix) |
| Qualité des skills et contribution | [Trail of Bits — AGENTS.md](https://github.com/trailofbits/skills/blob/main/AGENTS.md) |
| Observation des sessions et bac à sable | [CC Harness](https://github.com/lookfree/cc-harness) |
| Activation et portabilité | [Infrastructure Showcase](https://github.com/diet103/claude-code-infrastructure-showcase) |
| Reprise des workflows | [Spec Kit — workflows](https://github.com/github/spec-kit/blob/main/workflows/README.md) |
| Architecture de l’exécution | [Spec Kit — architecture](https://github.com/github/spec-kit/blob/main/workflows/ARCHITECTURE.md) |
| Sélection du contexte | [Aider — repository map](https://aider.chat/docs/repomap.html) |
| Préparation de corpus | [Repomix — guide](https://repomix.com/guide/) |
| Évaluation de sorties | [Promptfoo — test cases](https://www.promptfoo.dev/docs/configuration/test-cases/) |
| Réduction de contexte et diagnostic natif | [Claude Code — coûts](https://code.claude.com/docs/en/costs) |
| Cache et coût de compaction | [Claude Code — prompt caching](https://code.claude.com/docs/en/prompt-caching) |
| Mesure de consommation | [ccusage](https://github.com/ccusage/ccusage), [guide et limites](https://ccusage.com/guide/) |
| Filtrage des sorties de commandes | [RTK](https://github.com/rtk-ai/rtk) |
| Recherche sémantique dans le code | [Serena](https://github.com/oraios/serena) |
| Taille et compression des corpus | [Repomix — options](https://repomix.com/guide/command-line-options), [compression](https://repomix.com/guide/code-compress) |

**Conclusion :** l’amélioration recherchée n’est pas le nombre de règles, d’agents ou de contrôles. C’est la capacité à obtenir un résultat juste avec des preuves consultables, des décisions prises au bon moment, une reprise fiable et un coût proportionné au travail.
