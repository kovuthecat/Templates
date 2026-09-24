#!/usr/bin/env node
// Test des quatre hooks du plugin workflow, hors `plugin/` (jamais vendoré : les projets aval n'ont
// pas à embarquer une suite de tests pour un outillage qu'ils ne modifient pas — c'est le dépôt
// source qui doit rester sûr avant publication).
//
// POURQUOI CE FICHIER EXISTE
// Les hooks sont le seul mécanisme qui APPLIQUE réellement les règles de WORKFLOW.md (§7) : une
// régression y est silencieuse jusqu'à ce qu'un projet aval la découvre en session (v0.30.0,
// suite aux incidents headless/N1/synchro de Chords, MYO et torrent-uploader). `publier.mjs`
// refuse désormais de publier si ce test échoue.
//
// Node pur, aucune dépendance : fabrique un dépôt git jetable par cas (mkdtempSync + git init +
// un commit), envoie le payload JSON de chaque hook sur son entrée standard exactement comme le
// ferait le harnais Claude Code, puis vérifie le code de sortie et la sortie JSON produite.
//
// USAGE
//   node tests/tester-hooks.mjs
//
// Sortie : une ligne OK/FAIL par cas ; exit 1 si un cas échoue, 0 sinon.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import {
  repereSession, revuesManquantes, versionSuperieure, derniereVersionPubliee, racineDepot,
} from '../plugin/hooks/lib.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = dirname(ICI);
const HOOKS = join(RACINE, 'plugin', 'hooks');

const dossiersACommitter = [];
let echecs = 0;

function creerDepot({ synologyDrive = false } = {}) {
  const base = mkdtempSync(join(tmpdir(), 'workflow-hooks-test-'));
  const racine = synologyDrive ? join(base, 'SynologyDrive-test', 'projet') : base;
  mkdirSync(racine, { recursive: true });
  dossiersACommitter.push(base);
  const git = (...args) => execFileSync('git', args, { cwd: racine, stdio: 'pipe' });
  git('init', '-q');
  git('config', 'user.email', 'test@local');
  git('config', 'user.name', 'Test');
  writeFileSync(join(racine, 'README.md'), 'test\n');
  git('add', 'README.md');
  git('commit', '-q', '-m', 'init');
  return racine;
}

// Dépôt avec un vrai remote (bare local) : nécessaire pour prouver la gate de push (C3) — sans
// remote, le contrôle passe par l'exemption et ne prouve rien (anti-raccourci de T5).
function creerDepotAvecRemote() {
  const repo = creerDepot();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  git('branch', '-M', 'main'); // nom de branche fixe, indépendant de la config `init.defaultBranch`
  const bare = mkdtempSync(join(tmpdir(), 'workflow-hooks-bare-'));
  dossiersACommitter.push(bare);
  execFileSync('git', ['init', '-q', '--bare'], { cwd: bare, stdio: 'pipe' });
  git('remote', 'add', 'origin', bare);
  git('push', '-q', '-u', 'origin', 'main');
  return repo;
}

// Dépôt à `.git` DÉPLACÉ (gitdir séparé) : reproduit le cas de ~20 projets de l'utilisateur depuis
// le 2026-09-15 (docs/decisions/2026-09-24-revue-finale-et-regime-pro.md point 1) — `.git`, dans
// l'arbre de travail, est un FICHIER `gitdir: <chemin>`, jamais un dossier.
function creerDepotGitfile() {
  const gitdir = mkdtempSync(join(tmpdir(), 'workflow-hooks-gitdir-'));
  const arbre = mkdtempSync(join(tmpdir(), 'workflow-hooks-arbre-'));
  dossiersACommitter.push(gitdir, arbre);
  execFileSync('git', ['init', '-q', '--separate-git-dir', gitdir, arbre], { stdio: 'pipe' });
  const git = (...args) => execFileSync('git', args, { cwd: arbre, stdio: 'pipe' });
  git('config', 'user.email', 'test@local');
  git('config', 'user.name', 'Test');
  writeFileSync(join(arbre, 'README.md'), 'test\n');
  git('add', 'README.md');
  git('commit', '-q', '-m', 'init');
  return { arbre, gitdir };
}

