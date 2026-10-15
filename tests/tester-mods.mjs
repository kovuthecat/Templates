#!/usr/bin/env node
// Contrôle des mods du workflow (`plugin/mods/<mod>/`) — hors `plugin/`, comme `tests/tester-hooks.mjs` :
// jamais vendoré, la source doit rester sûre avant publication.
//
// POURQUOI CE FICHIER EXISTE
// Un module de mod invalide se TAIT au chargement (P12) : sans ce contrôle, un mod cassé serait publié,
// installé et affiché « enabled » sans jamais agir. Et une version de mod non alignée sur celle du
// workflow n'est jamais rechargée (une mise à jour à version égale ne relit pas le module, P12).
// `publier.mjs` refuse de publier si ce contrôle échoue ; `.claude/n0.json` le lance.
//
// Pour chaque mod (sous-dossier de `plugin/mods/` portant `.claude-plugin/plugin.json`) :
//   1. sa version == celle de `plugin/.claude-plugin/plugin.json` ;
//   2. il figure dans `plugin/.claude-plugin/marketplace.json` (source `./mods/<mod>`) ;
//   3. `<bin> plugin validate <mod>/.claude-plugin/plugin.json` sort 0 ;
//   4. `<bin> plugin test <mod>` sort 0 ;
//   5. (P20/S4) sa copie du lecteur d'index, `hooks/lire-index.mjs`, est IDENTIQUE à
//      `plugin/bin/lire-index.mjs` — un mod est un plugin séparé, il ne peut pas importer `plugin/bin`,
//      donc la copie est générée (`--regenerer-copies`) et jamais éditée à la main. `garde-fous` et
//      `affichage` doivent en avoir une ; toute autre copie trouvée est contrôlée de même.
// `<bin>` = `CLAUDE_CODE_EXECPATH` s'il est défini, sinon `claude`. Aucun binaire lançable → échec
// nommé : jamais un saut silencieux. Aucun mod trouvé → échec aussi (un mauvais chemin ne doit pas
// passer pour « tout va bien »).
//
// USAGE
//   node tests/tester-mods.mjs [--racine <dossier>]   (--racine : pour les tests de ce contrôle lui-même)
//   node tests/tester-mods.mjs --regenerer-copies      réécrit les copies du lecteur d'index, puis s'arrête
//
//   6. (P20/S10) les fixtures de sortie du moteur que lisent les tests des mods
//      (`affichage/tests/fixtures-plan.ts`, `garde-fous/tests/fixture-index.ts`) sont RÉGÉNÉRÉES à chaque
//      passage, depuis le vrai `prochaine-action.mjs` lancé sur `tests/fixtures/plans/moteur-base` : un
//      fichier régénéré une fois puis recommité figerait de nouveau la sortie du moteur. Le fichier est
//      réécrit avant `plugin test` ; commité, il ne change que si le moteur change.
//
// Sortie : une ligne OK/FAIL par contrôle ; exit 1 au moindre écart, 0 sinon.

import { claude as claudeCli, binaire } from '../plugin/bin/claude-cli.mjs';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const iRacine = process.argv.indexOf('--racine');
const RACINE = iRacine >= 0 ? resolve(process.argv[iRacine + 1]) : dirname(dirname(fileURLToPath(import.meta.url)));
const PLUGIN = join(RACINE, 'plugin');
const MODS = join(PLUGIN, 'mods');

let echecs = 0;
const ok = (msg) => console.log(`OK ${msg}`);
const ko = (msg) => { console.log(`FAIL ${msg}`); echecs++; };
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ── Binaire ──────────────────────────────────────────────────────────────────
// Le wrapper `claude()` est partagé avec installer-mods.mjs et publier.mjs (plugin/bin/claude-cli.mjs).
const claude = (args) => claudeCli(args, { cwd: RACINE, timeout: 180000 });
const dernieres = (e) => `${e.stdout ?? ''}${e.stderr ?? ''}`.trim().split('\n').slice(-8).join(' | ') || e.message;

// ── Mods ─────────────────────────────────────────────────────────────────────
const mods = existsSync(MODS)
  ? readdirSync(MODS).sort().filter((e) => statSync(join(MODS, e)).isDirectory()
      && existsSync(join(MODS, e, '.claude-plugin', 'plugin.json')))
  : [];
