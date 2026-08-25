# 2026-08-25 — Décision : sous-agent par défaut, headless en exception déclarée (option C)

**Statut : TRANCHÉE — option C retenue par Thibault le 2026-08-25.** Chantier : plan P3 de ce dépôt.

## Question

`/executer-vague` maintient deux voies de lancement (processus `claude -p` / sous-agent) et la
machinerie de verdict qui va avec (~150 lignes de lecteur JSON, PANNE, fail-closed). Depuis 0.14.1,
**les commits sont l'unique juge** dans les deux voies. Que reste-t-il à la voie headless qui
justifie son coût — et sinon, jusqu'où simplifier ?

**Critère de fin** : une option choisie, qui fixe (a) la ou les voies survivantes, (b) le canal de
verdict unique, (c) le sort des ~490 lignes de la skill.

## Faits établis (mesurés, pas supposés)

| Fait | Mesure |
| --- | --- |
| Un sous-agent hérite du navigateur in-app (18 outils) | testé 2026-08-24, direct, non différé |
| Un sous-agent hérite de tout l'environnement de la session (permissions, MCP) | par construction ; aucun préflight CLI/trust/allowlist nécessaire |
| L'outil `Agent` règle le **modèle** mais pas l'**effort** | schéma de l'outil — pas de paramètre `effort` |
| L'effort d'une session se fixe à son ouverture (`effortLevel` projet, ou choix utilisateur) | doc Claude Code ; non modifiable en cours de session |
| La voie headless a perdu 3 vagues sur 3 pannes d'environnement (JSON tué, trust ignoré, timeout Bash) | MYO P1-P3, 2026-08-24/25 |
| Le parallélisme réel impose `wave.lock` **quelle que soit la voie** (index git partagé) | indépendant du mode de lancement |
| Un processus `claude -p` détaché survit à la fermeture de la fenêtre ; un sous-agent non | par construction |

## Options

### A — Statu quo (deux voies pleines)
Coûte : 492 lignes relues à chaque orchestration, double machinerie de verdict, et la classe de
pannes « verdict perdu en route » qu'on rustine depuis deux jours. Ferme : rien.
**Écartée** : le statu quo est précisément ce que l'audit a mis en cause.

### B — Voie unique sous-agent
Supprime : lecteur JSON, PANNE, préflight CLI (2a), préflight trust/allowlist, gabarit nohup,
`.claude/vague/*.json|.exit|.stderr` — estimation −200 lignes et la classe de pannes entière.
Coûte : (1) plus **aucun** réglage d'effort par session orchestrée — tout tourne à l'effort ambiant,
compensable seulement par le modèle ; (2) une vague meurt si la fenêtre d'orchestration se ferme.
Ferme : l'orchestration résiliente longue durée (vague nocturne lancée puis machine fermée).

### C — Sous-agent par défaut, headless en exception déclarée *(recommandée)*
Le sous-agent devient la voie normale de **toutes** les sessions orchestrées (plus seulement
`Desktop`) : zéro préflight, zéro clic, verdict = commits. La voie headless ne subsiste que sur
déclaration explicite dans l'index (colonne `Env.` = `headless`), pour exactement deux cas :
- une session dont l'**effort** (`high`/`xhigh`) doit être réellement appliqué ;
- une vague à lancer **sans garder la fenêtre ouverte**.
Le lecteur JSON se réduit à l'extraction du motif : les commits jugent déjà (0.14.1), donc plus de
PANNE, plus de fail-closed élaboré — un JSON illisible n'est qu'un motif absent.
Coûte : deux voies subsistent dans la doc (mais l'une devient ~30 lignes au lieu de ~200).

## Chantier si C est retenue (un plan Templates, 2-3 sessions)

1. **Domicile unique des règles** — la cause racine des trois bugs du 2026-08-24 : chaque règle
   énoncée à 3-4 endroits. Domiciles : §4a statuts · §4b commits · §5b sessions/voies — les skills
   **renvoient**, ne reformulent plus.
2. **Réécriture d'`executer-vague`** autour de C : cible ≤ 250 lignes, narratif historique déplacé
   vers `docs/decisions/` (le *pourquoi* ne se paie pas à chaque orchestration).
3. **Colonne `Env.`** : `—` devient « sous-agent » implicite ; `headless` devient la valeur
   d'exception, justifiée dans le bandeau (`/nouveau-plan` mis à jour).

## Recommandation

**C.** B est plus pur mais sacrifie les deux seuls services que le headless rend encore, pour
économiser ~30 lignes de plus que C. C aligne le défaut sur la voie fiable (celle qui n'a jamais
perdu un verdict) et fait de la voie fragile une exception qu'on choisit en connaissance de cause —
la même logique qui a relégué la pastille au repli.

Option écartée en une ligne : faire porter l'effort par le sous-agent en attendant un futur
paramètre `effort` de l'outil `Agent` — pari sur une évolution du harnais, invérifiable aujourd'hui.
