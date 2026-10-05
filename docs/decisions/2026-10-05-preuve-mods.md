# 2026-10-05 — Mods de Claude Code : preuve avant adoption

> Issue de `/cadrer` : **Preuve à faire** (protocole de preuve, pas de décision d'adoption).

## Ce que ça change, en clair

**Pour l'instant, rien n'entre dans le workflow ni dans les projets.** Une expérience bornée
(une session, sur une branche jetable) mesure quatre choses. Une décision suivra au vu des
chiffres et tranchera entre :
- adopter un mod d'observation (tableau d'orchestration, compteur de tokens) ;
- poursuivre, ou non, les leviers de coût et la garde git par mod ;
- abandonner.

D'ici là, un `/nouveau-plan` peut porter ce protocole dans une session de type `exploration`.

## Question

Les mods de Claude Code apportent-ils au workflow un gain mesurable, à un coût de maintenance
acceptable ? Les mods sont des plugins de « function hooks » en TypeScript, avec panneau, bandeau,
status line, toast, refus ou réécriture d'appels d'outils, et lecture de l'usage. Le gain attendu
porte sur trois points :
- la fiabilité ;
- le coût en tokens ;
- la visibilité de l'orchestration.

## Contexte

L'idée vient de l'article d'Anthropic sur les mods, pas d'une gêne précise. Le besoin nommé à
l'interview : la fiabilité et le coût en tokens du workflow, et voir l'orchestration pendant
qu'elle tourne.

D'après la doc lue (bundle `plugin-authoring` 2.1.286, `reference.md` et `types/claude-code.d.ts`),
les mods offrent les leviers suivants :
- **Mesure.** `turn.complete.usage` donne, par tour, les tokens input, output, cache read et cache
  creation. Avec `agentId`, on les rattache à chaque sous-agent. Le workflow n'a aujourd'hui aucun
  chiffre de coût par session ni par plan.
- **Réduction.**
  - `prompt.section` et `prompt.compose` retirent ou raccourcissent des sections du prompt
    système.
  - `skill.prompt` réécrit une skill au chargement.
  - `prompt.attachment` supprime un rappel du moteur.
  - `tool.describe` diffère un outil.
  - La doc avertit qu'une réponse instable « dépense le cache » à chaque appel.
- **Garde des sous-agents.** D'après la doc, « a subagent's tools raise their own `tool.call` ».
  C'est le trou de l'incident `docs/workflow/incidents/2026-09-17-commit-sous-verrou-non-bloque.md`.
- **Affichage.** `AbovePrompt` fonctionne en terminal et dans Desktop, `Pane` partout sauf sur
  mobile.
- **Coexistence.** Les hooks commande existants restent dans la chaîne (gérés → modules →
  settings).

Trois points ne se tranchent pas en lecture :
- **Chargement.** La doc ne mentionne l'interrupteur `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` que
  pour `claude -p`. Un plugin installé (marketplace locale, vendoré) charge-t-il ses `modules` en
  session interactive sans réglage ? Et en session cloud ?
- **Coût réel.** Combien coûte un plan, et où ?
- **Cache.** Que devient-il quand on touche au prompt ?

D'où la preuve plutôt que le plan (signal C6 : prémisse comportementale non sondable en lecture,
et critère de succès qui n'existe pas encore comme nombre).

## Mesures

Les résultats positif et négatif sont écrits d'avance. L'instrument est un mod d'**observation
seule** : aucun refus, aucune réécriture.

- **M1 — Chargement.**
  - **Protocole :** déclarer le module dans le plugin installé (marketplace locale,
    `--scope local`), puis ouvrir une session Desktop interactive sans variable d'environnement.
  - **Positif :** `session.start` du mod s'exécute, et les cinq hooks commande restent actifs
    (CLAUDE-BASE toujours injecté).
  - **Négatif :** le chargement exige `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`, la question de
    hot-reload ou un second fichier de hooks ; ou bien la cohabitation casse un hook commande. Ce
    coût de distribution est alors chiffré par projet.
- **M2 — Sous-agents.**
  - **Protocole :** un `tool.call` observateur journalise `agentId` pour les appels Bash d'un
    sous-agent lancé par l'outil Agent (`workflow:session-low`, tâche triviale). Dans la même
    exécution, noter si le PreToolUse **classique** se déclenche aussi.
  - **Positif :** `agentId` est présent et le hook classique reste muet. La garde git par mod
    comblerait alors l'incident 2026-09-17.
  - **Négatif :** `agentId` est absent, ou le hook classique se déclenche déjà. Dans ce cas,
    aucun gain de fiabilité.
- **M3 — Coût.**
  - **Protocole :** agréger `turn.complete.usage` par `agentId` (input, output, cache read, cache
    creation) sur le déroulé d'un petit plan réel, rejoué deux fois sur un projet jetable. Le
    résultat va dans un JSON hors dépôt.
  - **Positif :** les deux exécutions s'écartent de moins de 15 %, et le poste dominant est
    identifié (orchestrateur, sessions ou préfixe système).
  - **Négatif :** l'usage est absent ou incomplet pour les sous-agents, et la mesure du coût par
    mod est impossible.
  - **M3b, si le budget le permet :** essayer un seul levier (`prompt.attachment` ou
    `tool.describe`) contre la référence. Le résultat est négatif si les tokens de cache
    creation annulent le gain.
- **M4 — Affichage.**
  - **Protocole :** un `Pane` ou un `AbovePrompt` dans l'onglet Code montre la sortie de
    `prochaine-action.mjs P<n> --json`, via `$.process.run`. À défaut, il lit `index.md` via
    `$.fs`. L'affichage doit se rafraîchir après chaque vague.
  - **Positif :** l'état est visible et à jour sans rien demander, et aucune ligne de refus
    n'apparaît dans le transcript.
  - **Négatif :** rien n'est rendu dans Desktop, ou `$.process` est refusé (« CLI only ») et
    `$.fs` ne suffit pas.

## Cadre

- **Branche :** `preuve/mods`, jetable et poussée, jamais `main`.
- **Budget :** une session d'exploration, environ 60 tours.
- **N0 final, sur le résultat :** `node tests/tester-hooks.mjs`, `claude plugin validate plugin` et
  `node plugin/bin/n0.mjs`. Les hooks existants doivent rester intacts.
- **Tout est contestable pendant la preuve**, y compris la prémisse de l'incident 2026-09-17 et la
  doc d'accès anticipé (l'API change entre versions).

**Ce qui revient, dans cet ordre :**
1. les mesures et la commande qui les reproduit ;
2. ce qui a été réfuté ;
3. le mod candidat, sur sa branche.

Ensuite viennent une passe `relecteur-session`, puis la décision d'adoption.

## Écarté pour l'instant

- **Orchestration en code** (`$.agent.spawn` + `turn.complete` filtré) : elle dégèlerait
  2026-09-12 (une seule voie d'orchestration) et 2026-09-22 (Sonnet orchestrateur). À rouvrir si
  M3 montre que l'orchestrateur est le poste dominant.
- **Garde git réécrite en mod :** attend M2.
- **Réécriture du prompt système ou des skills :** attend M3.

## Brief

Brief : inchangé (aucun `PROJECT_BRIEF.md` dans ce dépôt).

## Grille — état final

| Dimension | État | Preuve |
| --- | --- | --- |
| problème concret | READY | coût en tokens non mesuré, orchestration opaque, incident 2026-09-17 |
| résultat visé | OPEN | expérience (M3) |
| vérification | OPEN | expérience (M1 à M4) |
| périmètre | READY | plugin `workflow` |
| cohérence | OPEN | expérience (M1) |
