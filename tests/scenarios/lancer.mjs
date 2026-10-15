#!/usr/bin/env node
// Joue un plan réel de bout en bout sur un mini-projet jetable, puis le note.
//
//   node tests/scenarios/lancer.mjs --scenario nominal [--essais 2]
//   node tests/scenarios/lancer.mjs --scenario tous
//   node tests/scenarios/lancer.mjs --poser-seulement        # pose les 4 états, vérifie le moteur, n'appelle pas claude
//   node tests/scenarios/lancer.mjs --nettoyer               # supprime les passages posés dans le dossier temporaire
//
// Options : --model haiku · --effort medium (orchestrateur) · --max-budget 3 (USD par passage) ·
//           --max-turns 200 · --delai-min 45 · --claude <binaire> · --sans-noter ·
//           --autorisations banc|projet (défaut banc = la liste large OUTILS_AUTORISES ; projet =
//           le permissions.allow du gabarit tel que vendoré, comme un vrai projet)
//
// Un passage = un dossier `<tmp>/scenarios-templates/<scénario>-<n>-<horodatage>/` : l'instantané du
// plugin, le mini-projet vendoré (`projet/`), le dépôt nu `origin.git`, la sortie `out/stream.jsonl`.
// Rien n'est écrit dans ce dépôt. Mode d'emploi et pièges : tests/scenarios/README.md.
import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATTENDU, SCENARIOS, DEPOT, poser, envGit } from './projet/poser.mjs';
import { noterPassage, afficher } from './noter.mjs';

const RACINE = join(tmpdir(), 'scenarios-templates');

const args = process.argv.slice(2);
const opt = (nom, defaut) => {
  const i = args.indexOf(nom);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : defaut;
};

const MODELE = opt('--model', 'haiku');
const EFFORT = opt('--effort', 'medium');
const BUDGET = opt('--max-budget', '3');
const TOURS = opt('--max-turns', '200');
const DELAI_MIN = Number(opt('--delai-min', '45'));
const ESSAIS = Number(opt('--essais', '1'));
const AUTORISATIONS = opt('--autorisations', 'banc');
const scenarioArg = opt('--scenario', args.includes('--poser-seulement') ? 'tous' : null);

/** Outils autorisés : jamais `bypassPermissions` — le mini-projet tourne sur le vrai poste de
 * l'utilisateur. Le socle est celui du plan (S6/T11) ; les lectures seules s'y ajoutent. Un outil
 * refusé pendant une mise au point s'ajoute ici, nommé dans la mesure. `Task` : nom que l'événement
 * `init` de Claude Code 2.1.293 donne à l'outil `Agent`. */
export const OUTILS_AUTORISES = [
  'Read', 'Edit', 'Write', 'Glob', 'Grep', 'Agent', 'Task', 'SendMessage', 'Skill',
  'Bash(git:*)', 'Bash(node:*)',
  'Bash(cd:*)', 'Bash(echo:*)', 'Bash(pwd:*)', 'Bash(ls:*)', 'Bash(cat:*)', 'Bash(sed:*)', 'Bash(grep:*)', 'Bash(head:*)', 'Bash(tail:*)', 'Bash(wc:*)',
];

/** Outils non-Bash du socle : toujours autorisés, quelle que soit la liste choisie. */
export const OUTILS_SOCLE = ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'Agent', 'Task', 'SendMessage', 'Skill'];

export const MODES_AUTORISATIONS = ['banc', 'projet'];

/** `--autorisations projet` : ce qu'un vrai projet vendoré autorise — le `permissions.allow` du
 * `.claude/settings.json` du mini-projet (celui du gabarit, après vendorage) plus les outils non-Bash
 * du socle. Le dossier du passage n'est pas « de confiance » : Claude Code n'y lit pas ces `allow`,
 * seul `--allowedTools` compte — on les lui passe donc tels quels. Ni `Bash(cd:*)` ni `Bash(node:*)`
 * n'y entrent : c'est ce qui fait réapparaître les refus des constats A et B de la mesure. */
