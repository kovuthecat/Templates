#!/usr/bin/env node
// Contrôle des renvois d'invariant et des annexes de skill, hors `plugin/` (jamais vendoré : les
// projets aval n'ont pas à embarquer une suite de tests pour un outillage qu'ils ne modifient pas).
//
// POURQUOI CE FICHIER EXISTE
// C'était le point qui manquait à l'annexe A4 (docs/decisions/2026-09-14-conditions-nommees-domicile-
// unique.md, section (a) règle 3) : son risque était nommé (« une annexe mal désignée n'est jamais
// lue ») sans être levé. Un renvoi qu'aucune machine ne vérifie ne vaut rien. Sept assertions, pas
// une de plus — le contrôle porte sur la PRÉSENCE du renvoi, jamais sur son sens : il ne saura jamais
// dire qu'un invariant est faux, seulement qu'il n'est pas atteignable.
//
//   1. Tout bloc `Agent({ … })` de `plugin/**` qui lance une session, une reprise ou une enquête
//      (`subagent_type` commençant par `session-`, ou prompt contenant `/reprendre-echec`) contient
//      la ligne de renvoi, au mot près. Ailleurs (relecteur, vérificateurs, `critique-plan`,
//      `parcoureur-usage`), la ligne est permise, pas exigée (décision 2026-09-24, point 9 :
//      `EXECUTANT.md` n'est lu que par les agents qui exécutent).
//   2. Tout `references/<x>.md` cité par une `SKILL.md` existe, relatif au dossier de sa skill.
//   3. Tout `references/*.md` présent a au moins un appelant dans le dossier de sa skill.
//   4. Tout agent cité (`subagent_type: "<x>"` ou `` `<x>` → `` de `WORKFLOW.md` §5) existe dans
//      `plugin/agents/`, sauf les agents natifs du harnais.
//   5. Chaque frontmatter de `SKILL.md`/agent se parse : `---…---` présent, lignes `clé: valeur`,
//      `name` en kebab-case, pas de `tools` côté skill ni `allowed-tools` côté agent, aucune valeur
//      non citée ne contient `: ` ni ` #` (Trail of Bits — sinon le frontmatter tombe en silence).
//   6. Toute citation `${CLAUDE_PLUGIN_ROOT}/skills/<s>/references/<x>.md` se résout ; aucune annexe
//      ne cite elle-même une annexe (une annexe ne chaîne pas).
//   7. Aucun fichier de `plugin/**` ne cite `/orchestrer-plan` suivi, dans la même phrase, de « 5c »,
//      « 5d » ou d'un numéro d'`Étape` supérieur au nombre de titres `## Étape` de
//      `orchestrer-plan/SKILL.md` (restes de la voie headless, ou renumérotation jamais reportée
//      dans les renvois — P10/S5/T13).
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

// Un bloc `Agent({` lance une session, une reprise ou une enquête (donc doit porter le renvoi) si
// son `subagent_type` commence par `session-`, ou si son prompt cite `/reprendre-echec`. Déclaré
// ici (pas près de l'assertion 4, qui le réutilise) car l'assertion 1 en a besoin la première.
const MOTIF_SUBAGENT = /subagent_type:\s*"([\w-]+)"/;
function estBlocSessionOuReprise(texte) {
  const m = texte.match(MOTIF_SUBAGENT);
  if (m && m[1].startsWith('session-')) return true;
  return texte.includes('/reprendre-echec');
}

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

// ── Assertion 1 — renvoi présent dans chaque bloc Agent({ qui lance une session/reprise/enquête ──
const fichiersPlugin = fichiersTexteDe(PLUGIN);
const blocsAgent = [];
for (const f of fichiersPlugin) {
  let texte;
  try { texte = readFileSync(join(PLUGIN, f), 'utf8'); } catch { continue; } // illisible en utf8 → pas du texte
  for (const b of blocsAgentDe(texte)) blocsAgent.push({ fichier: join('plugin', f), ...b });
}
const blocsSessionOuReprise = blocsAgent.filter((b) => estBlocSessionOuReprise(b.texte));

