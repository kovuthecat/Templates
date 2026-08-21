# ARCHITECTURE.md

Réflexion d'architecture du projet : écrans, navigation, données, découpage technique.
Rempli **après** `PROJECT_BRIEF.md` (le quoi) et **avant** la maquette UI — c'est ce fichier
qu'on envoie tel quel à **Claude Design** (claude.ai) pour y dessiner la maquette.

> **Auto-suffisant** : Claude Design ne voit QUE ce fichier. Ne pas renvoyer vers d'autres
> fichiers du repo — recopier ici le strict nécessaire du brief.
> À l'instanciation : supprimer les sections non pertinentes (projet sans UI : garder
> uniquement « Découpage technique »).

## Rappel produit (recopié du brief)

- Objectif (2 lignes) :
- Fonctionnalités MVP :
- Plateformes cibles : <desktop / mobile / PWA / …>

## Écrans & vues

> Un bloc par écran — c'est la matière première de la maquette.

### Écran 1 — <nom>

- Rôle :
- Contenu / éléments clés :
- Actions possibles :

## Navigation & parcours

- Écran d'entrée :
- Flux principal : <écran A → écran B → …>
- Navigation secondaire : <menu, onglets, retours…>

## Données affichées

> Entités principales et champs visibles à l'UI — pas le schéma BDD complet.

- <Entité> : <champs affichés, états possibles>

## Contraintes UI

- <mobile-first ? offline ? accessibilité ? ton visuel ?>

---

## Découpage technique

> Sans effet sur la maquette — fixe la structure du code (feature-first : `CONVENTIONS.md`).

- Features : <feature-a : rôle · feature-b : rôle>
- État / persistance :
- Arbitrages structurants → consignés dans `DECISIONS.md`, pas ici.

---

## Maquette UI

> Rempli au retour de Claude Design. La maquette devient la référence : on câble dessus,
> on ne redessine pas en codant.

- Statut : [ ] à dessiner · [ ] dessinée · [ ] câblée
- Exports : `design/maquettes/` (un fichier par écran, HTML ou PNG)
- Écarts maquette ↔ architecture : <ce qui a changé en dessinant — répercuter ci-dessus si structurant>
