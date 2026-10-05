# 2026-10-05 — Rapport : le mod « état du plan »

> Issu de la preuve P12 (mesures : `docs/analyses/2026-10-05-preuve-mods-mesures.md`). Code :
> `plugin/hooks/observateur.tsx` sur la branche `preuve/mods` (commit `2e67004`, validé par le
> moteur 2.1.286). Rien de ce mod n'est sur `main`.

## Ce que ça change, en clair

Pendant qu'un plan tourne, un panneau à droite de l'onglet Code de Desktop montre **ce que
l'orchestrateur va faire ensuite** : la vague et les sessions à lancer, puis « pousser » ou « clôturer ».
Il se met à jour seul, sans rien demander, à chaque session lancée ou terminée. Le même mod note
dans un journal hors dépôt **combien chaque session coûte en tokens**, séparément de l'orchestrateur.

Tu le verrais ainsi : `/etat-plan` une fois en début de plan, puis le panneau change de lui-même
(constaté sur P90 : vague 1 → vague 2 → pousser).

**Recommandation : ne pas l'adopter tel quel tout de suite.** Il marche, mais il ne charge
aujourd'hui qu'à chaud, après un clic « Enable for this session » à chaque conversation, et rien ne
prouve encore qu'il charge tout seul depuis le plugin installé. **Le revers** : sans lui, le
workflow reste aveugle sur le coût par session et sur l'avancement d'un plan en cours.

## Ce qu'il fait

| Élément | Comportement | Constat |
| --- | --- | --- |
| Commande `/etat-plan` | Lance `node plugin/bin/prochaine-action.mjs <plan> --json` et ouvre le panneau « État <plan> » | Rendu dans Desktop, `$.process.run` accepté |
| Rafraîchissement | Sur l'appel d'outil `Agent` du fil principal et sur la fin de tour d'un sous-agent | Mise à jour vue deux fois, sans geste |
| Journal | `session.start`, chaque `tool.call` (outil, `agentId`), chaque `turn.complete` (usage : input, output, cache read, cache creation, modèle) | `~/.claude/preuves/mods/journal.jsonl`, 100 lignes sur la preuve |
| Refus, réécriture | Aucun : chaque hook appelle `next(e)` et rend le résultat intact | Les cinq hooks commande restent actifs (`tester-hooks` PASS) |

Coût d'un plan relevé sur P90 (2 sessions Haiku `low`) : l'orchestrateur (Opus, conversation
longue) pèse 58 % des tokens lus en cache ; chaque session paie ≈ 68 k tokens de cache creation au
démarrage. Détail : fichier de mesures, § M3.

## Ce qui manque avant d'adopter

1. **Prouver le chargement à froid** (M1 non conclu). Les deux essais de P12 portaient sur un
   module refusé par le moteur. À refaire avec le module corrigé : plugin installé, conversation
   neuve, sans variable.
2. **Valider avec le bon outil.** `claude plugin validate plugin` ne lit que `marketplace.json`, et
   le `claude` du PATH (2.1.274) n'a pas les règles du moteur Desktop (2.1.286). La gate doit être
   `"$CLAUDE_CODE_EXECPATH" plugin validate plugin/.claude-plugin/plugin.json`, ou `claude plugin
   test` sur des `*.test.ts` du mod.
3. **Corriger le relevé des refus** : le mod note `ok` sur un refus du hook classique ; il faut
   tester `isError` sur le résultat.
4. **Rendre le plan suivi paramétrable** : le mod lit `P90` en dur. Il devrait lire le plan en cours
   (argument de `/etat-plan`, ou le dernier `plans/P<n>/index.md` non clos).
5. **Chemin du journal** : en dur sous `C:/Users/Kovu/…` ; à dériver de `$.plugin` ou de `$.store`.

## Coût de distribution

| Cas | Ce qu'il faudrait | Coût |
| --- | --- | --- |
| Ce dépôt (plugin `--scope local`) | `"modules"` dans `hooks.json`, réinstallation à chaque changement du module (`update` à version égale ne recopie rien) | Inconnu tant que M1 n'est pas prouvé |
| Projets vendorés | `sync-workflow.mjs` ne copie pas `hooks.json` ; soit plugin installé par projet, soit `CLAUDE_CODE_PLUGIN_DIRS` utilisateur (tous les projets du poste), soit plugin de dossier skills `.claude/skills/<nom>/` | Non testé |
| Chaque conversation, aujourd'hui | Clic « Enable for this session » sur la copie du dossier dev-mods | Un geste humain par conversation |

## Défauts du workflow mis au jour par ce mod

Repris du fichier de mesures, § Défauts relevés : boucle `valider-n0` quand un fichier non suivi
traîne dans l'arbre (`plugin/bin/preuve-n0.mjs`, `empreinte()`), N0 complet ≈ 3 min 20 s pour une
ligne de texte, session Haiku qui calcule sa preuve avant son dernier changement.

## Suite proposée

Le cadrage des preuves suivantes (chargement à froid, mods de fichiers, de limites d'usage) est
dans `docs/decisions/2026-10-05-preuves-mods-autonomes.md`. Elles doivent tourner **sans
interaction humaine** : P12 a demandé une dizaine de gestes à l'utilisateur.