cas(`assertion 1 — renvoi présent dans chaque bloc Agent({ de session/reprise/enquête (${blocsSessionOuReprise.length} bloc(s) inspecté(s) sur ${blocsAgent.length} au total)`, () => {
  if (blocsAgent.length === 0) return 'aucun bloc Agent({ trouvé sous plugin/** — motif probablement cassé';
  if (blocsSessionOuReprise.length === 0) return 'aucun bloc Agent({ de session/reprise/enquête trouvé sous plugin/** — motif probablement cassé';
  for (const b of blocsSessionOuReprise) {
    if (!b.texte.includes(RENVOI)) return `${b.fichier}:${b.ligne} ne contient pas la ligne de renvoi`;
  }
  return null;
});

// ── Assertion 1bis — fixtures en mémoire : classification session/reprise vs le reste ───────
// `prochaine-action.mjs` et les squelettes changent souvent ; ce cas fige le CONTRAT de
// classification sur deux fixtures minimales, indépendamment des fichiers réels du dépôt.
cas('assertion 1bis — fixture subagent_type "session-*" classée requise (sans renvoi → détectable)', () => {
  const fixture = 'Agent({\n  subagent_type: "session-medium",\n  prompt: "Ouvre plans/P1/S1.md et exécute-le."\n})';
  const blocs = blocsAgentDe(fixture);
  if (blocs.length !== 1) return `fixture mal formée : ${blocs.length} bloc(s) trouvé(s), 1 attendu`;
  if (!estBlocSessionOuReprise(blocs[0].texte)) return 'un bloc subagent_type: "session-medium" doit être classé session/reprise (donc FAIL si le renvoi manque)';
  if (blocs[0].texte.includes(RENVOI)) return 'fixture invalide : ne doit pas contenir le renvoi';
  return null;
});

