# Plan P15 — Preuve : une session neuve de bout en bout, sans geste humain   (rédigé par Opus)

Workflow : v0.54.0
Preuve N0 : requise

Clos : 2026-10-08 — S1 livrée (0.55.0), suite conclue sur branche ; mesures docs/analyses/2026-10-06-session-neuve-mesures.md, décision docs/decisions/2026-10-06-apres-p15.md

## Objectif d'ensemble
Aujourd'hui, pour lancer une session de plan dans une conversation neuve, il faut la pastille et ton
clic. P15 mesure si l'orchestrateur peut le faire seul : ouvrir deux sessions planifiées qui
travaillent sans aucun geste, au modèle et à l'effort de l'index dès leur première requête, visibles
en Remote Control, puis reprendre la main tout seul à leur fin. Il mesure aussi si un mod peut se
câbler par les settings d'un projet, sans installer de plugin.

À la fin, un fichier de mesures donne un verdict par blocage (P, R, M, E, W1, W2, A, K, Report),
chacun contre son critère écrit d'avance, et compte tes gestes (cible : 0 après le réglage). Seul ce
fichier revient sur `main`. Tout le reste se joue sur la branche jetable `preuve/session-neuve`, après
un correctif préalable sur `main` : le hook Stop ne relance plus une session planifiée.
Décision : `docs/decisions/2026-10-06-suite-des-preuves-mods.md` (« Protocole de preuve — P15 »,
« Leçons de méthode »).

**Réglage préalable, fait par toi avant le lancement** : les règles du mode auto ne se lisent que dans
`~/.claude/settings.json` (jamais dans les settings du projet) et ne se rechargent pas à chaud ; le
classificateur a refusé que le cadreur les pose. Le script de pose (sauvegarde :
`~/.claude/settings.json.avant-P15`) ajoute des règles `autoMode.allow` préfixées `P15 —`, règle
l'effort d'Opus à `low` (`modelSettings`, le réglage que mesure E : une session orchestrée ne touche
jamais un fichier de settings), et corrige durablement la description d'environnement (dossier
`C:\Users\kovu\Projets`, dépôts `github.com/kovuthecat/*` de confiance — ton choix du 2026-10-06).
Ce geste est compté à part. Revers : jusqu'au retrait en S6, une session Opus ouverte dans un projet
sans `modelSettings` propre (Templates compris) tourne en `low`. La conversation d'orchestration
s'ouvre **après** la pose ; S3 le vérifie.

**Risques du plan** :
- La détection « session planifiée » du hook Stop (S1) pourrait manquer un cas. Réfuté si A et B
  finissent en un seul tour, sans retour du hook Stop.
- Les règles du mode auto pourraient ne pas être chargées, ou être chargées et insuffisantes. S3 cite
  la configuration effective (`claude auto-mode config`) au départ : un refus se range alors dans
  « règle absente » ou « règle présente, refus quand même ».
- La doc dit le `model:` du `SKILL.md` de tâche ignoré, alors que P14 l'a mesuré appliqué. Réfuté (ou
  confirmé) par M.
- Un client Remote Control connecté pourrait bloquer l'archivage (P13). Le motif de tout refus est
  relevé en A.
- `claude -p` pourrait ne charger aucun mod. Le témoin positif de S5 le distingue d'un négatif de K.
- L'instrument de P14 ne survit que dans le commit orphelin `1759667`. Réfuté si S2 le restaure ;
  sinon il le réécrit d'après `plans/P14/S1.md` (T1, Décision clé).
- B pourrait ne pas trouver l'adresse `P15-orchestrateur`. W2 serait alors « non conclu : adresse »,
  jamais négatif.