if (mods.length === 0) {
  ko(`aucun mod trouvé sous ${MODS} — un contrôle qui ne contrôle rien ne passe pas`);
  console.log(`\n${echecs} contrôle(s) en échec.`);
  process.exit(1);
}

// ── Copies du lecteur d'index (P20/S4) ───────────────────────────────────────
// Octet pour octet, fins de ligne normalisées (une copie écrite sous Windows peut être en CRLF).
const SOURCE_LECTEUR = join(PLUGIN, 'bin', 'lire-index.mjs');
const MODS_AVEC_COPIE = ['garde-fous', 'affichage'];
const lireNormalise = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const copieDe = (mod) => join(MODS, mod, 'hooks', 'lire-index.mjs');

if (process.argv.includes('--regenerer-copies')) {
  if (!existsSync(SOURCE_LECTEUR)) { console.log(`FAIL source absente : ${SOURCE_LECTEUR}`); process.exit(1); }
  const source = lireNormalise(SOURCE_LECTEUR);
  for (const mod of MODS_AVEC_COPIE) {
    if (!mods.includes(mod)) { console.log(`FAIL mod ${mod} introuvable sous ${MODS}`); process.exit(1); }
    mkdirSync(dirname(copieDe(mod)), { recursive: true });
    writeFileSync(copieDe(mod), source);
    console.log(`copie écrite : ${copieDe(mod)}`);
  }
  process.exit(0);
}

// ── Fixtures de sortie du moteur (P20/S10) ───────────────────────────────────
// Un scénario = un dépôt jetable (copie de moteur-base, tout commité) et la sortie `P9 --json` du moteur.
const MOTEUR = join(PLUGIN, 'bin', 'prochaine-action.mjs');
const PLANS_FIXTURES = join(RACINE, 'tests', 'fixtures', 'plans');
const CIBLES_MOTEUR = [
  { mod: 'affichage', fichier: join(MODS, 'affichage', 'tests', 'fixtures-plan.ts') },
  { mod: 'garde-fous', fichier: join(MODS, 'garde-fous', 'tests', 'fixture-index.ts') },
];
const echecExecution = (reprise) => ['Nature : exécution', `Tentatives : reprise=${reprise} enquete=0`, 'Blocage : fixture', ''].join('\n');
const SCENARIOS_MOTEUR = [
  { nom: 'MOTEUR_LANCER', doc: 'plan neuf : lancer la vague 1 (S1, Sonnet)', transformer: (t) => t },
  { nom: 'MOTEUR_REPRENDRE_SONNET', doc: "S1 déclarée Haiku dans l'index, en échec (reprise=1) : le moteur rend Sonnet",
    transformer: (t) => t.replace('Sonnet', 'Haiku'), echec: echecExecution(1) },
  { nom: 'MOTEUR_REPRENDRE_OPUS', doc: "S1 déclarée Sonnet dans l'index, en échec (reprise=1) : le moteur rend Opus",
    transformer: (t) => t, echec: echecExecution(1) },
  { nom: 'MOTEUR_FINI', doc: 'plan clos : fini', transformer: (t) => t.replace('Workflow : v0.39.0', ['Workflow : v0.39.0', 'Clos : 2026-09-29'].join('\n')) },
];

