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
const BRIEF_A_JOUR = join(BIN, 'brief-a-jour.mjs');

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

/** Dépôt jetable, tout commité (arbre propre) — pour les cas qui doivent passer le contrôle
 * d'arbre sale (T2, P8/S1, D1) sans que ça teste autre chose que cet arrêt-là. */
function initEtCommitTout(cwd, message = 'init') {
  initDepot(cwd);
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', message);
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
// prochaine-action.mjs — état (contrat C2, moitié « lecture », S2) et moteur (moitié « décision », S10)
// ════════════════════════════════════════════════════════════════════════════════════════════════

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
  // Anti-raccourci (S7/T15) : cette fixture est une COPIE du squelette-index.md modifié (ligne
  // `Workflow : v<x>` + colonne « Message de commit » ajoutée après Statut, C4/C7) — les assertions
  // ci-dessous sur `workflow` et sur les sessions/vagues prouvent que le parseur lit le NOUVEAU
  // format, pas seulement qu'il continue de lire l'ancien.
  const cwd = dossierJetable('workflow-pa-squelette-');
  cpSync(join(FIXTURES, 'plans', 'squelette'), join(cwd, 'plans', 'P0'), { recursive: true });
  const { code, sortie } = lancer(PROCHAINE_ACTION, ['P0', '--etat'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  const json = JSON.parse(sortie);
  if (json.workflow !== '<x>') return `Workflow attendu "<x>" (ligne ajoutée au squelette, C4), reçu ${JSON.stringify(json.workflow)}`;
  if (json.sessions.length !== 2) return `2 sessions attendues (S1, S2), reçu ${json.sessions.length}`;
  if (json.vagues.length !== 3) return `3 vagues attendues, reçu ${json.vagues.length}`;
  if (!json.vagues[0].parallelisable) return 'vague 1 attendue parallélisable';
  if (!json.vagues[2].cloture) return 'vague 3 attendue clôture';
  if (json.sessions.some((s) => s.etat !== 'a-lancer')) {
    return `toutes les sessions du squelette sont à faire, reçu: ${JSON.stringify(json.sessions.map((s) => s.etat))}`;
  }
  // La colonne « Message de commit », ajoutée après Statut (C7), ne doit pas décaler la lecture du
  // Statut lui-même (position fixe, cellules[8]) : S1 et S2 restent lues « à faire ».
  const s1 = json.sessions.find((s) => s.session === 'S1');
  if (!s1 || s1.statutBrut !== '[ ]') return `S1.statutBrut attendu "[ ]" (colonne Statut non décalée par l'ajout), reçu ${JSON.stringify(s1?.statutBrut)}`;
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

// ════════════════════════════════════════════════════════════════════════════════════════════════
// prochaine-action.mjs — moteur (S10) : les onze cas de la Validation de S10.md
// ════════════════════════════════════════════════════════════════════════════════════════════════

function lancerJson(args, cwd) {
  const { code, sortie } = lancer(PROCHAINE_ACTION, args, cwd);
  let action = null;
  try {
    action = JSON.parse(sortie);
  } catch {
    /* laissé null, le test le signalera */
  }
  return { code, sortie, action };
}

cas('moteur : plan neuf, aucun commit Plan: → lancer vague 1, chaque session porte modèle et effort', () => {
  // Ex-« regler-effort » (retiré, T4/P7/S2) : depuis que l'effort d'une session vient de son agent
  // et non de la conversation qui orchestre, aucun commit Plan: n'est requis pour lancer une vague —
  // c'est ce test qui couvre désormais la charge utile de `lancer`, cœur du plan.
  const cwd = dossierJetable('workflow-pa-lancer-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  // Arbre commité (arbre propre) : requis depuis T2/P8/S1 (D1) pour que le contrôle d'arbre sale
  // laisse passer un `lancer` — sans lien avec les commits `Plan:` que ce test dit justement inutiles.
  initEtCommitTout(cwd);
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'lancer') return `action attendue "lancer", reçu: ${sortie}`;
  if (action.vague !== 1) return `vague attendue 1, reçu ${action.vague}`;
  const s1 = action.sessions.find((s) => s.session === 'S1');
  if (!s1 || s1.modele !== 'Sonnet' || s1.effort !== 'medium') {
    return `S1 attendue {modele: "Sonnet", effort: "medium"}, reçu: ${JSON.stringify(s1)}`;
  }
  return null;
});

cas('moteur : vague à efforts mêlés → lancer rend à chacune le sien', () => {
  const cwd = dossierJetable('workflow-pa-efforts-melanges-');
  cpSync(join(FIXTURES, 'plans', 'moteur-efforts-melanges'), join(cwd, 'plans', 'P9'), { recursive: true });
  initEtCommitTout(cwd); // arbre propre requis par le contrôle d'arbre sale (T2/P8/S1, D1)
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'lancer') return `action attendue "lancer", reçu: ${sortie}`;
  const s1 = action.sessions.find((s) => s.session === 'S1');
  const s2 = action.sessions.find((s) => s.session === 'S2');
  if (!s1 || s1.effort !== 'low') return `S1 attendu effort "low", reçu: ${JSON.stringify(s1)}`;
  if (!s2 || s2.effort !== 'medium') return `S2 attendu effort "medium", reçu: ${JSON.stringify(s2)}`;
  return null;
});

cas('moteur : cohérence — chaque effort lançable a son agent plugin/agents/session-<effort>.md', () => {
  // Efforts lançables (T2, P7/S2, prochaine-action.mjs `EFFORTS_LANCABLES`) : sans ce test, plus
  // rien ne relie la validation de l'index aux fichiers d'agent créés en S1.
  const efforts = ['low', 'medium', 'high', 'xhigh'];
  for (const e of efforts) {
    const chemin = join(RACINE, 'plugin', 'agents', `session-${e}.md`);
    if (!existsSync(chemin)) return `agent manquant pour l'effort "${e}": ${chemin}`;
  }
  return null;
});

cas('moteur : vague faite mais commits non poussés → pousser', () => {
  const cwd = dossierJetable('workflow-pa-pousser-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  writeFileSync(join(cwd, 'plans', 'P9', 'S1.revue.md'), 'Bloquant : 0\nCouverture : complète\n');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd, stdio: 'pipe' });
  git(cwd, 'config', 'user.email', 'test@local');
  git(cwd, 'config', 'user.name', 'Test');
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-q', '-m', 'S1\n\nPlan: P9/S1/T1\nPlan: P9/S1/T2');
  const bare = dossierJetable('workflow-pa-bare-');
  execFileSync('git', ['init', '--bare', '-q'], { cwd: bare, stdio: 'pipe' });
  git(cwd, 'remote', 'add', 'origin', bare);
  git(cwd, 'push', '-q', '-u', 'origin', 'main');
  writeFileSync(join(cwd, 'scratch.txt'), 'x\n');
  git(cwd, 'add', 'scratch.txt');
  git(cwd, 'commit', '-q', '-m', 'travail local non poussé');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'pousser') return `action attendue "pousser", reçu: ${sortie}`;
  return null;
});

cas('moteur : vague close sans revue → relire', () => {
  const cwd = dossierJetable('workflow-pa-relire-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  initDepot(cwd);
  git(cwd, 'commit', '--allow-empty', '-q', '-m', 'S1\n\nPlan: P9/S1/T1\nPlan: P9/S1/T2');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'relire') return `action attendue "relire", reçu: ${sortie}`;
  if (action.vague !== 1 || !action.sessions.some((s) => s.session === 'S1')) {
    return `vague/sessions inattendus: ${sortie}`;
  }
  return null;
});

cas('moteur : session low avec zone réelle sans revue → la vague avance (pas de relire)', () => {
  const cwd = dossierJetable('workflow-pa-low-sans-revue-');
  cpSync(join(FIXTURES, 'plans', 'moteur-low'), join(cwd, 'plans', 'P9'), { recursive: true });
  initDepot(cwd);
  git(cwd, 'commit', '--allow-empty', '-q', '-m', 'S1\n\nPlan: P9/S1/T1\nPlan: P9/S1/T2');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (action && action.action === 'relire') return `relire n'aurait pas dû être rendu pour une session low: ${sortie}`;
  if (!action || action.action !== 'fini') return `action attendue "fini" (vague avancée sans revue), reçu: ${sortie}`;
  return null;
});

cas('moteur : vague close, revue faite, ordonnancement validation-humaine, vague suivante non démarrée → validation-humaine', () => {
  const cwd = dossierJetable('workflow-pa-validation-');
  cpSync(join(FIXTURES, 'plans', 'moteur-validation-humaine'), join(cwd, 'plans', 'P9'), { recursive: true });
  initDepot(cwd);
  git(cwd, 'commit', '--allow-empty', '-q', '-m', 'S1\n\nPlan: P9/S1/T1\nPlan: P9/S1/T2');
  writeFileSync(join(cwd, 'plans', 'P9', 'S1.revue.md'), 'Bloquant : 0\nCouverture : complète\n');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'validation-humaine') return `action attendue "validation-humaine", reçu: ${sortie}`;
  if (action.vague !== 1) return `vague attendue 1, reçu ${action.vague}`;
  return null;
});

cas('moteur : effort en emphase markdown (**high**) → lancer avec effort normalisé "high"', () => {
  const cwd = dossierJetable('workflow-pa-effort-emphase-');
  cpSync(join(FIXTURES, 'plans', 'moteur-effort'), join(cwd, 'plans', 'P9'), { recursive: true });
  initDepot(cwd);
  git(cwd, 'commit', '--allow-empty', '-q', '-m', 'Plan: P9/S9/T99'); // ref qui ne concerne pas S1
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'lancer') return `action attendue "lancer", reçu: ${sortie}`;
  const s1 = action.sessions.find((s) => s.session === 'S1');
  if (!s1 || s1.effort !== 'high') return `effort attendu "high" (emphase retirée), reçu: ${JSON.stringify(s1)}`;
  return null;
});

