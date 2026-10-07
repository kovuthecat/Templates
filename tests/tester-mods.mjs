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
//   4. `<bin> plugin test <mod>` sort 0.
// `<bin>` = `CLAUDE_CODE_EXECPATH` s'il est défini, sinon `claude`. Aucun binaire lançable → échec
// nommé : jamais un saut silencieux. Aucun mod trouvé → échec aussi (un mauvais chemin ne doit pas
// passer pour « tout va bien »).
//
// USAGE
//   node tests/tester-mods.mjs [--racine <dossier>]   (--racine : pour les tests de ce contrôle lui-même)
//
// Sortie : une ligne OK/FAIL par contrôle ; exit 1 au moindre écart, 0 sinon.

import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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

const versionWorkflow = json(join(PLUGIN, '.claude-plugin', 'plugin.json')).version;
const marketplace = json(join(PLUGIN, '.claude-plugin', 'marketplace.json'));

let binaireLancable = true;
try { claude(['--version']); }
catch (e) { binaireLancable = false; ko(`aucun binaire claude lançable (${binaire}) — validate et test impossibles : ${dernieres(e)}`); }

for (const mod of mods) {
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
