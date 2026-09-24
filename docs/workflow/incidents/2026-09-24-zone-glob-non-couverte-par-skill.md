# Incident workflow — 2026-09-24 — motif « zone illisible » sans option fixe dans le skill

- Projet : Templates · Workflow : v0.44.0 · Plan : P10
- Environnement : Desktop · orchestré
- Étape : `/orchestrer-plan` Étape 3 (`question`) · Nature : orchestration

## Symptôme
`prochaine-action.mjs` a rendu `question` (source `arbre-sale`, motif « zone illisible :
plugin/agents/session-*.md (S3) ») avant la vague 3. `orchestrer-plan/SKILL.md` ne donne un jeu
d'options fixes que pour deux motifs (« fichiers touchés dans une zone » et « arbre invérifiable »)
— rien pour « zone illisible ». La première tentative (option « vérifier git, puis relancer »,
propre à « arbre invérifiable ») n'a rien changé : le blocage vient du texte de la cellule `Zone
modifiée` de l'index (un glob `*`), pas de l'état git.

## Preuve
Deux appels successifs à `prochaine-action.mjs P10` ont rendu le même `motif` mot pour mot, malgré
un arbre confirmé propre (`git status`, `git fsck`) entre les deux.

## Sur place
Question posée à l'utilisateur avec une option improvisée (réécrire la cellule en chemins
explicites), faute d'option scriptée pour ce motif. Réponse : appliquée. `index.md` de P10 corrigé
(`plugin/agents/session-*.md` → quatre chemins explicites).

## Ce qu'il faudrait pour que ça passe
`orchestrer-plan/SKILL.md` (section « Calcul de « reste lançable » ») devrait donner un jeu
d'options fixe pour le motif « zone illisible », par exemple : réécrire le segment glob en chemins
explicites dans l'index, puis relancer.