function lancerHook(fichier, payload, env = {}) {
  return execFileSync('node', [join(HOOKS, fichier)], {
    input: JSON.stringify(payload),
    cwd: payload.cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

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

function estRefus(sortie) {
  return sortie.includes('"permissionDecision":"deny"');
}
function estBloque(sortie) {
  return sortie.includes('"decision":"block"');
}

// ── pretooluse-git.mjs ───────────────────────────────────────────────────────
{
  const repo = creerDepot();

  cas('pretooluse-git : git add -A refusé', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git add -A' } });
    return estRefus(s) ? null : `attendu un refus, reçu: ${s || '(vide)'}`;
  });

  cas('pretooluse-git : git commit -a refusé', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git commit -a -m "x"' } });
    return estRefus(s) ? null : `attendu un refus, reçu: ${s || '(vide)'}`;
  });

  cas('pretooluse-git : git add fichier accepté', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git add fichier.txt' } });
    return s === '' ? null : `attendu vide (accepté), reçu: ${s}`;
  });

  cas('pretooluse-git : git commit accepté sans wave.lock', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git commit -m "x"' } });
    return s === '' ? null : `attendu vide (accepté), reçu: ${s}`;
  });

  mkdirSync(join(repo, '.claude'), { recursive: true });
  writeFileSync(join(repo, '.claude', 'wave.lock'), '');

  cas('pretooluse-git : git commit refusé sous wave.lock', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git commit -m "x"' } });
    return estRefus(s) ? null : `attendu un refus, reçu: ${s || '(vide)'}`;
  });

  cas('pretooluse-git : git push refusé sous wave.lock', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git push' } });
    return estRefus(s) ? null : `attendu un refus, reçu: ${s || '(vide)'}`;
  });

  // Options globales AVANT la sous-commande (T2, P10/S1) : sans le préfixe dans la regex, ces deux
  // variantes contournaient le refus sous wave.lock.
  cas('pretooluse-git : git -C . commit refusé sous wave.lock', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git -C . commit -m "x"' } });
    return estRefus(s) ? null : `attendu un refus, reçu: ${s || '(vide)'}`;
  });

  cas('pretooluse-git : git -c user.name=x commit refusé sous wave.lock', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git -c user.name=x commit -m "x"' } });
    return estRefus(s) ? null : `attendu un refus, reçu: ${s || '(vide)'}`;
  });
}

// ── pretooluse-git.mjs : racine juste sur un dépôt à `.git` déplacé (T1, P10/S1) ─────
// Anti-raccourci : le verrou du test doit être à `<arbre>/.claude/wave.lock` — pas à côté du
// gitdir — et le cas (b) prouve que le refus du cas (a) vient bien de LUI, pas d'un autre défaut.
{
  const { arbre, gitdir } = creerDepotGitfile();

  cas('pretooluse-git (gitfile) : sans wave.lock → commit accepté', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: arbre, tool_name: 'Bash', tool_input: { command: 'git commit -m "x"' } });
    return s === '' ? null : `attendu vide (accepté), reçu: ${s}`;
  });

  mkdirSync(join(arbre, '.claude'), { recursive: true });
  writeFileSync(join(arbre, '.claude', 'wave.lock'), '');

  cas('pretooluse-git (gitfile) : wave.lock dans l\'arbre → commit refusé', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: arbre, tool_name: 'Bash', tool_input: { command: 'git commit -m "x"' } });
    return estRefus(s) ? null : `attendu un refus, reçu: ${s || '(vide)'}`;
  });

  cas('racineDepot (gitfile) : rend l\'arbre, jamais dirname(gitdir)', () => {
    const r = racineDepot(arbre);
    return r && resolve(r) === resolve(arbre) ? null : `racine attendue ${arbre}, reçu ${r}`;
  });

  const lie = join(dirname(arbre), 'workflow-hooks-lie-' + randomUUID());
  execFileSync('git', ['-C', arbre, 'worktree', 'add', lie, '-q'], { stdio: 'pipe' });
  dossiersACommitter.push(lie);

  cas('pretooluse-git (gitfile) : worktree lié, wave.lock dans l\'arbre principal → commit refusé', () => {
    const s = lancerHook('pretooluse-git.mjs', { cwd: lie, tool_name: 'Bash', tool_input: { command: 'git commit -m "x"' } });
    return estRefus(s) ? null : `attendu un refus (racine introuvable ⇒ refus par défaut), reçu: ${s || '(vide)'}`;
  });
}

