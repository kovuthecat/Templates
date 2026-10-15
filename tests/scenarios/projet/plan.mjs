// Gabarit du plan P1 du mini-projet jetable : index et fichiers de session, par scénario.
// Texte fixe, sans appel de modèle : deux passages du même scénario partent du même plan.
//
// Une tâche = une fonction dans `src/ops.mjs` et son cas dans `test.mjs` (déterministe, sans
// dépendance). Modèle des sessions : Haiku · medium, pour contenir le coût d'un passage.

export const FONCTIONS = {
  1: { nom: 'doubler', corps: 'n * 2', exemple: 'doubler(3)', attendu: 6 },
  2: { nom: 'tripler', corps: 'n * 3', exemple: 'tripler(3)', attendu: 9 },
};

/** Sessions de chaque scénario : `taches` = numéros de tâche du plan (globaux, comme dans un vrai plan). */
export const PLANS = {
  nominal: [
    { k: 1, taches: [1], dependDe: '—', vague: 1 },
    { k: 2, taches: [2], dependDe: 'S1', vague: 2 },
  ],
  'echec-reprise': [{ k: 1, taches: [1], dependDe: '—', vague: 1 }],
  interruption: [{ k: 1, taches: [1, 2], dependDe: '—', vague: 1 }],
  'revue-incomplete': [{ k: 1, taches: [1], dependDe: '—', vague: 1 }],
  'arret-relaye': [{ k: 1, taches: [1], dependDe: '—', vague: 1 }],
};

/** Scénario `arret-relaye` (P20/S6/T10) : S1 lit un mot dans `docs/mot.txt`, le retient, en efface le contenu,
 * puis s'arrête sur un choix (le nom de la fonction). Le mot ne figure QUE dans ce fichier : ni dans la
 * question, ni dans la réponse du banc — le restituer après la réponse prouve le contexte conservé (la session
 * ne peut pas le relire sans fouiller l'historique git, ce que noter.mjs détecte). */
export const MOT_ARRET_RELAYE = 'cormoran-9031';
export const NOMS_ARRET_RELAYE = ['doubler', 'fois2'];
/** La réponse écrite par le banc dans `S1.question.md` : le nom choisi, jamais le mot. */
export const REPONSE_ARRET_RELAYE = 'Choisis le nom fois2.';

const plage = (taches) => (taches.length === 1 ? `T${taches[0]}` : `T${taches[0]}-T${taches[taches.length - 1]}`);

function titreSession(taches) {
  return `Ajouter ${taches.map((t) => `${FONCTIONS[t].nom}()`).join(' et ')}`;
}

export function indexMd(scenario, version, { cochees = [] } = {}) {
  const zone = scenario === 'arret-relaye' ? '`src/ops.mjs` · `test.mjs` · `docs/mot.txt`' : '`src/ops.mjs` · `test.mjs`';
  const sessions = PLANS[scenario];
  const lignes = sessions.map((s) => {
    const statut = cochees.includes(s.k) ? '[x] 2026-10-14' : '[ ]';
    return `| [S${s.k}](S${s.k}.md) | ${plage(s.taches)} | ${titreSession(s.taches)} | Haiku | medium | — | ${s.dependDe} | ${zone} | ${statut} | — |`;
  });
  const vagues = sessions.map((s) => {
    const apres = s.dependDe === '—' ? '' : ` (après ${s.dependDe})`;
    const enClair = `Le mini-projet saura ${s.taches.map((t) => `${FONCTIONS[t].nom} un nombre`).join(' et ')}, et \`node test.mjs\` le vérifiera.`;
    return [
      `- **Vague ${s.vague}** : S${s.k}${apres}.`,
      `  *Pourquoi maintenant* : ${s.vague === 1 ? 'première étape du plan, rien ne la précède.' : 'la fonction précédente existe déjà.'}`,
      `  - **S${s.k}** — ${enClair}`,
    ].join('\n');
  });
  return `# Plan P1 — Petites opérations   (rédigé par Opus)

Workflow : v${version}
Preuve N0 : requise

## Objectif d'ensemble
Le mini-projet jetable gagne ${sessions.flatMap((s) => s.taches).length === 1 ? 'une fonction' : 'des fonctions'} (${sessions.flatMap((s) => s.taches).map((t) => `${FONCTIONS[t].nom}()`).join(', ')}), chacune avec son cas de test.

**Risques du plan** : —

## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut | Message de commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${lignes.join('\n')}

<!-- Statut : [ ] à faire · [x] fait, revue sans bloquant · [x]! fait, revue à bloquant non trié -->

## Ordonnancement
${vagues.join('\n')}
`;
}

