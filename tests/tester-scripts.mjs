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
const PROCHAINE_ACTION = join(BIN, 'prochaine-action.mjs');

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

function git(cwd, ...args) {
  execFileSync('git', args, { cwd, stdio: 'pipe' });
}

function initDepot(cwd) {
  git(cwd, 'init', '-q');
  git(cwd, 'config', 'user.email', 'test@local');
  git(cwd, 'config', 'user.name', 'Test');
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

// ════════════════════════════════════════════════════════════════════════════════════════════════
// prochaine-action.mjs — moitié « lecture » du contrat C2
// ════════════════════════════════════════════════════════════════════════════════════════════════

cas('prochaine-action : sans --etat → « moteur non implémenté (S10) », code 2', () => {
  // N'importe quel cwd valide : le flag --etat est vérifié avant toute lecture de l'index.
  const cwd = dossierJetable('workflow-pa-sansetat-');
  const { code, sortie } = lancer(PROCHAINE_ACTION, ['P5'], cwd);
  if (code !== 2) return `code ${code} attendu 2, sortie: ${sortie}`;
  if (!sortie.includes('moteur non implémenté (S10)')) return `message inattendu: ${sortie}`;
  return null;
});

cas('prochaine-action : plan absent → erreur nommée « index illisible », jamais un état supposé', () => {
  const cwd = dossierJetable('workflow-pa-absent-');
  const { code, sortie } = lancer(PROCHAINE_ACTION, ['P9', '--etat'], cwd);
  if (code !== 2) return `code ${code} attendu 2, sortie: ${sortie}`;
  if (!sortie.includes('index illisible')) return `message inattendu (pas d'erreur nommée): ${sortie}`;
  return null;
});

cas('prochaine-action : fixture copiée de plans/P5/index.md → 9 sessions, 5 vagues, toutes faite', () => {
  // Anti-raccourci : cette fixture est une COPIE de l'index réel (tests/fixtures/plans/P5-copie/),
  // pas une table réécrite d'après le parseur — elle seule révèle les variantes d'un index réel
  // (dates sur `[x]`, libellés de vague variés).
  const cwd = dossierJetable('workflow-pa-p5-');
  cpSync(join(FIXTURES, 'plans', 'P5-copie'), join(cwd, 'plans', 'P5'), { recursive: true });
  const { code, sortie } = lancer(PROCHAINE_ACTION, ['P5', '--etat'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  let json;
  try {
    json = JSON.parse(sortie);
  } catch (e) {
    return `JSON invalide (${e.message}): ${sortie}`;
  }
  if (json.sessions.length !== 9) return `9 sessions attendues, reçu ${json.sessions.length}`;
  // Le fichier réel porte 5 vagues (« Vague 1 » à « Vague 5 »), pas 6 — vérifié par grep sur
  // plans/P5/index.md avant d'écrire ce test (S2/T4, écart de comptage dans S2.md signalé au bilan).
  if (json.vagues.length !== 5) return `5 vagues attendues, reçu ${json.vagues.length}`;
  const nonFaites = json.sessions.filter((s) => s.etat !== 'faite');
  if (nonFaites.length > 0) return `sessions non « faite »: ${nonFaites.map((s) => s.session).join(', ')}`;
  return null;
});

cas('prochaine-action : fixture du squelette → vagues et sessions reconnues, aucun état deviné', () => {
  const cwd = dossierJetable('workflow-pa-squelette-');
  cpSync(join(FIXTURES, 'plans', 'squelette'), join(cwd, 'plans', 'P0'), { recursive: true });
  const { code, sortie } = lancer(PROCHAINE_ACTION, ['P0', '--etat'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  const json = JSON.parse(sortie);
  if (json.sessions.length !== 2) return `2 sessions attendues (S1, S2), reçu ${json.sessions.length}`;
  if (json.vagues.length !== 3) return `3 vagues attendues, reçu ${json.vagues.length}`;
  if (!json.vagues[0].parallelisable) return 'vague 1 attendue parallélisable';
  if (!json.vagues[2].cloture) return 'vague 3 attendue clôture';
  if (json.sessions.some((s) => s.etat !== 'a-lancer')) {
    return `toutes les sessions du squelette sont à faire, reçu: ${JSON.stringify(json.sessions.map((s) => s.etat))}`;
  }
  return null;
});

cas('prochaine-action : .echec.md complet → état "echec", cinq lignes mécaniques lues telles quelles', () => {
  const cwd = dossierJetable('workflow-pa-echec-complet-');
  cpSync(join(FIXTURES, 'plans', 'squelette'), join(cwd, 'plans', 'P0'), { recursive: true });
  writeFileSync(
    join(cwd, 'plans', 'P0', 'S1.echec.md'),
    [
      '# S1 — échec du 2026-09-17',
      '',
      'Nature : exécution',
      'Tentatives : reprise=1 enquete=0',
      'Blocage : relancer le build après correction du type',
      'Mesure : abc1234 · node tests/tester-scripts.mjs',
      'Auto : non',
      '',
    ].join('\n'),
  );
  const { code, sortie } = lancer(PROCHAINE_ACTION, ['P0', '--etat'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  const json = JSON.parse(sortie);
  const s1 = json.sessions.find((s) => s.session === 'S1');
  if (!s1) return 'session S1 absente';
  if (s1.etat !== 'echec') return `état attendu "echec", reçu ${s1.etat}`;
  if (s1.echec.nature !== 'exécution') return `nature inattendue: ${s1.echec.nature}`;
  if (s1.echec.tentatives.reprise !== 1 || s1.echec.tentatives.enquete !== 0) {
    return `tentatives inattendues: ${JSON.stringify(s1.echec.tentatives)}`;
  }
  if (s1.echec.blocage !== 'relancer le build après correction du type') return `blocage inattendu: ${s1.echec.blocage}`;
  if (s1.echec.demarrageAFroid) return 'demarrageAFroid attendu faux (Blocage présent)';
  if (s1.echec.mesure !== 'abc1234 · node tests/tester-scripts.mjs') return `mesure inattendue: ${s1.echec.mesure}`;
  if (s1.echec.auto !== 'non') return `auto inattendu: ${s1.echec.auto}`;
  return null;
});

cas('prochaine-action : .echec.md sans Tentatives ni Blocage → défauts du gabarit appliqués', () => {
  const cwd = dossierJetable('workflow-pa-echec-partiel-');
  cpSync(join(FIXTURES, 'plans', 'squelette'), join(cwd, 'plans', 'P0'), { recursive: true });
  writeFileSync(
    join(cwd, 'plans', 'P0', 'S1.echec.md'),
    ['# S1 — échec du 2026-09-17', '', 'Nature : environnement', '', '## Tâche visée', '<t>', ''].join('\n'),
  );
  const { code, sortie } = lancer(PROCHAINE_ACTION, ['P0', '--etat'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  const json = JSON.parse(sortie);
  const s1 = json.sessions.find((s) => s.session === 'S1');
  if (s1.echec.tentatives.reprise !== 0 || s1.echec.tentatives.enquete !== 0) {
    return `« Tentatives » absente : défaut reprise=0 enquete=0 attendu, reçu ${JSON.stringify(s1.echec.tentatives)}`;
  }
  if (s1.echec.blocage !== null) return `« Blocage » absente : null attendu, reçu ${s1.echec.blocage}`;
  if (!s1.echec.demarrageAFroid) return 'demarrageAFroid attendu vrai (Blocage absente ⇒ démarrage à froid)';
  if (s1.echec.nature !== 'environnement') return `nature (présente) mal lue: ${s1.echec.nature}`;
  return null;
});

cas('prochaine-action : session non cochée mais toutes ses tâches commitées → « faite »', () => {
  const cwd = dossierJetable('workflow-pa-commits-');
  cpSync(join(FIXTURES, 'plans', 'squelette'), join(cwd, 'plans', 'P0'), { recursive: true });
  initDepot(cwd);
  writeFileSync(join(cwd, 'a.txt'), 'x\n');
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-q', '-m', 'S1 : T1-T3 faites\n\nPlan: P0/S1/T1\nPlan: P0/S1/T2\nPlan: P0/S1/T3');
  const { code, sortie } = lancer(PROCHAINE_ACTION, ['P0', '--etat'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  const json = JSON.parse(sortie);
  const s1 = json.sessions.find((s) => s.session === 'S1');
  const s2 = json.sessions.find((s) => s.session === 'S2');
  if (s1.etat !== 'faite') return `S1 (T1-T3, toutes commitées) attendue "faite", reçu ${s1.etat}`;
  if (s2.etat !== 'a-lancer') return `S2 (T5, aucun commit) attendue "a-lancer", reçu ${s2.etat}`;
  return null;
});

cas('prochaine-action : .claude/wave.lock présent → dépôt.waveLock vrai', () => {
  const cwd = dossierJetable('workflow-pa-wavelock-');
  cpSync(join(FIXTURES, 'plans', 'squelette'), join(cwd, 'plans', 'P0'), { recursive: true });
  mkdirSync(join(cwd, '.claude'), { recursive: true });
  writeFileSync(join(cwd, '.claude', 'wave.lock'), '');
  initDepot(cwd); // pour que `git rev-parse --git-common-dir` résolve la racine du dépôt
  writeFileSync(join(cwd, 'a.txt'), 'x\n');
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-q', '-m', 'init');
  const { code, sortie } = lancer(PROCHAINE_ACTION, ['P0', '--etat'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  const json = JSON.parse(sortie);
  if (json.depot.waveLock !== true) return `waveLock attendu vrai, reçu ${JSON.stringify(json.depot)}`;
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