cas('moteur : effort "max" en index → question, motif citant §3', () => {
  const cwd = dossierJetable('workflow-pa-effort-max-');
  cpSync(join(FIXTURES, 'plans', 'moteur-effort'), join(cwd, 'plans', 'P9'), { recursive: true });
  const chemin = join(cwd, 'plans', 'P9', 'index.md');
  writeFileSync(chemin, readFileSync(chemin, 'utf8').replace('**high**', 'max'));
  initDepot(cwd);
  git(cwd, 'commit', '--allow-empty', '-q', '-m', 'Plan: P9/S9/T99');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'question') return `action attendue "question", reçu: ${sortie}`;
  if (!/§3/.test(action.motif)) return `motif attendu citant §3, reçu: ${action.motif}`;
  return null;
});

cas('moteur : effort inconnu ("turbo") en index → question, valeurs acceptées citées', () => {
  const cwd = dossierJetable('workflow-pa-effort-inconnu-');
  cpSync(join(FIXTURES, 'plans', 'moteur-effort'), join(cwd, 'plans', 'P9'), { recursive: true });
  const chemin = join(cwd, 'plans', 'P9', 'index.md');
  writeFileSync(chemin, readFileSync(chemin, 'utf8').replace('**high**', 'turbo'));
  initDepot(cwd);
  git(cwd, 'commit', '--allow-empty', '-q', '-m', 'Plan: P9/S9/T99');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'question') return `action attendue "question", reçu: ${sortie}`;
  if (!/low, medium, high, xhigh/.test(action.motif)) {
    return `motif attendu citant les valeurs acceptées, reçu: ${action.motif}`;
  }
  return null;
});