// ── postmodelswitch-journal.mjs : racine juste sur un dépôt à `.git` déplacé (T1, P10/S1) ───
cas('postmodelswitch-journal (gitfile) : journal écrit sous <arbre>/.claude/, jamais à côté du gitdir', () => {
  const { arbre, gitdir } = creerDepotGitfile();
  const s = lancerHook('postmodelswitch-journal.mjs', {
    cwd: arbre,
    session_id: 'test-' + randomUUID(),
    from_model: 'claude-sonnet-5',
    to_model: 'claude-opus-5',
  });
  if (s !== '') return `attendu vide (jamais bloquant), reçu: ${s}`;
  const journal = join(arbre, '.claude', 'journal-modeles.jsonl');
  if (!existsSync(journal)) return `journal non écrit sous l'arbre (${journal})`;
  // Le gitdir déplacé n'a jamais de sous-dossier `.claude` : l'ancien bug (`dirname(--git-common-dir)`)
  // aurait écrit à côté de LUI, pas de l'arbre — ici le gitdir est un dossier jetable dédié, jamais
  // celui de l'arbre, donc jamais de `.claude` en son sein si la racine résolue est juste.
  if (existsSync(join(gitdir, '.claude'))) return 'journal écrit à côté du gitdir (dans le gitdir lui-même), pas sous l\'arbre';
  return null;
});

// ── stop-contexte.mjs ────────────────────────────────────────────────────────
// `session_id` doit être unique par cas et par exécution : le hook mémorise son marqueur anti-boucle
// dans le tmpdir du système, hors du dépôt jetable du cas — un id fixe rejoué par une exécution
// suivante du test se relirait comme « déjà signalé » et masquerait un vrai blocage.
cas('stop-contexte : code modifié sans fichier de suivi → bloque', () => {
  const repo = creerDepot();
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return estBloque(s) ? null : `attendu un blocage, reçu: ${s || '(vide)'}`;
});

cas('stop-contexte : code + STATUS.md modifiés → passe', () => {
  const repo = creerDepot();
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  writeFileSync(join(repo, 'STATUS.md'), 'État\n- ok\n');
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return s === '' ? null : `attendu vide (passe), reçu: ${s}`;
});

cas('stop-contexte : sous wave.lock, diff non commité ne bloque pas', () => {
  const repo = creerDepot();
  mkdirSync(join(repo, '.claude'), { recursive: true });
  writeFileSync(join(repo, '.claude', 'wave.lock'), '');
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return s === '' ? null : `attendu vide (sous verrou, non bloquant), reçu: ${s}`;
});

cas('stop-contexte : STATUS.md au-delà du plafond → bloque', () => {
  const repo = creerDepot();
  const lignes = Array.from({ length: 90 }, (_, i) => `ligne ${i}`).join('\n') + '\n';
  writeFileSync(join(repo, 'STATUS.md'), lignes);
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return estBloque(s) ? null : `attendu un blocage (plafond), reçu: ${s || '(vide)'}`;
});

// Le motif `plans/P<n>/S<k>.echec.md` de plafonds.json ne matchait jamais rien : `depassements()`
// faisait `join(cwd, fichier)` sur le motif LITTÉRAL (`plafonds.json` `_comment_echec`, T2/P10/S1).
cas('stop-contexte : .echec.md au-delà du plafond (motif <n>/<k>) → bloque', () => {
  const repo = creerDepot();
  mkdirSync(join(repo, 'plans', 'P3'), { recursive: true });
  const lignes = Array.from({ length: 41 }, (_, i) => `ligne ${i}`).join('\n') + '\n';
  writeFileSync(join(repo, 'plans', 'P3', 'S2.echec.md'), lignes);
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return estBloque(s) && /S2\.echec\.md/.test(s)
    ? null : `attendu un blocage nommant S2.echec.md (plafond), reçu: ${s || '(vide)'}`;
});

// Marqueur de session non inscriptible : répertoire à la place du fichier — marche pareil sous
// Windows et Linux, contrairement à `chmod`, qui n'a pas d'effet fiable sous Windows. Le hook doit
// rendre un résultat BORNÉ face à cette panne (D6) : bloquer une fois puis rappeler sans bloquer,
// ou laisser passer avec un message — jamais une exception, jamais un blocage identique répété.
cas('stop-contexte : marqueur de session non inscriptible → résultat borné', () => {
  const repo = creerDepot();
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  const sessionId = randomUUID();
  const { dossier, chemin } = repereSession({ session_id: sessionId }, repo, 'stop');
  mkdirSync(chemin, { recursive: true }); // le marqueur est un répertoire : jamais lisible ni réinscriptible en fichier
  try {
    const s1 = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: sessionId });
    const s2 = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: sessionId });
    if (!estBloque(s1)) return `premier appel attendu bloquant, reçu: ${s1 || '(vide)'}`;
    if (estBloque(s2) && s2 === s1) {
      return `second appel identique au premier : blocage répété non borné — le marqueur (répertoire) n'est jamais lu comme « déjà signalé »`;
    }
    return null;
  } finally {
    rmSync(chemin, { recursive: true, force: true });
  }
});

