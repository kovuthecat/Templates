# 2026-09-13 — Analyse : coût du contexte, cache, et les deux leviers neufs de Claude Code

- Statut : **à arbitrer** — aucune mesure n'est décidée ici ; ce fichier est une entrée de
  `/analyser-incidents` (Étape 2b) et de `/cadrer`, jamais une décision.
- Workflow analysé : plugin **v0.30.0** (`plugin/.claude-plugin/plugin.json`).
- Produit par : session Claude Code Desktop, à la demande du mainteneur, après lecture de la
  documentation Anthropic sur le prompt caching et l'optimisation de coût, puis confrontation à
  `WORKFLOW.md` §3, §3b, §5b, §7 et à `hooks/hooks.json`.
- Portée : ce fichier ne traite que du **coût du contexte**. Il prolonge
  `2026-09-12-conseils-anthropic-contexte-skills-verification.md` (mesures `A*`/`B*`/`C*`/`J0`)
  sans le recouvrir : là où ce dernier parle de *ce qu'on écrit aux modèles*, celui-ci parle de
  *ce qu'on repaie à chaque tour*. Identifiants en `K*` pour ne pas collisionner.
- Consommation : identique au fichier du 2026-09-12 (voir sa section « Comment ce fichier se
  consomme »). Chaque mesure porte un `Incidents liés :` vide.

## Sources

