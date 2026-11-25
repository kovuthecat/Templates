# 2026-11-25 — Vagues parallèles au choix, plan par plan ; corrections de la passe d'incidents

> Issue de `/cadrer` : **Chantier à mener** (un plan). Entrées : demande de l'utilisateur (passage
> ponctuel sur Max, plusieurs projets à échéance serrée) et `docs/incidents/2026-11-25-synthese.md`.
> Rouvre le point 21 de `docs/decisions/2026-10-14-suites-revue-externe-et-sessions-sans-pastille.md`
> (« parallèle retiré ») : son motif était le quota Pro ; le signal a changé.
> Brief : inchangé (pas de `PROJECT_BRIEF.md` dans ce dépôt). Règles : inchangées.

## Ce qui change, en clair

- **Avant d'écrire chaque plan, `/nouveau-plan` te demande : sessions parallèles activées ou
  désactivées pour ce plan ?** Ta réponse s'inscrit en tête de l'index (`Parallèle : oui | non`).
  Un plan existant sans cette ligne reste en série, comme aujourd'hui.
- **Plan en parallèle : toutes les sessions d'une vague partent ensemble**, sans autre limite que
  les dépendances du plan (une session ne part que quand celles dont elle dépend sont faites).
  Chaque session travaille dans **sa propre copie du dépôt** (worktree, sur sa branche) : elle ne
  voit pas les fichiers en cours des autres, son contrôle N0 et ses commits restent les siens. À la
  collecte, le moteur fusionne chaque branche dans `main` puis pousse, comme aujourd'hui.
- **Ce que tu verras** : une vague de 4 sessions dure à peu près le temps de la plus longue, pas la
  somme des quatre. Tu le vois dans l'index : les quatre lignes cochées à la même collecte.
- **Revers, à connaître** :
  - le quota part plus vite, et une limite atteinte coupe **toutes** les sessions de la vague à la
    fois (elles sont reprises comme interruption, sans consommer de reprise) ;
  - chaque copie doit réinstaller ses dépendances (`node_modules`…) avant son N0 : du temps et du
    disque par session ; à mesurer en S1 ;
  - une vague dont deux sessions écrivent les mêmes fichiers **repasse en série** d'office, avec la
    raison au lancement : deux copies qui modifient le même fichier se fusionneraient mal ;
  - une session d'arrière-plan qui bute sur une demande d'autorisation reste bloquée (incident
    torrent-uploader du 2026-10-20) : avec plusieurs en même temps, c'est le risque principal. Le
    plan le traite (ci-dessous, L10) avant d'ouvrir le parallèle.
- **Les corrections des incidents du 2026-11-25 font partie du même plan**, en tête : deux défauts
  du moteur font aujourd'hui sauter un arrêt humain ou relancer une session déjà faite.

## Tranché

### Le parallèle