cas('assertion 1bis — fixture subagent_type "relecteur-session" classée non requise (sans renvoi → OK)', () => {
  const fixture = 'Agent({\n  subagent_type: "relecteur-session",\n  prompt: "Relis S1 de P1."\n})';
  const blocs = blocsAgentDe(fixture);
  if (blocs.length !== 1) return `fixture mal formée : ${blocs.length} bloc(s) trouvé(s), 1 attendu`;
  if (estBlocSessionOuReprise(blocs[0].texte)) return 'un bloc subagent_type: "relecteur-session" ne doit pas être classé session/reprise (renvoi permis, pas exigé)';
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

// ── Assertion 4 — agent cité = agent présent (blocs Agent({ et liste WORKFLOW.md §5) ────────
// Deux sources, un seul contrat : un nom qui n'est ni un agent natif du harnais ni un fichier de
// `plugin/agents/` est une citation morte. Réutilise `blocsAgent` (assertion 1) plutôt que de
// rescanner le texte brut : un `subagent_type: "fork"` en PROSE (WORKFLOW.md, décrivant l'interdit)
// ne doit pas compter comme une invocation, même piège que l'exclusion de assertion 1.
const NATIFS = new Set(['general-purpose', 'Explore', 'Plan', 'claude-code-guide', 'statusline-setup', 'claude']);
const agentsDisponibles = new Set(
  readdirSync(join(PLUGIN, 'agents')).filter((e) => e.endsWith('.md')).map((e) => e.slice(0, -3)),
);
// MOTIF_SUBAGENT est déclaré plus haut, avant l'assertion 1, qui le réutilise aussi.
const MOTIF_LISTE_5 = /^- `([\w-]+)` →/gm;

const workflowTexte = readFileSync(join(PLUGIN, 'WORKFLOW.md'), 'utf8');
const citationsAgents = [];
for (const b of blocsAgent) {
  const m = b.texte.match(MOTIF_SUBAGENT);
  if (m) citationsAgents.push({ fichier: b.fichier, ligne: b.ligne, x: m[1] });
}
for (const m of workflowTexte.matchAll(MOTIF_LISTE_5)) {
  citationsAgents.push({ fichier: 'plugin/WORKFLOW.md', ligne: ligneDe(workflowTexte, m.index), x: m[1] });
}

cas(`assertion 4 — agent cité = agent présent (${citationsAgents.length} citation(s) inspectée(s))`, () => {
  if (citationsAgents.length === 0) return 'aucun subagent_type ni entrée WORKFLOW.md §5 trouvé — motif probablement cassé';
  for (const c of citationsAgents) {
    if (!NATIFS.has(c.x) && !agentsDisponibles.has(c.x)) {
      return `${c.fichier}:${c.ligne} déclare "${c.x}", absent de plugin/agents/`;
    }
  }
  return null;
});

// ── Assertion 5 — frontmatter sain (skills et agents) ───────────────────────────────────────
// Parseur maison ligne à ligne, pas de bibliothèque YAML — le contrat à vérifier est justement
// celui qu'un vrai parseur YAML casse en silence sur une valeur non citée contenant `: ` ou ` #`
// (Trail of Bits, AGENTS.md).
function frontmatterDe(texte) {
  const lignes = texte.split('\n').map((l) => l.replace(/\r$/, ''));
  if ((lignes[0] || '').trim() !== '---') return { erreur: `bloc frontmatter absent (pas de '---' en tête)` };
  let fin = -1;
  for (let i = 1; i < lignes.length; i++) {
    if (lignes[i].trim() === '---') { fin = i; break; }
  }
  if (fin === -1) return { erreur: `bloc frontmatter jamais refermé` };
  const paires = [];
  for (let i = 1; i < fin; i++) {
    const m = lignes[i].match(/^([A-Za-z][\w-]*):\s?(.*)$/);
    if (!m) return { erreur: `ligne ${i + 1} n'est pas de la forme clé: valeur — ${JSON.stringify(lignes[i])}` };
    paires.push({ cle: m[1], valeur: m[2], ligne: i + 1 });
  }
  return { paires };
}

function valeurNonCitee(valeur) {
  const v = valeur.trim();
  const citee = (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) || (v.length >= 2 && v.startsWith("'") && v.endsWith("'"));
  return !citee && (valeur.includes(': ') || valeur.includes(' #'));
}

const agentsMd = readdirSync(join(PLUGIN, 'agents')).filter((e) => e.endsWith('.md')).map((e) => join('plugin', 'agents', e));
const skillsMd = skills.map((s) => join('plugin', 'skills', s, 'SKILL.md'));
const frontmatters = [...skillsMd.map((c) => ({ chemin: c, estSkill: true })), ...agentsMd.map((c) => ({ chemin: c, estSkill: false }))];

cas(`assertion 5 — frontmatter sain (${frontmatters.length} frontmatter(s) inspecté(s))`, () => {
  if (frontmatters.length === 0) return 'aucun frontmatter de skill ni d\'agent trouvé — motif probablement cassé';
  for (const { chemin, estSkill } of frontmatters) {
    const texte = readFileSync(join(RACINE, chemin), 'utf8');
    const r = frontmatterDe(texte);
    if (r.erreur) return `${chemin} : ${r.erreur}`;
    const parCle = new Map(r.paires.map((p) => [p.cle, p]));
    const nom = parCle.get('name');
    if (!nom) return `${chemin} : clé name absente du frontmatter`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(nom.valeur.trim())) {
      return `${chemin}:${nom.ligne} name "${nom.valeur.trim()}" n'est pas en kebab-case`;
    }
    if (estSkill && parCle.has('tools')) {
      return `${chemin}:${parCle.get('tools').ligne} une skill ne porte pas de clé tools (allowed-tools attendu)`;
    }
    if (!estSkill && parCle.has('allowed-tools')) {
      return `${chemin}:${parCle.get('allowed-tools').ligne} un agent ne porte pas de clé allowed-tools (tools attendu)`;
    }
    for (const p of r.paires) {
      if (valeurNonCitee(p.valeur)) {
        return `${chemin}:${p.ligne} valeur non citée de "${p.cle}" contient ": " ou " #" — ${JSON.stringify(p.valeur)}`;
      }
    }
  }
  return null;
});

// ── Assertion 6 — citation croisée résolue, une annexe ne chaîne pas ────────────────────────
const MOTIF_CROISEE = /\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/([\w.-]+)\/references\/([\w.-]+\.md)/g;

const citationsCroisees = [];
for (const f of fichiersPlugin) {
  let texte;
  try { texte = readFileSync(join(PLUGIN, f), 'utf8'); } catch { continue; }
  for (const m of texte.matchAll(MOTIF_CROISEE)) {
    citationsCroisees.push({ fichier: join('plugin', f), skill: m[1], nom: m[2], ligne: ligneDe(texte, m.index) });
  }
}

cas(`assertion 6 — citation croisée résolue, annexe sans chaîne (${citationsCroisees.length} citation(s) croisée(s) inspectée(s))`, () => {
  for (const c of citationsCroisees) {
    const cheminCible = join(PLUGIN, 'skills', c.skill, 'references', c.nom);
    if (!statSync(cheminCible, { throwIfNoEntry: false })?.isFile()) {
      return `${c.fichier}:${c.ligne} cite \${CLAUDE_PLUGIN_ROOT}/skills/${c.skill}/references/${c.nom}, absent de plugin/skills/${c.skill}/references/`;
    }
  }
  for (const a of annexesPresentes) {
    const cheminAnnexe = join(PLUGIN, 'skills', a.skill, 'references', a.nom);
    let texte;
    try { texte = readFileSync(cheminAnnexe, 'utf8'); } catch { continue; }
    const chaine = citationsDe(texte)[0];
    if (chaine) {
      return `plugin/skills/${a.skill}/references/${a.nom}:${chaine.ligne} cite elle-même references/${chaine.nom} — une annexe ne chaîne pas`;
    }
  }
  return null;
});

// ── Assertion 7 — /orchestrer-plan cité sans renvoi mort (« 5c », « 5d », Étape > N) ─────────
// Restes de la voie headless (« 5c », « 5d ») ou renumérotation d'`orchestrer-plan/SKILL.md`
// jamais reportée dans ses appelants : un numéro d'Étape qui n'existe plus pointe dans le vide
// (P10/S5/T13). Le nombre d'étapes réelles se lit dans le fichier lui-même, jamais en dur ici —
// sinon ce test devient lui-même le prochain renvoi mort à corriger après une renumérotation.
const orchestrerPlanTexte = readFileSync(join(PLUGIN, 'skills', 'orchestrer-plan', 'SKILL.md'), 'utf8');
const nbEtapesOrchestrerPlan = (orchestrerPlanTexte.match(/^## Étape \d+/gm) || []).length;

// Découpage grossier en phrases : sur '.', '!', '?' suivi d'espace + majuscule/guillemet/backtick,
// ou double saut de ligne. Suffisant pour repérer une co-occurrence dans le même voisinage — ce
// n'est pas une analyse linguistique, seulement de quoi éviter les faux positifs entre deux
// paragraphes sans rapport qui citeraient chacun `/orchestrer-plan` et une « Étape » de leur côté.
function phrasesDe(texte) {
  return texte.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý«`])|\n\n+/);
}

cas(`assertion 7 — /orchestrer-plan cité sans renvoi mort (5c, 5d, Étape > ${nbEtapesOrchestrerPlan}) (${fichiersPlugin.length} fichier(s) de plugin/** inspecté(s))`, () => {
  if (nbEtapesOrchestrerPlan === 0) return 'aucun titre ## Étape trouvé dans orchestrer-plan/SKILL.md — motif probablement cassé';
  let phrasesInspectees = 0;
  for (const f of fichiersPlugin) {
    let texte;
    try { texte = readFileSync(join(PLUGIN, f), 'utf8'); } catch { continue; }
    if (!texte.includes('/orchestrer-plan')) continue;
    for (const phrase of phrasesDe(texte)) {
      if (!phrase.includes('/orchestrer-plan')) continue;
      phrasesInspectees++;
      if (/\b5c\b/.test(phrase) || /\b5d\b/.test(phrase)) {
        return `plugin/${f} : phrase citant /orchestrer-plan et « 5c »/« 5d » — ${JSON.stringify(phrase.slice(0, 140))}`;
      }
      const mEtape = phrase.match(/Étape\s+(\d+)/);
      if (mEtape && Number(mEtape[1]) > nbEtapesOrchestrerPlan) {
        return `plugin/${f} : phrase citant /orchestrer-plan et « Étape ${mEtape[1]} » (> ${nbEtapesOrchestrerPlan} étapes réelles dans orchestrer-plan/SKILL.md) — ${JSON.stringify(phrase.slice(0, 140))}`;
      }
    }
  }
  if (phrasesInspectees === 0) return 'aucune phrase citant /orchestrer-plan trouvée sous plugin/** — motif probablement cassé';
  return null;
});

// ── Verdict ──────────────────────────────────────────────────────────────────────────────────
if (echecs > 0) {
  console.log(`\n${echecs} cas en échec.`);
  process.exit(1);
}
console.log('\nTous les cas sont OK.');
process.exit(0);