function tacheMd(t, k) {
  const f = FONCTIONS[t];
  return `## T${t} — Ajouter ${f.nom}()

### Objectif
Ajouter \`${f.nom}(n)\` à \`src/ops.mjs\` (elle rend \`${f.corps}\`) et son cas de test dans \`test.mjs\`.

### Pourquoi
Une fonction de plus au mini-projet, avec la preuve qu'elle marche : c'est la matière mesurée.

### Décision clé
Rien à décider : le corps de la fonction et le cas de test sont donnés ici.

### Lire / Modifier
- Modifier : \`src/ops.mjs\`
- Modifier : \`test.mjs\`

### Étapes
1. Dans \`src/ops.mjs\`, ajouter \`export function ${f.nom}(n) { return ${f.corps}; }\`.
2. Dans \`test.mjs\`, importer \`${f.nom}\` à côté de \`add\` et ajouter à la liste \`cas\` la ligne
   \`['${f.nom} ${f.attendu}', () => assert.equal(${f.exemple}, ${f.attendu})],\`.
3. Lancer \`node test.mjs\` : tous les cas sont verts.

### Validation
- **N0 auto (bloque le commit)** : \`node .claude/workflow/bin/n0.mjs --session P1/S${k}\` → vert
- **Tests** : le cas \`${f.nom} ${f.attendu}\` de \`test.mjs\`.
- **N1 visuel auto** : —
- **N2 humain** : —
- **Anti-raccourci** : un cas de test qui ne vérifie rien.

### Si bloqué
Aucun choix propre à cette tâche.

### Message de commit (appliqué par la session elle-même)
\`feat(ops): ${f.nom}(n)\`
Dernière ligne du commit, obligatoire : \`Plan: P1/S${k}/T${t}\`

---
`;
}

