# 2026-09-24 — Revue finale : fins de session à propriétaire unique, verrou réparé, régime économe pour Pro

## Décision
Toutes les recommandations de `docs/revues/2026-09-24-revue-finale-workflow.md` s'appliquent (plan
P10, version 0.45.0). En particulier :

1. **La racine du dépôt** se calcule par `git rev-parse --show-toplevel`. Dans un worktree lié,
   on sonde `git worktree list`. Si la racine reste introuvable, le hook **refuse par défaut**
   (comme sous verrou), avec un message qui explique pourquoi.
2. **Une session orchestrée finit toujours de la même façon** : dernière ligne `VERDICT:`, ni bloc
   de relance, ni `fin-de-plan.md`, aucune suppression de `.revue.md` ni de `.echec.md`. Sous
   `.claude/wave.lock` : ni commit ni push. Ce test se lit **en tête** de la consigne.
3. **`.revue.md` a un seul rédacteur** : l'orchestrateur, qui la committe avec le `[x]!` juste
   après la relecture. En chaînage manuel, c'est la session elle-même, via une étape Relecture de
   `/fin-de-tache`.
4. **La clôture d'un plan orchestré revient à l'orchestrateur** : action `cloturer` →
   `fin-de-plan.md`, qui pose le marqueur `Clos :` dans l'index.
5. **La promesse « bloquant de revue aux quatre conditions ⇒ reprise automatique » est retirée**
   (C5, 2026-09-17, sur ce point seulement). Un bloquant reste un `[x]!`, versé dans `TASKS.md`
   à la clôture.
6. **Opus économe en permanence** : la première reprise tourne sur le modèle de la session, Opus ne
   vient qu'à la deuxième. Au plus **une** passe Opus de remédiation (reprise ou enquête) par
   plan : au-delà, c'est une question. Ce décompte est écrit dans l'index par l'orchestrateur, il
   survit donc à la suppression des `.echec.md`. `critique-plan` reste en Opus.
7. **Coupure par quota = nature `interruption`**, écrite par l'orchestrateur à la collecte. Une
   fois le quota revenu : `SendMessage` à l'agent coupé, par exception aux trois conditions du canal
   court (N0 peut être rouge en pleine édition). Si l'agent ne répond plus → reprise à froid. Une
   interruption ne consomme aucune reprise du budget.
8. **Filtre de contenu = nature `filtre`** → question, jamais une reprise à l'identique.
9. **`EXECUTANT.md` n'est lu que par les agents qui exécutent** (session, reprise, enquête). Il dit
   que `CLAUDE-BASE.md` est absent en sous-agent et le fait lire. Le relecteur ne passe plus qu'une
   fois (sans `/code-review` interne).
10. Le style Pedagogue reste dans le gabarit (préférence du mainteneur).

## Contexte
Revue finale avant le passage de Max à Pro : 45 incidents, dont 16 non traités. Trois causes
majeures ont été vérifiées dans le code :

- depuis le 2026-09-15, `.git` est un fichier dans ~20 projets, donc `racineDepot()` rend
  `C:/Users/Kovu/.gitdirs` et la garde du verrou est morte (6 incidents) ;
- la fin d'une session orchestrée n'a pas de propriétaire : quatre textes se contredisent sur le
  commit des revues, et le bloc de relance écrase `VERDICT:` ;
- aucune nature d'échec ne couvre la coupure par quota.

Sondes du jour :
- une `session-low` n'a pas `CLAUDE-BASE.md` (elle a le `CLAUDE.md` du projet) ;
- `PreToolUse` refuse `git add -A` lancé par un sous-agent : les hooks s'appliquent donc aux
  sous-agents.

## Alternatives envisagées
- Implémenter la reprise automatique d'un bloquant : écartée. Elle coûte une session de plus par
  bloquant sur le quota Pro, pour un défaut qui peut attendre le tri.
- Interrupteur de régime Max/Pro : écarté. Deux comportements à maintenir pour un seul utilisateur.
- `critique-plan` en Sonnet `xhigh` : écarté. La critique ne tourne qu'une fois par plan
  architectural, et c'est là qu'Opus rapporte (incident des cinq plans).
- Reprise à froid après une coupure : gardée seulement en repli. L'agent coupé garde son contexte,
  et c'est ce qui a marché sur ebm-msp.
- Worktree lié sans racine : limite déclarée écartée, car elle laisserait un trou connu dans la
  garde.

## Raison du choix
Chaque défaut majeur venait d'une règle **sans propriétaire unique** ou d'un format **montré par
l'exemple mais lu à la lettre**. Le remède nomme un seul acteur par geste, et fait passer les
squelettes eux-mêmes dans le script sous test. Le passage à Pro rend la remédiation Opus et la
coupure par quota prioritaires : ce sont les postes où le coût se transforme en casse.

## Conséquences
- Le texte d'un geste (commit de revue, clôture, verdict) ne vit qu'à un endroit ; ailleurs, un
  renvoi.
- Le script d'orchestration gagne les actions `cloturer` et `relancer-interrompue`, et les natures
  `filtre` et `interruption`.
- Dans le dépôt source, le plan P10 s'arrête après S4 : il faut réinstaller le plugin local, sinon
  l'orchestrateur 0.44.0 ne connaîtrait pas ces actions.

## Impact IA
Moins de texte chargé par les agents qui ne font que relire ou vérifier. Une lecture de plus
(`CLAUDE-BASE.md`) par session orchestrée.

Brief : inchangé