export function autorisationsProjet(projet) {
  const settings = JSON.parse(readFileSync(join(projet, '.claude', 'settings.json'), 'utf8'));
  const allow = settings.permissions?.allow;
  if (!Array.isArray(allow) || allow.length === 0) throw new Error(`${projet}/.claude/settings.json : permissions.allow absent ou vide`);
  return [...new Set([...OUTILS_SOCLE, ...allow])];
}

const PROMPT = '/workflow:orchestrer-plan P1';

/** Variables d'une session Desktop qui compactent le contexte vers ~20 k tokens ou faussent l'effort
 * (piège tenu du banc du premier geste) — retirées avant `claude -p`. */
const A_RETIRER = /^(CLAUDE_CODE_|CLAUDE_AGENT_SDK_|CLAUDE_PREVIEW_)|^(CLAUDECODE|DISABLE_MICROCOMPACT|CLAUDE_PID|CLAUDE_EFFORT)$/;

function envPropre(dossier) {
  const env = {};
  for (const [cle, valeur] of Object.entries(envGit(dossier))) if (!A_RETIRER.test(cle)) env[cle] = valeur;
  return env;
}

/** Binaire : `--claude`, sinon `$CLAUDE_BIN`, sinon celui qui lance cette session (lu AVANT le
 * retrait des variables), sinon `claude` du PATH. */
function binaireClaude() {
  return opt('--claude', process.env.CLAUDE_BIN || process.env.CLAUDE_CODE_EXECPATH || 'claude');
}

function authentifie(binaire, env) {
  try {
    const sortie = execFileSync(binaire, ['auth', 'status'], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, timeout: 30000 });
    return JSON.parse(sortie).loggedIn === true;
  } catch (e) {
    try { return JSON.parse(String(e.stdout)).loggedIn === true; } catch { return false; }
  }
}

function versionClaude(binaire, env) {
  try {
    return execFileSync(binaire, ['--version'], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, timeout: 30000 }).trim();
  } catch { return 'inconnue'; }
}

function etatDepot() {
  const git = (...a) => execFileSync('git', a, { cwd: DEPOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }).trim();
  try { return { commit: git('rev-parse', '--short', 'HEAD'), sale: git('status', '--porcelain', '--', 'plugin').length > 0 }; }
  catch { return { commit: 'inconnu', sale: false }; }
}

