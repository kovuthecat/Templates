#!/usr/bin/env node
// Contrôle des renvois d'invariant et des annexes de skill, hors `plugin/` (jamais vendoré : les
// projets aval n'ont pas à embarquer une suite de tests pour un outillage qu'ils ne modifient pas).
//
// POURQUOI CE FICHIER EXISTE
// C'était le point qui manquait à l'annexe A4 (docs/decisions/2026-09-14-conditions-nommees-domicile-
// unique.md, section (a) règle 3) : son risque était nommé (« une annexe mal désignée n'est jamais
// lue ») sans être levé. Un renvoi qu'aucune machine ne vérifie ne vaut rien. Trois assertions, pas
// une de plus — le contrôle porte sur la PRÉSENCE du renvoi, jamais sur son sens : il ne saura jamais
// dire qu'un invariant est faux, seulement qu'il n'est pas atteignable.
//
//   1. Tout bloc `Agent({ … })` de `plugin/**` contient la ligne de renvoi, au mot près.
//   2. Tout `references/<x>.md` cité par une `SKILL.md` existe, relatif au dossier de sa skill.
//   3. Tout `references/*.md` présent a au moins un appelant dans le dossier de sa skill.
//
// Node pur, aucune dépendance : lit les fichiers texte de `plugin/`, aucune écriture.
//
// USAGE
//   node tests/tester-renvois.mjs
//
// Sortie : une ligne OK/FAIL par cas (avec le compte inspecté) ; exit 1 si un cas échoue, 0 sinon.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

// ── Racine résolue depuis l'emplacement du script, jamais depuis process.cwd() ───────────────
// Même règle que plugin/bin/publier.mjs:37 : `tests/` est hors de `plugin/`, mais le script doit
// tourner identiquement peu importe le dossier courant d'où il est lancé.
const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = dirname(ICI);
const PLUGIN = join(RACINE, 'plugin');

// ── Ligne de renvoi ──────────────────────────────────────────────────────────────────────────
// Copiée depuis `plugin/WORKFLOW.md` §5b, seul domicile de cette chaîne — ne jamais la retaper
// ailleurs, ne jamais la reformuler. `tests/` n'est pas vendoré : contrairement à
// `sync-workflow.mjs:73`, qui concatène la chaîne pour un fichier qui se vendore lui-même, un
// littéral simple suffit ici.
const RENVOI = 'Lis ${CLAUDE_PLUGIN_ROOT}/EXECUTANT.md en entier avant ton premier geste : il porte les invariants de lancement.';

const BINAIRES = /\.(png|jpg|jpeg|gif|ico|woff2?|zip)$/i;

let echecs = 0;

function cas(nom, fn) {
  try {
    const raison = fn();
    if (raison) {
      console.log(`FAIL ${nom}: ${raison}`);
      echecs++;
    } else {
      console.log(`OK ${nom}`);
    }
  } catch (e) {
    console.log(`FAIL ${nom}: exception ${e.message}`);
    echecs++;
  }
}

// ── Utilitaires ──────────────────────────────────────────────────────────────────────────────

function fichiersTexteDe(racine) {
  const out = [];
  const parcourir = (rel) => {
    const abs = join(racine, rel);
    for (const e of readdirSync(abs)) {
      const relE = rel ? join(rel, e) : e;
      const absE = join(racine, relE);
      if (statSync(absE).isDirectory()) parcourir(relE);
      else if (!BINAIRES.test(e)) out.push(relE);
    }
  };
  parcourir('');
  return out;
}

function ligneDe(texte, index) {
  return texte.slice(0, index).split('\n').length;
}

// Découpe les blocs `Agent({ … })` d'un texte : profondeur d'accolades depuis le `{` ouvrant,
// jusqu'au `}` qui la ramène à 0. Un bloc s'étend sur plusieurs lignes ; `${CLAUDE_PLUGIN_ROOT}`
// dans le prompt ajoute une paire équilibrée, sans effet sur la profondeur nette.
//
// N'ouvre un bloc que sur une ligne dont le texte, une fois retiré les espaces, est exactement
// `Agent({` — les 5 vrais blocs du dépôt s'ouvrent tous ainsi. Ça exclut `plugin/WORKFLOW.md:360`,
// qui mentionne `` `Agent({ … })` `` en code inline au milieu d'une phrase pour DÉCRIRE le motif :
// ce n'est pas une invocation, et un motif qui la ramasserait serait rouge sur du sain (même classe
// de piège que `docs/references/…` pour l'assertion 2).
function blocsAgentDe(texte) {
  const blocs = [];
  const lignes = texte.split('\n');
  let offset = 0;
  for (let idx = 0; idx < lignes.length; idx++) {
    const ligne = lignes[idx];
    if (ligne.trim() === 'Agent({') {
      const depart = offset + ligne.indexOf('Agent({');
      const debutAccolade = depart + 'Agent('.length; // index du premier '{'
      let profondeur = 0;
      let i = debutAccolade;
      for (; i < texte.length; i++) {
        if (texte[i] === '{') profondeur++;
        else if (texte[i] === '}') {
          profondeur--;
          if (profondeur === 0) break;
        }
      }
      const fin = i; // index du '}' qui referme le bloc
      blocs.push({ texte: texte.slice(depart, fin + 1), ligne: idx + 1 });
    }
    offset += ligne.length + 1; // +1 pour le '\n' retiré par split
  }
  return blocs;
}

