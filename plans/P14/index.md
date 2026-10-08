# Plan P14 — Preuve : régler modèle et effort d'une session planifiée dès son premier tour   (rédigé par Opus)

Workflow : v0.54.0
Preuve N0 : requise

Clos : 2026-10-08 — preuve conclue sur sa branche jetable ; mesures docs/analyses/2026-10-06-reglage-sessions-planifiees-mesures.md

## Objectif d'ensemble
Aujourd'hui, une session lancée par tâche planifiée tourne au modèle et à l'effort de la
conversation qui la lance, pas à ceux de sa ligne d'index (M5, P13). P14 établit par la mesure
comment elle peut tourner, **dès sa première requête**, au réglage de l'index, avec un seul
démarrage payé : d'abord par deux lignes dans le fichier de la tâche (voie B), puis, seulement si
cela ne suffit pas, par un mod (voie C).

À la fin, un fichier de mesures dit quelle voie retenir (B, C, ou le repli A, la session relais),
avec les lignes de transcription qui le prouvent. Rien n'entre dans le plugin : tout se déroule sur
la branche jetable `preuve/reglage-session`, où vivent statuts, preuves N0 et revues ; seul le
fichier de mesures revient sur `main`.
Décision : `docs/decisions/2026-10-06-reglage-des-sessions-planifiees.md`.

**Écart à la décision, tranché par l'utilisateur le 2026-10-06** : le plan de test P94 vise
**Opus · low**, non Haiku · low. Sur ce poste, les transcriptions des sessions Haiku ne portent pas
l'effort (4 sur 4, 0 champ `effort`) : l'axe effort n'aurait pas été mesurable. Les critères de la
décision se lisent « Opus » là où ils disent « Haiku ».

**Risques du plan** :
- La création d'une tâche planifiée peut être refusée par le classificateur du mode automatique
  (`P13-A`, M5). Réfuté si `P94-B` est créée du premier coup. Sinon : une relance, puis « non
  conclu : création refusée », et un geste humain compté.
- L'identifiant rendu au lancement peut ne pas être le nom du fichier de transcription. Réfuté si
  `<id>.jsonl` existe ; sinon, repérage par le prompt exact et l'heure.
- La session de test peut réclamer une approbation malgré sa lecture seule (mode de permission
  hérité, M5), et faire plus d'un tour. Réfuté si sa transcription n'a qu'un tour. Sinon la mesure
  est « non conclu : fixture », jamais « négative ».

**Lancement** — une conversation Desktop en **Sonnet · medium** (distincte de la cible sur les deux
axes), avec cette phrase :
`/orchestrer-plan P14 — exception de preuve : S1 et S3 se jouent dans ce fil, jamais en sous-agent (voir leur ligne « en clair »).`

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T3 | Étape 0, plan de test P94, mesure B (jouée par l'orchestrateur) | Sonnet | medium | — | — | `plans/P94/` · `preuves/reglage/transcription.mjs` · `docs/analyses/reglage-sessions-planifiees-releves.md` | [ ] | — |
| [S2](S2.md) | T4 | C1 — mod `turn.step` et ses tests simulés (si B ne suffit pas) | Sonnet | high | — | S1 | `preuves/mods/reglage/` | [ ] | — |
| [S3](S3.md) | T5-T7 | C2 — mod en direct, puis plugin rendu à l'état de `main` (jouée par l'orchestrateur) | Sonnet | medium | — | S2 | `plugin/hooks/hooks.json` · `plugin/hooks/reglage.ts` · `docs/analyses/reglage-sessions-planifiees-releves.md` | [ ] | — |
| [S4](S4.md) | T8 | Rendu, vérification de l'état, report sur `main` | Sonnet | medium | — | S3 | `docs/analyses/2026-10-06-reglage-sessions-planifiees-mesures.md` | [ ] | — |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : B est la voie la plus simple ; son verdict décide si S2 et S3 ont quelque
  chose à construire.
  - **S1** — **Jouée par l'orchestrateur lui-même, dans son fil, jamais en sous-agent** (exception de
    preuve : seule la conversation qui crée une tâche planifiée en voit la fin ; cela vaut aussi pour
    `reprendre`, `enqueter` et `relancer-interrompue`). L'orchestrateur ouvre `plans/P14/S1.md` et le
    déroule, commite ses tâches avec leur repère, coche `[x]`, puis rappelle le script.
    En clair : la branche de preuve est créée, un petit plan de test (P94) y est posé, puis une
    tâche planifiée le joue avec deux lignes de réglage ajoutées à son fichier. Tu verras un fichier
    de relevés qui dit, transcription à l'appui, si la session a tourné en Opus · low dès sa
    première requête. La tâche est supprimée à la fin, quoi qu'il arrive.
- **Vague 2** : S2 (après S1).
  *Pourquoi maintenant* : le mod ne se construit que si B a échoué ; il doit passer ses tests avant
  d'être installé.
  - **S2** — Si B a suffi, la session constate qu'il n'y a rien à construire et s'arrête. Sinon, un
    mod réécrit modèle et effort de chaque requête d'une session ouverte sur un plan, d'après sa
    ligne d'index ; des tests simulés le prouvent, sans rien installer.
- **Vague 3** : S3 (après S2).
  *Pourquoi maintenant* : un mod ne se charge qu'au démarrage d'une conversation ; il faut l'avoir
  testé avant de l'installer et de lancer la tâche qui le mesure.
  - **S3** — **Jouée par l'orchestrateur lui-même, dans son fil, jamais en sous-agent** (même
    exception que S1). Sans mod construit en S2, rien à faire. Sinon : le mod est installé dans le
    plugin de la branche, une deuxième tâche joue le plan de test, et les relevés disent si la
    première requête est partie au bon réglage. Le plugin est ensuite remis à l'état de `main`,
    quoi qu'il arrive.
- **Vague 4** : S4 (après S3).
  *Pourquoi maintenant* : le rendu ne s'écrit qu'une fois toutes les mesures faites et le poste
  remis en ordre.
  - **S4** — Le fichier de mesures dit quelle voie retenir (B, C ou la session relais) et combien de
    gestes humains la preuve a demandés. Il est reporté seul sur `main`.
- **Vague 5 — clôture** : `cloturer` par l'orchestrateur, sur `preuve/reglage-session`. Pas de
  commits de code à rattraper. L'intégration à `/orchestrer-plan` viendra ensuite, dans une décision
  sur `main`, au vu du verdict.
