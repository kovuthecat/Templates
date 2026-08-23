---
name: executer-vague
description: Orchestre une vague de sessions d'un plan — lance chaque session dans un processus séparé, ne garde que les verdicts, tient les statuts. À dérouler quand une vague de `plans/P<n>/index.md` est prête et ne contient aucune session `Desktop`. Pendant exécutif de `/nouveau-plan`.
model: haiku
---

# Exécuter une vague

L'orchestrateur ne fait que deux choses : **lancer des sessions** et **collecter des verdicts**.
Tout ce qu'il lit en plus, il le retraîne à chaque tour jusqu'à la fin de la vague — c'est ce qui
fait exploser un contexte d'orchestration.

Le frontmatter bascule sur Haiku pour ce tour, effort `low`. Le jugement vit dans les sessions
orchestrées (elles reçoivent leur propre modèle en argument `--model`), pas ici.

## Interdits — la raison d'être de cette skill

- **Ne jamais ouvrir un `S<k>.md`.** C'est la session exécutante qui le lit, dans son propre
  contexte. L'`index.md` suffit à l'orchestrateur.
- **Ne jamais lire un diff, une sortie de build ou un log.** Déléguer à `resumeur-git` et
  `verificateur-n0`, qui ne rendent que leur conclusion.
- **Ne jamais corriger soi-même.** Une session qui échoue rend la main à l'utilisateur ; l'orchestrateur
  n'implémente rien, ne relance rien. La seule chose qu'il ait le droit de lancer après un FAIL est
  la passe de **diagnostic** de l'Étape 5b — qui ne corrige rien non plus, et reste optionnelle.
- **Ne jamais interpréter le rapport d'une session.** Le verdict est extrait par schéma (Étape 4-5),
  pas relu : sur Haiku en particulier, un rapport d'échec détaillé est une tentation à enquêter ou
  « aider » plutôt qu'à relayer tel quel. La mécanique de l'Étape 4 retire le rapport brut de portée
  avant même que l'orchestrateur y touche — il n'y a rien à lire, donc rien sur quoi improviser.

## Étape 1 — Lire l'index, rien d'autre

Ouvrir `plans/P<n>/index.md` et en extraire, **pour la vague demandée uniquement** : sessions,
modèle, effort, colonne `Env.`, dépendances, zone modifiée.

## Étape 2 — Refuser ce qui ne s'orchestre pas

STOP, expliquer, rendre la main si l'un de ces cas se présente :

- une session de la vague porte **`Env. = Desktop`** → validation visuelle N1, lancement manuel
  obligatoire par l'utilisateur (`WORKFLOW.md` §5b) ;
- une **dépendance** n'est pas `[x]` dans l'`index.md` ;
- l'**arbre git n'est pas propre** (demander à `resumeur-git`) ;
- `.claude/settings.json` n'a pas d'**allowlist `permissions.allow`** → en headless personne ne peut
  confirmer un outil, la session resterait bloquée sans fin.

## Étape 3 — Poser le verrou si la vague est parallèle

Parallèle **seulement si** les zones modifiées sont disjointes. Au moindre doute : séquentiel.

Si parallèle, créer `.claude/wave.lock` **avant** tout lancement — il bloque commit et push pendant
la vague (hook). **Ne pas le retirer** en fin de vague : c'est `/fin-de-tache` qui le fait en fin de
plan.

## Étape 4 — Lancer

Une session = un processus. Jamais deux sessions dans une même conversation (`WORKFLOW.md` §5b).

**Deux rapports, deux destinataires.** Un échec doit rester réparable, mais son contexte n'a rien
à faire dans l'orchestrateur. La session exécutante produit donc deux sorties distinctes :

| Sortie | Destinataire | Contenu |
| --- | --- | --- |
| **Verdict** (contraint par schéma) | l'orchestrateur | `PASS`/`FAIL` + un motif d'une ligne + le chemin du rapport |
| **Rapport de passation** (fichier sur disque) | la session de réparation, plus tard | tout le contexte utile à la correction — **jamais lu ici** |

L'orchestrateur relaie un **chemin**, il ne l'ouvre pas. Le contexte de l'échec n'entre donc jamais
dans son contexte à lui, et reste pourtant intégralement disponible à qui devra corriger.

Chaque session reçoit un **identifiant propre** (`--session-id`) : sans lui, une session headless
peut hériter de la session ambiante, et son transcript devient impossible à retrouver.

