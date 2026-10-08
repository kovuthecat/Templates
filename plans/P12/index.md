# Plan P12 — Preuve : les mods de Claude Code apportent-ils un gain mesurable ?   (rédigé par Opus)

Workflow : v0.53.0
Preuve N0 : requise

Clos : 2026-10-08 — preuve conclue sur sa branche jetable ; mesures docs/analyses/2026-10-05-preuve-mods-mesures.md

## Objectif d'ensemble
Aujourd'hui, on ne sait pas combien coûte un plan en tokens, ni où part ce coût. L'orchestration ne
se voit pas pendant qu'elle tourne. Et la garde git laisse passer les commits des sous-agents
(incident du 2026-09-17).

À la fin du plan, quatre réponses chiffrées permettront de décider d'adopter ou non un mod :
- le mod charge-t-il tout seul ?
- voit-il les sous-agents ?
- combien coûte un plan, et où ?
- peut-il afficher l'état du plan dans Desktop ?

Rien n'entre dans le workflow ni dans les projets : le mod reste sur la branche jetable
`preuve/mods`.
Décision : `docs/decisions/2026-10-05-preuve-mods.md`.

**Risques du plan** :
- Un plugin installé pourrait ne charger ses modules qu'avec une variable d'environnement, ou un
  second fichier de hooks. Réfuté si, dans une conversation neuve, le mod trace son démarrage sans
  réglage (M1). Sinon, le coût de distribution est chiffré : c'est un résultat, pas un échec.
- La prémisse de l'incident du 2026-09-17 (le hook classique ne voit pas les sous-agents) est
  peut-être fausse. Réfuté si le hook refuse le commit du sous-agent (M2).

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [S1](S1.md) | T1-T5 | Preuve mods M1 à M4 (exploration, branche `preuve/mods`) | Sonnet | high | — | — | `plugin/hooks/hooks.json` · `plugin/hooks/observateur.tsx` · `plugin/types/index.d.ts` · `plugin/.claude-plugin/plugin.json` (champ `types` seulement) · `plans/P90/` · `plans/P91/` · `docs/analyses/` (mesures et fixtures) — tout sur `preuve/mods`, rien sur `main` | [ ] | — |

## Ordonnancement
- **Vague 1** : S1.
  *Pourquoi maintenant* : sans ces chiffres, la décision d'adopter un mod se prendrait sur la seule
  doc d'accès anticipé, alors que l'API change d'une version à l'autre.
  - **S1** — pastille. On installe un mod qui observe sans rien bloquer. Au milieu, on te demande
    **d'ouvrir une conversation Desktop neuve** : c'est là que se constate le chargement. À la fin,
    un fichier de mesures répond aux quatre questions, avec un verdict positif ou négatif pour
    chacune et la commande qui le reproduit. Pendant le déroulé, un panneau montre l'état d'un
    plan de test, s'il s'affiche.
- **Vague 2 — clôture** : seul le fichier de mesures est reporté sur `main`, avec le statut. Le
  mod candidat reste sur `preuve/mods`. Ensuite viennent une passe `relecteur-session`, puis la
  décision d'adoption.
