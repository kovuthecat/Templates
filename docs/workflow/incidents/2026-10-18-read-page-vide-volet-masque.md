# Incident workflow — 2026-10-18 — `read_page` rend une page vide quand le volet du navigateur est masqué

- Projet : Templates · Workflow : source (`plugin/`) · Plan : — (sonde hors plan)
- Environnement : Desktop · sous-agent et session liée, volet du navigateur masqué (utilisateur en Remote Control)
- Étape : `/verif-visuelle` étape 3 (`read_page` après `navigate`) · Nature : environnement

## Symptôme
Volet masqué et taille « desktop » par défaut (celle du volet) : `read_page` rend « (empty page)
Viewport: 0x0 ». Or le serveur tourne et la page est chargée. `/verif-visuelle` étape 3 lit d'abord
`read_page` pour attraper « les écrans blancs » : elle conclurait donc **à tort** à un écran blanc
(faux défaut N1). Elle pourrait aussi corriger du code qui n'est pas en cause. Aucun cas réel
constaté : défaut latent, trouvé par sonde.

## Preuve
- Sous-agent `general-purpose` (Haiku), page témoin servie sur `http://127.0.0.1:5199` (3 éléments
  interactifs). `tabs_context` : « The Browser pane is currently hidden. » `read_page` interactif rend
  « (empty page) Viewport: 0x0 », avant **et** après `resize_window { preset: "desktop" }` + `navigate`.
  `get_page_text` lit le titre. La capture d'écran lit la page (1er essai : « Screenshot timed out
  after 5s », 2e essai OK, cadre 800x600).
- Même sous-agent, `resize_window { preset: "mobile" }` + `navigate` : `read_page` rend les 3 éléments,
  « Viewport: 375x812 ».
- Conversation principale, volet toujours masqué : `resize_window { width: 1280, height: 800 }` +
  `navigate` : `read_page` rend les 3 éléments, « Viewport: 1280x800 ».
- Même constat dans une session liée sur EBM-MSPv2 (`docs/analyses/2026-10-18-sonde-session-liee-navigateur.md`, M1).

## Sur place
Corrigé en 0.67.1 (`/verif-visuelle` mode A, étapes 2 et 3), le jour même. Remède retenu : dans `/verif-visuelle` étape 2, imposer une taille
explicite (`resize_window { width: 1280, height: 800 }`) **avant** `navigate`, et la rétablir en fin
(`preset: "desktop"`). Autre possibilité : traiter un `read_page` à « Viewport: 0x0 » comme
« mesure impossible » et non comme « écran blanc », puis se replier sur `get_page_text`. Attention :
l'app efface une taille imposée à la fin du tour, il faut donc la reposer à chaque tour qui relit.