**Lancement** — après le réglage préalable, une conversation Desktop **neuve**, en **Sonnet · medium**,
**mode auto**, avec cette phrase :
`/orchestrer-plan P15 — exception de preuve : S3 et S4 se jouent dans ce fil, jamais en sous-agent (voir leur ligne « en clair »).`

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1 | Hook Stop : jamais de relance d'une session planifiée (sur `main`) | Sonnet | medium | — | — | `plugin/hooks/stop-contexte.mjs` · `plugin/hooks/lib.mjs` · `tests/tester-hooks.mjs` · `plugin/.claude-plugin/plugin.json` · `plugin/WORKFLOW.md` · `CHANGELOG.md` | [x] 2026-10-06 | — |
| [S2](S2.md) | T2-T3 | Branche, instrument, plan de fixture P95, tableau des permissions | Sonnet | medium | — | S1 | `preuves/reglage/transcription.mjs` · `preuves/session-neuve/` · `plans/P95/` · `.gitignore` · `docs/analyses/session-neuve-releves.md` | [ ] | — |
| [S3](S3.md) | T4-T5 | Déroulé W1 : session A, réveil par `Bash` (jouée par l'orchestrateur) | Sonnet | medium | — | S2 | `docs/analyses/session-neuve-releves.md` | [ ] | — |
| [S4](S4.md) | T6 | Déroulé W2 : session B, réveil par `SendMessage` (jouée par l'orchestrateur) | Sonnet | medium | — | S3 | `docs/analyses/session-neuve-releves.md` | [ ] | — |
| [S5](S5.md) | T7-T8 | K : un mod câblé par les settings d'un projet sans plugin | Sonnet | medium | — | S4 | `preuves/session-neuve/k/` · `docs/analyses/session-neuve-releves.md` | [ ] | — |
| [S6](S6.md) | T9-T10 | Rendu, report sur `main`, remise en ordre | Sonnet | medium | — | S5 | `docs/analyses/2026-10-06-session-neuve-mesures.md` · `preuves/session-neuve/retirer-reglages.mjs` · `docs/analyses/session-neuve-releves.md` | [ ] | — |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : sans ce correctif, chaque session de test serait relancée par le hook Stop
  après son verdict, ce qui fausse le nombre de tours mesurés (leçon 5) ; il doit être publié avant
  que la branche ne parte de `main`.
  - **S1** — Une session lancée par une tâche planifiée ne reçoit plus d'ordre de continuer du hook
    Stop : elle reçoit au plus un rappel, et s'arrête. Tu le verras à la version 0.55.0 du plugin, et
    à un tour unique par session de test.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : les deux déroulés lisent le plan de test, l'instrument et le réglage
  d'effort ; tout doit être commité et poussé sur la branche avant le premier lancement.
  - **S2** — La branche de preuve part de `main`, l'instrument de P14 est restauré, et un petit plan
    de test (P95, deux sessions) y est posé. Tu verras un tableau qui dit, pour chaque geste prévu,
    quelle règle ou permission l'autorise.
- **Vague 3 — `reprise-manuelle`** : S3 (après S2).
  *Pourquoi maintenant* : W1 et W2 se jouent sur deux déroulés distincts pour ne pas se masquer ; W1
  passe d'abord parce que son réveil ne dépend pas de la session lancée.
  - **S3** — **Jouée par l'orchestrateur lui-même, dans son fil, jamais en sous-agent** (exception de
    preuve : seule la conversation qui lance une tâche planifiée en voit la fin, et c'est elle dont
    on mesure le réveil ; cela vaut aussi pour `reprendre`, `enqueter` et `relancer-interrompue`).
    L'orchestrateur ouvre `plans/P15/S3.md` et le déroule, commite ses tâches avec leur repère,
    coche `[x]`, puis rappelle le script.
    En clair : l'orchestrateur lance seul une session en Opus · low, la rend visible en Remote
    Control, puis rend la main et doit être réveillé par une commande d'attente. Tu verras dans les
    relevés si tout s'est fait sans approbation, au bon modèle et au bon effort dès la première
    requête, et si la session a pu être archivée.
- **Vague 4 — `reprise-manuelle`** : S4 (après S3).
  *Pourquoi maintenant* : le réveil par message se mesure seul, sans commande d'attente vivante qui
  pourrait réveiller l'orchestrateur à sa place.
  - **S4** — **Jouée par l'orchestrateur lui-même, dans son fil, jamais en sous-agent** (même
    exception que S3).
    En clair : même chose avec une session en Haiku, qui prévient elle-même l'orchestrateur par un
    message quand elle a fini. Tu verras si ce message suffit à le réveiller.
- **Vague 5** : S5 (après S4).
  *Pourquoi maintenant* : le plan du chantier des mods n'attend que ce verdict pour choisir sa voie ;
  il passe après les déroulés pour ne pas installer de plugin de test pendant qu'ils tournent.
  - **S5** — Dans un petit projet de test hors du dépôt, sans plugin installé, un mod est déclaré
    dans les settings du projet. Tu verras s'il a écrit sa ligne au démarrage d'une session neuve,
    et, sinon, si le même mod installé en plugin l'écrit (preuve que l'instrument voit les mods).
- **Vague 6** : S6 (après S5).
  *Pourquoi maintenant* : le rendu ne s'écrit qu'une fois toutes les mesures faites, et les règles
  du mode auto ne se retirent qu'après le report, qui en a besoin.
  - **S6** — Le fichier de mesures donne un verdict par blocage et le nombre de tes gestes ; il est
    reporté seul sur `main`. Ensuite, les réglages de la preuve sont retirés et le poste vérifié :
    une commande te sera rendue pour retirer les règles `P15 —` de tes settings, si la session ne
    peut pas le faire.
- **Vague 7 — clôture** : `cloturer` par l'orchestrateur, sur `preuve/session-neuve`. Pas de commits
  de code à rattraper. L'intégration dans `/orchestrer-plan` et `WORKFLOW.md` §5b viendra ensuite,
  dans une décision sur `main`, au vu des verdicts.
