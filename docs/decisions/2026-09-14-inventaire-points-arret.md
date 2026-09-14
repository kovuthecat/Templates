# Inventaire des points d'arrêt (2026-09-14)

> Annexe de [2026-09-14-conditions-nommees-domicile-unique.md](2026-09-14-conditions-nommees-domicile-unique.md),
> point (c). Relecture exhaustive de `plugin/` (WORKFLOW, socle, exécutant, 13 skills + 3 annexes,
> 7 agents, output-style) à l'aune du critère « demander quand il y a un choix, agir quand il y a
> une gate ». Ce fichier porte la table brute ; la décision n'en garde que la lecture.

## Colonnes

`Gate N0 suffirait ?` : **oui** = c'est déjà une gate mal nommée (elle n'appelle aucun humain,
mais s'écrit `STOP`) ; **non** = point d'arrêt juste tel quel (arbitrage produit, irréversible,
changement de périmètre) ; **partiellement** = à reprendre, motif en 5 mots.

## Table

| # | fichier:ligne | Déclencheur | Ce qu'on demande à l'humain | Gate N0 suffirait ? |
|---|---|---|---|---|
| 1 | WORKFLOW.md:300-307 | `.claude/wave.lock` posé | rien — hook refuse commit/push | oui |
| 2 | WORKFLOW.md:446 | code modifié, suivi non écrit | rien — hook refuse de clore | oui |
| 3 | WORKFLOW.md:461 | plafond de lignes dépassé | rien — purge avant de continuer | oui |
| 4 | WORKFLOW.md:505 | échec environnement hors de portée | `FAIL` + remédiation nommée | partiellement — permission à élargir = choix |
| 5 | WORKFLOW.md:507 | prémisse de plan déclarée fausse | `FAIL` sans corriger, puis question | partiellement — vérification auto d'abord |
| 6 | WORKFLOW.md:516-522 | périmètre d'écriture débordé | STOP si le comportement attendu se décide | non — jugement de design |
| 7 | WORKFLOW.md:598-604 | migration, permission, prémisse confirmée, budget | question à options | non — irréversible ou arbitrage |
| 8 | WORKFLOW.md:411 | tâche touchant l'UI | jugement esthétique / UX / ton | non — N2 par définition |
| 9 | CLAUDE-BASE.md:24 | dépendance non prévue au plan | STOP, faire trancher l'ajout | non — engagement durable |
| 10 | CLAUDE-BASE.md:44 | fin de lot en mode autonome | lire les points N2 accumulés | non — jugement produit |
| 11 | EXECUTANT.md:10 | doute ou blocage sans `Latitude` | STOP, rapport, rendre la main | partiellement — beaucoup de blocages sont N0 |
| 12 | cadrer:21 | la réponse existe déjà ailleurs | rien — ne pas ouvrir la session | non — aiguillage, pas une gate |
| 13 | cadrer:56 | options bornées, conséquences écrites | trancher entre deux conceptions | non — arbitrage pur |
| 14 | cadrer:122 | protocole de preuve lancé | lire la preuve au premier plan | non — jugement sur la mesure |
| 15 | cadrer:140-144 | décision écrite, plan à faire | lancer `/nouveau-plan` à froid | partiellement — démarrage froid est mécanique |
| 16 | nouveau-plan:9-11 | plan investigué, avant écriture | approuver le plan (Plan Mode) | non — validation de conception |
| 17 | nouveau-plan:47 | 3ᵉ vague de remédiation | s'arrêter, rouvrir `/cadrer` | non — la prémisse est fausse |
| 18 | nouveau-plan:67 | ambiguïté résiduelle en Étape 1 | lever l'ambiguïté avant rédaction | non — scope à trancher |
| 19 | nouveau-plan:87 | gate humaine entre deux tâches | séparer les sessions | non — dépend du contenu déclaré |
| 20 | nouveau-plan:120-127 | mots `gate`/`reprise-manuelle`/`pastille` | déclarer l'exception au cadrage | non — décision d'orchestration |
| 21 | squelette-session:15 | doute en cours d'exécution | STOP, rapport, rendre la main | partiellement — dépend de la nature |
| 22 | squelette-session:69 | condition « Si bloqué » atteinte | STOP + signaler | partiellement — souvent un N0 rouge |
| 23 | fin-de-tache:27 | écart au plan sans `Latitude` | STOP sur tout écart | partiellement — écart mécanique jugeable |
| 24 | fin-de-tache:47-49 | fichier géré du manifeste modifié | réparer via le dépôt source | partiellement — détectable par hash |
| 25 | fin-de-tache:75-76 | sessions du plan restantes | ne pas pusher, push groupé | oui |
| 26 | fin-de-tache:96-99 | session commencée dans un worktree | signaler au lieu de clore | oui |
| 27 | fin-de-tache:115-121 | outil `Agent` absent du bac à sable | signaler la revue absente, clore | oui |
| 28 | fin-de-tache:144-147 | bloquant de revue, mode solo | corriger sur-le-champ ou reporter | partiellement — tri du défaut |
| 29 | fin-de-tache:186-190 | session suivante prête | lancer la pastille, régler modèle/effort | partiellement — réglage humain obligatoire |
| 30 | orchestrer-plan:59 | fichier non commité intersectant la vague | STOP, ne pas écraser | oui |
| 31 | orchestrer-plan:64-67 | effort ambiant < effort demandé | régler l'effort, c'est un humain | non — le harnais ne le pose pas |
| 32 | orchestrer-plan:160-166 | hors Desktop, ou session `pastille` | lancer chaque session à la main | partiellement — contrainte d'outillage |
| 33 | orchestrer-plan:227-229 | revue de session à bloquant | arbitrer le défaut trouvé | partiellement — non bloquant, tri différé |
| 34 | orchestrer-plan:274-275 | vague marquée `reprise-manuelle` | reprendre l'échec soi-même | non — déclaré au cadrage |
| 35 | orchestrer-plan:282-287 | vague marquée `gate` | relancer explicitement la skill | non — gate produit voulue |
| 36 | orchestrer-plan:320-338 | verdict `DECISION` collecté | choisir entre 2-4 issues chiffrées | non — choix par construction |
| 37 | remediation.md:24-25 | budget épuisé (2 reprises, 1 enquête) | trancher sans rien relancer | non — plafond d'autonomie |
| 38 | remediation.md:35 | sortie tuée par filtre de contenu | changer la mécanique d'écriture | non — N0 ne tourne jamais |
| 39 | remediation.md:64-67 | prémisse `CONFIRMEE` ou `INDECIDABLE` | étendre, réduire ou abandonner | non — le périmètre change |
| 40 | reprendre-echec:36-39 | table des gates de reprise | arbitrer selon le verdict rendu | non — irréversible ou périmètre |
| 41 | reprendre-echec:208-212 | annulation dépassant un `git checkout` | décider quoi annuler | non — destructif, sans retour |
| 42 | reprendre-echec:222-225 | diagnostic révèle prémisse fausse | rouvrir `/nouveau-plan` en extension | non — le plan change |
| 43 | reprendre:59 | `VALIDATION.md` non vide | rappeler le N2 en attente | non — jugement produit |
| 44 | reprendre:92 | action proposée en fin de reprise | attendre le oui avant d'exécuter | partiellement — souvent une action mécanique |
| 45 | verif-visuelle:30 | bandeau `Desktop`, outils absents | STOP, session mal lancée | oui |
| 46 | verif-visuelle:34-37 | `navigate` refusé en sous-agent | dérouler le N1 au premier plan | oui |
| 47 | verif-visuelle:79-96 | pas de navigateur in-app | dérouler la checklist N1+N2 | partiellement — N1 automatisable, N2 non |
| 48 | nouveau-projet:58-59 | synthèse d'interview prête | valider avant d'écrire un fichier | non — cadrage produit |
| 49 | nouveau-projet:87-89 | dépôt sous dossier synchronisé | exclure `.git`, attendre le oui | non — action hors du dépôt |
| 50 | migrer-projet:64 | repo vide, aucun code | STOP → `/nouveau-projet` | oui |
| 51 | migrer-projet:111-112 | réponse contredisant le code lu | trancher où est la vraie dette | non — arbitrage sur le réel |
| 52 | migrer-projet:114-119 | voie retenue, avant écriture | valider suppressions et créations | non — perte de contenu irréversible |
| 53 | migrer-projet:269 | dépôt sans `git init` | demander avant d'initialiser | non — hors périmètre du projet |
| 54 | maj-workflow:47-53 | ligne `DÉRIVE` sur fichier géré | arbitrer : remonter ou écraser | non — écrasement irréversible |
| 55 | revue-de-conception:48-51 | revue lancée sans humain présent | s'arrêter après le constat | non — l'interview est le cœur |
| 56 | revue-de-conception:77 | N0 rouge au diagnostic | s'arrêter, réparer d'abord | oui |
| 57 | revue-de-conception:122-126 | étalon recalé en dix lignes | valider explicitement l'objectif | non — définit le but |
| 58 | verificateur-n0.md:18 | aucune commande dans `CLAUDE.md` | le dire et s'arrêter | oui |
| 59 | verificateur-premisse.md:39-42 | prémisse invérifiable par lecture | trancher le faux problème | non — ni lecture ni N0 |
| 60 | pedagogue.md:28-38 | choix structurant, coûteux à défaire | 2-3 options, attendre l'arbitrage | non — engage la suite |