// `references/<x>.md` cité, mais pas comme fragment d'un chemin plus long (`docs/references/…`,
// piège constaté dans plugin/skills/choisir-mecanisme/SKILL.md l. 10 et 154 : ces citations
// visent `docs/references/`, pas l'annexe d'une skill). Exclu si précédé d'un `/` ou d'un
// caractère de mot.
const MOTIF_CITATION = /(?<![\w/])references\/([\w.-]+\.md)/g;

function citationsDe(texte) {
  const out = [];
  for (const m of texte.matchAll(MOTIF_CITATION)) {
    out.push({ nom: m[1], ligne: ligneDe(texte, m.index) });
  }
  return out;
}

function skillsAvecSkillMd() {
  const racineSkills = join(PLUGIN, 'skills');
  return readdirSync(racineSkills).filter((e) =>
    statSync(join(racineSkills, e)).isDirectory() &&
    statSync(join(racineSkills, e, 'SKILL.md'), { throwIfNoEntry: false })?.isFile(),
  );
}

// ── Assertion 1 — renvoi présent dans chaque bloc Agent({ de plugin/** ──────────────────────
const fichiersPlugin = fichiersTexteDe(PLUGIN);
const blocsAgent = [];
for (const f of fichiersPlugin) {
  let texte;
  try { texte = readFileSync(join(PLUGIN, f), 'utf8'); } catch { continue; } // illisible en utf8 → pas du texte
  for (const b of blocsAgentDe(texte)) blocsAgent.push({ fichier: join('plugin', f), ...b });
}

cas(`assertion 1 — renvoi présent dans chaque bloc Agent({ (${blocsAgent.length} bloc(s) inspecté(s))`, () => {
  if (blocsAgent.length === 0) return 'aucun bloc Agent({ trouvé sous plugin/** — motif probablement cassé';
  for (const b of blocsAgent) {
    if (!b.texte.includes(RENVOI)) return `${b.fichier}:${b.ligne} ne contient pas la ligne de renvoi`;
  }
  return null;
});

// ── Assertion 2 — chaque references/<x>.md cité par une SKILL.md existe, dans SA skill ──────
const skills = skillsAvecSkillMd();
let citationsInspectees = 0;
cas(`assertion 2 — annexe citée = annexe existante (skills inspectées : ${skills.length})`, () => {
  for (const s of skills) {
    const cheminSkillMd = join(PLUGIN, 'skills', s, 'SKILL.md');
    const texte = readFileSync(cheminSkillMd, 'utf8');
    for (const c of citationsDe(texte)) {
      citationsInspectees++;
      const cheminAnnexe = join(PLUGIN, 'skills', s, 'references', c.nom);
      if (!statSync(cheminAnnexe, { throwIfNoEntry: false })?.isFile()) {
        return `plugin/skills/${s}/SKILL.md:${c.ligne} cite references/${c.nom}, absent de plugin/skills/${s}/references/`;
      }
    }
  }
  if (citationsInspectees === 0) return 'aucune citation references/<x>.md trouvée dans une SKILL.md — motif probablement cassé';
  return null;
});
// Le compte de citations n'est connu qu'après exécution : redit ici pour l'anti-raccourci (« ce
// qu'elle a inspecté »), sans relancer l'assertion.
console.log(`  (annexes citées inspectées : ${citationsInspectees})`);

// ── Assertion 3 — chaque references/*.md présent a au moins un appelant dans sa skill ───────
function fichiersDe(dir) {
  return readdirSync(dir).filter((e) => statSync(join(dir, e)).isFile());
}

const annexesPresentes = [];
for (const s of skills) {
  const dossierAnnexes = join(PLUGIN, 'skills', s, 'references');
  if (!statSync(dossierAnnexes, { throwIfNoEntry: false })?.isDirectory()) continue;
  for (const nomAnnexe of readdirSync(dossierAnnexes).filter((e) => e.endsWith('.md'))) {
    annexesPresentes.push({ skill: s, nom: nomAnnexe });
  }
}

cas(`assertion 3 — annexe présente = annexe appelée (${annexesPresentes.length} annexe(s) présente(s))`, () => {
  if (annexesPresentes.length === 0) return 'aucune annexe references/*.md trouvée sous plugin/skills/ — motif probablement cassé';
  for (const a of annexesPresentes) {
    const dossierSkill = join(PLUGIN, 'skills', a.skill);
    const cheminAnnexe = join(dossierSkill, 'references', a.nom);
    let appele = false;
    const parcourir = (abs) => {
      for (const e of fichiersDe(abs)) {
        const cheminE = join(abs, e);
        if (cheminE === cheminAnnexe) continue; // l'annexe ne s'auto-cite pas
        let texte;
        try { texte = readFileSync(cheminE, 'utf8'); } catch { continue; }
        if (citationsDe(texte).some((c) => c.nom === a.nom)) appele = true;
      }
      for (const e of readdirSync(abs)) {
        const cheminE = join(abs, e);
        if (statSync(cheminE).isDirectory()) parcourir(cheminE);
      }
    };
    parcourir(dossierSkill);
    if (!appele) {
      return `plugin/skills/${a.skill}/references/${a.nom} : aucun appelant dans plugin/skills/${a.skill}/`;
    }
  }
  return null;
});

// ── Verdict ──────────────────────────────────────────────────────────────────────────────────
if (echecs > 0) {
  console.log(`\n${echecs} cas en échec.`);
  process.exit(1);
}
console.log('\nTous les cas sont OK.');
process.exit(0);
