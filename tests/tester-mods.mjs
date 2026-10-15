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
// Sortie : une ligne OK/FAIL par contrôle ; exit 1 au moindre écart, 0 sinon.

import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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
const binaire = process.env.CLAUDE_CODE_EXECPATH || 'claude';
const WIN = process.platform === 'win32';
const citer = (a) => `"${String(a).replace(/"/g, '\\"')}"`;
// Windows : `claude.cmd` d'une installation npm ne se lance pas sans shell, comme dans installer-mods.mjs.
function claude(args) {
  const opts = { cwd: RACINE, windowsHide: true, stdio: 'pipe', encoding: 'utf8', timeout: 180000 };
  return WIN ? execSync([binaire, ...args].map(citer).join(' '), opts) : execFileSync(binaire, args, opts);
}
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

const versionWorkflow = json(join(PLUGIN, '.claude-plugin', 'plugin.json')).version;
const marketplace = json(join(PLUGIN, '.claude-plugin', 'marketplace.json'));

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
