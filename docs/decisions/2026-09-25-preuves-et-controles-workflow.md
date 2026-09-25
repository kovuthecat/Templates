# Preuves de validation et contrôles économes

Brief : inchangé

## Décision
Demande utilisateur du 2026-09-25 : implémenter les points 2, 3, 4 et 5 de l'audit,
puis pousser Templates/main et publier le payload en 0.48.0.

- Revue : distinguer absente, interrompue et complète ; une reprise automatique au plus.
  Les défauts compromettant les prérequis bloquent les seules dépendances concernées.
- N0 : preuve JSON par session, liée au contenu Git et aux commandes exécutées.
  Validation complète obligatoire pour les nouveaux plans ; un résultat ciblé ne suffit pas.
  Vérifier la preuve au commit qui l'a déposée, et après le dernier commit de tâche : les
  sessions suivantes ne périment pas rétroactivement les validations précédentes.
- Recherche : gestes précis et courts en direct ; délégation pour exploration large, traces
  volumineuses et jugement indépendant.
- Plan : script Node sans dépendance pour chemins, chevauchements, dépendances et champs ;
  agent pour les contrôles sémantiques restants. Forme ambiguë signalée, jamais devinée.

## Compatibilité et limites
La preuve N0 devient obligatoire via `Preuve N0 : requise` dans les nouveaux index.
Les anciens plans conservent leur comportement ; activation explicite possible.
Une empreinte prouve les entrées locales, pas la qualité des tests ni les services externes.
La revue garde son caractère consultatif pour les défauts sans impact sur les prérequis.
Pas de nouveau framework, de nouveaux modèles ni de changement du budget d'enquête (point 1)
ou du parallélisme (point 6).

## Validation
Tests Node sur dépôts jetables : revue interrompue/reprise épuisée, dépendances sélectives,
preuve absente/périmée/partielle/échouée, code modifié pendant N0, nouveaux fichiers et
configurations, plans valides/invalides. Suites existantes et publication à blanc.
