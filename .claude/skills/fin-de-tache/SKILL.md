---
name: fin-de-tache
description: Checklist de fin de tâche et de fin de session — statuts, fichiers de contexte, rapport, commit. À dérouler quand une tâche T<n> d'une session S<k> est terminée et validée (N0 build + typecheck OK). Le mode (solo ou vague parallèle) est indiqué dans le bandeau du S<k>.md.
---

# Fin de tâche

Lire le bandeau du `S<k>.md` en cours : **parallèle : oui/non** détermine le mode.

**Commit et push n'ont lieu qu'en fin de plan** (cf. `WORKFLOW.md` §4b), jamais après une tâche ni
une session. En vague parallèle, un hook les refuse tant que `.claude/wave.lock` existe.

**Le statut d'une tâche vit dans un seul fichier : l'`index.md` de son plan.** Ne pas le recopier
ailleurs (ni dans le `S<k>.md`, ni dans `TASKS.md`) — c'est la première source de désynchronisation.

## Après CHAQUE tâche (les deux modes)

1. **N0** : `build` + `typecheck` (+ tests unitaires si logique pure) passent. Sinon la tâche n'est
   pas finie.
2. **N1** : si la tâche touchait l'UI, dérouler `/verif-visuelle`. Un défaut N1 se corrige
   maintenant, il ne se reporte pas.
3. **Rapport court** : Fichiers modifiés · Résumé · N0 lancé · N1 constaté · N2 à faire ·
   Prochaine action. Laisser le diff non commité dans l'arbre de travail.

## Fin de session — mode SOLO (parallèle : non)

4. **Statut** : passer les tâches à `[x]` dans l'`index.md` du plan (colonne Statut), avec la date.
5. **Contexte** : mettre à jour `STATUS.md` ; les autres fichiers **seulement si leur contenu
   change** — un fichier de contexte faux est pire qu'absent.
6. **N2** : consigner dans `VALIDATION.md` **uniquement** ce qui relève du jugement humain
   (esthétique, UX, ton). Rien de ce qu'un navigateur peut constater seul.
7. **Plafonds** : si le hook signale un dépassement, dérouler `/purge-contexte` — pas plus tard.
8. **Ne pas committer ni pusher** si d'autres sessions du plan restent à exécuter.

## Fin de session — mode VAGUE PARALLÈLE (parallèle : oui)

4. **Ne toucher AUCUN fichier partagé** : ni `STATUS.md`, ni `TASKS.md`, ni `index.md`, ni
   `VALIDATION.md`.
5. Consigner le bilan de session et les points N2 **dans le `S<k>.md`** (il n'appartient qu'à cette
   session) — ils seront reversés à la consolidation.
6. **Ni commit ni push** (bloqués par hook tant que `.claude/wave.lock` est présent).

## Fin de plan (toutes les sessions exécutées et validées)

7. Supprimer `.claude/wave.lock` s'il existe (clôt la vague, débloque git).
8. **Commit tâche par tâche, staging explicite** : `git status`, relire le diff, puis
   `git add <fichiers de la tâche>` — `git add -A` et `git commit -a` sont refusés par hook.
   Message = celui prévu dans chaque `T<n>`.
9. **Consolider** : statuts `[x]` dans `index.md`, lignes purgées de `TASKS.md`, `STATUS.md` à jour,
   points N2 des `S<k>.md` reversés dans `VALIDATION.md`.
10. **Un seul push** pour l'ensemble du plan.