// ── stop-contexte.mjs : gate de push (T5, C3) ────────────────────────────────
cas('stop-contexte : commit d\'avance sur l\'amont (remote réel) → bloque', () => {
  const repo = creerDepotAvecRemote();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  git('add', 'src.js');
  git('commit', '-q', '-m', 'feat: x');
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return estBloque(s) ? null : `attendu un blocage (avance), reçu: ${s || '(vide)'}`;
});

cas('stop-contexte : à jour avec un remote réel → muet (anti-raccourci)', () => {
  const repo = creerDepotAvecRemote();
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return s === '' ? null : `attendu vide (à jour), reçu: ${s}`;
});

cas('stop-contexte : fichier suivi modifié non commité (remote à jour) → bloque', () => {
  const repo = creerDepotAvecRemote();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  writeFileSync(join(repo, 'STATUS.md'), 'État\n');
  git('add', 'STATUS.md');
  git('commit', '-q', '-m', 'status');
  git('push', '-q');
  writeFileSync(join(repo, 'STATUS.md'), 'État modifié, non commité\n');
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return estBloque(s) ? null : `attendu un blocage (fichier suivi modifié), reçu: ${s || '(vide)'}`;
});

cas('stop-contexte : sans remote → muet sur le point de push', () => {
  const repo = creerDepot(); // pas de remote : exemption C3
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return s === '' ? null : `attendu vide (sans remote), reçu: ${s}`;
});

cas('stop-contexte : wave.lock avec remote et avance → muet sur le point de push', () => {
  const repo = creerDepotAvecRemote();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  git('add', 'src.js');
  git('commit', '-q', '-m', 'feat: x');
  mkdirSync(join(repo, '.claude'), { recursive: true });
  writeFileSync(join(repo, '.claude', 'wave.lock'), '');
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return s === '' ? null : `attendu vide (sous verrou, non bloquant), reçu: ${s}`;
});

cas('stop-contexte : branche sans amont, absente du remote → bloque', () => {
  const repo = creerDepotAvecRemote();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  git('checkout', '-q', '-b', 'wip/test-branche');
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  git('add', 'src.js');
  git('commit', '-q', '-m', 'feat: x');
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return estBloque(s) ? null : `attendu un blocage (branche non poussée), reçu: ${s || '(vide)'}`;
});

cas('stop-contexte : branche sans amont, déjà poussée sur le remote → muet', () => {
  const repo = creerDepotAvecRemote();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  git('checkout', '-q', '-b', 'wip/test-branche');
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  git('add', 'src.js');
  git('commit', '-q', '-m', 'feat: x');
  git('push', '-q', 'origin', 'wip/test-branche'); // poussée, mais sans -u : pas d'amont configuré
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return s === '' ? null : `attendu vide (branche déjà poussée), reçu: ${s}`;
});

// Régression trouvée en revue (plans/P6/S3.revue.md) : une branche sans amont, poussée UNE fois,
// puis retravaillée, restait muette pour toujours — seule la présence sur `origin` était vérifiée,
// jamais l'égalité avec HEAD.
cas('stop-contexte : branche sans amont, poussée puis retravaillée sans repousser → bloque', () => {
  const repo = creerDepotAvecRemote();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  git('checkout', '-q', '-b', 'wip/test-branche');
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  git('add', 'src.js');
  git('commit', '-q', '-m', 'feat: x');
  git('push', '-q', 'origin', 'wip/test-branche'); // poussée, mais sans -u : pas d'amont configuré
  writeFileSync(join(repo, 'src2.js'), 'console.log(2);\n');
  git('add', 'src2.js');
  git('commit', '-q', '-m', 'feat: y'); // jamais repoussé
  const s = lancerHook('stop-contexte.mjs', { cwd: repo, session_id: randomUUID() });
  return estBloque(s) ? null : `attendu un blocage (branche en retard sur origin), reçu: ${s || '(vide)'}`;
});

// ── revuesManquantes (lib.mjs) : revue commitée, plus de repère `Revues:` (T5) ───
cas('revuesManquantes : .revue.md ajouté puis supprimé (tri de clôture) → satisfait', () => {
  const repo = creerDepot();
  const debut = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  git('add', 'src.js');
  git('commit', '-q', '-m', 'feat: x\n\nPlan: P1/S1/T1');
  mkdirSync(join(repo, 'plans', 'P1'), { recursive: true });
  writeFileSync(join(repo, 'plans', 'P1', 'S1.revue.md'), 'Bloquant : 0\n');
  git('add', 'plans/P1/S1.revue.md');
  git('commit', '-q', '-m', 'revue: P1/S1');
  git('rm', '-q', 'plans/P1/S1.revue.md');
  git('commit', '-q', '-m', 'tri: clôture P1');
  const manquantes = revuesManquantes(repo, debut);
  return manquantes.length === 0 ? null : `attendu satisfait, reçu manquant: ${manquantes.join(', ')}`;
});