function sortieMoteur(scenario) {
  const cwd = mkdtempSync(join(tmpdir(), 'mods-moteur-'));
  try {
    cpSync(join(PLANS_FIXTURES, 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
    const index = join(cwd, 'plans', 'P9', 'index.md');
    writeFileSync(index, scenario.transformer(readFileSync(index, 'utf8').replace(/\r\n/g, '\n')));
    if (scenario.echec) writeFileSync(join(cwd, 'plans', 'P9', 'S1.echec.md'), scenario.echec);
    const git = (...a) => execFileSync('git', a, { cwd, stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 'test@local');
    git('config', 'user.name', 'Test');
    git('config', 'commit.gpgsign', 'false');
    git('add', 'plans');
    git('commit', '-q', '-m', 'init');
    return execFileSync('node', [MOTEUR, 'P9', '--json'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

const ENTETE_MOTEUR = [
  '// GÉNÉRÉ par `node tests/tester-mods.mjs` (P20/S10) à chaque passage : sorties RÉELLES de',
  '// `node plugin/bin/prochaine-action.mjs P9 --json` sur tests/fixtures/plans/moteur-base. Ne jamais éditer à la main.',
  '',
  '',
].join('\n');

// Collecte d'incidents : le VRAI collecter-incidents.mjs --json sur un dossier de projets jetable (deux vrais
// incidents de docs/workflow/incidents/, un incident mal rempli, un projet sans incidents, un dossier sans .git).
const COLLECTE = join(PLUGIN, 'bin', 'collecter-incidents.mjs');
const INCIDENTS_REELS = ['2026-10-05-publier-argument-inconnu.md', '2026-09-29-hook-git-commit-a-faux-positif.md'];
const FIXTURES_INCIDENTS = join(MODS, 'affichage', 'tests', 'fixtures-incidents.ts');

function sortiesCollecte() {
  const parent = mkdtempSync(join(tmpdir(), 'mods-incidents-'));
  try {
    const dossier = (projet) => join(parent, projet, 'docs', 'workflow', 'incidents');
    for (const p of ['Templates', 'Chords', 'Vide']) mkdirSync(join(parent, p, '.git'), { recursive: true });
    mkdirSync(join(parent, 'SansGit'), { recursive: true });
    mkdirSync(dossier('Templates'), { recursive: true });
    mkdirSync(dossier('Chords'), { recursive: true });
    for (const f of INCIDENTS_REELS) cpSync(join(RACINE, 'docs', 'workflow', 'incidents', f), join(dossier('Templates'), f));
    writeFileSync(join(dossier('Chords'), 'mal-rempli.md'), ['# Un incident mal rempli', '', "Texte libre, sans puces d'en-tête.", ''].join('\n'));
    // Le chemin complet du fichier (dossier jetable) est la seule valeur non reproductible : réduite au nom.
    const lancer = (...args) => {
      const j = JSON.parse(execFileSync('node', [COLLECTE, '--projets', parent, '--json', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
      for (const i of j.incidents) i.fichier = i.fichier.split(/[\\/]/).pop();
      return `${JSON.stringify(j, null, 2)}\n`;
    };
    return { COLLECTE_JSON: lancer(), COLLECTE_DEPUIS_JSON: lancer('--depuis', '2026-10-05') };
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
}

const ENTETE_INCIDENTS = [
  '// GÉNÉRÉ par `node tests/tester-mods.mjs` (P20/S10) à chaque passage : sorties RÉELLES de',
  '// `node plugin/bin/collecter-incidents.mjs --projets <dossier jetable> --json` (seul champ réduit : `fichier`, au nom du fichier).',
  '// Ne jamais éditer à la main.',
  '',
  '',
].join('\n');

function regenererFixturesIncidents() {
  if (!mods.includes('affichage') || !existsSync(dirname(FIXTURES_INCIDENTS))) return; // racine factice
  const manque = [COLLECTE, ...INCIDENTS_REELS.map((f) => join(RACINE, 'docs', 'workflow', 'incidents', f))].filter((p) => !existsSync(p));
  if (manque.length > 0) { ko(`fixtures des incidents : source absente (${manque.join(', ')}) — impossible de régénérer`); return; }
  let sorties;
  try { sorties = sortiesCollecte(); } catch (e) { ko(`fixtures des incidents : collecter-incidents.mjs a échoué — ${dernieres(e)}`); return; }
  const corps = [
    '// Tous les incidents : 3 projets scrutés, deux incidents conformes (Templates), un mal rempli (Chords).',
    `export const COLLECTE_JSON = ${JSON.stringify(sorties.COLLECTE_JSON)}\n`,
    '// Les mêmes, avec --depuis 2026-10-05.',
    `export const COLLECTE_DEPUIS_JSON = ${JSON.stringify(sorties.COLLECTE_DEPUIS_JSON)}\n`,
  ].join('\n');
  writeFileSync(FIXTURES_INCIDENTS, ENTETE_INCIDENTS + corps);
  ok('affichage : fixtures des incidents régénérées (collecter-incidents.mjs --json, 2 sorties)');
}

function regenererFixturesMoteur() {
  const cibles = CIBLES_MOTEUR.filter((c) => mods.includes(c.mod) && existsSync(dirname(c.fichier)));
  if (cibles.length === 0) return; // racine factice (tests de ce contrôle) : rien à régénérer
  if (!existsSync(MOTEUR) || !existsSync(join(PLANS_FIXTURES, 'moteur-base'))) {
    ko(`fixtures du moteur : ${MOTEUR} ou tests/fixtures/plans/moteur-base absent — impossible de régénérer`);
    return;
  }
  let corps;
  try {
    corps = SCENARIOS_MOTEUR.map((sc) => `// ${sc.doc}\nexport const ${sc.nom} = ${JSON.stringify(sortieMoteur(sc))}\n`).join('\n');
  } catch (e) { ko(`fixtures du moteur : le moteur a échoué — ${dernieres(e)}`); return; }
  for (const c of cibles) {
    writeFileSync(c.fichier, ENTETE_MOTEUR + corps);
    ok(`${c.mod} : fixtures du moteur régénérées (${SCENARIOS_MOTEUR.length} sorties de prochaine-action.mjs)`);
  }
}

const versionWorkflow = json(join(PLUGIN, '.claude-plugin', 'plugin.json')).version;
const marketplace = json(join(PLUGIN, '.claude-plugin', 'marketplace.json'));

regenererFixturesMoteur();
regenererFixturesIncidents();

let binaireLancable = true;
try { claude(['--version']); }
catch (e) { binaireLancable = false; ko(`aucun binaire claude lançable (${binaire}) — validate et test impossibles : ${dernieres(e)}`); }

for (const mod of mods) {
  // 5. copie du lecteur d'index
  const copie = copieDe(mod);
  const doitAvoir = MODS_AVEC_COPIE.includes(mod);
  if (existsSync(copie) || doitAvoir) {
    if (!existsSync(SOURCE_LECTEUR)) ko(`${mod} : source du lecteur d'index absente (${SOURCE_LECTEUR})`);
    else if (!existsSync(copie)) ko(`${mod} : hooks/lire-index.mjs absent — \`node tests/tester-mods.mjs --regenerer-copies\``);
    else if (lireNormalise(copie) === lireNormalise(SOURCE_LECTEUR)) ok(`${mod} : lire-index.mjs identique à plugin/bin/lire-index.mjs`);
    else ko(`${mod} : hooks/lire-index.mjs diffère de plugin/bin/lire-index.mjs — copie générée, jamais éditée : \`node tests/tester-mods.mjs --regenerer-copies\``);
  }

  let manifeste;
  try { manifeste = json(join(MODS, mod, '.claude-plugin', 'plugin.json')); }
  catch (e) { ko(`${mod} : plugin.json illisible (${e.message})`); continue; }

  if (manifeste.version === versionWorkflow) ok(`${mod} : version ${manifeste.version} alignée sur le workflow`);
  else ko(`${mod} : version ${manifeste.version ?? '(absente)'} ≠ ${versionWorkflow} (plugin/.claude-plugin/plugin.json) — une version de mod non bumpée n'est jamais rechargée`);

  const entree = (marketplace.plugins ?? []).find((p) => p.name === mod);
  if (entree && entree.source === `./mods/${mod}`) ok(`${mod} : entrée de marketplace.json présente`);
  else ko(`${mod} : entrée { "name": "${mod}", "source": "./mods/${mod}" } absente de plugin/.claude-plugin/marketplace.json${entree ? ` (source actuelle : ${entree.source})` : ''}`);

  if (!binaireLancable) continue; // déjà signalé en échec, une seule fois
  try { claude(['plugin', 'validate', join(MODS, mod, '.claude-plugin', 'plugin.json')]); ok(`${mod} : plugin validate`); }
  catch (e) { ko(`${mod} : plugin validate en échec — ${dernieres(e)}`); }
  try { claude(['plugin', 'test', join(MODS, mod)]); ok(`${mod} : plugin test`); }
  catch (e) { ko(`${mod} : plugin test en échec — ${dernieres(e)}`); }
}

if (echecs > 0) {
  console.log(`\n${echecs} contrôle(s) en échec.`);
  process.exit(1);
}
console.log('\nTous les contrôles sont OK.');
process.exit(0);