| Point | Décision |
| --- | --- |
| Choix | Par plan, question posée par `/nouveau-plan` **avant** sa rédaction (Étape 0, après le contrôle de version), options fixes `activées` / `désactivées`, sans défaut recommandé. Domicile : ligne `Parallèle : oui | non` de l'en-tête d'`index.md`, lue par `lire-index.mjs`. Absente = `non`. |
| Mécanisme | Une copie isolée par session (`isolation: "worktree"` de l'outil `Agent`). L'interdit « jamais de worktree » (`orchestrer-plan/SKILL.md:57-58`, `EXECUTANT.md:81`, `prochaine-action.mjs:880`) ne tient plus que pour les plans `Parallèle : non`. |
| Plafond | Aucun en dehors des dépendances : toutes les sessions lançables d'une vague partent dans le même message. |
| Zones | Le moteur refuse le parallèle pour une vague dont deux sessions ont des zones qui se recoupent : il rend un `lancer` en série pour cette vague, avec le motif. `verifier-plan.mjs` le signale dès la rédaction. |
| Collecte | Le moteur fusionne chaque branche de session dans `main` **sans réécrire ses commits** (fusion, pas `rebase`) : la preuve N0, calculée sur le commit de la session (`preuve-n0.mjs:85`), reste vérifiable. Conflit de fusion → `question` (jamais résolu seul). Puis coche, revue, push comme aujourd'hui. |
| Série | `Parallèle : non` : comportement 0.68.0 inchangé (« un seul à la fois », `orchestrer-plan/SKILL.md:38`). |
| Écarté | **Même dossier, zones disjointes** : refonte de la preuve N0 (empreinte de tout l'arbre, `preuve-n0.mjs:26-47`) et commits reportés à l'orchestrateur — le coût qui l'avait fait écarter le 2026-10-14. **Plafond fixe (2 ou 3)** : refusé par l'utilisateur. **Ne rien changer** (paralléliser seulement entre projets, déjà possible) : ne raccourcit pas un plan. |

### Les incidents (synthèse du 2026-11-25)

| # | Décision |
| --- | --- |
| L1 | `lire-index.mjs` lit aussi `validation-humaine` / `reprise-manuelle` écrits après les deux-points ; `verifier-plan.mjs` signale la forme non canonique. Test de non-régression avec les lignes d'EBM-MSPv2 P18 et nova P20. |
| L2 | `parseTaches` et `refsCommitees` (`prochaine-action.mjs:219`, `:276`) acceptent les identifiants `T-063` ; `verifier-plan.mjs` refuse un champ Tâches dont aucun identifiant ne se lit. Test avec les commits nova P18/S2. |
| L3 | `validation-humaine` n'est rendue que si tous les membres de la vague sont faits ; un membre bloqué par une dépendance `[x]!` → `question` sur le bloquant amont. |
| L4 | `.claude/journal-modeles.jsonl` ne rend plus l'arbre « sale » (même exclusion que `preuve-n0.mjs:12`). |
| L5 | Motif d'interruption (`orchestrer-plan/SKILL.md:122`) : ajouter `stalled` et `watchdog`. |
| L6 | Gabarit : `plans/**/*.n0.json` hors du lint (`.prettierignore` et équivalents dans `/nouveau-projet`). |
| L7 | « Claude Design » → « maquette via l'outil Artifact (type Design, ou page HTML publiée) » dans `nouveau-projet/SKILL.md` et le gabarit `DESIGN_SPEC.md`. |
| L8 | `/verif-visuelle` reconnaît le refus « No server named … » qui liste les serveurs d'un autre dossier : il dit que Desktop lit le `launch.json` du dossier ouvert, propose l'entrée à y ajouter, sinon mode B. |
| L9 | **Fait admis** : l'outil `Agent` de Desktop n'a plus de paramètre `run_in_background` ; tout sous-agent part en arrière-plan et notifie à la fin (reconstaté pendant ce cadrage). La règle « premier plan » (`CLAUDE-BASE.md`, `WORKFLOW.md` §5, `EXECUTANT.md`, mod O3) est réécrite en geste : **attendre la notification avant tout geste qui dépend du résultat, et ne pas finir son tour tant qu'un agent attendu tourne**. Le N0 reste un script au premier plan. Ce que fait une **session sous-agent** qui délègue (est-elle réveillée par la notification ?) → sonde en S1. |
| L10 | Prompt de session (`prochaine-action.mjs`) : aucune commande qui demande une autorisation — pas de `rm`, pas de `cd … &&`, fichiers temporaires dans le dossier scratchpad ou écrasés ; et le gabarit `permissions.allow` couvre les commandes d'une session ordinaire. Préalable au parallèle. |
| L11 | Nouveau geste du moteur `--lever-bloquant S<k> <docs/decisions/…>` : lève un bloquant mécanique (ex. `n0.json` hors zone) quand une décision écrite le justifie ; commit tracé, la question `dependance-revue` le propose en option. |
| L12 | Script `incident.mjs <slug>` qui écrit l'en-tête (date, version lue dans le manifeste, plan, environnement) ; `/fin-de-tache` point 8 l'appelle au lieu de demander une recopie du gabarit §9b. |

## Grille de préparation — état final

| Dimension | État | Preuve |
| --- | --- | --- |
| problème concret | READY | demande explicite (Max, échéances) ; 22 incidents, `docs/incidents/2026-11-25-synthese.md` |
| résultat visé | READY | une vague parallèle dure le temps de sa plus longue session ; question posée à chaque plan — demande explicite |
| vérification | OPEN | worktree + réinstallation des dépendances + N0 + fusion sans réécriture, jamais essayés → **expérience** : sonde en S1 du plan (deux sessions factices sur un projet de test, preuve vérifiée après fusion) ; session sous-agent réveillée par la notification d'un agent délégué (L9) → même sonde |
| périmètre | READY | `nouveau-plan`, `orchestrer-plan`, `EXECUTANT.md`, `WORKFLOW.md` §5, `CLAUDE-BASE.md`, `lire-index.mjs`, `prochaine-action.mjs`, `verifier-plan.mjs`, mod `garde-fous` (O3), `verif-visuelle`, `fin-de-tache`, `nouveau-projet`, gabarits |
| cohérence | OPEN | plans ouverts des projets sans ligne `Parallèle :` → lus `non`, rien à migrer ; à vérifier par `explorateur` en S1 qu'aucun outil tiers (mods, hook Stop `revuesManquantes`) ne suppose une seule branche |

Ordre conseillé au plan : corrections L1-L8, L11, L12 (indépendantes, peuvent tourner ensemble), puis
L9-L10, puis la sonde, puis le parallèle — le parallèle ne s'ouvre qu'une fois la sonde verte.