cas('revuesManquantes : jamais commitée → manquante', () => {
  const repo = creerDepot();
  const debut = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  git('add', 'src.js');
  git('commit', '-q', '-m', 'feat: x\n\nPlan: P1/S1/T1');
  const manquantes = revuesManquantes(repo, debut);
  return manquantes.includes('P1/S1') ? null : `attendu P1/S1 manquante, reçu: ${manquantes.join(', ')}`;
});

cas('revuesManquantes : .echec.md dispense de revue', () => {
  const repo = creerDepot();
  const debut = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  git('add', 'src.js');
  git('commit', '-q', '-m', 'feat: x\n\nPlan: P1/S1/T1');
  mkdirSync(join(repo, 'plans', 'P1'), { recursive: true });
  writeFileSync(join(repo, 'plans', 'P1', 'S1.echec.md'), 'Nature : exécution\n');
  const manquantes = revuesManquantes(repo, debut);
  return manquantes.length === 0 ? null : `attendu dispensé, reçu manquant: ${manquantes.join(', ')}`;
});

// Une session `low` n'est jamais relue (C7) — exemptée ici même, pas seulement côté moteur
// `prochaine-action.mjs` (T2, P10/S1) : sinon `stop-contexte` réclame une revue que personne ne
// relira jamais.
cas('revuesManquantes : session low qui committe du code → jamais réclamée', () => {
  const repo = creerDepot();
  const debut = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  poserPlan(repo, ['| [S1](S1.md) | T1 | … | Haiku | low | — | — | `src/` | [ ] |']);
  git('add', '.');
  git('commit', '-q', '-m', 'plan: P1');
  writeFileSync(join(repo, 'src.js'), 'console.log(1);\n');
  git('add', 'src.js');
  git('commit', '-q', '-m', 'feat: x\n\nPlan: P1/S1/T1');
  const manquantes = revuesManquantes(repo, debut);
  return manquantes.length === 0 ? null : `attendu exemptée (effort low), reçu manquant: ${manquantes.join(', ')}`;
});

// ── sessionstart-contexte.mjs ────────────────────────────────────────────────
cas('sessionstart-contexte : sort sans erreur sur le dépôt de test', () => {
  const repo = creerDepot();
  lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return null; // execFileSync aurait levé sur un exit non nul
});

// Branche de travail (worktree, exploration) partie de main, pendant que main avance sur origin :
// son propre amont ne dit rien, seule la comparaison à origin/main voit le retard.
function brancheDepasseeParMain() {
  const repo = creerDepotAvecRemote();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  git('checkout', '-q', '-b', 'wip/travail');
  git('checkout', '-q', 'main');
  writeFileSync(join(repo, 'avance.md'), 'x\n');
  git('add', 'avance.md');
  git('commit', '-q', '-m', 'main avance');
  git('push', '-q', 'origin', 'main');
  git('checkout', '-q', 'wip/travail');
  return repo;
}

cas('sessionstart-contexte : branche en retard sur origin/main → ligne', () => {
  const repo = brancheDepasseeParMain();
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /En retard de 1 commit\(s\) sur `origin\/main`/.test(s)
    ? null : `signal de retard sur main absent, reçu: ${s || '(vide)'}`;
});

cas('sessionstart-contexte : branche à jour de origin/main → muet sur ce point', () => {
  const repo = brancheDepasseeParMain();
  execFileSync('git', ['merge', '-q', '--no-edit', 'origin/main'], { cwd: repo, stdio: 'pipe' });
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /sur `origin\/main`/.test(s) ? `retard signalé à tort: ${s}` : null;
});

cas('sessionstart-contexte : signale STATUS.md en retard (≥3 commits)', () => {
  const repo = creerDepot();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  writeFileSync(join(repo, 'STATUS.md'), 'État\n');
  git('add', 'STATUS.md');
  git('commit', '-q', '-m', 'status');
  for (const f of ['a.txt', 'b.txt', 'c.txt']) {
    writeFileSync(join(repo, f), 'x\n');
    git('add', f);
    git('commit', '-q', '-m', f);
  }
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /STATUS\.md a \d+ commit/.test(s) ? null : `signal de retard absent, reçu: ${s || '(vide)'}`;
});