```bash
uuid=$(node -e "console.log(require('crypto').randomUUID())")
mkdir -p .claude/vague

claude -p "Ouvre plans/P<n>/S<k>.md et exécute-le.
En cas d'ÉCHEC, écrire d'abord un rapport de passation dans plans/P<n>/S<k>.echec.md
(voir le gabarit dans \${CLAUDE_PLUGIN_ROOT}/skills/reprendre-echec/SKILL.md), puis
renvoyer son chemin dans le champ 'rapport'. En cas de succès, 'rapport' vaut ''." \
  --session-id "$uuid" \
  --model <modèle> --effort <effort> \
  --output-format json \
  --json-schema '{"type":"object","properties":{"verdict":{"type":"string","enum":["PASS","FAIL"]},"motif":{"type":"string"},"rapport":{"type":"string"}},"required":["verdict","motif","rapport"]}' \
  > ".claude/vague/S<k>.json"

echo "$uuid" > ".claude/vague/S<k>.session"
```

Modèle et effort viennent de l'`index.md` — identiques au bandeau du `S<k>.md`.

**Séquentiel par défaut, et l'arrêt au premier FAIL vit dans la boucle, pas dans une consigne.**
Une vague séquentielle se lance en une seule commande : le `break` rend l'arrêt structurel, là où
« ne pas lancer la suite » laissé en prose dépend de la docilité de l'orchestrateur.

```bash
for k in <liste des S<k> de la vague, dans l'ordre>; do
  lancer_session "$k"                     # le bloc ci-dessus
  { read -r verdict; read -r motif; read -r rapport; } < <(lire ".claude/vague/$k.json")
  echo "$k · $verdict · $motif" >> .claude/vague/verdicts.txt
  [ "$verdict" = "PASS" ] || break        # ← l'arrêt de la vague est ICI
done
```

**En parallèle**, l'arrêt anticipé n'existe pas : suffixer chaque lancement de `&` (chacun écrit
dans son propre `.claude/vague/S<k>.json`, donc pas de collision), un seul `wait`, puis lire tous
les verdicts. Les sessions déjà lancées vont au bout — c'est le prix du parallèle, et la raison
pour laquelle il exige des zones disjointes (Étape 3).

## Étape 5 — Collecter les verdicts

Quatre champs, et seulement ceux-là : `is_error`, `structured_output.verdict`, `.motif`, `.rapport`.
**Jamais `result`** ni aucun autre champ de l'enveloppe — c'est là que vivent le texte libre et les
métadonnées que le schéma a justement pour rôle d'écarter.

**La décision se prend dans Node, pas en bash**, et la sortie est faite d'une valeur par ligne. Ni
séparateur à découper, ni condition à réécrire à chaque appel : le seul endroit où « PASS » est
défini est la ligne `ok` ci-dessous.

```bash
lire() { node -e "
  let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
    let s={}, err=true;
    try{ const j=JSON.parse(d); err = j.is_error !== false; s = j.structured_output ?? {}; }catch(e){}
    const complet = typeof s.verdict==='string' && typeof s.motif==='string' && typeof s.rapport==='string';
    const ok = !err && complet && s.verdict==='PASS';
    const l = t => String(t ?? '').replace(/[\r\n]+/g,' ').trim();
    console.log(ok ? 'PASS' : 'FAIL');
    console.log(complet ? l(s.motif) : 'sortie non conforme');
    console.log(complet ? l(s.rapport) : '');
  })" < "$1"; }

{ read -r verdict; read -r motif; read -r rapport; } < <(lire ".claude/vague/S<k>.json")
```

**Fail-closed, et c'est Node qui l'applique** : `PASS` exige `is_error === false`, les trois champs
du schéma présents et typés, et `verdict === "PASS"`. Tout le reste — `FAIL`, champ manquant, JSON
malformé, session tuée — ressort en `FAIL`, motif « sortie non conforme ». Une sortie illisible
produit donc littéralement un FAIL au lieu de déclencher une interprétation.

