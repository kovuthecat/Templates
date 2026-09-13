# 2026-09-13 — L'orchestrateur enquête avant de demander ; un humain n'est sollicité que par une question

> **Amende** `2026-08-30-reprise-automatique-echec.md` et `2026-09-09-nature-de-l-echec-et-incidents.md`
> sur ce qui suit un `FAIL`. La nature de l'échec, le démarrage à froid, l'interdit de reprendre la
> conversation d'une session en échec et l'opt-out `reprise-manuelle` sont inchangés.

## Décision

Le verdict terminal unique `ARBITRAGE` est supprimé. Il servait trois choses qui ne se valent pas :
une décision qui appartient à l'utilisateur, un manque d'information, et une affirmation non
vérifiée. Quatre changements, un principe — **un plan ne s'arrête que sur un choix**.

1. **Deux verdicts au lieu d'un.** `/reprendre-echec` en mode orchestré rend désormais
   `PASS | FAIL | ENQUETE | DECISION`. `ENQUETE` = hypothèse épuisée, c'est-à-dire un manque
   d'information ; `DECISION` = annulation destructive, prémisse confirmée fausse, remédiation
   d'environnement hors de portée. Seul `DECISION` arrête le plan.
2. **Une prémisse se vérifie avant d'arrêter le plan.** 7ᵉ agent, **`verificateur-premisse`**
   (Haiku, lecture seule, une ligne de verdict) : l'affirmation par laquelle une session déclare le
   plan faux est confrontée au dépôt. `REFUTEE` → reprise comme une nature `exécution`, la preuve
   passée dans le prompt, **et un fichier d'incident** (nature `prémisse`) pour que le taux de
   fausses prémisses devienne mesurable depuis le dépôt source. `CONFIRMEE` ou `INDECIDABLE` →
   question à l'utilisateur. Corollaire pour l'exécutant : une prémisse s'écrit **falsifiable**.
3. **Une enquête, là où le plan rendait la main.** `/orchestrer-plan` gagne une **Étape 5d** :
   après une reprise qui rend `FAIL` ou `ENQUETE`, un sous-agent frais déroule `/reprendre-echec` en
   **mode enquête** — lecture seule, une passe, aucune correction, aucun N0. Il écrit le `.echec.md`
   mis à jour **en premier geste** puis rend `ENQUETE: PISTE|OPTIONS`. `PISTE` → une dernière
   reprise ; `OPTIONS` → le rapport porte une section `## Issues` de 2 à 4 options, qui devient la
   question posée. Un échec d'exécution d'une session **déjà Opus** va directement à l'enquête :
   il n'y a plus de cran au-dessus depuis la v0.29.0, et le levier est l'information, pas le modèle.
4. **Un arrêt se pose en question.** Format imposé au rapport final (`/orchestrer-plan` Étape 6) :
   une question en une phrase, 2 à 4 options avec leur coût et ce que chacune débloque, une
   recommandation, et ce qui reste lançable sans décider. Les options ne s'inventent pas : elles
   viennent de la section `## Issues` de l'enquête, recopiée mot pour mot, ou d'une table de cas
   connus. Une seule question par arrêt — le plan s'arrête à la première session non remédiée.

