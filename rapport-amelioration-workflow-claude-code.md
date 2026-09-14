# Rapport d’audit et recommandations — Workflow Claude Code `Templates`

**Destinataire :** prochaine session Claude Code chargée d’améliorer le workflow  
**Dépôt audité :** `C:\Users\Kovu\SynologyDrive\Thibault\Projets\Templates`  
**Date de l’audit :** 14 septembre 2026  
**Version déclarée du plugin :** `0.35.0`  
**Point Git observé :** `31eb9e6` (`chore(P4): coche S2 et S3 dans l'index`)  
**Précaution :** l’arbre de travail contenait des modifications P4 en cours pendant l’audit. Relire `git status`, `plans/P4/index.md` et les décisions récentes avant toute mise en œuvre. Ne pas supposer que ce rapport décrit l’état final de P4.

## 1. Résumé exécutif

Le workflow `Templates` est déjà plus discipliné que la plupart des systèmes recensés par Awesome Claude Code sur quatre dimensions : séparation entre décision et exécution, gestion explicite du contexte, persistance des décisions, et gates déterministes. Il ne gagnerait pas à être remplacé par Superpowers, gstack, AB Method ou AgentSys.

Il présente cependant trois lacunes précises :

1. **La réflexion emploie une méthode générale unique.** `/cadrer` sait arrêter, déléguer, écrire et conclure, mais ne choisit pas explicitement un protocole de raisonnement adapté au type d’incertitude.
2. **Il manque une revue de conception avant implémentation.** `/revue-de-conception` est une revue a posteriori de dérive et de dette. `verificateur-plan` vérifie la cohérence et l’exécutabilité d’une découpe. Aucun des deux ne joue pleinement le rôle d’un contradicteur d’architecture avant le premier commit.
3. **L’exploration est optimisée pour localiser, pas pour comprendre.** L’agent `explorateur` protège très bien le contexte principal, mais son contrat « chemins + rôles, vingt lignes » ne suffit pas pour reconstruire un flux, des frontières de domaine ou une contradiction entre documentation et comportement réel.

Deux lacunes transversales complètent ce diagnostic :

4. **La préparation d’un chantier n’est pas évaluée par des gates de preuve indépendantes.** Une réflexion peut être bien conduite tout en conservant un objectif imprécis, une frontière de périmètre instable ou des critères de réussite non vérifiables.
5. **Les artefacts décrivent surtout la destination, moins explicitement le delta.** Pour un projet existant, une modification gagnerait à distinguer systématiquement ce qui est ajouté, modifié, retiré et préservé.

La recommandation centrale est donc une **extension ciblée**, pas une refonte :

- garder `/cadrer` comme contrôleur de la réflexion et lui adjoindre six micro-protocoles chargés à la demande ;
- ajouter à `/cadrer` des gates binaires de préparation, chacune appuyée par une preuve ;
- ajouter une skill légère `/critique-plan` entre `/nouveau-plan` et l’approbation d’un plan à risque ;
- donner à `explorateur` trois modes de sortie explicites, avec preuves, inconnues et niveau de confiance ;
- décrire les changements brownfield comme des deltas `ADDED | MODIFIED | REMOVED | PRESERVED` ;
- tester ces comportements par scénarios avant de les rendre bloquants ;
- renforcer ensuite publication, lint, reprise d’orchestration et observabilité sans ajouter de nouvelle source de vérité.

## 2. Périmètre et méthode

L’analyse porte principalement sur :

- `plugin/WORKFLOW.md` ;
- `plugin/skills/cadrer/SKILL.md` ;
- `plugin/skills/nouveau-plan/SKILL.md` ;
- `plugin/skills/revue-de-conception/SKILL.md` ;
- `plugin/skills/choisir-mecanisme/SKILL.md` ;
- `plugin/agents/explorateur.md` ;
- le câblage des cinq hooks dans `plugin/hooks/hooks.json` ;
- les agents de vérification et les tests `tests/tester-hooks.mjs` et `tests/tester-renvois.mjs`.

Les sources externes ont été sélectionnées depuis [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code), qui est un catalogue et non un workflow homogène. L’analyse distingue donc les idées provenant des projets référencés, plutôt que de les attribuer globalement au catalogue.

Principales références étudiées :