cas('sessionstart-contexte : muet sur un STATUS.md supprimé, même très en retard', () => {
  const repo = creerDepot();
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  writeFileSync(join(repo, 'STATUS.md'), 'État\n');
  git('add', 'STATUS.md');
  git('commit', '-q', '-m', 'status');
  git('rm', '-q', 'STATUS.md');
  git('commit', '-q', '-m', 'retrait de STATUS.md');
  for (const f of ['a.txt', 'b.txt', 'c.txt']) {
    writeFileSync(join(repo, f), 'x\n');
    git('add', f);
    git('commit', '-q', '-m', f);
  }
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  // `git log -- STATUS.md` retrouve encore le commit d'origine : c'est le test d'existence sur
  // disque, et lui seul, qui doit taire un retard que plus rien ne peut résorber.
  return /STATUS\.md a \d+ commit/.test(s) ? `retard signalé sur un fichier supprimé: ${s}` : null;
});

cas('sessionstart-contexte : signale .git sous dossier synchronisé sans témoin', () => {
  const repo = creerDepot({ synologyDrive: true });
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return s.includes('dossier synchronisé') ? null : `signal absent, reçu: ${s || '(vide)'}`;
});

cas('sessionstart-contexte : silencieux sur ce point avec le témoin posé', () => {
  const repo = creerDepot({ synologyDrive: true });
  mkdirSync(join(repo, '.git', 'info'), { recursive: true });
  writeFileSync(join(repo, '.git', 'info', 'synchro-exclue'), '');
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return s.includes('dossier synchronisé') ? `signal présent malgré le témoin: ${s}` : null;
});

// Contrôle « modèle courant contre modèle du plan » (v0.31.0). Le plan est lu dans
// `plans/P<n>/index.md`, seul porteur des statuts — d'où une table complète dans le dépôt jetable.
function poserPlan(repo, lignes) {
  mkdirSync(join(repo, 'plans', 'P1'), { recursive: true });
  writeFileSync(
    join(repo, 'plans', 'P1', 'index.md'),
    '# Plan P1 — test\n\n## Sessions\n' +
      '| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |\n' +
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n' +
      lignes.join('\n') + '\n',
  );
}

cas('sessionstart-contexte : signale un modèle absent des sessions restantes', () => {
  const repo = creerDepot();
  poserPlan(repo, ['| [S1](S1.md) | T1 | … | Sonnet | medium | — | — | `src/` | [ ] |']);
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo, model: 'claude-haiku-4-5' });
  return /lancée en haiku/.test(s) ? null : `signal absent, reçu: ${s || '(vide)'}`;
});

cas('sessionstart-contexte : silencieux quand le modèle correspond au plan', () => {
  const repo = creerDepot();
  poserPlan(repo, ['| [S1](S1.md) | T1 | … | Sonnet | medium | — | — | `src/` | [ ] |']);
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo, model: 'claude-sonnet-5' });
  return /lancée en/.test(s) ? `signal présent à tort: ${s}` : null;
});

cas('sessionstart-contexte : ignore les sessions déjà faites', () => {
  const repo = creerDepot();
  poserPlan(repo, [
    '| [S1](S1.md) | T1 | … | Haiku | low | — | — | `src/` | [x] |',
    '| [S2](S2.md) | T2 | … | Sonnet | medium | — | — | `src/` | [ ] |',
  ]);
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo, model: 'claude-haiku-4-5' });
  // Haiku ne vaut que pour S1, déjà faite : le signal doit tomber.
  return /lancée en haiku/.test(s) ? null : `signal absent alors que S1 est faite, reçu: ${s || '(vide)'}`;
});

cas('sessionstart-contexte : muet sans plan', () => {
  const repo = creerDepot();
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo, model: 'claude-haiku-4-5' });
  return /lancée en/.test(s) ? `signal présent sans plan: ${s}` : null;
});

// ── versionSuperieure (lib.mjs) : comparaison numérique, jamais lexicale (T6) ────
cas('versionSuperieure : 0.38.1 > 0.9.0 (numérique, pas lexicale)', () => {
  if (!versionSuperieure('0.38.1', '0.9.0')) return 'attendu vrai (0.38.1 > 0.9.0 numériquement)';
  if (versionSuperieure('0.9.0', '0.38.1')) return 'attendu faux (0.9.0 < 0.38.1 numériquement)';
  return null;
});

cas('versionSuperieure : versions égales → faux', () => {
  return versionSuperieure('0.38.1', '0.38.1') ? 'attendu faux (égalité)' : null;
});

