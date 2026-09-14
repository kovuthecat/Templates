# 2026-09-14 — Deux régimes de travail, et une frontière humaine écrite

## Ce que ça change

Le workflow avait un seul régime — « Opus pense, les autres font, le design est fixé » — et une
frontière humaine qui n'était écrite nulle part. Il en a désormais **deux**, et elle l'est.

**Deux régimes, tous deux normaux.** Le régime **fixé** vaut pour le travail spécifiable : celui
dont on peut énoncer le résultat avant de l'obtenir. Le régime **ouvert** vaut pour le travail de
recherche : périmètre ouvert, juge contestable, borné par une branche jetable, un budget et N0 à la
fin, livrable = une preuve mesurée. Le second n'est pas une exception tolérée — c'est le bon régime
pour un problème de recherche, et l'aiguillage se fait au cadrage, jamais en session.

**Une frontière humaine mécanique : demander quand il y a un choix, agir quand il y a une gate.**
On sollicite un humain uniquement pour l'irréversible et pour un jugement esthétique ou produit
(N2). Tout ce qu'une gate sait juger se fait sans demander, et se rapporte après. Ce qui remplace
l'autorisation préalable, c'est la **lisibilité après coup**.

Ce qui ne change pas : un exécutant ne lit que son `S<k>.md` ; les trois niveaux de validation ;
le vendoring ; le hors-périmètre.

## Pourquoi

Revue de conception du 2026-09-14 (`docs/revues/2026-09-14-workflow.md`), sur 22 jours d'historique
et 23 incidents de 4 projets.

**Pour les deux régimes** : `prémisse` est le mode d'échec dominant du workflow — 10 des 12
rapports d'échec classés, sur deux projets. Et une prémisse **comportementale** (« A reproduit B »)
est indécidable aux deux bouts : `/nouveau-plan` Étape 1 investigue en Plan Mode, et
`verificateur-premisse` a `tools: Read, Grep, Glob`. Le workflow interdisait donc l'exécution là où
la prémisse se forme **et** là où elle se vérifie — une question qui ne se tranche qu'en exécutant
ne pouvait être tranchée nulle part, et ne surgissait qu'en session, sous forme de `FAIL`. Cinq
plans successifs sur une même zone en ont été la démonstration ; une session à périmètre ouvert a
réglé la même question en une matinée.

**Pour la frontière humaine** : elle n'était écrite dans aucun fichier, donc chaque skill l'a
tranchée dans son coin, et le défaut par défaut était « demander ». Un plan a payé trois arrêts et
trois arbitrages humains pour faire valider un remède que la session avait elle-même nommé. Faire
valider un remède que l'agent a déjà écrit, et dont une gate juge l'effet, n'est pas un contrôle :
c'est de la latence. Et faire valider une décision que l'utilisateur ne peut pas évaluer
techniquement ne produit pas un contrôle non plus — cela produit un tampon.

## Ce qui borne

L'autonomie s'étend **où une gate existe**, et nulle part ailleurs. N0 est cette gate. Rien ne
change sur le jugement produit (N2), ni sur l'irréversible. Ce n'est pas un relâchement de la
sécurité : c'est cesser de demander une permission là où un test répond mieux qu'un humain.

De même, le régime ouvert n'ouvre pas le périmètre en général — il échange un confinement contre un
autre (branche + budget + N0 final au lieu d'un périmètre d'écriture fermé). Un exécutant de plan
ne bascule jamais en régime ouvert de lui-même.

## Écarté

- **Ouvrir le périmètre en général**, ou donner à l'exécutant une latitude de conception permanente.
  85 plans et 16 rapports d'échec : le périmètre fermé paie. L'ouvrir partout coûterait partout pour
  réparer une zone.
- **Assouplir `prémisse` → STOP.** La version contrôlée de cette porte existe déjà (ligne « Écarts
  au plan » sous `Latitude` déclarée).
- **Rien ne se demande pendant une vague, tout se rend en fin de lot.** Maximise le débit, mais une
  vague peut partir loin dans une mauvaise direction avant d'être vue.

## Mise en œuvre

`plugin/WORKFLOW.md` §1 (fait le 2026-09-14) : les deux régimes et la frontière humaine.
Reste à faire, hors de cette décision : relire les points d'arrêt des skills à l'aune du critère
(écart 3 de la revue), et le chantier de déduplication des invariants (écarts 1, 3, 4) qui sort
en `/cadrer`.