**Le budget est ce qui rend l'autonomie sûre.** Par session : 2 reprises, 1 enquête. Par plan :
2 enquêtes. Il vit dans une ligne mécanique du rapport d'échec — `Tentatives : reprise=<n>
enquete=<n>`, lue par un `grep` comme `Nature :` —, donc il survit à une orchestration interrompue
puis relancée. Domicile de l'ensemble : `WORKFLOW.md` **§9c**, nouvelle.

## Contexte

Signalé par le mainteneur : « l'orchestrateur demande souvent une intervention humaine là où il
suffit de lancer une investigation pour repartir ; l'intervention ne devrait être nécessaire que
lorsqu'il y a un choix entre plusieurs options, et être posée sous forme de question. »

Le défaut était structurel, pas un réglage trop serré. `ARBITRAGE` était un verdict **terminal
unique** pour quatre motifs de nature différente, et deux autres sorties tout aussi sèches
existaient à côté (`environnement` dont la remédiation n'est pas acquise → `FAIL` immédiat ;
deuxième `FAIL` consécutif → arrêt). Sur les deux cas centraux, le workflow portait déjà l'argument
contre son propre comportement :

- **La prémisse.** Le constat du 2026-09-09 qui a supprimé la reprise sur prémisse dit que les
  prémisses déclarées étaient *fausses* — « la détection est correcte, seul le nommage est en
  cause » (faux), « 37 étapes dans le PDF » (il y en a 32). La conclusion tirée — ne pas payer un
  modèle plus cher — était juste ; la conclusion manquante est qu'une prémisse **n'est pas un
  fait** : c'est une hypothèse produite par la session la moins fiable du lot, et elle arrêtait un
  plan entier sans que personne ne la vérifie. La vérifier coûte un agent Haiku en lecture seule.
- **L'hypothèse épuisée.** `/reprendre-echec` écrivait déjà « deux tentatives sur la même hypothèse
  coûtent plus qu'un cadrage » : la bonne suite était nommée dans le texte, mais le mécanisme
  rendait la main à un humain au lieu de la lancer. Or cet humain ne dispose d'aucune information
  de plus que l'orchestrateur — il lance l'enquête. On lui facturait une latence pour un geste
  déterministe, et la latence humaine est le coût dominant d'une orchestration sans surveillance
  (déjà la raison d'être de la reprise automatique, 2026-08-30).

## Alternatives envisagées

- **Desserrer les gates existantes** (moins d'arrêts, mêmes verdicts). Écarté : les quatre motifs
  d'`ARBITRAGE` n'ont pas la même réponse — desserrer aurait laissé passer l'annulation destructive
  avec le reste, ou gardé l'hypothèse épuisée avec elle. C'est la confusion des trois choses qui
  était le défaut, pas leur seuil.
- **Laisser l'orchestrateur enquêter lui-même.** Écarté : il lance et collecte ; enquêter dans sa
  conversation, c'est ouvrir des rapports et des diffs, exactement ce que ses interdits protègent —
  et faire exploser le contexte qu'il retraite à chaque vague.
- **Une reprise de plus au lieu d'une enquête.** Écarté : une troisième tentative sur la même
  hypothèse est l'anti-pattern de §3, et c'est précisément ce que le constat du 2026-09-09 a
  montré inutile. L'enquête est en lecture seule, moins chère, et produit ce qui manque — une
  hypothèse ou des options.
- **Compter les tentatives en contexte** plutôt que dans le fichier. Écarté : une orchestration
  interrompue puis relancée repartirait à zéro, et le plafond ne plafonnerait plus rien. Même
  raisonnement que pour les statuts (§4a) : le fichier fait foi.
- **Poser la question sans options, en renvoyant au rapport.** Écarté : c'est le comportement
  d'avant sous un autre nom. Une question sans option ne se répond pas, elle se re-cadre — et
  l'utilisateur refait le diagnostic déjà payé.

## Raison du choix

Les invariants tiennent tels quels : l'orchestrateur lance et collecte (il lance une vérification
comme il lance une revue, lit `Tentatives :` comme il lit `Nature :`), le jugement vit dans les
sessions lancées, le démarrage à froid reste la seule entrée d'une réparation, et l'utilisateur
garde tout ce qui est irréversible ou qui change le périmètre. Ce qui change est ce qui ne lui a
jamais appartenu : chercher.

Le coût est borné et il **remplace** une dépense existante. Aujourd'hui, une hypothèse épuisée paie
déjà une reprise escaladée (Opus, parfois Fable) qui refait le diagnostic pour rendre `ARBITRAGE` ;
demain elle paie une enquête en lecture seule au modèle de l'index. La vérification de prémisse
coûte un Haiku et évite, sur la base du 2026-09-09, la majorité des arrêts.

## Conséquences

- **Nouvel agent** `plugin/agents/verificateur-premisse.md` (7ᵉ) — `WORKFLOW.md` §5 mis à jour
  partout où le nombre était écrit, `README.md` (la table disait encore « 5 agents »).
- `/orchestrer-plan` : interdits (deux lignes neuves), annonce de vague, **5c réécrite**
  (budget, vérification de prémisse, quatre issues), **5d neuve**, **Étape 6** (bloc question,
  table d'origine des options), frontmatter. 368 → 485 lignes.
- `/reprendre-echec` : mode orchestré (table des gates), **mode enquête** neuf, gabarit
  (`Tentatives :`, prémisse falsifiable), Étapes 1 à 5 réalignées.
- `WORKFLOW.md` : §5 (7 agents), §8 (quatre anti-patterns neufs, dont son symétrique — trancher à
  la place de l'utilisateur), §9a (ligne `prémisse`), **§9c neuve** (domicile).
- `CLAUDE-BASE.md` (+7 lignes, 80 → 87), `EXECUTANT.md` (prémisse falsifiable), `/nouveau-plan`
  (`reprise-manuelle` couvre aussi l'enquête).
- **Ce qui ne bouge pas** : `reprise-manuelle`, `gate`, l'ordre de clôture d'une vague, le
  recoupement par les commits, les revues de session, les hooks (aucun n'est touché —
  `tests/tester-hooks.mjs` reste à 23 cas).
- Coût assumé : une vérification Haiku par prémisse, une enquête Sonnet/Opus par session bloquée,
  et une skill d'orchestration plus longue de 117 lignes — chargée seulement quand on orchestre.
- À surveiller sur les prochains plans : le **taux de prémisses réfutées** (fichiers d'incident de
  nature `prémisse`) et le **taux d'enquêtes qui rendent `PISTE`**. Si les enquêtes rendent
  surtout `OPTIONS`, c'est que l'échec est en amont — dans le cadrage, pas dans l'exécution.
