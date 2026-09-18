# 2026-09-18 — L'effort se règle par sous-agent : ce qui se débloque, ce qui reste couplé

- Version : plugin `workflow` **0.39.1**.
- Entrée : question du mainteneur — « l'orchestrateur doit-il être Sonnet ou Haiku, et à quel
  effort ? », puis « la doc dit qu'on peut maintenant régler l'effort d'un sous-agent »
  (<https://code.claude.com/docs/en/model-config#set-the-effort-level>).
- Décidé par le mainteneur : corriger les textes, ne pas encore toucher à la voie de lancement.

## Le constat

Le dépôt disait trois choses différentes, et la plus fausse était la plus lue.

1. **`WORKFLOW.md` §5b** : « L'effort d'un sous-agent est celui de la conversation qui le lance
   (`Agent` règle le modèle, pas l'effort) » — énoncé comme une contrainte d'outillage absolue,
   relayé tel quel par `/orchestrer-plan` (deux emplacements).
2. **`docs/references/claude-code-capabilities-2026-08.md`, Appendix F** (2026-09-15) : `effort` en
   frontmatter d'agent est **documenté**, valeurs `low…max`, défaut « inherits from session ». La
   réserve inscrite ce jour-là portait sur son **affichage** (`/tasks` ne l'expose qu'à partir de
   2.1.242), pas sur son existence.
3. **`plugin/agents/critique-plan.md`** porte `effort: high` depuis cette même date. Le mécanisme
   était donc déjà en service dans le dépôt pendant que §5b affirmait qu'il n'existait pas.

Ce qui a soudé (2) en (1) : la **sonde A** du 2026-09-17 a conclu `NON SONDABLE` — l'effort
n'apparaissait ni sur la carte « Terminé » ni dans le détail de transcription du sous-agent. Elle
n'a pas lu `/tasks`, le seul endroit que la documentation désigne. Une absence d'affichage est
devenue, en deux jours et sans nouvelle mesure, une absence de mécanisme, écrite dans §3 (« pas
d'agents `session-<effort>` ») puis dans la skill.

**Fait officiel, vérifié le 2026-09-18** — `model-config` § *Set the effort level* range le
frontmatter parmi les sept leviers d'effort : « set `effort` in a skill or subagent markdown file to
override the effort level when that skill or subagent runs », avec sa précédence — « overriding the
session level but not the environment variable », borné par `maxEffortLevel` et le plafond
d'organisation. `sub-agents` § *Frontmatter reference* confirme le champ, indépendant de `model:`.

## La contrainte réelle, qui elle subsiste

Corriger §5b ne débloque rien tout de suite, parce que le couplage ne vient pas de l'outil `Agent`
mais de **ce que le workflow lance** : une session de plan part en `subagent_type: "claude"`
(`orchestrer-plan/SKILL.md`, Étape 1) — l'agent générique, qui n'a **pas de fichier**, donc pas de
frontmatter où poser un effort. Elle hérite de la conversation, exactement comme avant.

Le frontmatter ne sert qu'aux agents **nommés** de `plugin/agents/`. Pour en faire profiter les
sessions de plan, il faudrait des agents `session-low` / `session-medium` / `session-high` — l'option
que §3 écartait au motif que le mécanisme n'était pas vérifiable. Ce motif tombe ; l'option redevient
ouverte, mais elle change la voie de lancement (§5b, voie unique) et se cadre, elle ne s'improvise
pas dans une correction de texte.

## Ce qui est décidé

1. **§3 et §5b corrigés** : l'effort d'un sous-agent vient de son frontmatter, **sinon** de la
   conversation. La formule « l'outil `Agent` pose le modèle, jamais l'effort » reste vraie de
   l'outil, et fausse comme énoncé général — les deux textes la portent désormais ainsi.
2. **La contrainte est nommée là où elle agit** : `subagent_type: "claude"` = pas de frontmatter =
   héritage. `/orchestrer-plan` le dit sous cette forme (message `regler-effort` compris), au lieu
   d'invoquer une sonde non concluante.
3. **Appendix F clos** : la ligne `effort` n'attend plus un geste du mainteneur — la documentation
   tranche seule.
4. **Agents `session-<effort>` : chantier ouvert, non tranché ici.** À cadrer (`/cadrer`) avec la
   question de l'effort de l'orchestrateur, dont il est le préalable.

## Ce qui est écarté, et pourquoi

**Créer les agents `session-<effort>` dans la foulée.** Tentant — le mécanisme est là, les fichiers
sont triviaux. Mais ça déplace la voie de lancement unique de §5b : trois agents porteurs d'un effort
figé remplacent un paramètre lu dans l'index, et l'index cesse d'être le seul porteur du couple
modèle/effort (§4a). C'est un changement de conception, pas un correctif localisé.

> **Corrigé le 2026-09-18 même jour, par le cadrage qui a suivi**
> (`2026-09-18-effort-porte-par-l-agent-de-session.md`) : la seconde moitié de cet argument est
> fausse. §4a ne porte que les **statuts** — aucune règle du dépôt ne fait de l'index le seul porteur
> du couple modèle/effort, que le bandeau de chaque `S<k>.md` duplique déjà (`WORKFLOW.md:43`,
> `squelette-session.md:9`). Reste vrai : c'est un changement de conception, à cadrer — ce qui a été
> fait. Verdict du cadrage : cinq agents `session-<effort>`, recommandés.

**Passer l'orchestrateur à `low` maintenant.** C'est la question qui a ouvert ce dossier, et la
réponse est non — pas encore. Tant que les sessions héritent, l'effort de l'orchestrateur **est**
celui de toute la vague : le mettre à `low` ferait tourner chaque session du plan en `low`, en
silence, quel que soit ce qu'écrit son `S<k>.md`. Le geste n'est pensable qu'**après** le
découplage. Et même alors il reste à mesurer : depuis 0.39 l'orchestrateur exécute un script plutôt
qu'il ne dérive un état (C2, « il exécute, ne décide plus »), ce qui plaide pour `low`, mais il
garde les arbitrages de remédiation, de prémisse et d'escalade, qui sont du jugement.

**Rouvrir K5 par la même occasion** (« tout lancer un cran d'effort en dessous, rejouer les échecs au
défaut », écartée le 2026-09-13). Non : K5 était gardée par une éval qui n'existe toujours pas, et
c'est la même garde qui s'applique ici. Or cette éval — la comparaison Haiku/Sonnet en orchestrateur,
T19 du plan P6 — a été **abandonnée** faute de bac à sable Windows pour `claude plugin eval`
(`docs/workflow/incidents/2026-09-17-sandbox-windows-absent-claude-plugin-eval.md`). Tant que ce
blocage d'environnement tient, aucun arbitrage qui échange de la qualité contre du coût ne peut être
tranché par la mesure, ni ici ni pour K5.

## Conséquences

- Un agent nommé qui a besoin d'un effort propre le pose en frontmatter, sans passer par la session.
- L'effort d'une vague s'annonce toujours **une fois** à l'ouverture, et cette règle a maintenant une
  raison exacte (agent générique sans fichier) au lieu d'une mesure mal conclue.
- Deux chantiers restent liés, dans cet ordre : agents `session-<effort>` d'abord, effort de
  l'orchestrateur ensuite. Aucun des deux ne se tranche avant que `claude plugin eval` tourne.
- Une sonde qui rend `NON SONDABLE` ne vaut pas réfutation : la conclusion appartient à ce qu'elle a
  mesuré (ici l'UI), jamais au mécanisme. Rien dans le workflow ne l'imposait — c'est la leçon à
  retenir de l'écart entre Appendix F et §5b.
