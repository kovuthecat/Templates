# 2026-08-22 — Agents mécaniques & enchaînement de sessions

Couvre D-P2-4 (quatre agents mécaniques Haiku) et D-P2-5 (enchaînement de sessions).

## Décision

Quatre agents Haiku, distribués par le plugin `workflow` (`agents/`), prennent en charge les
tâches mécaniques qui remplissaient jusqu'ici la conversation principale de traces brutes :
`explorateur` (localiser un élément qui touche plus d'un fichier), `verificateur-n0` (build /
typecheck / tests — plus jamais lancés en direct), `resumeur-git` (résumer un diff ou un
historique) et `lecteur-doc` (lire une doc externe). Chacun ne rend que sa conclusion. La
délégation est rendue **proactive** par la rédaction de leur `description` (« Proactively… »,
« Use immediately after… ») et une table de délégation explicite dans `CLAUDE-BASE.md`.

Pour enchaîner les sessions d'un même plan sans jamais les mélanger dans une seule conversation :
la pastille `spawn_task` en Desktop lance la session suivante en un clic ; un orchestrateur
headless `claude -p` enchaîne les sessions d'une vague qui ne comporte aucune session `Desktop`
(pas de validation N1 requise). Toute session marquée `Desktop` reste un lancement manuel par
Thibault, jamais automatisé.

## Contexte

Avant cette décision, l'exploration, les commandes de build/test et la lecture de doc externe
s'exécutaient directement dans la conversation Opus/Sonnet de cadrage ou d'exécution — la sortie
verbeuse (chemins parcourus, logs de build, contenu de page) restait en contexte et se payait à
chaque tour suivant, alors que seule la conclusion avait de la valeur. Par ailleurs, `/fin-de-tache`
clôturait une session sans mécanisme pour enchaîner la suivante sans intervention manuelle
complète, ce qui cassait le rythme des plans à vagues multiples.

## Alternatives envisagées

- **Un seul agent générique « exécuteur mécanique »** : écartée — une description trop large ne
  déclenche pas la délégation proactive aussi fiablement que quatre rôles précis et nommés.
- **Laisser Opus/Sonnet explorer et lancer les commandes lui-même, juste en le rappelant en prose**
  (« pense à déléguer ») : écartée — une instruction en prose du type « toujours / ne jamais » a
  déjà été oubliée une fois (cf. `choisir-mecanisme` §Critères rapides) ; sans agent dédié, rien ne
  garantit la délégation.
- **`/clear` automatique entre deux sessions d'un plan** : écartée — non disponible techniquement ;
  d'où le choix de la pastille et de l'orchestrateur headless comme mécanismes de substitution.
- **Automatiser aussi les sessions marquées `Desktop`** : écartée — leur validation N1 dépend du
  navigateur in-app et du jugement de Thibault ; les automatiser casserait le seul gate humain du
  N1.
- **Un fichier questionnaire vierge à remplir pour cadrer un nouveau projet** (au lieu de la skill
  interactive `/nouveau-projet`) : écartée en conversation le 2026-08-22 — un fichier statique se
  remplit d'un coup, sans reformulation intermédiaire ; la skill pose une question à la fois et
  reformule chaque réponse en 1 ligne avant de continuer, ce qui rattrape une réponse mal comprise
  avant qu'elle ne se propage dans tout le cadrage. Le fichier vierge aurait aussi manqué le gate de
  validation explicite (Phase B) avant toute écriture de fichier.
- **Un hook qui bloquerait automatiquement l'exploration directe** (Read/Grep répétés en
  conversation principale au lieu de l'agent `explorateur`) : envisagé puis reporté en conversation
  le 2026-08-22 — sans mesure de l'usage réel du plugin, un tel hook risquait de bloquer des lectures
  légitimes (un seul fichier, une vérification ponctuelle) et de générer plus de friction que de
  gain. Décision : mesurer d'abord si la délégation proactive (description des agents + table dans
  `CLAUDE-BASE.md`) suffit en pratique, durcir en hook seulement si l'oubli se reproduit — même
  logique que pour tout hook (`choisir-mecanisme` §Critères rapides : « une instruction en prose a
  déjà été oubliée une fois »).

## Conséquences

- Toute tâche de recherche multi-fichiers, de vérification N0, de résumé de diff ou de lecture de
  doc externe passe par l'agent correspondant — plus jamais en direct dans la conversation
  principale (anti-pattern documenté dans `WORKFLOW.md` §8).
- Une session `Desktop` ne peut pas être enchaînée par l'orchestrateur headless : elle nécessite
  toujours un lancement manuel.
- Le coût de contexte d'une session de cadrage ou d'exécution baisse mécaniquement : les traces
  brutes ne remontent plus, seules les conclusions des quatre agents le font.
- Pas de hook qui bloquerait l'exploration directe pour l'instant : la délégation reste une
  proposition forte (description + table), pas une contrainte. À réévaluer si l'oubli se reproduit
  après quelques plans réels — pas avant.