cas('moteur : échec exécution, modèle Sonnet → reprendre Opus (un cran au-dessus)', () => {
  const cwd = dossierJetable('workflow-pa-reprendre-exec-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  writeFileSync(
    join(cwd, 'plans', 'P9', 'S1.echec.md'),
    ['Nature : exécution', 'Tentatives : reprise=0 enquete=0', 'Blocage : relancer après correction', ''].join('\n'),
  );
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'reprendre') return `action attendue "reprendre", reçu: ${sortie}`;
  if (action.session !== 'S1') return `session attendue S1, reçu ${action.session}`;
  if (action.modele !== 'Opus') return `modèle attendu "Opus" (un cran au-dessus de Sonnet), reçu ${action.modele}`;
  return null;
});

cas('moteur : échec prémisse sans Mesure → verifier-premisse', () => {
  const cwd = dossierJetable('workflow-pa-premisse-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  writeFileSync(
    join(cwd, 'plans', 'P9', 'S1.echec.md'),
    ['Nature : prémisse', 'Tentatives : reprise=0 enquete=0', ''].join('\n'),
  );
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'verifier-premisse') return `action attendue "verifier-premisse", reçu: ${sortie}`;
  if (action.session !== 'S1') return `session attendue S1, reçu ${action.session}`;
  if (action.chemin !== 'plans/P9/S1.echec.md') return `chemin inattendu: ${action.chemin}`;
  return null;
});

cas('moteur : budget de reprises épuisé (reprise=2) → question', () => {
  const cwd = dossierJetable('workflow-pa-budget-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  writeFileSync(
    join(cwd, 'plans', 'P9', 'S1.echec.md'),
    ['Nature : exécution', 'Tentatives : reprise=2 enquete=0', 'Blocage : relancer après correction', ''].join('\n'),
  );
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'question') return `action attendue "question", reçu: ${sortie}`;
  if (!/budget/.test(action.motif)) return `motif attendu à propos du budget, reçu: ${action.motif}`;
  return null;
});

cas('moteur : Auto : oui · option <m> → reprendre avec cette option, même modèle', () => {
  const cwd = dossierJetable('workflow-pa-auto-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  writeFileSync(
    join(cwd, 'plans', 'P9', 'S1.echec.md'),
    ['Nature : exécution', 'Tentatives : reprise=0 enquete=1', 'Auto : oui · option 2', ''].join('\n'),
  );
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'reprendre') return `action attendue "reprendre", reçu: ${sortie}`;
  if (action.session !== 'S1') return `session attendue S1, reçu ${action.session}`;
  if (action.modele !== 'Sonnet') return `modèle attendu "Sonnet" (même modèle, Auto: oui prime sur la nature), reçu ${action.modele}`;
  if (action.option !== 2) return `option attendue 2, reçu ${action.option}`;
  return null;
});

cas('moteur : vague reprise-manuelle en échec → question, quelle que soit la nature', () => {
  const cwd = dossierJetable('workflow-pa-reprise-manuelle-');
  cpSync(join(FIXTURES, 'plans', 'moteur-reprise-manuelle'), join(cwd, 'plans', 'P9'), { recursive: true });
  writeFileSync(
    join(cwd, 'plans', 'P9', 'S1.echec.md'),
    ['Nature : exécution', 'Tentatives : reprise=0 enquete=0', ''].join('\n'),
  );
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'question') return `action attendue "question", reçu: ${sortie}`;
  if (!/reprise-manuelle/.test(action.motif)) return `motif attendu à propos de reprise-manuelle, reçu: ${action.motif}`;
  return null;
});

