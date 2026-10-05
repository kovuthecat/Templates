`feat(preuve): mods d'orchestration O1 à O5 et leurs tests simulés` (T6) |`feat(preuve): observateur v2 (refus par isError, plan en argument, journal sans chemin en dur)` (T3) · `feat(preuve): harnais — consignes A et B, attente bornée, collecte des mesures` (T4) · `test(fixture): plans P92 et P93 pour M3 bis, consignes A et B relues` (T5) |`feat(preuve): mod de limites d'usage L et ses tests simulés` (T2) |`feat(preuve): mod de fichiers F et ses tests simulés` (T1) |# Plan P13 — Preuves des mods, autonomes et parallèles   (rédigé par Opus)

Workflow : v0.54.0
Preuve N0 : requise

## Objectif d'ensemble
P12 a demandé une dizaine de gestes et a laissé sans réponse la question du chargement à froid
(M1). P13 rejoue la preuve **sans toi** et l'élargit. On mesure les mods de fichiers, de limites
d'usage et d'orchestration. On mesure aussi le chargement à froid, la garde git en arrière-plan,
le coût d'un plan rejoué deux fois, et le lancement de sessions neuves par l'orchestrateur
(à la place de la pastille).

À la fin, un fichier de mesures donne un verdict positif ou négatif par mod, contre les critères
écrits d'avance. Il compte aussi les gestes humains demandés, cible 0.

Rien n'entre dans le plugin : tout se déroule sur la branche jetable `preuve/mods-2`. Les statuts,
les preuves N0 et les revues de ce plan y vivent. Sur `main`, seul le fichier de mesures revient.
Décision : `docs/decisions/2026-10-05-preuves-mods-autonomes.md`.

**Risques du plan** :
- Une session planifiée pourrait réclamer une approbation (permission, outil) que personne ne
  donne. Elle resterait alors bloquée. Réfuté si les deux sessions laissent leur fichier témoin
  sans carte d'approbation. Sinon, c'est un résultat négatif de M5, chiffré en gestes.
- La notification de fin pourrait ne pas réveiller l'orchestrateur. Un minuteur de secours le
  réveille au bout de 50 min. Y recourir est lui-même un résultat négatif de M5.
- Une session planifiée ne fait qu'un tour. Le modèle réglé après coup (`set_session_model`)
  pourrait donc ne jamais s'appliquer au travail. Réfuté si `get_session` montre Sonnet pendant le
  premier tour de travail.
- `agent.spawn` pourrait ne pas se déclencher pour les sous-agents du plugin (`workflow:session-*`).
  Réfuté si les appels sondes de la session A apparaissent dans le journal du mod d'orchestration.