function jouer({ binaire, dossier, projet, snapshot, outils }) {
  const env = envPropre(dossier);
  const out = join(dossier, 'out');
  mkdirSync(out, { recursive: true });
  const commande = [
    '-p', '--model', MODELE, '--effort', EFFORT,
    '--max-turns', TOURS, '--max-budget-usd', BUDGET,
    '--strict-mcp-config', '--no-session-persistence',
    '--permission-mode', 'acceptEdits',
    '--allowedTools', outils.join(','),
    '--plugin-dir', snapshot,
    '--output-format', 'stream-json', '--verbose',
  ];
  writeFileSync(join(out, 'prompt.txt'), PROMPT + '\n');
  writeFileSync(join(out, 'commande.txt'), `${binaire} ${commande.join(' ')}\n`);
  return new Promise((resolve) => {
    const debut = Date.now();
    const enfant = spawn(binaire, commande, { cwd: projet, env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    enfant.stdout.pipe(createWriteStream(join(out, 'stream.jsonl')));
    enfant.stderr.pipe(createWriteStream(join(out, 'stderr.txt')));
    enfant.stdin.end(PROMPT);
    let delaiDepasse = false;
    const minuteur = setTimeout(() => {
      delaiDepasse = true;
      try { enfant.kill(); } catch { /* déjà terminé */ }
    }, DELAI_MIN * 60 * 1000);
    enfant.on('error', (e) => { clearTimeout(minuteur); resolve({ code: -1, erreur: e.message, dureeMs: Date.now() - debut, delaiDepasse }); });
    enfant.on('close', (code) => { clearTimeout(minuteur); resolve({ code, dureeMs: Date.now() - debut, delaiDepasse }); });
  });
}

async function main() {
  if (args.includes('--nettoyer')) {
    rmSync(RACINE, { recursive: true, force: true });
    console.log(`supprimé : ${RACINE}`);
    return 0;
  }
  const poserSeulement = args.includes('--poser-seulement');
  if (!scenarioArg) {
    console.error(`indiquer --scenario <${SCENARIOS.join('|')}|tous> (ou --poser-seulement)`);
    return 2;
  }
  if (!MODES_AUTORISATIONS.includes(AUTORISATIONS)) {
    console.error(`--autorisations attend ${MODES_AUTORISATIONS.join(' ou ')} (reçu : ${AUTORISATIONS})`);
    return 2;
  }
  const scenarios = scenarioArg === 'tous' ? SCENARIOS : scenarioArg.split(',');
  for (const s of scenarios) if (!ATTENDU[s]) { console.error(`scénario inconnu : ${s} (${SCENARIOS.join(', ')})`); return 2; }

  const binaire = binaireClaude();
  const envTest = envPropre(RACINE);
  if (!poserSeulement && !authentifie(binaire, envTest)) {
    console.error(
      `claude n'est pas authentifié pour un lancement en -p depuis ce poste (« ${binaire} auth status » : loggedIn=false).\n` +
      'Une session Desktop s\'authentifie par l\'hôte, un processus enfant non : lancer `claude auth login` dans un terminal\n' +
      '(ou exporter un jeton `ANTHROPIC_API_KEY`), puis relancer. Rien n\'a été posé ni dépensé.',
    );
    return 3;
  }

  mkdirSync(RACINE, { recursive: true });
  const horodatage = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const depot = etatDepot();
  const passages = [];
  let echecPose = false;

  for (const scenario of scenarios) {
    for (let i = 1; i <= ESSAIS; i++) {
      const dossier = join(RACINE, `${scenario}-${i}-${horodatage}`);
      let pose;
      try {
        pose = poser({ scenario, dossier });
      } catch (e) {
        console.error(`✗ ${scenario} : ${e.message}`);
        echecPose = true;
        continue;
      }
      const a = ATTENDU[scenario];
      console.log(`✓ ${scenario.padEnd(17)} première action : ${pose.premiere.action} ${pose.premiere.session ?? pose.premiere.sessions?.map((s) => s.session).join(',')} (attendu : ${a.action} ${a.session})`);
      for (const c of pose.constats) console.log(`    constat : ${c}`);
      if (poserSeulement) { passages.push({ dossier, pose }); continue; }

      // `projet` : lue dans le settings.json du mini-projet APRÈS vendorage (posé par `poser`).
      let outils;
      try { outils = AUTORISATIONS === 'projet' ? autorisationsProjet(pose.projet) : OUTILS_AUTORISES; }
      catch (e) { console.error(`✗ ${scenario} : ${e.message}`); echecPose = true; continue; }
      console.log(`  → claude -p (${MODELE} ${EFFORT}, plafond ${BUDGET} USD, ${DELAI_MIN} min, autorisations ${AUTORISATIONS}) dans ${dossier}`);
      const resultat = await jouer({ binaire, dossier, projet: pose.projet, snapshot: pose.snapshot, outils });
      const meta = {
        scenario, essai: i, modele: MODELE, effort: EFFORT, budgetUsd: Number(BUDGET), maxTours: Number(TOURS),
        autorisations: AUTORISATIONS, outilsAutorises: outils,
        claude: versionClaude(binaire, envTest), depot, pluginVersion: pose.version,
        sortie: resultat.code, erreur: resultat.erreur ?? null, delaiDepasse: resultat.delaiDepasse, dureeMurMs: resultat.dureeMs,
        passage: dossier.split(/[\\/]/).pop(),
      };
      writeFileSync(join(dossier, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
      writeFileSync(join(RACINE, 'dernier.txt'), dossier + '\n');
      passages.push({ dossier, pose, meta });
      if (!args.includes('--sans-noter')) {
        try { afficher(noterPassage(dossier)); } catch (e) { console.error(`  notation impossible : ${e.message}`); }
      }
    }
  }
  if (poserSeulement) {
    console.log(`\n${passages.length} état(s) posé(s) dans ${RACINE} — moteur vérifié, aucun appel à claude.`);
  }
  return echecPose ? 1 : 0;
}

// Importé (par tests/tester-scripts.mjs, pour `autorisationsProjet`), le module ne lance rien.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) process.exitCode = await main();