cas('moteur : .claude/wave.lock présent → question, vague interrompue', () => {
  const cwd = dossierJetable('workflow-pa-moteur-wavelock-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  mkdirSync(join(cwd, '.claude'), { recursive: true });
  writeFileSync(join(cwd, '.claude', 'wave.lock'), '');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'question') return `action attendue "question", reçu: ${sortie}`;
  if (!/verrou/.test(action.motif)) return `motif attendu à propos du verrou, reçu: ${action.motif}`;
  return null;
});

// Reproduit I2 (docs/incidents/2026-09-24-synthese.md) : sur un dépôt à `.git` déplacé,
// `prochaine-action` rendait `pousser` sous verrou — l'ancien `racineDepot` (`dirname(--git-common-dir)`)
// résolvait hors de l'arbre et n'y voyait jamais `.claude/wave.lock` (T1, P10/S1).
cas('moteur (gitfile) : wave.lock présent, un commit d\'avance sur origin → jamais "pousser"', () => {
  const gitdir = dossierJetable('workflow-pa-gitfile-gd-');
  const cwd = dossierJetable('workflow-pa-gitfile-arbre-');
  execFileSync('git', ['init', '-q', '--separate-git-dir', gitdir, cwd], { stdio: 'pipe' });
  git(cwd, 'config', 'user.email', 'test@local');
  git(cwd, 'config', 'user.name', 'Test');
  git(cwd, 'branch', '-M', 'main');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  writeFileSync(join(cwd, 'plans', 'P9', 'S1.revue.md'), 'Bloquant : 0\nCouverture : complète\n');
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-q', '-m', 'S1\n\nPlan: P9/S1/T1\nPlan: P9/S1/T2');
  const bare = dossierJetable('workflow-pa-gitfile-bare-');
  execFileSync('git', ['init', '--bare', '-q'], { cwd: bare, stdio: 'pipe' });
  git(cwd, 'remote', 'add', 'origin', bare);
  git(cwd, 'push', '-q', '-u', 'origin', 'main');
  writeFileSync(join(cwd, 'scratch.txt'), 'x\n');
  git(cwd, 'add', 'scratch.txt');
  git(cwd, 'commit', '-q', '-m', 'travail local non poussé'); // avance > 0 sur origin/main
  mkdirSync(join(cwd, '.claude'), { recursive: true });
  writeFileSync(join(cwd, '.claude', 'wave.lock'), '');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (action && action.action === 'pousser') return `action ne doit jamais être "pousser" sous wave.lock (gitfile) : ${sortie}`;
  if (!action || action.action !== 'question') return `action attendue "question" (wave.lock détecté), reçu: ${sortie}`;
  if (!/verrou/.test(action.motif)) return `motif attendu à propos du verrou, reçu: ${action.motif}`;
  return null;
});

cas('moteur : tout coché, revues faites, rien à pousser → fini', () => {
  const cwd = dossierJetable('workflow-pa-fini-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  initDepot(cwd);
  git(
    cwd,
    'commit',
    '--allow-empty',
    '-q',
    '-m',
    'S1 et S2\n\nPlan: P9/S1/T1\nPlan: P9/S1/T2\nPlan: P9/S2/T3',
  );
  writeFileSync(join(cwd, 'plans', 'P9', 'S1.revue.md'), 'Bloquant : 0\nCouverture : complète\n');
  writeFileSync(join(cwd, 'plans', 'P9', 'S2.revue.md'), 'Bloquant : 0\nCouverture : complète\n');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'fini') return `action attendue "fini", reçu: ${sortie}`;
  return null;
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// prochaine-action.mjs — D2 : appel d'agent prêt à recopier (T1, P8/S1)
// ════════════════════════════════════════════════════════════════════════════════════════════════

cas('moteur : lancer à efforts mêlés → S1 {session-low, haiku}, S2 {session-medium, sonnet}', () => {
  // Anti-raccourci (S1.md) : la fixture écrit Haiku/Sonnet capitalisés — un test qui passerait sur
  // un index déjà en minuscules ne prouverait rien sur `appelAgent`.
  const cwd = dossierJetable('workflow-pa-agent-lancer-');
  cpSync(join(FIXTURES, 'plans', 'moteur-efforts-melanges'), join(cwd, 'plans', 'P9'), { recursive: true });
  initEtCommitTout(cwd);
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'lancer') return `action attendue "lancer", reçu: ${sortie}`;
  const s1 = action.sessions.find((s) => s.session === 'S1'); // Haiku, low
  const s2 = action.sessions.find((s) => s.session === 'S2'); // Sonnet, medium
  if (!s1?.agent || s1.agent.subagent_type !== 'session-low' || s1.agent.model !== 'haiku') {
    return `S1.agent attendu {subagent_type: "session-low", model: "haiku"}, reçu: ${JSON.stringify(s1?.agent)}`;
  }
  if (!s2?.agent || s2.agent.subagent_type !== 'session-medium' || s2.agent.model !== 'sonnet') {
    return `S2.agent attendu {subagent_type: "session-medium", model: "sonnet"}, reçu: ${JSON.stringify(s2?.agent)}`;
  }
  return null;
});

cas('moteur : reprendre — échec exécution Sonnet → agent {session-high, opus} (un cran au-dessus)', () => {
  const cwd = dossierJetable('workflow-pa-agent-reprendre-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  writeFileSync(
    join(cwd, 'plans', 'P9', 'S1.echec.md'),
    ['Nature : exécution', 'Tentatives : reprise=0 enquete=0', 'Blocage : relancer après correction', ''].join('\n'),
  );
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'reprendre' || action.modele !== 'Opus') {
    return `reprendre en Opus attendu, reçu: ${sortie}`;
  }
  if (!action.agent || action.agent.subagent_type !== 'session-high' || action.agent.model !== 'opus') {
    return `agent attendu {subagent_type: "session-high", model: "opus"}, reçu: ${JSON.stringify(action.agent)}`;
  }
  return null;
});