// ── derniereVersionPubliee (lib.mjs) : cache 24h, sans réseau (T6) ───────────────
function poserManifeste(repo, contenu) {
  mkdirSync(join(repo, '.claude', 'workflow'), { recursive: true });
  writeFileSync(join(repo, '.claude', 'workflow', 'manifest.json'), JSON.stringify(contenu));
}

function poserCacheVersion(repo, contenu) {
  mkdirSync(join(repo, '.git'), { recursive: true });
  writeFileSync(join(repo, '.git', 'workflow-version.json'), JSON.stringify(contenu));
}

cas('derniereVersionPubliee : cache frais lu sans réseau', () => {
  const repo = creerDepot();
  // `source` volontairement inexistant : si le cache n'était pas lu, le `git ls-remote` réseau qui
  // suivrait échouerait (dépôt introuvable) et rendrait `null`, pas '9.9.9'.
  poserManifeste(repo, { version: '0.1.0', source: 'inexistant-xyz/inexistant' });
  poserCacheVersion(repo, { version: '9.9.9', lu: Date.now() });
  const v = derniereVersionPubliee(repo);
  return v === '9.9.9' ? null : `attendu '9.9.9' (cache), reçu: ${v}`;
});

// Cache C4 sous le VRAI gitdir (T2, P10/S1) : `join(racine, '.git', …)` échoue silencieusement
// quand `.git` est un FICHIER (gitdir déplacé) — ce chemin littéral n'existe pas, le cache ne
// s'écrit ni ne se relit jamais, et le hook relance `git ls-remote` à chaque SessionStart.
cas('derniereVersionPubliee (gitfile) : cache écrit sous le vrai gitdir, relu sans réseau', () => {
  const { arbre } = creerDepotGitfile();
  poserManifeste(arbre, { version: '0.1.0', source: 'inexistant-xyz/inexistant' });
  const cheminCache = execFileSync(
    'git', ['rev-parse', '--path-format=absolute', '--git-path', 'workflow-version.json'],
    { cwd: arbre, encoding: 'utf8' },
  ).trim();
  mkdirSync(dirname(cheminCache), { recursive: true });
  writeFileSync(cheminCache, JSON.stringify({ version: '9.9.9', lu: Date.now() }));
  const v = derniereVersionPubliee(arbre);
  return v === '9.9.9' ? null : `attendu '9.9.9' (cache sous le vrai gitdir), reçu: ${v}`;
});

cas('derniereVersionPubliee : sans manifeste → null, jamais de réseau', () => {
  const repo = creerDepot();
  const v = derniereVersionPubliee(repo);
  return v === null ? null : `attendu null (pas de manifeste), reçu: ${v}`;
});

// ── sessionstart-contexte.mjs : version du workflow vendoré (T6, C4) ─────────────
cas('sessionstart-contexte : version en retard (cache) → ligne', () => {
  const repo = creerDepot();
  poserManifeste(repo, { version: '0.9.0', source: 'kovuthecat/claude-workflow' });
  poserCacheVersion(repo, { version: '0.38.1', lu: Date.now() });
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /Workflow vendoré v0\.9\.0, source v0\.38\.1/.test(s)
    ? null : `signal de retard absent, reçu: ${s || '(vide)'}`;
});

cas('sessionstart-contexte : version à jour (cache) → muet', () => {
  const repo = creerDepot();
  poserManifeste(repo, { version: '0.38.1', source: 'kovuthecat/claude-workflow' });
  poserCacheVersion(repo, { version: '0.38.1', lu: Date.now() });
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /Workflow vendoré/.test(s) ? `signal présent à tort (à jour): ${s}` : null;
});

cas('sessionstart-contexte : dépôt non vendoré (pas de manifeste) → muet', () => {
  const repo = creerDepot();
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /Workflow vendoré/.test(s) ? `signal présent à tort (non vendoré): ${s}` : null;
});

cas('sessionstart-contexte : correctifCritiqueDepuis applicable → « avant la prochaine vague »', () => {
  const repo = creerDepot();
  poserManifeste(repo, {
    version: '0.9.0', source: 'kovuthecat/claude-workflow', correctifCritiqueDepuis: '0.20.0',
  });
  poserCacheVersion(repo, { version: '0.38.1', lu: Date.now() });
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /avant la prochaine vague/.test(s)
    ? null : `mention d'urgence absente, reçu: ${s || '(vide)'}`;
});

