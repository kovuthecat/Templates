# 2026-09-13 — Les réglages du plan tiennent, la passation s'écrit, le modèle laisse une trace

- Version : plugin `workflow` **0.31.0**.
- Entrée : `docs/analyses/2026-09-13-cout-du-contexte-cache-et-hooks-de-modele.md` (mesures `K*`),
  produite après lecture de la documentation Anthropic sur le prompt caching et l'optimisation de
  coût, et des notes de version Claude Code 2.1.251 / 2.1.260.
- Décidé par le mainteneur : implémenter K1, K3, K4, K7, K8, K9, K10, K11 et une version réduite de
  K2. K5 reportée, K6 sans objet ici.

## Le constat

Trois choses n'allaient pas, et aucune n'était une question de cache.

**§3 énonce la règle la plus chère du workflow — « régler modèle et effort avant de lancer » — et
rien ne la vérifiait.** La ligne « À régler AVANT de lancer » rappelle ; elle ne contraint pas. Une
session partie au hasard des réglages de la veille ne se découvre qu'au résultat. §7 liste les
hooks qui appliquent les règles qui comptent : le modèle n'y était pas.

**Le gabarit ne protégeait pas son propre défaut.** Claude Code consulte
`modelSettings.<modèle>.effortLevel` **avant** la clé racine `effortLevel`, et ce quel que soit le
fichier d'où vient chacune (résolveur lu dans `claude.exe` 2.1.266 :
`Object.hasOwn(byModel, modèle) ? byModel[modèle] : default`). Un `/effort` lancé une fois écrit
`modelSettings` dans les settings **utilisateur** et battrait ensuite l'`effortLevel` du gabarit —
dans les douze projets, en silence. Le `"effortLevel": "medium"` du gabarit ne protégeait de rien.

**§5b impose un démarrage à froid entre sessions, et seules les sessions de plan avaient de quoi
le supporter.** La pastille dit « ouvre `S<k>.md` et exécute-le » parce que le `S<k>.md` *est* la
passation. Une session sans `S<k>.md` — cadrage, analyse, escalade — n'avait rien : elle repartait
de zéro et réexplorait des impasses déjà payées.

## Ce qui est décidé

1. **`modelSettings` vendoré** dans `project-settings.json`, aligné sur la grille §2-3 (Opus `high`,
   Sonnet `medium`, Haiku `low`). L'effort suit le modèle : un seul réglage au lancement au lieu de
   deux. Et surtout, la table reprend la main sur un `/effort` utilisateur égaré —
   `modelSettings` suit, lui, la précédence normale (local > projet > utilisateur). `/effort` en
   session reste la dérogation explicite, à consigner dans le bandeau. `max` n'est pas réglable
   ici : l'énumération persistée s'arrête à `xhigh`, ce qui confirme la ligne de §3.
2. **`sessionstart-contexte.mjs` compare le modèle courant au plan.** Si aucune session `[ ]` des
   plans ouverts ne demande cette famille de modèle, il le dit — au démarrage, quand la correction
   est gratuite. Lu dans `plans/P*/index.md`, seul porteur des statuts (§4a). Muet pendant une
   vague : les sous-agents héritent du modèle de l'orchestrateur, pas du plan.
3. **`postmodelswitch-journal.mjs`, cinquième hook** : une ligne JSONL par changement de modèle
   dans `.claude/journal-modeles.jsonl`.
   **Pourquoi `PostModelSwitch` et pas `PreModelSwitch`** — `Pre` peut refuser un switch
   (`permissionDecision` n'accepte que `allow` et `deny` ; il n'y a pas de `ask`), mais mettre de
   la friction sur une escalade que §2 recommande explicitement serait le mauvais arbitrage. On
   trace, on n'empêche pas. Le journal est le seul retour d'expérience sur la grille §2 : un modèle
   systématiquement escaladé n'est pas un incident, c'est une ligne de grille fausse. Sous
   `.claude/`, donc hors du comptage du hook `Stop` — il ne peut ni déclencher un faux « fin de
   session non consignée », ni en satisfaire un à tort.
4. **Bloc de passation dans `/fin-de-tache`**, pour le cas sans `S<k>.md` uniquement. Bloc de code
   clos, copiable en Desktop comme en cloud, avec une ligne **« Déjà tenté et écarté »** obligatoire
   — celle que ni un résumé ni une compaction ne conservent, et celle dont une escalade a besoin.
   Quand une pastille est possible, elle vient en plus, pas à la place.
5. **§3b réécrite** : invalidation à trois étages (changer le système ne touche pas le cache des
   outils ; changer les messages ne touche ni l'un ni l'autre — seuls les outils et le **modèle**
   forcent une reconstruction complète, sans échappatoire) ; minimums cacheables par modèle, non
   monotones (**4 096 tokens sur Haiku 4.5** contre 512 sur Opus 5) ; fenêtre de reprise de 20
   positions ; `/compact` avant un changement de modèle **délibéré**, jamais avant une escalade.
6. **Vague lancée en décalé** (`/orchestrer-plan` Étape 3, §3b) : une entrée de cache n'est lisible
   qu'après le début du streaming de la première réponse. Lancer le premier sous-agent seul, les
   autres quand il produit. Sur une vague de 4, la part partagée passe d'environ 5,0× à 1,55× le
   prix d'entrée. §3b recommandait jusqu'ici de lancer « d'un bloc », ce qui garantissait le pire cas.
7. **`CLAUDE_CODE_SUBAGENT_MODEL: sonnet`** dans le gabarit. Sans effet sur les cinq agents du
   workflow, qui portent leur `model:` en frontmatter ; couvre les agents intégrés lancés au fil de
   l'eau, qui héritaient sinon du modèle de la conversation — donc d'Opus dans un cadrage.

## Ce qui est écarté, et pourquoi

**`/compact` déclenché par un hook au changement de modèle.** Le raisonnement de coût est juste —
le switch détruit le cache de toute façon, et tant qu'il est chaud la requête de résumé relit le
préfixe au tarif cache. Mais aucun hook ne peut déclencher une commande slash ; et surtout, on
change de modèle en cours de session pour **escalader**, donc au moment précis où un résumé écrit
par le modèle qui vient d'échouer ferait perdre les impasses et le texte des erreurs qui
justifiaient l'escalade. Le bon geste est la passation (point 4), pas la compaction. Le geste
manuel reste recommandé hors escalade (point 5).

**K5 — tout lancer un cran d'effort en dessous, rejouer les échecs au défaut.** Le chiffre publié
est le plus gros du dossier (même taux de réussite pour moitié prix), et le workflow a déjà la
machinerie (N0 comme gate binaire, `/reprendre-echec`, « la nature de l'échec décide de la
reprise »). Mais c'est le seul levier qui échange de la qualité contre du coût, et il n'y a pas
d'éval pour dire si elle est récupérée. L'ordre des leviers d'Anthropic est explicite : les gains
gratuits d'abord. À rouvrir quand l'éval existe (mesure B5 de l'analyse du 2026-09-12).

## Vérification

`tests/tester-hooks.mjs` passe de 15 à 22 cas : quatre pour le contrôle de modèle au démarrage
(signalé, silencieux quand ça correspond, sessions faites ignorées, muet sans plan), trois pour le
journal (ligne écrite et hook silencieux, changement nul, contrat non tenu). `bin/publier.mjs`
refuse de publier si un cas échoue.