| Source | Ce qu'elle apporte |
| --- | --- |
| [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) | invariant de préfixe ; hiérarchie d'invalidation à trois étages ; minimums cacheables par modèle ; multiplicateurs écriture/lecture ; fenêtre de lookback de 20 positions ; timing des requêtes concurrentes ; messages `role: "system"` en cours de conversation |
| [Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) | `clear_tool_uses` / `clear_thinking` ; distinction nettoyage vs compaction |
| Guide plateforme *Optimizing for cost and intelligence* (via la référence bundlée du skill `claude-api`) | ordre des leviers (gains gratuits avant arbitrages) ; courbes d'effort mesurées par charge de travail ; rejeu des échecs ; coût des prompts datés |
| [Cookbook *Cost optimization*](https://platform.claude.com/cookbook/cost-optimization-cost-optimization) | exemple de bout en bout ; la plupart des leviers ne s'appliquent pas à une charge donnée |
| [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) · [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | récupération juste-à-temps, prise de notes structurée, sous-agents |
| Notes de version Claude Code — hooks `PreModelSwitch`/`PostModelSwitch` (2.1.251), `/effort` par modèle et `CLAUDE_CODE_SUBAGENT_MODEL` (2.1.260) | relayées par le mainteneur, recoupées sur `code.claude.com/docs/en/hooks.md` par l'agent `claude-code-guide` |

**Réserves.** Les chiffres de coût ci-dessous viennent de runs publiés par Anthropic : ils sont
directionnels, pas garantis. Le contrat des hooks de modèle a été vérifié le 2026-09-13
(§ « Vérifications ») — une affirmation de la première rédaction s'y est révélée fausse, et une
question interne à K3 reste ouverte. La leçon v0.30.0 (« hooks testés avant publication »)
s'applique intégralement à K2 : rien de ce fichier ne dispense du test réel.

## Ce que §3b dit déjà — et ce qui a bougé

La §3b « Coût et cache » existe et est juste sur l'essentiel. Trois lignes ont vieilli :

| §3b dit | État réel | Conséquence |
| --- | --- | --- |
| « Invalident le préfixe : … un changement d'effort » | **Vérifié le 2026-09-13 : reste vrai pour le workflow.** L'exemption de Claude Code 2.1.260 ne couvre que **Fable 5.1** ; Opus 5 n'en bénéficie pas. Côté API, la beta `mid-conversation-output-config-2026-07-01` couvre Fable 5.1, Mythos 5.1 **et Opus 5** — écart API / Claude Code sans effet ici | Aucune correction. La règle la plus répétée du workflow garde tout son mordant sur le modèle principal. Ligne à réexaminer si Claude Code aligne Opus 5 sur l'API |
| « Un hit de cache coûte 0,1× le prix d'entrée » | Exact, sauf Fable 5.1 : **0,025×** (0,25 $/MTok) | Sans objet ici — Fable est hors workflow depuis v0.29.0 |
| « Une vague parallèle lancée d'un bloc … est la seule configuration où des sessions partagent un préfixe » | Le partage est réel, mais **pas si elles démarrent ensemble** : une entrée de cache n'est lisible qu'après le début du streaming de la première réponse. N requêtes concurrentes à préfixe identique paient toutes plein tarif | Voir K4 — le « d'un bloc » annule le bénéfice qu'il cherche |

Trois faits absents de §3b et qui manquent :

- **Hiérarchie d'invalidation à trois étages.** Changer le `system` n'invalide **pas** le cache des
  `tools` ; changer le contenu des messages n'invalide ni l'un ni l'autre. Seuls un changement
  d'outils et un changement de **modèle** forcent une reconstruction complète. §3b traite « le
  préfixe » comme un bloc unique et surestime donc le coût de certaines actions.
- **Minimum cacheable, non monotone** : 512 tokens sur Opus 5, 1024 sur Sonnet 5, **4096 sur
  Haiku 4.5**. En dessous, rien n'est mis en cache, sans erreur ni signal. Voir K7.
- **Fenêtre de lookback de 20 positions** : un run d'appels d'outils *parallèles* compte pour une
  seule position, un run séquentiel long peut pousser l'entrée précédente hors fenêtre.

## Mesures

### K1 — Réécrire §3b sur la hiérarchie d'invalidation et le timing [coût] [cache]

- Classe A · confiance **haute** · coût : une demi-heure.
- Statut : **faite v0.31.0**.
- **Ce que ça change** : §3b passe de « ces actions invalident le préfixe » à la table à trois
  étages (tools / system / messages), ajoute les minimums par modèle, la fenêtre de 20 positions et
  le timing des requêtes concurrentes. Les trois lignes vieillies du tableau ci-dessus sont
  corrigées.
- **Ce qu'on verra** : moins de prudence inutile (un changement de `tool_choice` ou de contenu de
  message ne coûte rien), plus de prudence là où il faut (modèle, outils).
- **Risque** : §3b grossit. Parade : la table remplace la liste en prose, elle ne s'y ajoute pas.
- Fichiers : `plugin/WORKFLOW.md` §3b.
- Incidents liés :

### K2 — `PreModelSwitch` : rendre mécanique la seule grande règle de §3b qui ne l'est pas [coût] [cache]

- Classe A · confiance **moyenne-haute** (contrat lu par sous-agent, pas de visu) · coût : une
  session Sonnet + un test réel avant publication.
- Statut : **faite v0.31.0** — réduite : journal `PostModelSwitch` seul, le blocage `PreModelSwitch` est écarté (voir « Écartés »).
- **Le constat.** §7 liste quatre hooks : git, contexte, plafonds, format. Aucun ne couvre le
  modèle. Or §3b énonce qu'un `/model` en cours de session repaie **tout** le préfixe — et c'est la
  seule action du workflow dont le coût est à la fois élevé, invisible et à un caractère de
  distance. « Une instruction ne contraint rien ; un hook si » (§7) : la règle la plus chère du
  workflow est restée une instruction.
- **Ce que ça change.** Un hook `premodelswitch-cout.mjs` qui reçoit `{session_id, prompt_id,
  transcript_path, cwd, permission_mode, from_model, to_model}` — contrat vérifié le 2026-09-13,
  `transcript_path` **est** fourni — et :
  1. **refuse une fois, avec la raison.** `permissionDecision` n'accepte que `"allow"` et
     `"deny"` : **il n'y a pas de `"ask"`**. Le geste réel est donc un `deny` portant un
     `permissionDecisionReason` qui chiffre le coût (préfixe entier repayé, cache détruit parce
     qu'il est **scopé par modèle**, sans échappatoire) et propose la passation (K10) ;
     l'utilisateur relance `/model` s'il maintient. Un seul refus par session, sur le modèle du
     hook `Stop` qui « ne bloque qu'une fois par session » ;
  2. **laisse passer sans rien dire** quand le switch est légitime : `permission_mode` de plan,
     ou pas de `plans/P*/S*.md` en cours — une session de cadrage libre n'a pas à être freinée ;
  3. **journalise** le couple `from_model → to_model` avec l'horodatage. C'est le point aveugle
     actuel : §2 autorise explicitement l'escalade vers Opus (« si la cause d'un bug n'est pas
     localisée »), §3 distingue monter l'effort de monter le modèle — et rien ne trace jamais
     qu'une escalade a eu lieu. Ce journal est exactement le signal dont `/analyser-incidents` a
     besoin pour savoir si la grille modèle de §2 est juste : un modèle systématiquement escaladé
     est une ligne de grille fausse, pas un incident.
- **Ce qu'on verra** : plus de `/model` accidentel en cours de session de plan ; un fichier de
  journal exploitable par `/analyser-incidents` au bout de quelques semaines.
- **Risque** : un hook trop bavard qui freine une escalade légitime. Parade : le point 2 ci-dessus,
  et `ask` plutôt que `deny` — on informe, on ne bloque pas. Second risque : le hook se déclenche
  aussi sur les skills à `model:` en frontmatter et sur les sous-agents, où le switch est voulu et
  fréquent. Parade : `matcher` sur les modèles, ou sortie silencieuse quand `from_model` est celui
  de la conversation et `to_model` celui d'un agent connu.
- **`PostModelSwitch` ne peut pas réinjecter le contexte — vérifié.** Il reçoit les mêmes champs,
  ne peut pas bloquer (le switch a eu lieu), et n'expose aucun champ d'injection : seulement
  `systemMessage`, qui est un message affiché à l'**utilisateur** dans le terminal, pas du contexte
  donné au modèle. L'idée « le cache est détruit de toute façon, autant réinjecter le bandeau du
  `S<k>.md` » tombe définitivement. Ce que `PostModelSwitch` sait faire : journaliser, et afficher.
  Le point 3 ci-dessus lui revient donc plutôt qu'à `PreModelSwitch`, qui doit rester rapide.
- Fichiers : nouveau `plugin/hooks/premodelswitch-cout.mjs`, `plugin/hooks/hooks.json`,
  `plugin/templates/project-settings.json` (câblage vendoré), `plugin/WORKFLOW.md` §7 (table),
  `plugin/CLAUDE-BASE.md` (« quatre hooks » → cinq).
- Incidents liés :

### K3 — `modelSettings` : l'effort suit le modèle [coût]

- Classe B · confiance **moyenne** (dépend d'une précédence à vérifier) · coût : un cadrage court.
- Statut : **faite v0.31.0**.
- **Le constat.** §3 impose un rituel manuel répété à chaque lancement : « À régler AVANT de
  lancer — S<k> : modèle <M> · effort <E> », parce que « la pastille hérite des réglages
  courants ». Depuis 2.1.260, `/effort` mémorise le niveau **par modèle** sous `modelSettings` dans
  les settings utilisateur. Choisir le modèle porte alors l'effort avec lui : la moitié du rituel
  disparaît, et avec elle la moitié des occasions de se tromper.
- **La tension à trancher, et c'est pour ça que c'est classe B.** §3 sépare délibérément les deux
  axes — « le modèle, c'est la capacité ; l'effort, c'est la quantité de travail ; les deux se
  diagnostiquent séparément ». Un effort par modèle **fusionne partiellement les deux axes**.
  Proposition : l'adopter comme **plancher par défaut** aligné sur la grille §2/§3 telle qu'elle
  est déjà écrite (Opus → `high`, Sonnet → `medium`, Haiku → `low`), en gardant `/effort` en
  session comme dérogation explicite consignée dans le bandeau du `S<k>.md`. Le défaut devient
  cohérent tout seul, la dérogation reste un geste conscient.
- **Le point bloquant, levé le 2026-09-13 — mais il déplace la mesure.** La précédence entre
  fichiers est documentée : entreprise > `--settings` > `.claude/settings.local.json` >
  `.claude/settings.json` **projet** > `~/.claude/settings.json` utilisateur. Un `modelSettings`
  posé dans les settings **utilisateur** est donc bien exposé à l'`effortLevel` racine du projet.
  Conséquence : **ne pas compter sur les settings utilisateur — vendorer `modelSettings` dans
  `project-settings.json`**, au même niveau que l'`effortLevel` qui y est déjà. `modelSettings`
  n'est marqué ni « user only » ni « managed only » : il vaut au niveau projet.
- **Tranché le 2026-09-13 par lecture du binaire `claude.exe` 2.1.266** (la doc ne le dit pas ;
  le résolveur, lui, est en clair dans le bundle) : `modelSettings.<modèle>.effortLevel` **gagne
  contre la clé racine `effortLevel`**. Le résolveur est
  `Object.hasOwn(e.byModel, modèle) ? e.byModel[modèle] : e.default`, où `default` est calculé
  depuis la racine et `byModel` depuis les `modelSettings`. La table par modèle est consultée
  d'abord ; la racine n'est qu'un repli.
- **Et ça traverse les fichiers — c'est le vrai piège.** Les deux clés ne sont pas résolues au même
  endroit : la précédence entre fichiers s'applique **à l'intérieur** de chaque clé, mais entre les
  deux clés c'est `byModel` qui l'emporte, d'où qu'il vienne. Conséquence : **un `/effort` lancé une
  fois par le mainteneur écrit `modelSettings` dans ses settings utilisateur, et ce réglage bat
  ensuite le `"effortLevel": "medium"` du gabarit projet dans les douze projets**, silencieusement
  et définitivement. Le `effortLevel` racine du gabarit ne protège de rien.
- **Ce que ça fait à la mesure.** Vendorer `modelSettings` dans `project-settings.json` cesse
  d'être une commodité et devient une **protection** : `modelSettings` suit, lui, la précédence
  normale (local > projet > utilisateur), donc une table par modèle posée au niveau projet reprend
  la main sur un `/effort` utilisateur égaré. Le `effortLevel` racine peut rester comme repli pour
  les modèles non listés.
- **Deux faits confirmés au passage** : `/effort` en session bat tout le reste (`sessionEffort` de
  type `level` court-circuite la table) ; et l'énumération persistée est
  `["low","medium","high","xhigh"]` — **`max` n'y est pas**, ce qui confirme la ligne de §3
  (« `max` : non réglable via `effortLevel` du projet, seulement via `/effort max` en session »).
- **Réserve de méthode** : lu dans un binaire minifié, pas dans la doc. Le résolveur et
  l'énumération sont sans ambiguïté ; l'ordre des sources (`["userSettings","projectSettings",
  "localSettings"]`, parcouru à l'envers et arrêté au premier trouvé) est une inférence, cohérente
  avec la précédence documentée. À re-tester si un comportement observé la contredit.
- **État constaté** : le `~/.claude/settings.json` du mainteneur ne contient aujourd'hui **ni**
  `effortLevel` **ni** `modelSettings` — `/effort` n'a jamais rien persisté. Rien n'entre donc en
  collision pour l'instant, et le `"effortLevel": "medium"` du gabarit projet est le seul réglage
  en vigueur. La mesure part d'une page blanche.
- **Ce qu'on verra** : bandeaux de `S<k>.md` où seul le modèle est à régler ; moins de sessions
  lancées à l'effort ambiant du coup d'avant.
- Fichiers : `plugin/WORKFLOW.md` §3 (« Rappel systématique »), `plugin/templates/project-settings.json`,
  `plugin/skills/nouveau-plan/SKILL.md` (gabarit de bandeau).
- Incidents liés :

### K4 — Décaler le premier lancement d'une vague parallèle [coût] [cache]

- Classe A · confiance **moyenne** (le fait est API, l'application à des sessions Claude Code est
  déduite) · coût : deux lignes dans `/orchestrer-plan` + une ligne §3b.
- Statut : **faite v0.31.0**.
- **Le constat.** Une entrée de cache ne devient lisible qu'**après le début du streaming de la
  première réponse**. N sessions démarrées ensemble sur un préfixe identique écrivent N entrées
  distinctes et n'en lisent aucune. §3b recommande aujourd'hui de lancer la vague « d'un bloc » —
  ce qui garantit précisément le pire cas.
- **Ce que ça change** : lancer la première session, attendre qu'elle produise ses premiers tokens,
  puis lancer les suivantes. Sur une vague de 4, le préfixe partagé passe de 4 écritures à 1,25×
  à une écriture + 3 lectures à 0,1× — soit environ 5,0× → 1,55× le prix d'entrée sur cette part.
- **Ce qu'on verra** : rien visuellement ; c'est mesurable seulement au coût. Test honnête : lancer
  une vague des deux façons et comparer. Tant que ce n'est pas mesuré, la mesure reste à confiance
  moyenne.
- **Risque** : aucun sur le résultat, seulement quelques secondes de latence au lancement. Le
  verrou `.claude/wave.lock` et l'interdiction de committer entre deux lancements (§4b) sont
  inchangés — décaler n'est pas committer.
- Fichiers : `plugin/WORKFLOW.md` §3b et §5b, `plugin/skills/orchestrer-plan/SKILL.md`.
- Incidents liés :

### K5 — La reprise d'échec devient un levier de coût [coût] [jugement]

- Classe B · confiance **moyenne-haute** · coût : un cadrage.
- Statut : **reportée** — attend une éval (mesure B5 du 2026-09-12).
- **Le constat.** Anthropic a mesuré, sur du code : tout lancer à l'effort `low` puis **rejouer les
  seuls échecs** au défaut donne ~93 % de réussite à ~0,70 $/tâche, contre 91,7 % à 1,39 $ en
  lançant tout au défaut. Même taux de réussite, moitié du coût, **échecs bon marché compris**.
  Cela suppose un signal d'échec fiable — le workflow en a un, et il est déjà outillé : N0
  (`build` + `typecheck` + tests) est une gate binaire, et `/reprendre-echec` + « la nature de
  l'échec décide de la reprise » (v0.27.0) est exactement la machinerie de rejeu.
- **Ce que ça change** : les tâches d'exécution cadrées (celles que §2 envoie déjà à Sonnet/Haiku)
  partent un cran d'effort en dessous du défaut ; un `FAIL` N0 dont la nature est « reprise
  possible » rejoue **au défaut**, pas à l'identique. Le mécanisme de reprise cesse d'être
  seulement un filet et devient un poste d'économie.
- **Ce qu'on verra** : plus de premiers passages rouges, un coût total par tâche plus bas. C'est
  contre-intuitif et il faut l'écrire tel quel dans §3, sinon le premier rouge sera lu comme une
  régression.
- **Risque** : le double temps d'horloge sur les tâches qui échouent, et le coût du rejeu si le
  taux d'échec réel dépasse largement celui des runs publiés. Parade : le journal de K2 et les
  incidents donnent le taux réel — décider après l'avoir mesuré sur un vrai plan, pas avant.
- **Ce qui manque pour trancher** : une éval (mesure B5 du fichier du 2026-09-12). Sans elle, on
  échange de la qualité contre du coût à l'aveugle — ce que l'ordre des leviers d'Anthropic
  interdit explicitement.
- Fichiers : `plugin/WORKFLOW.md` §3 et §9, `plugin/skills/reprendre-echec/SKILL.md`.
- Incidents liés : groupe « verdict perdu / jamais rendu » (2 projets, 4 incidents) — MYO
  `2026-09-11-verdict-perdu-en-route-s5.md`, `2026-09-13-verdict-perdu-verificateur-n0-en-fond.md`,
  `2026-09-13-session-rend-la-main-en-attendant-son-n0.md` ; Chords
  `2026-09-10-session-sans-verdict-sous-agent-interne.md`. Ce groupe confirme par l'incident la
  moitié « la nature décide du modèle de reprise » de cette mesure, dans le sens inverse de celui
  qu'elle vise : ici c'est la **montée** d'un cran qui a été payée pour rien (deux reprises Opus sur
  du travail déjà vert), faute d'une case pour « frontière de tour ». Case ajoutée en v0.34.0 ; la
  moitié « partir un cran en dessous », elle, attend toujours l'éval B5.

### K6 — Les prompts datés coûtent 36 % de plus, mesuré [coût] [jugement]

- Classe A · confiance **haute** · coût : nul en soi — c'est un chiffre à verser à une mesure
  existante.
- Statut : **faite v0.31.0** — chiffre reporté dans le fichier du 2026-09-12.
- **Le constat.** Sur une évaluation de support, des prompts écrits pour Opus 4.8 et exécutés sur
  Opus 5 ont coûté **+36 % par ticket sans aucun gain de précision** ; une fois audités, les mêmes
  prompts coûtaient 14 % de moins **et** résolvaient 97 % des tickets contre 92 %. Sur la migration
  Sonnet 4.6 → Sonnet 5, l'audit a retiré 14 % à précision constante.
- **Ce que ça change** : les mesures `A2` (dédupliquer CLAUDE-BASE), `J0` (scission socle /
  exécutant) et le fil directeur « moins contraindre les modèles forts » du fichier du 2026-09-12
  n'étaient adossées qu'à du jugement. Elles ont maintenant un chiffre. Cela les fait monter dans
  la table de priorité de ce fichier-là, sans rien changer à leur contenu.
- **Ce qu'on verra** : rien de neuf — c'est une révision de priorité, pas une mesure.
- Fichiers : aucun ici ; reporter la ligne dans `2026-09-12-…md` § « Priorité et confiance ».
- Incidents liés :

### K7 — Plancher de cache sur Haiku : la réduction du socle a une falaise [cache]

- Classe C · confiance haute sur le fait, **faible sur l'ampleur** · coût : un paragraphe.
- Statut : **faite v0.31.0**.
- **Le constat.** Le minimum cacheable est de **4096 tokens sur Haiku 4.5** — contre 512 sur
  Opus 5. En dessous, rien n'est mis en cache, silencieusement. Quatre des cinq agents du plugin
  tournent sur Haiku, avec 10 à 15 tours : leur préfixe est réémis à chaque tour.
- **L'interaction à noter.** Raccourcir le socle commun (`A2`, `J0`) est bon pour toutes les
  sessions — mais peut faire passer un sous-agent Haiku **sous** le plancher, transformant une
  lecture à 0,1× en réémission à 1,0× sur chacun de ses tours.
- **Pourquoi c'est quand même classe C.** L'effet absolu est borné par la taille du préfixe
  lui-même : en dessous de 4096 tokens, le pire cas coûte 4096 tokens × 15 tours sur un agent Haiku.
  C'est petit. Ne pas laisser cet argument freiner `A2`/`J0`, qui portent sur toutes les sessions,
  Opus comprises, où le plancher est de 512.
- **Ce que ça change** : une ligne de §3b qui dit le plancher et son sens — et qui interdit d'en
  faire un argument contre le raccourcissement du socle.
- Fichiers : `plugin/WORKFLOW.md` §3b.
- Incidents liés :

### K8 — `CLAUDE_CODE_SUBAGENT_MODEL` comme filet [coût]

- Classe C · confiance haute · coût : une ligne de settings.
- Statut : **faite v0.31.0**.
- **Le constat.** Les cinq agents du plugin déclarent déjà `model:` en frontmatter (haiku ×4,
  sonnet ×1) : la variable n'a **aucun effet** sur eux, et c'est très bien ainsi. Elle couvre deux
  autres cas : les agents intégrés (`Explore`, `general-purpose`, `Plan`) lancés au fil de l'eau,
  qui héritent sinon du modèle de la conversation — donc d'Opus dans une session de cadrage — et
  tout futur agent qui oublierait sa ligne `model:`.
- **Ce que ça change** : `"env": {"CLAUDE_CODE_SUBAGENT_MODEL": "sonnet"}` dans
  `project-settings.json`, avec un commentaire disant que les agents du workflow ont leur propre
  `model:` et ne sont pas concernés.
- **Risque** : un `Explore` sur une question transverse difficile tombe trop bas et rend une
  réponse pauvre. Parade : c'est une valeur par défaut, l'appel explicite peut la surcharger.
  À arbitrer entre `haiku` (économe) et `sonnet` (sûr) — `sonnet` est probablement le bon défaut
  pour un agent d'exploration non cadré, qui est par définition la situation où le scope est flou.
- **Complément gratuit** : `/tasks` affiche le modèle d'un sous-agent en cours — à citer dans §5b
  comme moyen de vérifier, plutôt que de supposer.
- Fichiers : `plugin/templates/project-settings.json`, `plugin/WORKFLOW.md` §5b.
- Incidents liés :

### K9 — `/compact` et le nettoyage de contexte ne sont pas le même geste [coût]

- Classe C · confiance haute · coût : deux lignes.
- Statut : **faite v0.31.0**.
- **Le constat.** Le nettoyage de contexte (retrait des vieux résultats d'outils) **coûte plus
  qu'il ne rapporte** dans le run mesuré par Anthropic : chaque passe réécrit la conversation
  cachée. C'est un outil de fenêtre de contexte, pas d'économie. La compaction (résumer et
  continuer), elle, a retiré 38 % de plus sur un run long — mais seulement sur des sessions assez
  longues pour l'atteindre.
- **Ce que ça change** : §3b dit déjà « `/compact` seulement avant une pause » — la raison donnée
  est le cache, elle est bonne. Y ajouter que compacter **tôt** ne fait pas d'économie : ça déplace
  le coût. Et que `/purge-contexte` (fichiers de suivi sur disque) n'a rien à voir avec tout ça —
  la proximité des noms invite à la confusion.
- Fichiers : `plugin/WORKFLOW.md` §3b.
- Incidents liés :

### K10 — Bloc de passation : le prompt exact de la session suivante [contexte] [jugement]

- Classe A · confiance **haute** · coût : une section de skill + un gabarit.
- Statut : **faite v0.31.0**.
- **Le constat.** `/fin-de-tache` § « Enchaînement » sait déjà passer la main — mais **seulement
  pour la session suivante d'un plan**, et en s'appuyant entièrement sur un fichier déjà écrit :
  la pastille porte le prompt minimal « Ouvre `plans/P<n>/S<k>.md` et exécute-le. » C'est un bon
  design : le `S<k>.md` **est** la passation. Trois trous :
  1. une session qui se termine **sans `S<k>.md`** (cadrage, analyse, exploration, escalade de
     modèle) n'a aucune passation — et c'est précisément le cas où le contexte perdu coûte cher ;
  2. la pastille `spawn_task` est propre au Desktop ; hors Desktop §5b se rabat sur « afficher la
     commande », qui ne porte pas le **contenu** de la passation ;
  3. le prompt n'est jamais rendu **copiable tel quel** à l'humain : il est posé dans une pastille,
     pas écrit dans la conversation.
- **Ce que ça change.** Toute session qui rend la main en demandant une session neuve termine par
  un bloc de code clos, copiable sans retouche, et rien d'autre après lui :

  ```
  Session suivante — modèle <M> · effort <E>

  Lis, dans cet ordre, et rien d'autre :
  - <chemin> — <pourquoi ce fichier>
  - <chemin> — <pourquoi ce fichier>

  État : <où en est le travail, en 2-3 lignes>
  Déjà tenté et écarté : <ce qui a échoué et pourquoi — la ligne qu'un résumé perd>
  À faire : <l'objectif de la session suivante, et son critère de fin>
  ```

- **Pourquoi « Déjà tenté et écarté » est la ligne qui compte.** C'est exactement ce qu'une
  compaction automatique supprime, et exactement ce dont une session d'escalade a besoin (voir
  « Écartés » ci-dessous). Même logique que le « Écartés — ne pas reproposer » de
  `/revue-de-conception` : on transmet le négatif, pas seulement le positif.
- **La liste « Lis … et rien d'autre »** applique au cas non planifié la règle que le socle impose
  déjà au cas planifié : « un exécutant qui a un `S<k>.md` ne lit QUE les fichiers listés dans sa
  session ». Sans elle, une session neuve relit le repère par défaut et repaie un préfixe entier.
- **Ce qu'on verra** : des reprises qui ne redécouvrent pas ce que la session précédente avait déjà
  écarté ; une passation utilisable en Desktop, VS Code, cloud et mobile sans dépendre de la pastille.
- **Risque** : un bloc qui double la pastille et qu'on maintient à deux endroits. Parade : la
  pastille reste le véhicule quand un `S<k>.md` existe (elle n'a alors rien à recopier) ; le bloc
  est le véhicule **quand il n'y en a pas**. Les deux ne se recouvrent jamais.
- Fichiers : `plugin/skills/fin-de-tache/SKILL.md` § « Enchaînement », `plugin/WORKFLOW.md` §5b,
  et le `permissionDecisionReason` du hook K2 qui y renvoie.
- Incidents liés :

### K11 — `session_source` et `model` sur SessionStart [contexte]

- Classe B · confiance **haute** sur le fait, à cadrer sur l'usage · coût : une demi-journée.
- Statut : **faite v0.31.0**.
- **Le constat.** `sessionstart-contexte.mjs` ne lit aujourd'hui que le disque et git. Le hook
  reçoit pourtant `session_source` ∈ `startup | resume | clear | compact | fork`, `model`,
  `prompt_id`, `transcript_path` et `scratchpad_dir` — il sait donc **pourquoi** la session
  démarre, et sur quel modèle.
- **Ce que ça ouvre** : ne rien dire sur un `resume` (le contexte a déjà été signalé au `startup`,
  le répéter pollue) ; sur un `compact`, rappeler ce que la compaction vient de faire tomber ; sur
  un `startup` avec une vague en cours, afficher le bloc de passation K10 s'il en traîne un ; et
  comparer `model` au modèle écrit dans le bandeau du `S<k>.md` pour dire « tu as lancé S3 en
  Haiku, le plan dit Sonnet » — le seul contrôle qui manque vraiment aujourd'hui, et qui répare
  à la source ce que la ligne « À régler AVANT de lancer » ne fait que rappeler.
- **Risque** : un hook SessionStart qui en fait trop et se met à parler à chaque démarrage, contre
  sa règle actuelle (« silencieux si tout est sain »). Parade : chaque nouveau signal doit passer
  la même barre que les existants — il ne parle que s'il y a un écart.
- Fichiers : `plugin/hooks/sessionstart-contexte.mjs`, `plugin/WORKFLOW.md` §7.
- Incidents liés :

## Vérifications du 2026-09-13

Les quatre points ouverts de la première rédaction, tranchés le jour même. Sources :
`code.claude.com/docs/en/{hooks,settings,settings-reference,model-config,prompt-caching}.md`,
`platform.claude.com/docs/en/build-with-claude/{prompt-caching,mid-conversation-system-messages}`.
Claude Code installé au moment du test : **2.1.266**.

| # | Question | Réponse | Effet |
| --- | --- | --- | --- |
| 1 | Précédence `effortLevel` projet vs `modelSettings` utilisateur | Précédence entre fichiers : entreprise > `--settings` > `settings.local.json` > `settings.json` projet > utilisateur. **Mais entre les deux clés, `modelSettings` gagne d'où qu'il vienne** — résolveur lu dans `claude.exe` 2.1.266, voir K3 | K3 renforcée : vendorer `modelSettings` au niveau projet devient une **protection** contre un `/effort` utilisateur, pas une commodité |
| 2 | `PostModelSwitch` peut-il injecter du contexte ? | **Non.** Ne peut pas bloquer, n'expose que `systemMessage` — un message affiché à l'**utilisateur**. La glose « contexte injecté pour Claude » rapportée la veille était fausse | K2 corrigée : `PostModelSwitch` journalise et affiche, rien de plus |
| 3 | Opus 5 partage-t-il l'exemption d'effort ? | **Non dans Claude Code** (Fable 5.1 seulement). Oui côté API, via la beta | §3b inchangée, sans réserve |
| 4 | `SessionStart` reçoit-il `staleness` / `estimated_re_cache_cost` ? | **Non — ces champs n'existent pas.** Affirmation du sous-agent de la veille, non vérifiée, écartée | La mesure espérée tombe. Mais SessionStart reçoit `session_source`, `model`, `transcript_path`, `scratchpad_dir` → **K11** |

Deux découvertes de la même passe, portées en mesures : `permissionDecision` n'accepte pas `"ask"`
(K2 révisée) et `PreModelSwitch` reçoit `transcript_path` (K2). Une question reste ouverte et sans
conséquence ici : la doc consultée ne liste pas de hook `PreCompact` — même s'il existait, il se
déclenche *pendant* une compaction, il n'en provoque pas.

## Écartés — ne pas reproposer

### `/compact` déclenché par `PreModelSwitch`

L'idée : le switch de modèle détruit le cache de toute façon, donc compacter à cet instant est
« gratuit ». **Le raisonnement de coût est juste**, et il est confirmé par la doc : tant que le
cache est chaud, la requête de résumé relit le préfixe **au tarif cache**, et c'est résumer une
session *froide* qui coûte le plus cher. Compacter juste avant un switch est donc bien le meilleur
moment possible pour compacter. Deux raisons de ne pas en faire un hook :

1. **Le mécanisme n'existe pas.** Aucun hook ne peut déclencher une commande slash ; il n'y a pas
   de mécanisme documenté pour provoquer une compaction. `PreModelSwitch` sait `allow`, `deny`, et
   afficher un message. La version implémentable serait « refuser le switch en disant *compacte
   d'abord* » — un rituel humain en deux temps, pas une automatisation.
2. **Le cas d'usage se retourne contre l'idée.** On change de modèle en cours de session pour
   **escalader** (§2 : « si la cause d'un bug n'est pas localisée » ; §3 : « il tourne en rond
   depuis 2 relances »). Compacter à cet instant, c'est remettre au modèle fort **un résumé écrit
   par le modèle qui vient d'échouer** — en perdant les hypothèses testées, le texte exact des
   erreurs et les impasses déjà explorées, c'est-à-dire précisément ce qui justifiait l'escalade.
   On optimiserait le coût du moment où l'on paie justement pour avoir plus de discernement.

**Ce qu'on garde.** Le bon moment reste vrai **hors escalade** : un changement de modèle délibéré à
une frontière de phase propre (exploration finie en Opus, exécution en Sonnet) gagne à être précédé
d'un `/compact` pendant que le cache est chaud. C'est une ligne de §3b, en geste manuel, à côté de
« `/compact` seulement avant une pause ». Pour l'escalade, la bonne primitive n'est pas la
compaction mais la passation explicite — **K10**, vers laquelle le `permissionDecisionReason` de
K2 renvoie.

## Priorité et confiance

| Rang | Mesure | Gain | Confiance | Coût |
| --- | --- | --- | --- | --- |
| 1 | K10 bloc de passation | fort | haute | une section de skill |
| 2 | K1 réécrire §3b | moyen | haute | une demi-heure |
| 3 | K6 chiffre sur les prompts datés | fort (via A2/J0) | haute | nul |
| 4 | K2 hook `PreModelSwitch` | fort | **haute** (contrat vérifié) | une session + test réel |
| 5 | K4 décaler la vague | moyen à fort | moyenne | deux lignes |
| 6 | K3 `modelSettings` vendoré | moyen (+ correctif d'un piège silencieux) | haute | un gabarit |
| 7 | K5 reprise comme levier de coût | fort à terme | moyenne-haute | un cadrage + éval |
| 8 | K11 `session_source` + `model` | moyen | haute (fait) / à cadrer (usage) | une demi-journée |
| 9 | K9 compaction vs nettoyage | faible | haute | deux lignes |
| 10 | K8 `CLAUDE_CODE_SUBAGENT_MODEL` | faible | haute | une ligne |
| 11 | K7 plancher Haiku | faible | haute / ampleur faible | un paragraphe |

**Séquencement proposé.** Toutes les vérifications sont faites (§ « Vérifications du 2026-09-13 »),
y compris celle qui restait interne à K3. Rien n'est plus en attente d'information.

Vague 1 — documentation, réversible, aucun risque : **K1, K6, K9, K7**, plus la ligne « compacter
avant un changement de modèle délibéré » retenue en § « Écartés ».
Vague 2 — **K10 puis K2**, dans cet ordre : le hook renvoie vers la passation, elle doit donc
exister avant lui. K2 est le seul vrai développement et doit être testé en réel avant publication
(leçon v0.30.0).
Vague 3 — **K3** après son test, **K11** après cadrage de ses signaux, **K8** au passage.
**K4** se mesure en même temps que la prochaine vague réelle. **K5** passe par `/cadrer` et attend
l'éval (B5 du fichier du 2026-09-12).

**Le fil directeur.** Les leviers de coût d'Anthropic vont dans un ordre imposé : **gains gratuits
d'abord, arbitrages ensuite**. Appliqué ici, cela range K1, K2, K4, K6, K8 (aucune qualité
échangée) avant K3 et K5 (qui touchent à l'effort, donc à la capacité). Ne pas inverser : le seul
vrai risque de ce fichier serait de baisser l'effort avant d'avoir récupéré ce qui est gratuit.

## Ce qui ne s'applique pas

- **Placement de `cache_control`, choix du TTL, pré-chauffage à `max_tokens: 0`, Message Batches,
  `task_budget`** : leviers de l'API Messages. Claude Code gère ses breakpoints lui-même ; le
  workflow n'écrit pas de code d'appel API. Ne pas reproposer.
- **`clear_tool_uses` / `clear_thinking`, compaction serveur** : même raison — voir K9 pour la part
  qui a un équivalent utilisateur (`/compact`).
- **Fable 5.1** : lectures de cache à 0,025× et exemption d'invalidation sur l'effort. Fable est
  hors workflow depuis v0.29.0 ; à rouvrir seulement si cette décision est révisée.
- **Divulgation progressive du contexte** (documents derrière un outil, `defer_loading` sur les
  schémas d'outils) : déjà couvert par `A4` (`references/`) du fichier du 2026-09-12, et le seuil
  de rentabilité (~10 000 tokens de schémas) n'est pas atteint par le plugin.
- **`max_tokens` comme bouton de réglage** : non exposé en Claude Code.
- **Admin API (rapports usage et coût)** : demande une clé Admin d'organisation, hors de portée
  d'un compte individuel. La mesure du coût, pour ce workflow, passe par `/context` et par le
  journal de K2 — pas par des rapports.

## Comment ce fichier se consomme

Identique au fichier du 2026-09-12 — voir sa section homonyme. Les identifiants `K1`…`K11` sont
stables et ne collisionnent avec aucun autre fichier d'analyse.