**Lancement** — une conversation Desktop en Sonnet, sur la branche `preuve/mods-2`, avec cette
phrase :
`/orchestrer-plan P13 — exception de preuve : S6 se joue dans ce fil, jamais en sous-agent (voir sa ligne « en clair »).`

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1 | F — mod de fichiers | Sonnet | high | — | — | `preuves/mods/fichiers/` | [ ] | `feat(preuve): mod de fichiers F et ses tests simulés` (T1) |
| [S2](S2.md) | T2 | L — mod de limites d'usage | Sonnet | medium | — | — | `preuves/mods/limites/` | [ ] | `feat(preuve): mod de limites d'usage L et ses tests simulés` (T2) |
| [S3](S3.md) | T3-T5 | H — observateur v2, harnais, plans de fixture | Sonnet | high | — | — | `preuves/mods/observateur/` · `preuves/harnais/` · `plans/P92/` · `plans/P93/` | [ ] | `feat(preuve): observateur v2 (refus par isError, plan en argument, journal sans chemin en dur)` (T3) · `feat(preuve): harnais — consignes A et B, attente bornée, collecte des mesures` (T4) · `test(fixture): plans P92 et P93 pour M3 bis, consignes A et B relues` (T5) |
| [S4](S4.md) | T6 | O — mods d'orchestration O1 à O5 | Sonnet | high | — | — | `preuves/mods/orchestration/` | [ ] | `feat(preuve): mods d'orchestration O1 à O5 et leurs tests simulés` (T6) |
| [S5](S5.md) | T7 | Installation à froid des quatre mods | Sonnet | medium | — | S1, S2, S3, S4 | `plugin/hooks/hooks.json` · `plugin/hooks/observateur.tsx` · `plugin/hooks/fichiers.ts` · `plugin/hooks/limites.ts` · `plugin/hooks/orchestration.ts` · `plugin/.claude-plugin/plugin.json` · `.gitignore` | [ ] | — |
| [S6](S6.md) | T8-T9 | M5 et mesures en direct (jouée par l'orchestrateur) | Sonnet | medium | — | S5 | `plans/P92/` · `plans/P93/` · `preuves/fixtures/` · `docs/analyses/preuves-mods-autonomes-releves.md` · `TASKS.md` | [ ] | — |
| [S7](S7.md) | T10-T11 | Rendu, désinstallation, report sur `main` | Sonnet | medium | — | S6 | `docs/analyses/2026-10-05-preuves-mods-autonomes-mesures.md` · `plugin/hooks/hooks.json` · `plugin/hooks/observateur.tsx` · `plugin/hooks/fichiers.ts` · `plugin/hooks/limites.ts` · `plugin/hooks/orchestration.ts` · `plugin/.claude-plugin/plugin.json` · `.gitignore` | [ ] | — |

## Ordonnancement
- **Vague 1 — parallélisable** : S1 · S2 · S3 · S4 (zones disjointes, aucune dépendance).
  *Pourquoi maintenant* : les quatre mods doivent exister et passer leurs tests avant d'être
  installés. En parallèle, la vague prend le temps de la plus longue session au lieu de la somme
  des quatre (≈ 4 × 40 tours).
  - **S1** — Un mod refuse à une session de plan toute écriture de fichier hors de sa zone. Les
    écritures dans la zone passent, ainsi que celles du fil principal et des fichiers de suivi du
    plan. Les tests simulés en font la preuve, sans rien installer.
  - **S2** — Un mod note la fenêtre de 5 h et la semaine d'usage. Au-delà d'un seuil, il refuse de
    lancer un nouveau sous-agent, avec un motif lisible. Tests simulés au seuil et en dessous.
  - **S3** — L'observateur de P12 est corrigé : il voit les refus, suit le plan voulu et n'a plus de
    chemin en dur. S3 écrit aussi les consignes des deux sessions planifiées (A et B), le script qui
    rassemble les mesures, et deux petits plans de test identiques, P92 et P93.
  - **S4** — Un mod en cinq interrupteurs. Il impose le modèle écrit dans l'index, injecte les
    règles communes aux sous-agents, et lance un sous-agent au premier plan quand rien n'est dit. Il
    recueille aussi les verdicts et les coupures de quota, et affiche une ligne d'état. Chacun est
    prouvé par des tests simulés.
- **Vague 2** : S5 (après S1 à S4).
  *Pourquoi maintenant* : un mod ne se charge qu'au démarrage d'une conversation. Il faut donc
  l'installer avant que l'orchestrateur ouvre les deux sessions neuves.
  - **S5** — Les quatre mods entrent dans le plugin de la branche, qui est réinstallé. À partir de
    là, toute conversation neuve de ce projet les charge. Le moteur valide chaque module avant
    l'installation.
- **Vague 3** : S6 (après S5).
  *Pourquoi maintenant* : c'est la mesure elle-même. Elle demande les mods installés, et un
  orchestrateur qui n'a pas encore rendu la main.
  - **S6** — **Jouée par l'orchestrateur lui-même, jamais en sous-agent** (exception de preuve,
    décision du 2026-10-05). Cela vaut aussi pour `lancer`, `reprendre`, `enqueter` et
    `relancer-interrompue` : l'orchestrateur ouvre `plans/P13/S6.md` et le déroule dans son propre
    fil. Il commite ses tâches avec leur repère, coche `[x]`, puis rappelle le script.
    En clair : l'orchestrateur ouvre deux conversations neuves sans toi et règle leur modèle. Il
    rend la main, et doit être réveillé par leur fin. Chacune joue un petit plan de test pendant que
    les mods mesurent. Ensuite il range ces conversations aux archives et supprime les tâches. Un
    fichier de relevés bruts sort sur la branche.
- **Vague 4** : S7 (après S6).
  *Pourquoi maintenant* : le rendu ne s'écrit qu'une fois tous les relevés faits, et la
  désinstallation ne doit pas précéder la dernière mesure.
  - **S7** — Le fichier de mesures donne un verdict par mod et le nombre de gestes humains. Les mods
    sortent du plugin, qui revient à l'état de `main`. Seul ce fichier est reporté sur `main`, sans
    que la branche de travail ne change.
- **Vague 5 — clôture** : `cloturer` par l'orchestrateur, sur `preuve/mods-2`. Pas de commits de
  code à rattraper. La décision d'adopter ou non un mod viendra ensuite, dans un `/cadrer` sur
  `main`.
