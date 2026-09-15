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
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { repereSession } from '../plugin/hooks/lib.mjs';

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
}

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

// ── sessionstart-contexte.mjs ────────────────────────────────────────────────
cas('sessionstart-contexte : sort sans erreur sur le dépôt de test', () => {
  const repo = creerDepot();
  lancerHook('sessionstart-contexte.mjs', { cwd: repo });
  return null; // execFileSync aurait levé sur un exit non nul
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