cas('moteur : enqueter — modèle et effort cohérents (Opus ⇒ session-high, opus)', () => {
  const cwd = dossierJetable('workflow-pa-agent-enqueter-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  const chemin = join(cwd, 'plans', 'P9', 'index.md');
  writeFileSync(chemin, readFileSync(chemin, 'utf8').replace('Sonnet | medium', 'Opus | high'));
  writeFileSync(
    join(cwd, 'plans', 'P9', 'S1.echec.md'),
    ['Nature : exécution', 'Tentatives : reprise=0 enquete=0', ''].join('\n'),
  ); // pas de Blocage : démarrage à froid ⇒ enqueter (modèle Opus)
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'enqueter') return `action attendue "enqueter", reçu: ${sortie}`;
  if (!action.agent || action.agent.subagent_type !== 'session-high' || action.agent.model !== 'opus') {
    return `agent attendu {subagent_type: "session-high", model: "opus"}, reçu: ${JSON.stringify(action.agent)}`;
  }
  return null;
});

cas('moteur : modèle hors Sonnet|Opus|Haiku → pas de champ agent, avertissement nommant la valeur', () => {
  const cwd = dossierJetable('workflow-pa-agent-inconnu-');
  cpSync(join(FIXTURES, 'plans', 'moteur-base'), join(cwd, 'plans', 'P9'), { recursive: true });
  const chemin = join(cwd, 'plans', 'P9', 'index.md');
  writeFileSync(chemin, readFileSync(chemin, 'utf8').replace('Sonnet | medium', 'Codex | medium'));
  initEtCommitTout(cwd);
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'lancer') return `action attendue "lancer", reçu: ${sortie}`;
  const s1 = action.sessions.find((s) => s.session === 'S1');
  if (s1.agent) return `S1 ne doit porter aucun champ "agent" (modèle inconnu), reçu: ${JSON.stringify(s1)}`;
  if (!s1.avertissement || !s1.avertissement.includes('Codex')) {
    return `S1.avertissement attendu nommant "Codex", reçu: ${JSON.stringify(s1.avertissement)}`;
  }
  return null;
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// prochaine-action.mjs — D1 : arrêt sur arbre sale dans la zone d'une vague (T2, P8/S1)
// ════════════════════════════════════════════════════════════════════════════════════════════════

/** Remplace la zone `` `src/a.mjs` `` de la fixture `moteur-arbre-sale` par `nouvelleZone` (même
 * technique que `moteur-effort` : patcher l'index copié, pas la fixture). */
function remplacerZoneArbreSale(cwd, nouvelleZone) {
  const chemin = join(cwd, 'plans', 'P9', 'index.md');
  writeFileSync(chemin, readFileSync(chemin, 'utf8').replace('`src/a.mjs`', nouvelleZone));
}

cas('arbre-sale : arbre propre → lancer', () => {
  const cwd = dossierJetable('workflow-pa-arbre-propre-');
  cpSync(join(FIXTURES, 'plans', 'moteur-arbre-sale'), join(cwd, 'plans', 'P9'), { recursive: true });
  initEtCommitTout(cwd);
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'lancer') return `action attendue "lancer", reçu: ${sortie}`;
  return null;
});

cas('arbre-sale : fichier modifié dans la zone → question arbre-sale le nommant', () => {
  const cwd = dossierJetable('workflow-pa-arbre-dans-zone-');
  cpSync(join(FIXTURES, 'plans', 'moteur-arbre-sale'), join(cwd, 'plans', 'P9'), { recursive: true });
  initEtCommitTout(cwd);
  mkdirSync(join(cwd, 'src'), { recursive: true });
  writeFileSync(join(cwd, 'src', 'a.mjs'), 'export const a = 1;\n');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'question') return `action attendue "question", reçu: ${sortie}`;
  if (action.options?.source !== 'arbre-sale') return `source attendue "arbre-sale", reçu: ${JSON.stringify(action.options)}`;
  if (!action.options.fichiers?.includes('src/a.mjs')) {
    return `fichiers attendu incluant "src/a.mjs", reçu: ${JSON.stringify(action.options)}`;
  }
  return null;
});

cas('arbre-sale : fichier modifié hors zone → lancer (pas de question)', () => {
  const cwd = dossierJetable('workflow-pa-arbre-hors-zone-');
  cpSync(join(FIXTURES, 'plans', 'moteur-arbre-sale'), join(cwd, 'plans', 'P9'), { recursive: true });
  initEtCommitTout(cwd);
  mkdirSync(join(cwd, 'src'), { recursive: true });
  writeFileSync(join(cwd, 'src', 'z.mjs'), 'export const z = 1;\n');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'lancer') return `action attendue "lancer" (fichier hors zone), reçu: ${sortie}`;
  return null;
});