## Lecture

Répartition : 34 « non » (57 %, justes tels quels), 13 « partiellement » (22 %, le vrai gisement),
12 « oui » (20 %, des gates mal nommées qui ne coûtent aucune latence).

Les 13 « partiellement » forment trois familles :

- **Le STOP générique de l'exécutant** (#11, #21, #22, #23) — `EXECUTANT.md:10` et le squelette de
  session imposent STOP sur « doute ou blocage » sans distinguer la nature, alors que
  `WORKFLOW.md` §9a sait déjà trancher (un `environnement` à portée se corrige et continue).
  C'est la duplication la plus coûteuse : c'est elle que (c) reprend dans la décision.
- **Les points de relance manuelle** (#15, #29, #32) — l'humain n'est sollicité que parce que rien
  ne pose modèle et effort à sa place. Contrainte d'outillage, pas un choix de conception.
- **Les tris différés** (#24, #28, #33) — bloquants de revue et fichiers gérés modifiés : seul le
  *verdict* est mécanique, l'arbitrage reste humain. Restent des questions (voir « Écarté » dans
  la décision).

Asymétrie notée : la doctrine §9c (« un plan ne s'arrête que sur un choix ») s'applique à
l'orchestration mais pas aux cinq gates de cadrage amont (#48, #52, #57 notamment) — cohérent,
ce sont des jugements produit, mais aucune ne renvoie au critère. C'est ce que (c) corrige par le
mécanisme de renvoi de (a).