> Deux pièges que ce code évite, et qu'une version « lue en bash » avait tous les deux :
> découper sur une tabulation (elle est *IFS whitespace* : deux tabulations consécutives
> s'effondrent en une et décalent tous les champs), et accepter un `verdict: PASS` arrivé sans les
> autres champs requis — donc sans respecter le schéma.

**Arrêt au premier FAIL** : la boucle de l'Étape 4 s'en charge. En parallèle, laisser les sessions
déjà lancées se terminer, puis s'arrêter.

## Étape 5b — Diagnostic escaladé *(optionnel, à demander explicitement)*

**Désactivé par défaut.** À n'activer que pour une vague lancée sans surveillance, quand personne
ne lira le FAIL avant plusieurs heures. Ce que ça achète : se réveiller devant un échec **diagnostiqué**
plutôt que devant un motif d'une ligne.

Ce n'est **pas** une réparation automatique. L'orchestrateur ne corrige toujours rien et ne relance
aucune session de la vague (Interdits) : il lance une passe qui **enrichit le rapport de passation**,
et s'arrête là. La correction reste une décision humaine, via `/reprendre-echec`.

**Escalader d'un cran au-dessus du modèle qui a échoué**, lu dans l'`index.md` — jamais un Opus
codé en dur : si c'est déjà Opus qui a échoué, remonter à Opus ne sert à rien (`WORKFLOW.md` §2).

| Modèle en échec | Diagnostic lancé avec |
| --- | --- |
| Haiku | Sonnet |
| Sonnet | Opus |
| Opus | Fable — et le signaler : on est dans le cas « rare, cher » de `WORKFLOW.md` §2 |
| Fable | aucun. Rendre la main, point. |

```bash
claude -p "Lis plans/P<n>/S<k>.echec.md et la tâche visée dans plans/P<n>/S<k>.md.
NE CORRIGE RIEN. Approfondis le diagnostic et réécris le rapport de passation au même
format (\${CLAUDE_PLUGIN_ROOT}/skills/reprendre-echec/SKILL.md), en enrichissant
'Déjà écarté' et 'Hypothèse en cours'. Seul fichier que tu as le droit d'écrire :
plans/P<n>/S<k>.echec.md" \
  --session-id "$(node -e "console.log(require('crypto').randomUUID())")" \
  --model <cran au-dessus> --effort high \
  --disallowed-tools Edit \
  > /dev/null
```

`--disallowed-tools Edit` retire le principal vecteur de modification de code. **Ce n'est pas une
preuve** : `Write` reste nécessaire pour réécrire le rapport, et rien n'empêche techniquement
d'écrire ailleurs. D'où la vérification qui suit, elle mécanique :

```bash
git status --porcelain > .claude/vague/apres-diagnostic.txt
diff .claude/vague/avant-diagnostic.txt .claude/vague/apres-diagnostic.txt
```

Un écart portant sur autre chose que `S<k>.echec.md` → **arrêter tout et le signaler** : la passe
de diagnostic a débordé, et l'état du dépôt n'est plus celui que le rapport décrit. Prendre le
`git status --porcelain` de référence **avant** de lancer le diagnostic.

## Étape 6 — Rendre la main

1. Passer à `[x]` dans l'`index.md` les sessions PASS, avec la date (statut = source unique,
   `WORKFLOW.md` §4a). En vague parallèle les sessions n'y touchent pas (`/fin-de-tache`) : c'est
   l'orchestrateur qui le fait, une fois la vague finie.
2. **Rapport final** : une ligne par session — `S<k> · PASS/FAIL · motif` (elles sont déjà dans
   `.claude/vague/verdicts.txt`). Puis la vague suivante prête, ou le blocage rencontré. Préciser
   si l'Étape 5b a tourné, et avec quel modèle : le rapport de passation n'est plus celui qu'a
   écrit la session en échec.
3. **Sur FAIL, donner les deux points d'entrée de la réparation, sans les ouvrir** :
   - le chemin du rapport de passation (`$rapport`), et la commande qui l'exploite :
     `/reprendre-echec plans/P<n>/S<k>.echec.md` ;
   - l'identifiant de la session en échec (`.claude/vague/S<k>.session`), **uniquement comme
     recours** si le rapport s'avère insuffisant : `claude --resume <uuid>` rouvre le transcript
     complet. À ne pas proposer par défaut — reprendre une session en échec rapatrie aussi toutes
     ses fausses pistes, ce que le démarrage à froid existe précisément pour éviter
     (`WORKFLOW.md` §5b).
4. **Ni commit ni push** — ils ont lieu en fin de plan, via `/fin-de-tache`.