cas('arbre-sale : dossier entier non suivi contenant un fichier d\'une zone-dossier → question', () => {
  const cwd = dossierJetable('workflow-pa-arbre-dossier-');
  cpSync(join(FIXTURES, 'plans', 'moteur-arbre-sale'), join(cwd, 'plans', 'P9'), { recursive: true });
  remplacerZoneArbreSale(cwd, '`src/`');
  initEtCommitTout(cwd);
  mkdirSync(join(cwd, 'src'), { recursive: true });
  writeFileSync(join(cwd, 'src', 'nouveau.mjs'), 'export const n = 1;\n');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'question') {
    return `action attendue "question" (dossier non suivi dans la zone), reçu: ${sortie}`;
  }
  if (!action.options.fichiers?.includes('src/nouveau.mjs')) {
    return `fichiers attendu incluant "src/nouveau.mjs", reçu: ${JSON.stringify(action.options)}`;
  }
  return null;
});

cas('arbre-sale : chemin accentué dans la zone → question', () => {
  const cwd = dossierJetable('workflow-pa-arbre-accent-');
  cpSync(join(FIXTURES, 'plans', 'moteur-arbre-sale'), join(cwd, 'plans', 'P9'), { recursive: true });
  remplacerZoneArbreSale(cwd, '`src/café.mjs`');
  initEtCommitTout(cwd);
  mkdirSync(join(cwd, 'src'), { recursive: true });
  writeFileSync(join(cwd, 'src', 'café.mjs'), 'export const c = 1;\n');
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'question') return `action attendue "question" (chemin accentué sale), reçu: ${sortie}`;
  return null;
});

cas(
  "arbre-sale : cellule recopiée de plans/P4/index.md:25 (accolades) avec un fichier sale d'une branche → question",
  () => {
    const cwd = dossierJetable('workflow-pa-arbre-accolades-');
    cpSync(join(FIXTURES, 'plans', 'moteur-arbre-sale'), join(cwd, 'plans', 'P9'), { recursive: true });
    remplacerZoneArbreSale(
      cwd,
      '`plugin/skills/{fin-de-tache,verif-visuelle,migrer-projet,revue-de-conception,cadrer,nouveau-projet,orchestrer-plan}/SKILL.md`, `plugin/agents/verificateur-n0.md`',
    );
    initEtCommitTout(cwd);
    mkdirSync(join(cwd, 'plugin', 'skills', 'cadrer'), { recursive: true });
    writeFileSync(join(cwd, 'plugin', 'skills', 'cadrer', 'SKILL.md'), '# cadrer\n');
    const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
    if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
    if (!action || action.action !== 'question') return `action attendue "question" (accolades développées), reçu: ${sortie}`;
    if (!action.options.fichiers?.includes('plugin/skills/cadrer/SKILL.md')) {
      return `fichiers attendu incluant la branche développée, reçu: ${JSON.stringify(action.options)}`;
    }
    return null;
  },
);

cas(
  "arbre-sale : cellules de plans/P4/index.md:23 et plans/P7/index.md:31 (texte hors backticks), arbre propre → lancer",
  () => {
    for (const zone of [
      '`plugin/WORKFLOW.md` (§9a, §9c), `plugin/skills/reprendre-echec/`, `plugin/skills/orchestrer-plan/`',
      '`plugin/agents/` (4 fichiers créés)',
    ]) {
      const cwd = dossierJetable('workflow-pa-arbre-texte-');
      cpSync(join(FIXTURES, 'plans', 'moteur-arbre-sale'), join(cwd, 'plans', 'P9'), { recursive: true });
      remplacerZoneArbreSale(cwd, zone);
      initEtCommitTout(cwd);
      const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
      if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
      if (!action || action.action !== 'lancer') {
        return `zone "${zone}" : action attendue "lancer" (texte hors backticks ignoré), reçu: ${sortie}`;
      }
    }
    return null;
  },
);

cas('arbre-sale : zone `src/**` → question, motif « zone illisible »', () => {
  const cwd = dossierJetable('workflow-pa-arbre-illisible-');
  cpSync(join(FIXTURES, 'plans', 'moteur-arbre-sale'), join(cwd, 'plans', 'P9'), { recursive: true });
  remplacerZoneArbreSale(cwd, '`src/**`');
  initEtCommitTout(cwd);
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'question') return `action attendue "question" (zone illisible), reçu: ${sortie}`;
  if (!/zone illisible/.test(action.motif)) return `motif attendu citant "zone illisible", reçu: ${action.motif}`;
  return null;
});

