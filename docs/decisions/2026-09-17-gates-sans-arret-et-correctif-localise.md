# Arrêts sans jugement retirés, correctif localisé, relance toujours copiable (2026-09-17)

## Décision

Trois changements, tranchés par l'utilisateur le 2026-09-17 (plugin `workflow` 0.38.0) :

1. **Toute fin de session qui renvoie vers une conversation neuve se termine par le bloc de
   relance** : modèle et effort, prompt exact à coller, fichiers à lire en chemin complet, état,
   pistes écartées, objectif (`/fin-de-tache`, domicile). Plus seulement quand il n'y a pas de
   `S<k>.md`.
2. **Un plan qui passe ne s'arrête plus.** Le mot de vague `gate` (arrêt même si tout est `PASS`)
   est retiré et ignoré. Seul `validation-humaine` arrête après un `PASS`, et seulement si une
   session de la vague a un N2 à juger. Un geste humain préalable se vérifie en premier geste de la
   session, il n'arrête pas l'orchestrateur.
3. **Le correctif localisé se pose dans la session qui le trouve** (`WORKFLOW.md` §9a) : cause
   mesurée, remède petit, réversible, jugé par la gate et N0 — même hors périmètre, même contre un
   « ne corrige pas ici ». Seul un bandeau `Correctif localisé : interdit — <raison>` l'éteint.
   Corollaires : une enquête `OPTIONS` marque `Auto : oui` une recommandation de ce type, et
   l'orchestrateur l'applique par une reprise au lieu de poser la question ; une session Opus en
   échec dont `Blocage :` nomme un geste est reprise au même modèle, sans enquête ; la condition 1
   du canal court vise l'identifiant rendu par `Agent`, plus `ListAgents`.

## Contexte

Interface-OE, P10/S6 (preuve de routage VPN), 2026-09-16, 14:56 → 17:06. Deux défauts, cause
mesurée chaque fois par la session Opus elle-même : invite `ENTER PASSWORD:` sans fin de ligne
(correctif de quelques lignes, déjà écrit dans le script d'épreuve) puis `routeMetric` au lieu de
`RouteMetric` dans l'instrument (une ligne). Le `S6.md` interdisait `src/` et disait « ne corrige
pas ici ». Coût : trois exécutions Opus, deux enquêtes Sonnet en lecture seule qui n'avaient rien à
apprendre, deux questions dont la réponse fut l'option recommandée, deux extensions de plan (S8,
S9), deux sessions ; S8 a grossi à ~207 lignes de code et produit un bloquant de revue repris en
P11/S1. Le plan contredisait déjà §1 (« remède nommé, réversible, jugé par une gate : demander est
de la latence ») et §9a (« l'instrument n'est jamais intouchable »). Le même plan portait trois
vagues `gate` (S1, S6, S7) dont le critère de passage était mécanique : chaque arrêt sur `PASS`
n'apportait que la relance. Incident lié : `Interface-OE/docs/workflow/incidents/2026-09-16-agent-arriere-plan-non-relancable.md`.

## Alternatives envisagées

- Garder `gate` et documenter un critère : écarté, le seul critère valable est le jugement N2, qui
  mérite un mot qui le dise.
- Autoriser le correctif seulement si le plan déclare une `Latitude` : écarté, c'est exactement le
  cadreur qui n'avait pas prévu le défaut — la règle doit tenir sans lui.
- Supprimer le canal court : écarté, l'identifiant d'agent suffit à le rendre praticable.

## Conséquences

- `verificateur-plan` gagne deux contrôles (arrêts sans jugement, correctif éteint sans raison).
- L'inventaire du 2026-09-14 (#35, « gate produit voulue ») est caduc sur ce point.
- La revue de session reste le garde-fou d'un correctif localisé abusif : commit séparé, ligne
  `Correctif localisé :`, signalé en tête du bilan.
