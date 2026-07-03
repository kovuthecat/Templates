---
name: fin-de-tache
description: Checklist de fin de tâche — statuts, fichiers de contexte, rapport, commit. À dérouler quand une tâche T<n> d'un plan est terminée et validée (build + typecheck OK).
---

# Fin de tâche

1. **Statuts** : passer la tâche à `[x]` dans `T<n>.md`, dans l'`index.md` du plan **et** dans `TASKS.md`.
2. **Contexte** : mettre à jour `STATUS.md` ; les autres fichiers de contexte **seulement si leur
   contenu change** (un fichier de contexte faux est pire qu'absent).
3. **Validation visuelle** : consigner la checklist dans `VALIDATION.md` — ne PAS tenter de la vérifier
   soi-même (pas de navigateur, pas de capture d'écran).
4. **Rapport** : Fichiers modifiés · Résumé · Tests lancés · À valider visuellement (→ `VALIDATION.md`) · Prochaine action.
5. **Git** : `git status`, relire le diff, commit atomique (message : `WORKFLOW.md` / `CONVENTIONS.md`) ; push en fin de session.