// ── sessionstart-contexte.mjs : plugin CHARGÉ contre la copie de travail, dépôt source (T3, P10/S1) ──
// Incidents du 2026-09-22/23/24 (Templates, DrumsTraining) : le plugin local installé au cache
// n'était pas rechargé après une publication, sans que rien ne le signale.
function versionPluginCharge() {
  return JSON.parse(readFileSync(join(HOOKS, '..', '.claude-plugin', 'plugin.json'), 'utf8')).version;
}

cas('sessionstart-contexte : dépôt source, plugin chargé périmé vs copie de travail → ligne', () => {
  const repo = creerDepot();
  mkdirSync(join(repo, 'plugin', '.claude-plugin'), { recursive: true });
  writeFileSync(join(repo, 'plugin', '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '99.0.0' }));
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /Plugin chargé v[\d.]+, source v99\.0\.0/.test(s)
    ? null : `signal absent, reçu: ${s || '(vide)'}`;
});

cas('sessionstart-contexte : dépôt source, plugin chargé = copie de travail → muet', () => {
  const repo = creerDepot();
  mkdirSync(join(repo, 'plugin', '.claude-plugin'), { recursive: true });
  writeFileSync(join(repo, 'plugin', '.claude-plugin', 'plugin.json'), JSON.stringify({ version: versionPluginCharge() }));
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /Plugin chargé/.test(s) ? `signal présent à tort (à jour): ${s}` : null;
});

cas('sessionstart-contexte : dépôt VENDORÉ (manifest.json présent) → muet même si versions diffèrent', () => {
  const repo = creerDepot();
  mkdirSync(join(repo, 'plugin', '.claude-plugin'), { recursive: true });
  writeFileSync(join(repo, 'plugin', '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '99.0.0' }));
  poserManifeste(repo, { version: '0.1.0' }); // présence seule suffit à dire « vendoré », peu importe le contenu
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /Plugin chargé/.test(s) ? `signal présent à tort (dépôt vendoré, pas la source): ${s}` : null;
});

cas('sessionstart-contexte : ni source ni vendoré (pas de plugin/.claude-plugin/) → muet', () => {
  const repo = creerDepot();
  const s = lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return /Plugin chargé/.test(s) ? `signal présent à tort: ${s}` : null;
});

// ── postmodelswitch-journal.mjs ──────────────────────────────────────────────
cas('postmodelswitch-journal : écrit une ligne JSONL et reste silencieux', () => {
  const repo = creerDepot();
  const s = lancerHook('postmodelswitch-journal.mjs', {
    cwd: repo,
    session_id: 'test-' + randomUUID(),
    from_model: 'claude-sonnet-5',
    to_model: 'claude-opus-5',
  });
  if (s !== '') return `attendu vide (jamais bloquant), reçu: ${s}`;
  const journal = join(repo, '.claude', 'journal-modeles.jsonl');
  if (!existsSync(journal)) return 'journal non écrit';
  const ligne = JSON.parse(readFileSync(journal, 'utf8').trim());
  if (ligne.de !== 'claude-sonnet-5' || ligne.vers !== 'claude-opus-5') {
    return `contenu inattendu: ${JSON.stringify(ligne)}`;
  }
  return null;
});

cas('postmodelswitch-journal : n’écrit rien sur un changement nul', () => {
  const repo = creerDepot();
  lancerHook('postmodelswitch-journal.mjs', {
    cwd: repo,
    from_model: 'claude-opus-5',
    to_model: 'claude-opus-5',
  });
  return existsSync(join(repo, '.claude', 'journal-modeles.jsonl'))
    ? 'journal écrit alors que le modèle n’a pas changé'
    : null;
});

cas('postmodelswitch-journal : contrat non tenu (champs absents) → rien, sans erreur', () => {
  const repo = creerDepot();
  lancerHook('postmodelswitch-journal.mjs', { cwd: repo });
  return existsSync(join(repo, '.claude', 'journal-modeles.jsonl'))
    ? 'journal écrit sans from_model/to_model'
    : null;
});

// ── posttooluse-format.mjs ───────────────────────────────────────────────────
cas('posttooluse-format : silencieux sans prettier configuré', () => {
  const repo = creerDepot();
  const fichier = join(repo, 'src.js');
  writeFileSync(fichier, 'const x=1\n');
  const s = lancerHook('posttooluse-format.mjs', { cwd: repo, tool_input: { file_path: fichier } });
  return s === '' ? null : `attendu vide (silencieux), reçu: ${s}`;
});

// ── Nettoyage et verdict ─────────────────────────────────────────────────────
for (const d of dossiersACommitter) {
  try { rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
}

if (echecs > 0) {
  console.log(`\n${echecs} cas en échec.`);
  process.exit(1);
}
console.log('\nTous les cas sont OK.');
process.exit(0);
