#!/usr/bin/env node
// Test des scripts `plugin/bin/n0.mjs` et `plugin/bin/prochaine-action.mjs` — hors `plugin/`, comme
// `tests/tester-hooks.mjs` : le dépôt source doit rester sûr avant publication (contrat C1/C2,
// docs/decisions/2026-09-17-autonomie-par-defaut-etat-scripte-push-par-session.md).
//
// POURQUOI CE FICHIER EXISTE
// N0 et l'état d'une orchestration sortent des sous-agents pour devenir des scripts (C1, C2) : un
// script non testé qui remplace un sous-agent (jusqu'ici couvert par le jugement d'un modèle) est
// un recul, pas un progrès, s'il se trompe silencieusement sur l'extraction d'erreur ou l'état d'une
// session. `publier.mjs` refuse de publier si ce test échoue (comme `tester-hooks.mjs`).
//
// Node pur, aucune dépendance : copie les fixtures de `tests/fixtures/` dans un dossier jetable par
// cas (mkdtempSync), lance le script en sous-processus, vérifie code de sortie et texte produit.
//
// USAGE
//   node tests/tester-scripts.mjs
//
// Sortie : une ligne OK/FAIL par cas ; exit 1 si un cas échoue, 0 sinon.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = dirname(ICI);
const BIN = join(RACINE, 'plugin', 'bin');
const FIXTURES = join(RACINE, 'tests', 'fixtures');
const N0 = join(BIN, 'n0.mjs');

const dossiersTemporaires = [];
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

function dossierJetable(prefixe) {
  const d = mkdtempSync(join(tmpdir(), prefixe));
  dossiersTemporaires.push(d);
  return d;
}

/** Copie une fixture (sous tests/fixtures/<sousChemin>) dans un dossier jetable, retourne son chemin. */
function copierFixture(sousChemin) {
  const src = join(FIXTURES, sousChemin);
  const dst = dossierJetable('workflow-scripts-');
  cpSync(src, dst, { recursive: true });
  return dst;
}

/** Lance un script node dans `cwd`, sans jamais lever : renvoie {code, sortie} (stdout+stderr fusionnés). */
function lancer(script, args, cwd) {
  try {
    const sortie = execFileSync('node', [script, ...args], {
      cwd,
      encoding: 'utf8',
      input: '',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { code: 0, sortie };
  } catch (e) {
    return { code: e.status ?? 1, sortie: (e.stdout ?? '') + (e.stderr ?? '') };
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// n0.mjs — contrat C1
// ════════════════════════════════════════════════════════════════════════════════════════════════

cas('n0 : configuration vert → code 0, une ligne PASS par commande', () => {
  const cwd = copierFixture('n0/vert');
  const { code, sortie } = lancer(N0, [], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!/build → PASS/.test(sortie)) return `ligne "build → PASS" absente: ${sortie}`;
  if (!/lint → PASS/.test(sortie)) return `ligne "lint → PASS" absente: ${sortie}`;
  return null;
});

cas('n0 : configuration rouge → code 1, texte tsc extrait (pas juste le code), log complet', () => {
  const cwd = copierFixture('n0/rouge');
  const { code, sortie } = lancer(N0, [], cwd);
  if (code !== 1) return `code ${code} attendu 1, sortie: ${sortie}`;
  if (!/build → FAIL/.test(sortie)) return `ligne "build → FAIL" absente: ${sortie}`;
  // Anti-raccourci : la fixture rouge échoue avec une erreur simulée au format tsc, jamais une
  // commande introuvable — asserter que ce TEXTE précis a été extrait prouve l'extraction, pas
  // seulement le code de sortie 1 (qu'une commande introuvable produirait tout autant).
  const ligneAttendue = 'src/app.ts(3,5): error TS2345: Type mismatch';
  if (!sortie.includes(ligneAttendue)) return `texte extrait absent de la sortie: ${sortie}`;
  const cheminLog = join(cwd, '.claude', 'n0', 'dernier.log');
  if (!existsSync(cheminLog)) return 'log complet non écrit';
  if (!readFileSync(cheminLog, 'utf8').includes(ligneAttendue)) return 'log complet ne contient pas la ligne simulée';
  if (!sortie.includes(cheminLog)) return `chemin du log absent de la sortie: ${sortie}`;
  return null;
});

cas('n0 : .claude/n0.json absent → code 2, message C1 mot pour mot', () => {
  const cwd = copierFixture('n0/absent');
  const { code, sortie } = lancer(N0, [], cwd);
  if (code !== 2) return `code ${code} attendu 2, sortie: ${sortie}`;
  const attendu = 'n0: déclarer les commandes dans .claude/n0.json (les reprendre de CLAUDE.md § Commandes)';
  if (sortie.trim() !== attendu) return `message inattendu: ${JSON.stringify(sortie)}`;
  return null;
});

cas('n0 : délai dépassé → FAIL (délai), code 1', () => {
  const cwd = dossierJetable('workflow-n0-delai-');
  mkdirSync(join(cwd, '.claude'), { recursive: true });
  writeFileSync(
    join(cwd, '.claude', 'n0.json'),
    JSON.stringify({ commandes: [{ nom: 'lent', cmd: 'node lent.mjs', delaiMs: 150 }] }),
  );
  writeFileSync(join(cwd, 'lent.mjs'), 'await new Promise((r) => setTimeout(r, 3000));\n');
  const { code, sortie } = lancer(N0, [], cwd);
  if (code !== 1) return `code ${code} attendu 1, sortie: ${sortie}`;
  if (!/lent → FAIL \(délai\)/.test(sortie)) return `ligne "lent → FAIL (délai)" absente: ${sortie}`;
  return null;
});

cas('n0 : --seulement ne lance que la commande nommée', () => {
  const cwd = copierFixture('n0/vert');
  const { code, sortie } = lancer(N0, ['--seulement', 'lint'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!/lint → PASS/.test(sortie)) return `ligne "lint → PASS" absente: ${sortie}`;
  if (/build →/.test(sortie)) return `"build" n'aurait pas dû tourner: ${sortie}`;
  return null;
});

cas('n0 : --cible substitue {fichier} dans testCible', () => {
  const cwd = copierFixture('n0/vert');
  const { code, sortie } = lancer(N0, ['--cible', 'src/x.test.js'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!/testCible → PASS/.test(sortie)) return `ligne "testCible → PASS" absente: ${sortie}`;
  const log = readFileSync(join(cwd, '.claude', 'n0', 'dernier.log'), 'utf8');
  if (!log.includes('cible: src/x.test.js')) return `{fichier} non substitué dans la commande: ${log}`;
  return null;
});

// ── Nettoyage et verdict ─────────────────────────────────────────────────────
for (const d of dossiersTemporaires) {
  try {
    rmSync(d, { recursive: true, force: true });
  } catch {
    /* best-effort */
  }
}

if (echecs > 0) {
  console.log(`\n${echecs} cas en échec.`);
  process.exit(1);
}
console.log('\nTous les cas sont OK.');
process.exit(0);