cas('arbre-sale : `git status` en échec (pas de dépôt git) → question, motif « arbre invérifiable »', () => {
  const cwd = dossierJetable('workflow-pa-arbre-invérifiable-');
  cpSync(join(FIXTURES, 'plans', 'moteur-arbre-sale'), join(cwd, 'plans', 'P9'), { recursive: true });
  // Volontairement PAS de dépôt git ici : `git status` échoue, jamais un `lancer` sur un état non
  // vérifié (C2). Anti-raccourci : ne pas simuler l'échec, le provoquer réellement (pas de `git init`).
  const { code, action, sortie } = lancerJson(['P9', '--json'], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!action || action.action !== 'question') return `action attendue "question" (arbre invérifiable), reçu: ${sortie}`;
  if (!/invérifiable/.test(action.motif)) return `motif attendu citant "invérifiable", reçu: ${action.motif}`;
  return null;
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// brief-a-jour.mjs — contrôle mécanique décision → brief (T4, P9/S2)
// ════════════════════════════════════════════════════════════════════════════════════════════════

/** Comme `git`, mais avec des dates de commit imposées (GIT_AUTHOR_DATE / GIT_COMMITTER_DATE) —
 * pour les cas où l'ordre chronologique entre deux commits doit être garanti, pas seulement probable. */
function commiterDate(cwd, message, dateIso) {
  execFileSync('git', ['add', '-A'], { cwd, stdio: 'pipe' });
  execFileSync('git', ['commit', '-q', '-m', message], {
    cwd,
    stdio: 'pipe',
    env: { ...process.env, GIT_AUTHOR_DATE: dateIso, GIT_COMMITTER_DATE: dateIso },
  });
}

cas('brief-a-jour : pas de PROJECT_BRIEF.md → SANS OBJET, code 0', () => {
  const cwd = dossierJetable('workflow-brief-sans-objet-');
  initDepot(cwd);
  writeFileSync(join(cwd, 'lisez-moi.md'), 'rien à voir\n');
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', 'init');
  const { code, sortie } = lancer(BRIEF_A_JOUR, [], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!sortie.includes('SANS OBJET — pas de PROJECT_BRIEF.md')) return `sortie inattendue: ${sortie}`;
  return null;
});

cas('brief-a-jour : décision `Brief : inchangé` → RAS', () => {
  const cwd = dossierJetable('workflow-brief-inchange-');
  initDepot(cwd);
  writeFileSync(join(cwd, 'PROJECT_BRIEF.md'), '# Brief\n');
  mkdirSync(join(cwd, 'docs', 'decisions'), { recursive: true });
  writeFileSync(
    join(cwd, 'docs', 'decisions', '2026-01-01-d1.md'),
    '# Décision\n\n## Conséquences\n...\n\nBrief : inchangé (sans effet)\n',
  );
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', 'init + décision inchangée');
  const { code, sortie } = lancer(BRIEF_A_JOUR, [], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!/^RAS — 1 décision/m.test(sortie)) return `RAS attendu: ${sortie}`;
  return null;
});

cas('brief-a-jour : `Brief : Roadmap : …` commitée avec le brief → RAS', () => {
  const cwd = dossierJetable('workflow-brief-avec-');
  initDepot(cwd);
  writeFileSync(join(cwd, 'lisez-moi.md'), 'init\n');
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', 'init');
  writeFileSync(join(cwd, 'PROJECT_BRIEF.md'), '# Brief\n\n### MVP\n- [ ] item\n');
  mkdirSync(join(cwd, 'docs', 'decisions'), { recursive: true });
  writeFileSync(
    join(cwd, 'docs', 'decisions', '2026-01-02-d2.md'),
    '# Décision\n\n## Conséquences\n...\n\nBrief : Roadmap : ajout d\'un item\n',
  );
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', 'décision + brief ensemble');
  const { code, sortie } = lancer(BRIEF_A_JOUR, [], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!/^RAS — 1 décision/m.test(sortie)) return `RAS attendu: ${sortie}`;
  return null;
});

cas('brief-a-jour : même décision commitée SANS le brief → ÉCART, code 1', () => {
  const cwd = dossierJetable('workflow-brief-sans-');
  initDepot(cwd);
  writeFileSync(join(cwd, 'PROJECT_BRIEF.md'), '# Brief\n\n### MVP\n- [ ] item\n');
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', 'init brief');
  mkdirSync(join(cwd, 'docs', 'decisions'), { recursive: true });
  writeFileSync(
    join(cwd, 'docs', 'decisions', '2026-01-03-d3.md'),
    '# Décision\n\n## Conséquences\n...\n\nBrief : Roadmap : ajout d\'un item\n',
  );
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', 'décision seule');
  const { code, sortie } = lancer(BRIEF_A_JOUR, [], cwd);
  if (code !== 1) return `code ${code} attendu 1, sortie: ${sortie}`;
  if (!/^ÉCART docs\/decisions\/2026-01-03-d3\.md — Brief : Roadmap annoncé, PROJECT_BRIEF\.md absent du commit .+ et aucun Brief-applique$/m.test(sortie)) {
    return `ligne ÉCART attendue absente ou mal formée: ${sortie}`;
  }
  return null;
});

cas('brief-a-jour : cas précédent + commit ultérieur avec `Brief-applique:` → RAS', () => {
  const cwd = dossierJetable('workflow-brief-applique-');
  initDepot(cwd);
  writeFileSync(join(cwd, 'PROJECT_BRIEF.md'), '# Brief\n\n### MVP\n- [ ] item\n');
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', 'init brief');
  mkdirSync(join(cwd, 'docs', 'decisions'), { recursive: true });
  writeFileSync(
    join(cwd, 'docs', 'decisions', '2026-01-04-d4.md'),
    '# Décision\n\n## Conséquences\n...\n\nBrief : Roadmap : ajout d\'un item\n',
  );
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', 'décision seule');
  writeFileSync(join(cwd, 'PROJECT_BRIEF.md'), '# Brief\n\n### MVP\n- [x] item\n');
  git(cwd, 'add', '-A');
  execFileSync('git', [
    'commit', '-q', '-m',
    'docs(brief): applique la décision\n\nBrief-applique: docs/decisions/2026-01-04-d4.md',
  ], { cwd, stdio: 'pipe' });
  const { code, sortie } = lancer(BRIEF_A_JOUR, [], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!/^RAS — 1 décision/m.test(sortie)) return `RAS attendu: ${sortie}`;
  return null;
});

cas(
  'brief-a-jour : cas précédent + commit ultérieur du brief SANS `Brief-applique:` (clôture qui coche la roadmap) → toujours ÉCART',
  () => {
    const cwd = dossierJetable('workflow-brief-faille-dates-');
    initDepot(cwd);
    writeFileSync(join(cwd, 'PROJECT_BRIEF.md'), '# Brief\n\n### MVP\n- [ ] item\n');
    git(cwd, 'add', '-A');
    git(cwd, 'commit', '-q', '-m', 'init brief');
    mkdirSync(join(cwd, 'docs', 'decisions'), { recursive: true });
    writeFileSync(
      join(cwd, 'docs', 'decisions', '2026-01-05-d5.md'),
      '# Décision\n\n## Conséquences\n...\n\nBrief : Roadmap : ajout d\'un item\n',
    );
    git(cwd, 'add', '-A');
    git(cwd, 'commit', '-q', '-m', 'décision seule');
    // Clôture de plan : coche la roadmap, sans jamais dire quelle décision elle applique — c'est la
    // faille qu'une comparaison de dates manquerait (le brief redevient "récent").
    writeFileSync(join(cwd, 'PROJECT_BRIEF.md'), '# Brief\n\n### MVP\n- [x] item\n');
    git(cwd, 'add', '-A');
    git(cwd, 'commit', '-q', '-m', 'fin de plan : roadmap cochée');
    const { code, sortie } = lancer(BRIEF_A_JOUR, [], cwd);
    if (code !== 1) return `code ${code} attendu 1 (la faille des dates ne doit pas passer), sortie: ${sortie}`;
    if (!/^ÉCART docs\/decisions\/2026-01-05-d5\.md —/m.test(sortie)) return `ligne ÉCART attendue absente: ${sortie}`;
    return null;
  },
);

cas('brief-a-jour : décision sans ligne `Brief :`, plus récente que le brief → ÉCART', () => {
  const cwd = dossierJetable('workflow-brief-sans-ligne-recente-');
  initDepot(cwd);
  writeFileSync(join(cwd, 'PROJECT_BRIEF.md'), '# Brief\n');
  commiterDate(cwd, 'init brief', '2020-01-01T10:00:00+00:00');
  mkdirSync(join(cwd, 'docs', 'decisions'), { recursive: true });
  writeFileSync(join(cwd, 'docs', 'decisions', '2020-06-01-d6.md'), '# Décision\n\n## Conséquences\n...\n');
  commiterDate(cwd, 'décision sans ligne Brief', '2020-06-01T10:00:00+00:00');
  const { code, sortie } = lancer(BRIEF_A_JOUR, [], cwd);
  if (code !== 1) return `code ${code} attendu 1, sortie: ${sortie}`;
  if (!/^ÉCART docs\/decisions\/2020-06-01-d6\.md — pas de ligne Brief :, décision postérieure au dernier commit du brief \(2020-01-01\)$/m.test(sortie)) {
    return `ligne ÉCART attendue absente ou mal formée: ${sortie}`;
  }
  return null;
});

cas('brief-a-jour : décision sans ligne `Brief :`, plus ancienne que le brief → RAS', () => {
  const cwd = dossierJetable('workflow-brief-sans-ligne-ancienne-');
  initDepot(cwd);
  mkdirSync(join(cwd, 'docs', 'decisions'), { recursive: true });
  writeFileSync(join(cwd, 'docs', 'decisions', '2019-01-01-d7.md'), '# Décision\n\n## Conséquences\n...\n');
  commiterDate(cwd, 'décision sans ligne Brief, ancienne', '2019-01-01T10:00:00+00:00');
  writeFileSync(join(cwd, 'PROJECT_BRIEF.md'), '# Brief\n');
  commiterDate(cwd, 'brief plus récent', '2020-01-01T10:00:00+00:00');
  const { code, sortie } = lancer(BRIEF_A_JOUR, [], cwd);
  if (code !== 0) return `code ${code} attendu 0, sortie: ${sortie}`;
  if (!/^RAS — 1 décision/m.test(sortie)) return `RAS attendu: ${sortie}`;
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