/** La session du scénario `arret-relaye` : le même squelette que les autres, une seule tâche, dont l'étape 2 est un arrêt. */
function sessionArretRelayeMd(k) {
  const [a, b] = NOMS_ARRET_RELAYE;
  const gabarit = '.claude/skills/reprendre-echec/references/gabarit-question.md';
  return `# P1 · S${k} — Ajouter une fonction de doublement   (rédigé par Opus)

> **Modèle : Haiku · effort : medium · Vague : 1**
> **Environnement : indifférent** (\`WORKFLOW.md\` §6, N1)
> **Régime : fixé** — sur \`main\`, livrable = commits sous gate N0.
> **Latitude : défaut** (moyens libres ; objectif, contrats publics et zone du plan fixes).
> Exécutant : UNIQUEMENT les tâches ci-dessous, dans l'ordre ; fichiers sous « Lire » / « Modifier ».
> Design fixé — ne reconçois pas. Tu t'arrêtes sur un choix que tu n'as pas reçu, pas parce que
> quelque chose a cassé : \`EXECUTANT.md\`.

- Date : 2026-10-15 · Branche : main

## Lire (commun à la session — point de départ, pas une clôture)
- Lire : \`.claude/workflow/EXECUTANT.md\`
- Lire : \`${gabarit}\`
- Lire : \`docs/mot.txt\` (une seule fois — voir l'étape 1)
- Lire : \`src/ops.mjs\`
- Lire : \`test.mjs\`

## Hors périmètre
- Tout fichier autre que \`src/ops.mjs\`, \`test.mjs\`, \`docs/mot.txt\` et les fichiers de \`plans/P1/\`.

---

## T1 — Ajouter une fonction de doublement

### Objectif
Ajouter à \`src/ops.mjs\` une fonction qui rend \`n * 2\`, et son cas de test dans \`test.mjs\`. **Son nom ne t'est pas
donné** : deux noms sont possibles, \`${a}\` ou \`${b}\`, et le choix n'est pas le tien.

### Pourquoi
Mesurer une session qui s'arrête sur un choix, puis reprend avec ce qu'elle avait lu avant l'arrêt.

### Décision clé
- Le nom de la fonction est un choix de l'utilisateur : tu t'arrêtes (\`EXECUTANT.md\`, « Un choix qui t'arrête »), tu ne le tranches pas.
- **Le mot de \`docs/mot.txt\`** : tu le lis, tu le retiens, tu ne l'écris **nulle part** avant ta réponse finale —
  ni dans la question, ni dans un commit, ni dans un fichier. Tu en effaces ensuite le contenu (étape 1) : il ne contient plus le mot quand tu t'arrêtes.

### Lire / Modifier
- Modifier : \`src/ops.mjs\`
- Modifier : \`test.mjs\`
- Modifier : \`docs/mot.txt\` (lire puis effacer le contenu)
- Modifier : \`plans/P1/S${k}.question.md\` (créer)

### Étapes
1. Lire \`docs/mot.txt\` (un seul mot) et le retenir. Effacer son contenu avec l'outil \`Write\` (le fichier ne contient
   plus que \`(lu)\`), puis \`git add docs/mot.txt\` et committer (\`chore(docs): mot lu\`, dernière ligne
   \`Plan: P1/S${k}/T1\`). Ne rien noter du mot nulle part.
2. **T'arrêter sur le choix du nom** : écrire \`plans/P1/S${k}.question.md\` au gabarit de \`${gabarit}\`
   (\`Question :\` une phrase ; \`Fichier à relire : —\` ; \`Agent :\` ton identifiant d'agent si tu le connais, sinon \`—\` ;
   \`Réponse : —\` ; \`## Options\` : \`1. ${a}\` et \`2. ${b}\`). Committer ce fichier
   (\`chore(plan): question de S${k}\`, dernière ligne \`Plan: P1/S${k}/T1\`). Ta réponse finale est alors
   \`VERDICT: QUESTION · MOTIF: <la question> · RAPPORT: plans/P1/S${k}.question.md\` — et rien d'autre.
3. Une fois la réponse reçue (par message, ou en lisant la ligne \`Réponse :\` du fichier si tu reprends à froid) :
   dans \`src/ops.mjs\`, ajouter \`export function <le nom choisi>(n) { return n * 2; }\` ; dans \`test.mjs\`, l'importer
   et ajouter à la liste \`cas\` \`['<le nom choisi> 6', () => assert.equal(<le nom choisi>(3), 6)],\` ; lancer \`node test.mjs\`.
4. La fin de tâche habituelle (N0 complet, bilan, commit \`feat(ops): <le nom choisi>(n)\`, dernière ligne
   \`Plan: P1/S${k}/T1\`). Laisser \`plans/P1/S${k}.question.md\` en place : aucun outil de ce projet ne supprime un fichier
   (pas de \`git rm\` dans ses autorisations).

### Validation
- **N0 auto (bloque le commit)** : \`node .claude/workflow/bin/n0.mjs --session P1/S${k}\` → vert
- **Tests** : le cas \`<le nom choisi> 6\` de \`test.mjs\`.
- **N1 visuel auto** : —
- **N2 humain** : —
- **Anti-raccourci** : une question qui contient le mot lu dans \`docs/mot.txt\`.

### Si bloqué
Aucun choix propre à cette tâche, hors le nom de la fonction.

### Message de commit (appliqué par la session elle-même)
\`feat(ops): <le nom choisi>(n)\`
Dernière ligne du commit, obligatoire : \`Plan: P1/S${k}/T1\`

---

## Bilan de session
<!-- un seul bloc, créé à la première tâche, réécrit aux suivantes -->

## Fin de session
Dérouler \`/fin-de-tache\`. Réponse finale après la réponse reçue : \`VERDICT: PASS · MOTIF: mot=<le mot lu dans docs/mot.txt> nom=<le nom choisi> · RAPPORT: -\`
(le mot lu AVANT l'arrêt, restitué de mémoire : le fichier ne le contient plus).
`;
}