- [Superpowers](https://github.com/obra/superpowers) ;
- [Claude Code Thinking Skills](https://github.com/tjboudreaux/cc-thinking-skills) ;
- [gstack](https://github.com/garrytan/gstack) ;
- [AB Method](https://github.com/ayoubben18/ab-method) ;
- [AgentSys](https://github.com/agent-sh/agentsys) ;
- [Agent Collab Skills](https://github.com/WenyuChiou/agent-collab-skills) ;
- [Claude Code Infrastructure Showcase](https://github.com/diet103/claude-code-infrastructure-showcase) ;
- [CC Harness](https://github.com/lookfree/cc-harness) ;
- [agnix](https://github.com/agent-sh/agnix) ;
- [Dynamic Workflow Patterns](https://github.com/zircote/workflows-plugin) ;
- [Ideation](https://github.com/nicknisi/ideation) ;
- [chann/skills](https://github.com/chann/skills) ;
- [Advanced Context Engineering for Coding Agents](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents) et les commandes de recherche de [HumanLayer](https://github.com/humanlayer/humanlayer) ;
- [OpenSpec](https://github.com/Fission-AI/OpenSpec) ;
- [GitHub Spec Kit](https://github.com/github/spec-kit) ;
- [Trail of Bits Skills](https://github.com/trailofbits/skills) ;
- [Claude Code System Prompts](https://github.com/Piebald-AI/claude-code-system-prompts) ;
- [Claude Code Agent Teams](https://github.com/jpsweeney97/claude-code-agent-teams).

Toutes les sources web ont été consultées sur leur branche principale le 14 septembre 2026. Leurs contenus peuvent évoluer ; vérifier les diffs amont avant d’en reprendre une règle.

## 3. État actuel du workflow

### 3.1 Architecture générale

Le workflow repose sur une chaîne claire :

```text
revue a posteriori éventuelle
        ↓
     /cadrer
        ↓ décision écrite
   /nouveau-plan
        ↓ sessions + vagues
 /orchestrer-plan ou exécution manuelle
        ↓
  /fin-de-tache + revue indépendante
```

Ses principes structurants sont solides :

- « Opus pense, les autres font » ;
- distinction entre régime fixé et régime ouvert/protocole de preuve ;
- une source de vérité par type d’information ;
- sessions de plan à froid ;
- délégation des traces brutes à sept agents spécialisés ;
- validation N0/N1/N2 ;
- séparation entre gate mécanique, question humaine et contrainte d’outillage ;
- taxonomie des échecs `environnement | exécution | prémisse` ;
- incidents du workflow remontés sous forme de fichiers versionnés.

Cette ossature est plus importante que n’importe quelle nouvelle technique de brainstorming. Toute amélioration proposée doit la respecter.

### 3.2 Forces de `/cadrer`

`/cadrer` est particulièrement aboutie sur la conduite de session :

- elle vérifie d’abord que la réflexion est nécessaire ;
- elle impose une question et un critère de fin écrits ;
- elle réserve le modèle cher à l’arbitrage et délègue l’exploration ;
- elle exige des conséquences observables pour chaque option ;
- elle écrit les décisions au fil de l’eau ;
- elle sait couper une réflexion longue et reprendre à froid ;
- elle possède quatre sorties explicites : décision, chantier, rien à faire, preuve ;
- elle permet de dégeler une décision si une preuve invalide l’instrument ou la prémisse.

Ce niveau de gouvernance dépasse le simple « poser quelques questions puis écrire une spécification » de nombreuses skills publiques.

### 3.3 Forces de `/revue-de-conception`

La skill ne prend pas le code existant pour son propre étalon. Elle reconstruit d’abord l’intention, la recale avec l’utilisateur, puis mesure les écarts. C’est une excellente protection contre les refactorings de goût.

Ses meilleures règles sont :

- aucune question dont la réponse existe déjà dans les fichiers ;
- chaque question part d’un constat et propose des issues avec recommandation ;
- sept questions et sept écarts au maximum ;
- aucun écart sans coût observable ;
- distinction `dérive | écrit périmé | dette de conception` ;
- une seule prochaine action ;
- mise à jour immédiate de l’écrit si l’objectif a réellement changé.

### 3.4 Limites observées

#### Une méthode de réflexion trop générique

`/cadrer` traite avec le même squelette une causalité incertaine, une décision réversible, un conflit d’exigences, une exploration produit ou un risque de lancement. La gouvernance est excellente, mais le mécanisme cognitif reste implicite.

#### Un angle mort entre planification et exécution

`/nouveau-plan` investigue le flux, les fichiers, les dépendances et les hypothèses racines. `verificateur-plan` relit la découpe. Il manque néanmoins une passe spécifiquement chargée de contester :

- les frontières proposées ;
- les flux et transitions d’état ;
- les chemins d’échec et de récupération ;
- les contraintes de performance et de sécurité ;
- la stratégie de test ;
- le rayon d’impact anticipé.

Cette passe ne doit pas être fusionnée avec `/revue-de-conception`, dont l’objet est l’écart entre intention et système existant.

#### Une exploration volontairement amputée

`explorateur` est un très bon agent de localisation. En revanche, son format actuel ne permet pas de distinguer clairement un fait observé, une inférence et une zone non vérifiée. Il peut donc fournir la bonne carte de fichiers sans fournir le modèle de fonctionnement dont un cadrage ou un plan architectural a besoin.

## 4. Enseignements des sources externes

### 4.1 Superpowers : adapter la profondeur au type de changement

La skill [brainstorming](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md) distingue trois chemins :

- **spike** : répondre à une question de faisabilité, avec code jetable éventuel ;
- **bounded** : changement local dans un flux déjà présent ;
- **architectural** : nouveau système, nouvelles frontières ou interfaces partagées.

La profondeur de l’artefact varie, mais l’approbation humaine du design demeure. Pour le chemin architectural, la skill couvre architecture, composants, flux de données, erreurs et tests, puis effectue une auto-relecture de la spécification contre les placeholders, contradictions, ambiguïtés et débordements de périmètre.

**À reprendre :** la classification précoce du changement et l’augmentation unidirectionnelle de la profondeur si une complexité cachée apparaît.

**À ne pas reprendre telle quelle :** l’approbation obligatoire de chaque micro-changement. Elle contredirait la règle locale « demander quand il y a un choix, agir quand il y a une gate ».

La skill [writing-plans](https://github.com/obra/superpowers/blob/main/skills/writing-plans/SKILL.md) verrouille aussi la structure des fichiers et des interfaces avant de détailler les tâches. Le workflow local le fait partiellement, mais pourrait rendre cette vérification explicite pour les plans architecturaux.

### 4.2 `cc-thinking-skills` : une bibliothèque de mécanismes, pas une meilleure gouvernance

Le dépôt publie 28 skills de raisonnement et un [routeur](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-model-router/SKILL.md). Celui-ci privilégie `NONE` ou une seule méthode, limite les combinaisons à trois rôles distincts et sélectionne en fonction du domaine, du type de problème, des informations disponibles, des enjeux et de la réversibilité.

Chaque skill feuille contient généralement :

- conditions d’utilisation ;
- contre-indications ;
- procédure ;
- format de sortie ;
- critères de falsification et d’arrêt ;
- garde contre la sur-application.

Exemples particulièrement pertinents :

- [Map–Territory](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-map-territory/SKILL.md) : confronter documentation, test ou métrique à l’observation réelle ;
- [Pre-mortem](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-pre-mortem/SKILL.md) : transformer les chemins d’échec en exigences, responsables et gates ;
- [Bounded Rationality](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-bounded-rationality/SKILL.md) : annoncer le seuil « assez bon » avant la recherche et s’arrêter au premier candidat qui le franchit ;
- [TRIZ](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-triz/SKILL.md) : résoudre une contradiction par séparation temporelle, spatiale, conditionnelle ou d’échelle avant d’accepter un compromis ;
- [Kepner–Tregoe](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-kepner-tregoe/SKILL.md) : IS/IS-NOT pour les causes, MUST/WANT et conséquences adverses pour les choix.

Le dépôt publie des évaluations mais reconnaît lui-même que les résultats disponibles ne justifient pas encore une affirmation générale de gain de qualité. Il faut donc reprendre les **formes falsifiables et les critères d’arrêt**, pas croire qu’un vocabulaire de méthode rend automatiquement le raisonnement meilleur.

### 4.3 gstack : une découverte produit et une revue technique beaucoup plus spécialisées

[`office-hours`](https://github.com/garrytan/gstack/blob/main/office-hours/SKILL.md) sépare un mode startup d’un mode builder. Le premier utilise six questions forcées autour de la réalité de la demande, du statu quo, de la spécificité du besoin, du plus petit point d’entrée, de l’observation et de l’avenir du produit. Le système recherche aussi les designs antérieurs apparentés et produit un document transmis aux étapes suivantes.

[`plan-ceo-review`](https://github.com/garrytan/gstack/blob/main/plan-ceo-review/SKILL.md) rend explicite la posture de revue du périmètre : expansion, expansion sélective, maintien ou réduction.

[`plan-eng-review`](https://github.com/garrytan/gstack/blob/main/plan-eng-review/SKILL.md) examine avant codage architecture, flux de données, diagrammes, cas limites, tests et performance. Il relie les choix techniques à des conséquences utilisateur et opérationnelles.

**Supériorité sur le workflow local :** profondeur de la découverte produit et couverture de la revue pré-implémentation.

**Infériorité ou coût :** plusieurs skills gstack dépassent 50–75 Ko et embarquent préambules, télémétrie, gestion multi-hôte, mémoire et conventions propres. Les importer créerait un second système de gouvernance et un coût de maintenance disproportionné.

### 4.4 AB Method : modèle du domaine, scénarios et mesure de dérive du plan

[AB Method](https://github.com/ayoubben18/ab-method) combine un grill systématique, une langue ubiquitaire, un modèle du domaine et une conception de code partagée. Sa skill `grill-with-docs` :

- confronte les termes employés au glossaire du projet ;
- remplace les termes flous par des concepts canoniques ;
- utilise des scénarios concrets et des cas limites pour éprouver les frontières ;
- vérifie les affirmations de l’utilisateur contre le code ;
- réserve les ADR aux décisions difficiles à inverser, surprenantes sans contexte et issues d’un véritable arbitrage.

AB Method compare aussi le rayon d’impact prédit par le plan au rayon réellement révélé par le diff. C’est une mesure simple de compréhension du système : si les deux divergent régulièrement, la planification ne connaît pas assez bien la zone.

**À reprendre :** vocabulaire de domaine, scénarios concrets, parking des tangentes, et comparaison impact prévu/réel.

### 4.5 AgentSys : collecte déterministe, jugement sémantique unique

[AgentSys](https://github.com/agent-sh/agentsys) applique un principe utile : le code collecte ce que le code sait détecter ; le modèle juge ce qui exige une interprétation. Regex, AST et analyse statique produisent un état structuré, puis une passe LLM unique évalue les écarts. Le système utilise aussi des niveaux de certitude et des gates de phase.

Le workflow local suit déjà cette direction avec ses hooks et tests. Il peut aller plus loin pendant l’exploration et la critique de plan : faire collecter mécaniquement fichiers, dépendances, commandes, statuts, références et diff, puis demander au modèle de juger ce paquet plutôt que de redécouvrir le dépôt dans sa conversation.

### 4.6 Agent Collab Skills : réconciliation et preuve d’acceptation

[Agent Collab Skills](https://github.com/WenyuChiou/agent-collab-skills) sépare : découpage, exécution, revue, checkpoint, évaluation de politique, réconciliation des sorties et preuve d’acceptation. Son `output-reconciler` conserve explicitement les résultats manquants ou en échec et signale contradictions, conflits et dérives de périmètre. Son acceptance gate produit `PASS`, `CONDITIONAL PASS` ou `FAIL` avant une décision humaine distincte.

Le workflow local possède déjà exécution, revue et statuts. L’idée utile est une **réconciliation de vague** lorsque plusieurs sessions parallèles touchent des interfaces liées : comparer leurs contrats et signaler les contradictions avant de considérer la vague comme collectée.

### 4.7 Infrastructure Showcase et CC Harness : observer avant de bloquer

[Claude Code Infrastructure Showcase](https://github.com/diet103/claude-code-infrastructure-showcase) utilise `UserPromptSubmit` pour comparer une demande à des règles d’activation de skills, puis trace les activations réelles. Il propose aussi un garde de vérification avant édition.

[CC Harness](https://github.com/lookfree/cc-harness) lit localement les journaux Claude Code et fournit arbre de sous-agents, coûts, analyse des déclencheurs et bac à sable de hooks avec entrées simulées.

**À reprendre :** journaliser les suggestions et activations de skills, et rejouer des fixtures de hooks.

**À éviter au départ :** bloquer une édition parce qu’une skill supposée pertinente n’a pas été invoquée. Aucun incident local mesuré ne justifie encore cette friction. Commencer en mode observation.

### 4.8 agnix : valider la configuration comme du code

[agnix](https://github.com/agent-sh/agnix) annonce 456 règles couvrant notamment `CLAUDE.md`, `AGENTS.md`, `SKILL.md`, hooks et MCP, avec modes strict, explication des règles et correctifs prévisualisables.

Le contrôle local de publication vérifie déjà les renvois et les tests de hooks. Il devrait progressivement couvrir aussi :

- frontmatter de skills et agents ;
- noms et références pendantes ;
- matchers et schémas de sortie des hooks ;
- outils déclarés incompatibles avec les interdits du corps ;
- chemins de références absents ;
- duplications manifestes de règles à domicile unique.

Il est possible d’essayer `agnix` en lecture seule dans une session dédiée, mais il ne doit pas devenir une dépendance opaque de publication sans revue des règles retenues.

### 4.9 Dynamic Workflow Patterns : nommer les formes d’orchestration

[Dynamic Workflow Patterns](https://github.com/zircote/workflows-plugin) sépare la mécanique officielle du runtime d’un catalogue de vingt patterns et huit anti-patterns. Le dépôt contient aussi des évaluations de choix de forme : pipeline plutôt que parallèle, vérification adversariale, boucle jusqu’à épuisement, phases avec gates.

Le workflow local n’a pas besoin d’adopter le runtime Dynamic Workflow pour profiter de cette idée. Nommer quelques formes — séquentiel, éventail/réduction, phase-gate, évaluateur-correcteur, boucle bornée — rendrait les plans et incidents d’orchestration plus faciles à discuter.

### 4.10 Ideation : ne pas confondre conversation aboutie et chantier prêt

[Ideation](https://github.com/nicknisi/ideation) transforme un brain dump en contrat au moyen de cinq gates binaires : clarté du problème, définition du but, critères de réussite, frontières du périmètre et cohérence. Chaque gate doit citer en une phrase la preuve qui justifie son état. Il n’existe pas de score moyen permettant de masquer une faiblesse critique : une seule gate importante encore ouverte suffit à maintenir le chantier en préparation.

Le dépôt ajoute quatre critiques indépendantes : dérive de périmètre, sur-ingénierie, dépendances cachées et faiblesse des critères de réussite. Il sépare aussi une source structurée, `contract-data.json`, de ses rendus humainement lisibles et encode les critères d’acceptation soit comme commandes avec résultat attendu, soit comme jugements explicitement humains. Une reprise ne réinterroge que les gates encore ouvertes.

**À reprendre :**

- cinq gates de préparation dans `/cadrer`, chacune avec état, preuve et question résiduelle ;
- quatre angles contradictoires dans `/critique-plan`, sans nécessairement créer quatre agents permanents ;
- des critères d’acceptation typés `commande` ou `jugement` ;
- une reprise qui conserve les gates acquises tant qu’aucune nouvelle preuve ne les invalide.

**À adapter :** ne pas créer automatiquement un second contrat global. La décision ou le plan existant doit rester le domicile unique ; le bloc de préparation doit y être inclus ou produit comme artefact temporaire explicitement promu.

### 4.11 HumanLayer : recherche factuelle, compaction intentionnelle et alignement

[Advanced Context Engineering for Coding Agents](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md) propose d’optimiser le contexte selon quatre qualités : correction, complétude, taille et trajectoire. Son workflow sépare recherche, planification et implémentation, avec des résumés intentionnels entre les phases au lieu d’accumuler toutes les traces dans une conversation unique. L’auteur souligne qu’une erreur dans la recherche ou le plan a un effet de levier bien supérieur à une erreur localisée dans le code.

La commande [`research_codebase`](https://github.com/humanlayer/humanlayer/blob/main/.claude/commands/research_codebase.md) répartit l’exploration entre localisation, analyse du fonctionnement et recherche de motifs existants. Surtout, elle impose une posture de documentaliste : décrire le système tel qu’il est avant de critiquer ou de proposer. Le résultat conserve contexte temporel, chemins, lignes, connexions, historique et questions ouvertes.

**À reprendre :**

- séparer dans toute sortie `faits observés`, `inférences`, `inconnues` et `recommandations` ;
- faire de la sortie d’exploration un paquet de preuves compact et réutilisable ;
- réserver la critique à une phase distincte de la cartographie factuelle ;
- compacter intentionnellement entre exploration, plan et exécution ;
- concentrer la revue humaine sur la recherche et le plan, où son effet de levier est maximal.

**À ne pas reprendre systématiquement :** l’exploration multi-agent exhaustive. Le workflow local doit garder un mode rapide et n’utiliser la recherche profonde que pour les changements transversaux, les migrations et l’architecture.

### 4.12 chann/skills : fermeture des décisions, registre d’hypothèses et contrat de skill

[chann/skills](https://github.com/chann/skills) est une collection récente et encore peu éprouvée publiquement. Elle doit être considérée comme une source de patterns, non comme une dépendance de confiance. Quatre skills sont néanmoins particulièrement instructives :

- `review-me` relit chaque décision importante séparément, puis développe récursivement les décisions qu’elle induit ;
- `bug-hunt` conserve un registre d’hypothèses falsifiables, y compris les hypothèses réfutées, et élargit le niveau d’analyse après plusieurs échecs dans la même couche ;
- `research-brief` privilégie les sources primaires, date les affirmations, conserve les désaccords, affiche le niveau de confiance et rend les questions ouvertes obligatoires ;
- `skill-forge` et `skill-audit` vérifient description de déclenchement, structure, manifeste, sélecteurs Codex, commandes, évaluations et cohérence de publication.

**À reprendre :** une revue récursive des conséquences d’une décision, un registre d’hypothèses pour les diagnostics difficiles, un format de recherche sourcé, et un contrat automatisable pour chaque skill publiée.

La boucle de conception utile est :

```text
décision
  → justification et preuve
  → conséquences directes
  → décisions induites
  → alternatives écartées
  → test ou observation nécessaire
```

Cette boucle comble l’espace entre un cadrage qui a choisi une direction et un plan qui découpe déjà son exécution.

### 4.13 OpenSpec : spécifier le changement plutôt que réécrire le monde

[OpenSpec](https://github.com/Fission-AI/OpenSpec) distingue les spécifications du comportement actuel des dossiers de changement. Chaque changement regroupe proposition, conception, tâches et modifications de spécification. Son mécanisme le plus utile pour le workflow local est la spécification différentielle : [`ADDED`, `MODIFIED` et `REMOVED`](https://github.com/Fission-AI/OpenSpec/blob/main/docs/overview.md) décrivent seulement ce qui change, ce qui rend le modèle particulièrement adapté au brownfield.

Une adaptation locale devrait ajouter `PRESERVED` afin de rendre visibles les invariants dont la conservation conditionne la réussite. Pour tout plan non trivial :

```text
ADDED      → comportement ou contrat nouveau
MODIFIED   → comportement existant dont la sémantique change
REMOVED    → comportement, compatibilité ou dette supprimée
PRESERVED  → invariant ou interface qui ne doit pas régresser
```

Le dossier de changement d’OpenSpec constitue aussi une unité de revue autonome : il évite de reconstruire l’intention depuis l’historique de conversation. Le workflow local possède déjà décisions et plans versionnés ; il doit reprendre la sémantique des deltas sans créer une arborescence concurrente.

### 4.14 GitHub Spec Kit : orchestration persistante et composition inspectable

[GitHub Spec Kit](https://github.com/github/spec-kit) formalise une chaîne constitution → spécification → clarification → plan → checklist → tâches → analyse → implémentation → convergence. Cette chaîne recouvre en partie le workflow local et ne justifie pas son remplacement.

L’apport différenciant se trouve dans son moteur : les [workflows](https://github.com/github/spec-kit/blob/main/workflows/README.md) sont déclaratifs, persistants et reprenables ; ils peuvent combiner commandes, scripts, conditions, boucles, éventail/réduction et gates humaines. L’état est sauvegardé après chaque étape. Son [modèle de composition](https://github.com/github/spec-kit/blob/main/docs/reference/overview.md) permet en outre d’inspecter quels artefacts sont actifs, quelle couche les fournit et quelle surcharge l’emporte.

**À reprendre à moyen terme :**

- persistance minimale de l’étape, des entrées, des sorties et du verdict ;
- reprise exacte après interruption ;
- déclaration des conditions et gates plutôt que leur dispersion dans des prompts narratifs ;
- inspection de la provenance effective d’une commande ou d’une règle ;
- versionnement et contrôle de conflit pour les ensembles de workflow.

**À ne pas reprendre maintenant :** la totalité de Spec Kit. Son niveau de cérémonie et sa nouvelle arborescence feraient doublon avec les plans, décisions et statuts existants.

### 4.15 Trail of Bits : encoder l’expertise et tester la frontière d’une skill

[Trail of Bits Skills](https://github.com/trailofbits/skills) distingue utilement la commande qui exécute une procédure, la skill qui encode expertise et jugement, et l’agent qui bénéficie d’un rôle ou d’un contexte séparé. Ses [standards d’écriture](https://github.com/trailofbits/skills/blob/main/CLAUDE.md) exigent notamment `When to Use`, `When NOT to Use`, une prescription proportionnée au risque et, pour la sécurité, les rationalisations dangereuses que l’agent doit refuser.

Le dépôt recommande un `SKILL.md` mince, des références chargées progressivement et une profondeur documentaire limitée à un niveau. Il exécute également des contrôles avant publication.

**À reprendre :**

- ajouter aux skills locales des contre-indications explicites, pas seulement des déclencheurs ;
- distinguer connaissance experte, procédure répétable et isolement de contexte ;
- documenter les raccourcis ou rationalisations à refuser pour les gates critiques ;
- limiter les chaînes de références et valider automatiquement leur accessibilité ;
- traiter toute skill tierce comme du code non fiable : revue, version figée, audit des scripts et hooks avant installation.

### 4.16 Piebald et Agent Teams : deux sources de veille, pas deux dépendances

[Claude Code System Prompts](https://github.com/Piebald-AI/claude-code-system-prompts) suit les changements de prompts intégrés à Claude Code, notamment les agents Explore et Plan. Ce dépôt n’est ni une documentation officielle ni une API stable. Il constitue toutefois un bon oracle de compatibilité pour détecter qu’une nouvelle version de Claude Code fournit désormais nativement un comportement que le plugin surcharge.

**À reprendre :** ajouter à `/maj-workflow` une revue périodique des capacités natives pertinentes et de leurs changements. Ne jamais recopier automatiquement ces prompts ; comparer, tester puis supprimer les règles locales devenues redondantes.

La skill [`explore-repo`](https://github.com/jpsweeney97/claude-code-agent-teams/blob/main/skills/explore-repo/SKILL.md) de [Claude Code Agent Teams](https://github.com/jpsweeney97/claude-code-agent-teams) emploie six regards : cartographe, architecte, cartographe d’interfaces, éclaireur d’outillage, analyste du domaine et historien. La taxonomie est utile pour une recherche profonde, mais six agents permanents seraient incompatibles avec l’économie de contexte recherchée localement.

**À reprendre :** ces six angles comme checklist de couverture d’un mode `cartographier-conception`, avec délégation parallèle uniquement pour une migration, un audit de grande ampleur ou une architecture transversale.

## 5. Comparaison fonctionnelle

| Capacité | Workflow local | Sources externes | Verdict |
| --- | --- | --- | --- |
| Gouvernance d’une réflexion | Entrée, sortie, preuve, écrit, reprise à froid | Souvent plus conversationnel | **Local supérieur** |
| Préparation vérifiable avant plan | Implicite dans le cadrage | Gates binaires et preuves dans Ideation | **Externe supérieur** |
| Diversité des mécanismes de raisonnement | Méthode générale | 28 cadres dans `cc-thinking-skills` | **Externe supérieur** |
| Découverte produit | Conséquences observables, options | Six questions gstack, réalité de la demande, wedge | **Externe supérieur** |
| Conception d’un changement architectural | Répartie entre cadrage et plan | Superpowers et gstack couvrent composants, flux, erreurs, tests | **Externe supérieur** |
| Revue d’un système existant | Étalon humain, coûts observables, phase du projet | Souvent checklist d’architecture | **Local supérieur** |
| Localisation de code | Très économe et isolée | Souvent exploration large | **Local supérieur** |
| Compréhension de flux et domaine | Peu formalisée | AB Method et AgentSys | **Externe supérieur** |
| Distinction fait/inférence/inconnue | Non garantie par le format | HumanLayer et `research-brief` | **Externe supérieur** |
| Spécification d’un delta brownfield | Destination et sessions | OpenSpec décrit ajout, modification et suppression | **Externe supérieur** |
| Gates et sources de vérité | Très explicites | Variables selon les projets | **Local supérieur** |
| Évaluation des skills | Tests de hooks/renvois, peu de scénarios comportementaux | Superpowers et thinking-skills publient des evals | **Externe supérieur** |
| Contrat et sécurité de publication des skills | Contrôles partiels | chann/skills et Trail of Bits | **Externe supérieur** |
| Reprise d’une orchestration interrompue | Plans persistants, reprise largement procédurale | Spec Kit persiste l’état de chaque étape | **Externe supérieur** |
| Observabilité | Journal de modèles + incidents | Déclencheurs, coûts, graphes, sandbox de hooks | **Externe supérieur** |

## 6. Architecture cible recommandée

### R1 — Ajouter des gates de préparation et un aiguillage cognitif minimal dans `/cadrer`

Avant de choisir une méthode de raisonnement, produire cinq gates inspirées d’Ideation :

```text
Problème clair          : READY | OPEN — preuve : …
But défini              : READY | OPEN — preuve : …
Réussite vérifiable     : READY | OPEN — preuve : …
Périmètre borné         : READY | OPEN — preuve : …
Cohérence               : READY | OPEN — preuve : …
```

Une gate `OPEN` n’interdit pas toute expérimentation : elle interdit seulement de présenter comme plan d’implémentation certain ce qui relève encore d’un protocole de preuve. Les gates déjà acquises sont conservées à la reprise, sauf nouvelle contradiction documentée.

Ne pas créer 28 skills visibles. Ajouter dans `plugin/skills/cadrer/references/` six fiches courtes, ouvertes uniquement lorsque leur signal est présent :

```text
causalite.md             → méthode scientifique + test discriminant
carte-territoire.md      → écrit/test/métrique contre observation réelle
decision-reversible.md   → réversibilité + coût d’opportunité
premortem.md             → chemins d’échec convertis en gates
contradiction.md         → séparation TRIZ
arret-recherche.md       → seuil assez bon annoncé avant exploration
```

Ajouter à `/cadrer`, après la formulation de la question :

```text
Quel type d’inconnu empêche de conclure ?

- fait ou cause inconnue             → causalite
- modèle contredit par le réel       → carte-territoire
- choix coûteux ou difficile à annuler → decision-reversible + éventuellement premortem
- deux exigences incompatibles       → contradiction
- recherche sans fin naturelle       → arret-recherche
- aucun mécanisme n’améliore clairement la décision → aucun ; continuer directement
```

Contraintes :

- une fiche par défaut, deux au maximum ;
- chaque fiche possède `Quand`, `Quand ne pas`, `Procédure`, `Sortie`, `Falsification`, `Arrêt` ;
- le protocole ne crée pas une nouvelle source de vérité ;
- le résultat final reste une des quatre sorties actuelles de `/cadrer`.

### R2 — Créer `/critique-plan`

Objectif : examiner un plan ou une spécification avant le codage, sans refaire le cadrage ni la découpe.

Déclenchement recommandé :

- nouveau sous-système ;
- modification d’interface consommée par plusieurs composants ;
- migration de données ;
- session `high` ou `xhigh` ;
- risque sécurité, concurrence, intégrité ou performance ;
- demande explicite de l’utilisateur.

Ne pas la lancer pour une correction locale et réversible.

Entrées minimales :

- décision source ;
- `plans/P<n>/index.md` ;
- fichiers `S<k>.md` concernés ;
- paquet d’exploration structuré ;
- décisions d’architecture applicables.

Grille :

1. objectif, non-objectifs et risque de dérive de périmètre ;
2. nécessité réelle et risque de sur-ingénierie ;
3. unités, responsabilités et interfaces ;
4. dépendances déclarées et dépendances cachées ;
5. flux de données de bout en bout ;
6. états, transitions et concurrence ;
7. erreurs, reprise, idempotence et rollback ;
8. sécurité et confidentialité si applicables ;
9. performance et limites si applicables ;
10. critères de réussite, matrice de tests et gates ;
11. rayon d’impact prévu ;
12. hypothèses `confirmée | inférée | inconnue`.

Pour chaque décision structurante, appliquer seulement si nécessaire la fermeture récursive : justification, conséquences, décisions induites, alternatives écartées et preuve attendue. Arrêter lorsque les conséquences restantes sont mécaniques ou déjà couvertes par une décision existante.

Sortie proposée :

```text
Verdict : PASS | REVOIR | ARBITRAGE
Bloquants : N

Pour chaque constat :
- preuve ;
- conséquence observable ;
- correction minimale ;
- emplacement exact dans le plan ;
- confiance : haute | moyenne | faible.
```

Règles :

- `PASS` silencieux ou très court ;
- aucune suggestion sans coût ou risque observable ;
- `REVOIR` lorsque le plan peut être corrigé mécaniquement ;
- `ARBITRAGE` uniquement si deux conceptions légitimes changent le produit ou une décision durable ;
- aucune modification de code ;
- la skill peut proposer des modifications de plan, mais ne décide pas d’étendre l’objectif.

Position dans le flux : appelée par `/nouveau-plan` après `verificateur-plan`, seulement si le déclencheur est vrai, puis approbation/commit du plan.

### R3 — Donner trois modes à `explorateur`

Conserver le nom et le modèle économique. Ajouter au prompt d’appel un champ obligatoire `Mode` :

#### `localiser`

Comportement actuel : `chemin — rôle`, puis réponse brève.

#### `suivre-flux`

Sortie maximale recommandée :

```text
Entrée → <chemin:symbole>
Étapes → <chemin:symbole — transformation>
État lu/écrit → <chemin:symbole>
Sortie → <chemin:symbole>
Erreurs/repli → <chemin:symbole>
Inconnues → <ce qui n’a pas été vérifié>
Conclusion → 3 phrases maximum
```

#### `cartographier-conception`

Sortie maximale recommandée :

```text
Unités et responsabilités
Interfaces et consommateurs
Conventions observées
Décisions applicables
Contradictions ou frontières floues
Inconnues
```

Chaque affirmation non triviale porte une preuve `chemin:symbole` et un niveau `haute | moyenne | faible`. Un niveau faible ne doit jamais être transformé silencieusement en prémisse de plan.

La sortie distingue en outre quatre rubriques : `faits observés`, `inférences`, `inconnues`, `recommandations`. En mode `localiser`, seules les trois premières sont normalement nécessaires. Une recommandation ne doit jamais être mêlée à la cartographie factuelle.

### R4 — Mesurer le rayon d’impact prévu contre le diff réel

Pour les sessions non triviales, enregistrer dans `S<k>.md` la zone prévue, déjà présente sous une forme proche. Lors de `/fin-de-tache`, calculer ou résumer la zone réellement modifiée.

Ajouter au bilan :

```text
Impact prévu : <zones>
Impact réel : <zones>
Écart : conforme | dérivés mécaniques | conception débordée
```

Ne pas dupliquer le statut dans un nouveau fichier. Les écarts répétés peuvent devenir une donnée d’incident ou un signal pour `/revue-de-conception`.

### R5 — Ajouter des évaluations comportementales

Les tests actuels contrôlent surtout les hooks et les renvois. Ajouter un petit corpus de scénarios avant de changer les skills :

1. **Cadrage trivial** : doit choisir aucun protocole.
2. **Bug contredisant la documentation** : doit choisir carte–territoire.
3. **Deux exigences réellement opposées** : doit choisir contradiction.
4. **Choix réversible** : ne doit pas déclencher un pré-mortem lourd.
5. **Nouveau sous-système** : doit demander une critique de plan.
6. **Correction locale** : ne doit pas demander une critique de plan.
7. **Exploration de localisation** : ne doit pas produire de dumps.
8. **Exploration de flux** : doit nommer entrée, état, sortie et inconnues.
9. **Plan contradictoire avec une décision** : doit sortir `ARBITRAGE`.
10. **Plan sain** : doit pouvoir sortir `PASS` sans suggestions décoratives.

Pour chaque scénario : prompt, contexte minimal, comportement attendu, comportements interdits. Conserver un cas témoin sans nouvelle instruction pour vérifier que la règle apporte réellement quelque chose.

### R6 — Observer l’activation avant de l’imposer

Ajouter éventuellement une télémétrie locale, non bloquante et ignorée par Git :

```json
{"date":"…","promptClass":"architecture","suggested":"critique-plan","invoked":true}
```

Mesurer pendant plusieurs usages :

- suggestions pertinentes ;
- skills oubliées ;
- activations inutiles ;
- protocoles toujours escaladés vers un autre.

Ne créer un hook bloquant qu’après plusieurs incidents homogènes et vérifiables.

### R7 — Étendre le contrôle de publication

Étendre `plugin/bin/publier.mjs` ou ajouter un validateur appelé par celui-ci :

- frontmatter valide ;
- références existantes ;
- agents et skills nommés réellement présents ;
- hooks conformes au schéma attendu ;
- aucun outil permis qui rende un interdit structurel incohérent ;
- aucun renvoi local reformulé là où un domicile unique est exigé ;
- fixtures et scénarios comportementaux valides.

Étendre le contrat de chaque skill avec :

- `Quand utiliser` et `Quand ne pas utiliser` ;
- nature dominante `expertise | procédure | isolation de contexte` ;
- rationalisations à refuser pour les opérations sensibles ;
- au moins un scénario positif et un scénario de non-déclenchement ;
- profondeur maximale d’un niveau pour les références ;
- provenance et version des idées ou ressources externes reprises.

Faire d’abord fonctionner ce contrôle en rapport, puis rendre bloquantes uniquement les erreurs certaines.

### R8 — Décrire explicitement le delta de chaque changement non trivial

Ajouter dans la décision ou l’index du plan, sans créer un nouveau domicile :

```text
ADDED      : nouveaux comportements, contrats ou artefacts
MODIFIED   : comportements existants dont la sémantique change
REMOVED    : comportements, compatibilités ou artefacts retirés
PRESERVED  : invariants et interfaces qui doivent rester vrais
```

Chaque tâche du plan doit se rattacher à au moins un delta ou à une preuve nécessaire. La fin de tâche vérifie que le diff réel respecte également `PRESERVED`. Ce mécanisme doit rester facultatif pour une correction triviale dont le delta tient en une phrase.

### R9 — Préparer une reprise d’orchestration fondée sur un état minimal

Ne pas adopter maintenant le moteur de Spec Kit. Définir d’abord un état minimal sérialisable pour chaque exécution :

```text
workflow + version
étape courante
entrées et artefacts sources
sortie vérifiée de l’étape
verdict et gate suivante
tentatives et catégorie d’échec
```

Cet état doit référencer les plans et décisions existants, pas les dupliquer. Tester d’abord la reprise d’une interruption entre deux étapes, puis une branche conditionnelle et enfin une vague parallèle avec réconciliation. La provenance effective des commandes, skills, hooks et surcharges doit être inspectable avant d’ajouter un mécanisme de composition plus riche.

### R10 — Faire de `/maj-workflow` une revue de compatibilité

À chaque mise à jour importante de Claude Code :

1. relire la documentation officielle applicable ;
2. consulter comme signal secondaire les changements observés par Piebald pour Explore, Plan, hooks et compaction ;
3. comparer les capacités natives aux règles locales ;
4. exécuter les scénarios comportementaux ;
5. supprimer ou simplifier les surcharges devenues redondantes ;
6. ne jamais importer automatiquement un prompt extrait.

Pour les skills tierces, ajouter une revue de confiance avant installation : version figée, lecture du `SKILL.md`, des références, scripts et hooks, permissions nécessaires, provenance et licence.

## 7. Ordre de mise en œuvre conseillé

Utiliser le prochain numéro de plan libre après P4. Ne pas modifier P4 sans vérifier son état final.

### Phase A — Baseline et contrat

- figer les scénarios comportementaux actuels ;
- documenter les différences entre cadrage, critique de plan et revue a posteriori ;
- définir les cinq gates binaires de préparation et la forme de leur preuve ;
- définir le format différentiel `ADDED | MODIFIED | REMOVED | PRESERVED` ;
- préciser le contrat des trois modes d’exploration ;
- aucune modification de comportement tant que les cas de non-déclenchement ne sont pas écrits.

**Gate :** les scénarios distinguent sans ambiguïté `/cadrer`, `/critique-plan`, `verificateur-plan` et `/revue-de-conception`.

### Phase B — Préparation et micro-protocoles de réflexion

- intégrer les cinq gates à `/cadrer` sans créer une nouvelle source de vérité ;
- créer les six références ;
- ajouter l’aiguillage minimal à `/cadrer` ;
- vérifier que `NONE` reste le résultat normal pour les sujets simples ;
- vérifier qu’une gate `OPEN` conduit soit à une question ciblée, soit à un protocole de preuve ;
- contrôler le coût de contexte des descriptions.

**Gate :** chaque état `READY` cite une preuve ; un protocole est choisi pour son mécanisme, jamais parce que son nom paraît pertinent.

### Phase C — Exploration structurée

- modifier le contrat de `explorateur` ;
- mettre à jour les appels existants avec `Mode: localiser` ;
- utiliser `suivre-flux` dans `/nouveau-plan` ;
- réserver `cartographier-conception` à `/critique-plan` et `/revue-de-conception` ;
- séparer faits, inférences, inconnues et recommandations ;
- tester la compaction entre exploration et plan.

**Gate :** aucun appel ne dépend d’un mode implicite ; aucune sortie brute longue n’entre dans le contexte principal.

### Phase D — Critique de plan

- créer la skill et son format de sortie ;
- définir ses déclencheurs objectifs ;
- l’intégrer après `verificateur-plan` ;
- couvrir dérive de périmètre, sur-ingénierie, dépendances cachées et critères de réussite ;
- fermer récursivement les conséquences des seules décisions structurantes ;
- tester `PASS`, `REVOIR`, `ARBITRAGE` ;
- ne pas la rendre universelle.

**Gate :** un petit changement ne paie aucune cérémonie supplémentaire ; un changement architectural reçoit une revue des flux, états, échecs et tests.

### Phase E — Delta, convergence et mesure

- intégrer `ADDED | MODIFIED | REMOVED | PRESERVED` aux plans non triviaux ;
- rattacher chaque session à un delta ou à une preuve ;
- vérifier les invariants `PRESERVED` à la fin ;
- comparer rayon d’impact prévu et réel.

**Gate :** le plan et le diff peuvent être comparés sans reconstruire l’intention depuis la conversation.

### Phase F — Qualité et observabilité

- télémétrie d’activation non bloquante ;
- lint de configuration et contrat des skills ;
- bac à sable de hooks à base de fixtures ;
- revue de confiance des composants tiers ;
- revue de compatibilité dans `/maj-workflow` ;
- éventuelle réconciliation de vagues parallèles.

**Gate :** aucune nouvelle donnée n’est une seconde source de vérité ; toute donnée temporaire est ignorée ou explicitement promue.

### Phase G — Reprise d’orchestration, seulement après mesure du besoin

- prototyper l’état minimal d’une exécution ;
- reprendre après interruption entre deux étapes ;
- tester ensuite une branche conditionnelle ;
- tester enfin une vague parallèle avec réconciliation ;
- rendre inspectable la provenance des artefacts actifs.

**Gate :** la reprise utilise les plans et décisions existants par référence et ne crée aucun registre concurrent.

## 8. Critères d’acceptation globaux

La prochaine amélioration est réussie si :

1. `/cadrer` évalue séparément problème, but, réussite, périmètre et cohérence, avec une preuve pour chaque gate acquise.
2. `/cadrer` peut explicitement choisir `aucun` ou un mécanisme adapté sans exposer une forêt de skills à chaque session.
3. Une décision de réflexion conserve les quatre sorties actuelles et leur persistance.
4. Un plan architectural est relu sur ses flux, états, échecs, tests, dépendances et hypothèses avant exécution.
5. Une correction locale ne déclenche pas cette revue lourde.
6. `explorateur` distingue localisation, flux et cartographie de conception.
7. Toute conclusion d’exploration importante cite une preuve et sa confiance, et distingue fait, inférence et inconnue.
8. Un changement brownfield non trivial identifie explicitement ce qu’il ajoute, modifie, retire et préserve.
9. Chaque critère d’acceptation indique s’il relève d’une commande vérifiable ou d’un jugement humain.
10. Les nouvelles règles possèdent des tests de déclenchement et de non-déclenchement.
11. Chaque skill déclare aussi quand elle ne doit pas être employée.
12. Les tests existants de hooks et de renvois restent verts.
13. Aucun statut, décision, incident ou verdict n’acquiert un second domicile.
14. Une éventuelle reprise d’orchestration référence les artefacts existants et restaure l’étape sans ambiguïté.
15. La documentation principale ne grossit pas inutilement : les méthodes détaillées restent en références chargées à la demande.

## 9. Idées explicitement rejetées

### Installer toutes les thinking skills

Rejeté : surface d’activation trop grande, descriptions payées à chaque session, frontières floues entre méthodes voisines. Reprendre quelques protocoles comme annexes de `/cadrer`.

### Remplacer le workflow par gstack ou AB Method

Rejeté : perte des invariants locaux, nouveau système de mémoire et de statuts, couplage à des scripts et conventions externes.

### Transformer `/revue-de-conception` en revue pré-implémentation

Rejeté : les deux fonctions n’ont ni le même étalon ni les mêmes sorties. Conserver la revue a posteriori et créer une brique distincte.

### Rendre `/critique-plan` obligatoire pour tout changement

Rejeté : coût disproportionné et contradiction avec la hiérarchie locale de complexité.

### Faire de `explorateur` un agent omniscient

Rejeté : son utilité première est l’isolation du bruit. Les nouveaux modes doivent rester bornés et structurés.

### Bloquer l’édition si une skill n’a pas été activée

Rejeté tant qu’aucune donnée locale ne montre des omissions répétées. Observer d’abord.

### Ajouter une mémoire parallèle

Rejeté : décisions, état, backlog et plans ont déjà des domiciles uniques. Une mémoire supplémentaire provoquerait la dérive que le workflow cherche précisément à éviter.

### Adopter intégralement OpenSpec ou Spec Kit

Rejeté : leurs concepts de delta, convergence, reprise et composition sont utiles, mais leurs arborescences et cycles complets doubleraient les décisions et plans locaux. Reprendre les primitives, pas le framework.

### Lancer six explorateurs pour chaque demande

Rejeté : la taxonomie d’Agent Teams est une checklist de couverture, pas un minimum opérationnel. La parallélisation profonde doit rester réservée aux migrations, architectures transversales et recherches dont les axes sont réellement indépendants.

### Copier les prompts internes suivis par Piebald

Rejeté : ils ne constituent pas une API stable et leur provenance n’est pas officielle. Les utiliser uniquement pour détecter des évolutions à confirmer par documentation et tests.

### Installer directement une collection de skills tierce

Rejeté sans audit : une skill peut contenir instructions, scripts et hooks exécutés avec les permissions de Claude Code. Examiner le contenu, figer la version, vérifier la licence et tester dans un contexte isolé avant toute adoption.

## 10. Mandat proposé pour la prochaine session Claude Code

> Améliore le workflow sans le remplacer. Commence par relire `plugin/WORKFLOW.md`, `plans/P4/index.md`, les décisions récentes et l’état Git. Préserve les domiciles uniques, les quatre sorties de `/cadrer`, la séparation entre gate et question humaine, et l’isolation des traces brutes. Établis d’abord une baseline comportementale. Puis propose un plan par phases pour : (1) cinq gates binaires de préparation dans `/cadrer`, chacune justifiée par une preuve ; (2) six micro-protocoles de raisonnement chargés à la demande, avec `NONE` comme sortie normale ; (3) trois modes explicites de l’agent `explorateur`, séparant faits, inférences, inconnues et recommandations ; (4) une skill `/critique-plan` conditionnelle, couvrant périmètre, sur-ingénierie, dépendances cachées, critères de réussite et conséquences des décisions, distincte de `verificateur-plan` et `/revue-de-conception` ; (5) un format brownfield `ADDED | MODIFIED | REMOVED | PRESERVED` dans les artefacts existants ; (6) la mesure de l’impact prévu contre le diff réel ; (7) le contrat, le lint, la sécurité et l’observabilité non bloquante des skills ; (8) seulement après validation du besoin, un prototype de reprise d’orchestration fondé sur un état minimal. Fais de `/maj-workflow` une revue de compatibilité avec les capacités natives, sans importer de prompts extraits. N’importe pas intégralement un framework externe. Chaque proposition doit citer le problème local qu’elle résout, son coût de contexte, ses critères de déclenchement et de non-déclenchement, ses tests et son domicile documentaire.

## 11. Sources

### Catalogue

- hesreallyhim, [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code).

### Réflexion et conception

- obra, [Superpowers — brainstorming](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md).
- obra, [Superpowers — writing plans](https://github.com/obra/superpowers/blob/main/skills/writing-plans/SKILL.md).
- tjboudreaux, [Claude Code Thinking Skills](https://github.com/tjboudreaux/cc-thinking-skills).
- tjboudreaux, [Thinking Model Router](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-model-router/SKILL.md).
- tjboudreaux, [Map–Territory](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-map-territory/SKILL.md).
- tjboudreaux, [Pre-mortem](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-pre-mortem/SKILL.md).
- tjboudreaux, [Bounded Rationality](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-bounded-rationality/SKILL.md).
- tjboudreaux, [TRIZ](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-triz/SKILL.md).
- tjboudreaux, [Kepner–Tregoe](https://github.com/tjboudreaux/cc-thinking-skills/blob/main/skills/thinking-kepner-tregoe/SKILL.md).
- garrytan, [gstack](https://github.com/garrytan/gstack).
- garrytan, [gstack — office-hours](https://github.com/garrytan/gstack/blob/main/office-hours/SKILL.md).
- garrytan, [gstack — plan-ceo-review](https://github.com/garrytan/gstack/blob/main/plan-ceo-review/SKILL.md).
- garrytan, [gstack — plan-eng-review](https://github.com/garrytan/gstack/blob/main/plan-eng-review/SKILL.md).
- ayoubben18, [AB Method](https://github.com/ayoubben18/ab-method).
- nicknisi, [Ideation](https://github.com/nicknisi/ideation).
- chann, [Skills](https://github.com/chann/skills).
- HumanLayer, [Advanced Context Engineering for Coding Agents](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md).
- HumanLayer, [Research Codebase command](https://github.com/humanlayer/humanlayer/blob/main/.claude/commands/research_codebase.md).
- jpsweeney97, [Claude Code Agent Teams](https://github.com/jpsweeney97/claude-code-agent-teams).
- jpsweeney97, [Explore Repo skill](https://github.com/jpsweeney97/claude-code-agent-teams/blob/main/skills/explore-repo/SKILL.md).

### Spécification et évolution brownfield

- Fission-AI, [OpenSpec](https://github.com/Fission-AI/OpenSpec).
- Fission-AI, [OpenSpec — Core Concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/overview.md).
- GitHub, [Spec Kit](https://github.com/github/spec-kit).
- GitHub, [Spec Kit — Agentic SDD](https://github.com/github/spec-kit/blob/main/docs/reference/agentic-sdd.md).
- GitHub, [Spec Kit — Workflows](https://github.com/github/spec-kit/blob/main/workflows/README.md).
- GitHub, [Spec Kit — Reference Overview](https://github.com/github/spec-kit/blob/main/docs/reference/overview.md).

### Orchestration, contrôle et observabilité

- agent-sh, [AgentSys](https://github.com/agent-sh/agentsys).
- WenyuChiou, [Agent Collab Skills](https://github.com/WenyuChiou/agent-collab-skills).
- diet103, [Claude Code Infrastructure Showcase](https://github.com/diet103/claude-code-infrastructure-showcase).
- lookfree, [CC Harness](https://github.com/lookfree/cc-harness).
- agent-sh, [agnix](https://github.com/agent-sh/agnix).
- zircote, [Dynamic Workflow Patterns](https://github.com/zircote/workflows-plugin).
- Trail of Bits, [Skills](https://github.com/trailofbits/skills).
- Trail of Bits, [Skill authoring standards](https://github.com/trailofbits/skills/blob/main/CLAUDE.md).
- Piebald AI, [Claude Code System Prompts](https://github.com/Piebald-AI/claude-code-system-prompts).

### Documentation officielle Claude Code

- Anthropic, [Hooks reference](https://code.claude.com/docs/en/hooks).
- Anthropic, [Subagents](https://code.claude.com/docs/en/subagents).
- Anthropic, [Agent Skills](https://code.claude.com/docs/en/skills).
- Anthropic, [Best practices](https://code.claude.com/docs/en/best-practices).