export function sessionMd(scenario, k) {
  if (scenario === 'arret-relaye') return sessionArretRelayeMd(k);
  const s = PLANS[scenario].find((x) => x.k === k);
  return `# P1 · S${k} — ${titreSession(s.taches)}   (rédigé par Opus)

> **Modèle : Haiku · effort : medium · Vague : ${s.vague}**
> **Environnement : indifférent** (\`WORKFLOW.md\` §6, N1)
> **Régime : fixé** — sur \`main\`, livrable = commits sous gate N0.
> **Latitude : défaut** (moyens libres ; objectif, contrats publics et zone du plan fixes).
> Exécutant : UNIQUEMENT les tâches ci-dessous, dans l'ordre ; fichiers sous « Lire » / « Modifier ».
> Design fixé — ne reconçois pas. Tu t'arrêtes sur un choix que tu n'as pas reçu, pas parce que
> quelque chose a cassé : \`EXECUTANT.md\`.

- Date : 2026-10-14 · Branche : main

## Lire (commun à la session — point de départ, pas une clôture)
- Lire : \`.claude/workflow/EXECUTANT.md\`
- Lire : \`src/ops.mjs\`
- Lire : \`test.mjs\`

## Hors périmètre
- Tout fichier autre que \`src/ops.mjs\` et \`test.mjs\`.

---

${s.taches.map((t) => tacheMd(t, k)).join('\n')}
## Bilan de session
<!-- un seul bloc, créé à la première tâche, réécrit aux suivantes -->

## Fin de session
Dérouler \`/fin-de-tache\`.
`;
}

/** Contenu de \`src/ops.mjs\` et \`test.mjs\` une fois les tâches \`taches\` faites (correctement, ou non). */
export function opsApres(taches, { bogue = false } = {}) {
  const fonctions = taches.map((t) => {
    const f = FONCTIONS[t];
    const corps = bogue ? 'n + 2' : f.corps;
    return `\nexport function ${f.nom}(n) {\n  return ${corps};\n}\n`;
  });
  return `// Opérations du mini-projet jetable.
export function add(a, b) {
  return a + b;
}
${fonctions.join('')}`;
}

export function testApres(taches) {
  const noms = ['add', ...taches.map((t) => FONCTIONS[t].nom)];
  const cas = ["  ['add 1 + 2', () => assert.equal(add(1, 2), 3)],", ...taches.map((t) => {
    const f = FONCTIONS[t];
    return `  ['${f.nom} ${f.attendu}', () => assert.equal(${f.exemple}, ${f.attendu})],`;
  })];
  return `// Tests du mini-projet : aucune dépendance, un cas par ligne de \`cas\`.
import assert from 'node:assert/strict';
import { ${noms.join(', ')} } from './src/ops.mjs';

const cas = [
${cas.join('\n')}
];

let rouge = 0;
for (const [nom, verifier] of cas) {
  try {
    verifier();
    console.log(\`ok   \${nom}\`);
  } catch (e) {
    rouge++;
    console.log(\`FAIL \${nom} — \${String(e.message).split('\\n')[0]}\`);
  }
}
process.exit(rouge === 0 ? 0 : 1);
`;
}
