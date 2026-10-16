#!/usr/bin/env node
// Joue un plan réel de bout en bout sur un mini-projet jetable, puis le note.
//
//   node tests/scenarios/lancer.mjs --scenario nominal [--essais 2]
//   node tests/scenarios/lancer.mjs --scenario tous
//   node tests/scenarios/lancer.mjs --poser-seulement        # pose les états de tous les scénarios, vérifie le moteur, n'appelle pas claude
//   node tests/scenarios/lancer.mjs --nettoyer               # supprime les passages posés dans le dossier temporaire
//   node tests/scenarios/lancer.mjs --scenario arret-relaye --autorisations projet --attente 30
//                                                            # en deux temps : `claude -p` PERSISTÉ jusqu'à la question,
//                                                            # attente, réponse écrite dans S1.question.md, `claude -p --resume`
//   node tests/scenarios/lancer.mjs --reprendre [--attente 30] [--pause-max 9]
//                                                            # continue le dernier passage en deux temps (attente restante, puis réponse)
//
// Options : --model haiku · --effort medium (orchestrateur) · --max-budget 3 (USD par passage) ·
//           --max-turns 200 · --delai-min 45 · --claude <binaire> · --sans-noter ·
//           --autorisations banc|projet (défaut banc = la liste large OUTILS_AUTORISES ; projet =
//           le permissions.allow du gabarit tel que vendoré, comme un vrai projet) ·
//           --attente <minutes> (scénario arret-relaye : attente entre la question et la réponse) ·
//           --pause-max <minutes> (attente maximale PAR APPEL : au-delà, code 4, `--reprendre` continue)
//
// Un passage = un dossier `<tmp>/scenarios-templates/<scénario>-<n>-<horodatage>/` : l'instantané du
// plugin, le mini-projet vendoré (`projet/`), le dépôt nu `origin.git`, la sortie `out/stream.jsonl`.
// Rien n'est écrit dans ce dépôt. Mode d'emploi et pièges : tests/scenarios/README.md.
import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATTENDU, SCENARIOS, DEPOT, poser, envGit } from './projet/poser.mjs';
import { REPONSE_ARRET_RELAYE } from './projet/plan.mjs';
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
const ATTENTE_MIN = Number(opt('--attente', '0'));
const PAUSE_MAX_MIN = Number(opt('--pause-max', String(ATTENTE_MIN)));
const REPRENDRE = args.includes('--reprendre');

/** Scénarios joués en deux temps (session persistée, attente, réponse, reprise). */
export const SCENARIOS_DEUX_TEMPS = ['arret-relaye'];

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

/** Message du temps 2 d'`arret-relaye` : l'utilisateur répond DANS la conversation, comme un vrai (P20/S13 : avec la
 * seule réponse committée dans `S1.question.md`, l'orchestrateur refusait de la transmettre — « rien ne me dit que
 * c'est toi » —, passage `arret-relaye-1-2026-10-16T07-35-15`). La réponse ne porte jamais le mot de `mot.txt`. */
export const promptTemps2 = (reponse) => `${PROMPT}\n\nMa réponse à la question de S1 : ${reponse}`;

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

/** `deuxTemps` : `{ phase: 1|2, sessionId }` — la session est PERSISTÉE (jamais `--no-session-persistence`), créée
 * sous `sessionId` au temps 1 et reprise (`--resume`) au temps 2, dont la sortie va dans `*-reprise.*`. */
function jouer({ binaire, dossier, projet, snapshot, outils, deuxTemps = null }) {
  const prompt = deuxTemps?.phase === 2 ? promptTemps2(REPONSE_ARRET_RELAYE) : PROMPT;
  const env = envPropre(dossier);
  const out = join(dossier, 'out');
  mkdirSync(out, { recursive: true });
  const reprise = deuxTemps?.phase === 2;
  const suffixe = reprise ? '-reprise' : '';
  const commande = [
    '-p', '--model', MODELE, '--effort', EFFORT,
    '--max-turns', TOURS, '--max-budget-usd', BUDGET,
    '--strict-mcp-config',
    ...(deuxTemps ? (reprise ? ['--resume', deuxTemps.sessionId] : ['--session-id', deuxTemps.sessionId]) : ['--no-session-persistence']),
    '--permission-mode', 'acceptEdits',
    '--allowedTools', outils.join(','),
    '--plugin-dir', snapshot,
    '--output-format', 'stream-json', '--verbose',
  ];
  writeFileSync(join(out, `prompt${suffixe}.txt`), prompt + '\n');
  writeFileSync(join(out, `commande${suffixe}.txt`), `${binaire} ${commande.join(' ')}\n`);
  return new Promise((resolve) => {
    const debut = Date.now();
    const enfant = spawn(binaire, commande, { cwd: projet, env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    enfant.stdout.pipe(createWriteStream(join(out, `stream${suffixe}.jsonl`)));
    enfant.stderr.pipe(createWriteStream(join(out, `stderr${suffixe}.txt`)));
    enfant.stdin.end(prompt);
    let delaiDepasse = false;
    const minuteur = setTimeout(() => {
      delaiDepasse = true;
      try { enfant.kill(); } catch { /* déjà terminé */ }
    }, DELAI_MIN * 60 * 1000);
    enfant.on('error', (e) => { clearTimeout(minuteur); resolve({ code: -1, erreur: e.message, dureeMs: Date.now() - debut, delaiDepasse }); });
    enfant.on('close', (code) => { clearTimeout(minuteur); resolve({ code, dureeMs: Date.now() - debut, delaiDepasse }); });
  });
}

const dormir = (ms) => new Promise((fin) => setTimeout(fin, ms));

function lireJson(chemin) {
  try { return JSON.parse(readFileSync(chemin, 'utf8')); } catch { return null; }
}

/** Le temps 2 d'un passage en deux temps : attend ce qu'il reste de `--attente` (au plus `--pause-max` par appel,
 * puis code 4 : `--reprendre` continue), écrit la réponse dans `S1.question.md` (ligne `Réponse :`) et la
 * committe, puis `claude -p --resume`. Rend le code de sortie du banc. */
async function deuxiemeTemps({ binaire, dossier }) {
  const att = lireJson(join(dossier, 'attente.json'));
  if (!att) { console.error(`${dossier} : pas de attente.json — ce passage n'est pas en deux temps (ou son temps 1 n'a pas fini)`); return 2; }
  const minutes = args.includes('--attente') ? ATTENTE_MIN : att.attenteMin;
  const restantMs = att.finTemps1Ms + minutes * 60000 - Date.now();
  if (restantMs > 0) {
    const pauseMs = Math.min(restantMs, (args.includes('--pause-max') ? PAUSE_MAX_MIN : Math.max(minutes, 1)) * 60000);
    console.log(`  attente : ${(restantMs / 60000).toFixed(1)} min restantes sur ${minutes} — pause de ${(pauseMs / 60000).toFixed(1)} min`);
    await dormir(pauseMs);
    if (restantMs > pauseMs) {
      console.log(`  attente non écoulée (${((restantMs - pauseMs) / 60000).toFixed(1)} min restantes) : rappeler \`node tests/scenarios/lancer.mjs --reprendre\``);
      return 4;
    }
  }
  const projet = join(dossier, 'projet');
  const env = envGit(dossier);
  const fichier = join(projet, 'plans', 'P1', 'S1.question.md');
  const git = (...a) => execFileSync('git', a, { cwd: projet, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  if (!existsSync(fichier)) {
    console.log("  la session n'a pas écrit plans/P1/S1.question.md : pas de réponse à donner, temps 2 non joué (H1 indéterminée)");
    writeFileSync(join(dossier, 'meta-reprise.json'), JSON.stringify({ jouee: false, motif: 'aucune question écrite' }, null, 2) + '\n');
    afficher(noterPassage(dossier), true);
    return 0;
  }
  const texte = readFileSync(fichier, 'utf8').replace(/\r\n/g, '\n');
  if (!/^Réponse\s*:.*$/m.test(texte)) { console.error('S1.question.md sans ligne « Réponse : » : réponse non écrite'); return 1; }
  writeFileSync(fichier, texte.replace(/^Réponse\s*:.*$/m, `Réponse : ${REPONSE_ARRET_RELAYE}`));
  git('add', '--', 'plans/P1/S1.question.md');
  git('commit', '-q', '-m', `chore(plan): réponse de l'utilisateur pour S1\n\nPlan: P1/S1`);
  try { git('push', '-q'); } catch { /* le moteur rendra `pousser` */ }
  const outils = AUTORISATIONS === 'projet' ? autorisationsProjet(projet) : OUTILS_AUTORISES;
  const debutMs = Date.now();
  console.log(`  → claude -p --resume ${att.sessionId} (réponse écrite après ${((debutMs - att.finTemps1Ms) / 60000).toFixed(1)} min d'attente)`);
  const resultat = await jouer({ binaire, dossier, projet, snapshot: join(dossier, 'plugin'), outils, deuxTemps: { phase: 2, sessionId: att.sessionId } });
  writeFileSync(join(dossier, 'meta-reprise.json'), JSON.stringify({
    jouee: true, sessionId: att.sessionId, attenteVoulueMin: minutes, attenteReelleMs: debutMs - att.finTemps1Ms,
    reponse: REPONSE_ARRET_RELAYE, sortie: resultat.code, erreur: resultat.erreur ?? null, delaiDepasse: resultat.delaiDepasse, dureeMurMs: resultat.dureeMs,
  }, null, 2) + '\n');
  afficher(noterPassage(dossier), true);
  return 0;
}

async function main() {
  if (REPRENDRE) {
    const dossier = existsSync(join(RACINE, 'dernier.txt')) ? readFileSync(join(RACINE, 'dernier.txt'), 'utf8').trim() : null;
    if (!dossier) { console.error('aucun passage joué (dernier.txt absent)'); return 2; }
    return deuxiemeTemps({ binaire: binaireClaude(), dossier });
  }
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
      const enDeuxTemps = SCENARIOS_DEUX_TEMPS.includes(scenario);
      const sessionId = enDeuxTemps ? randomUUID() : null;
      console.log(`  → claude -p (${MODELE} ${EFFORT}, plafond ${BUDGET} USD, ${DELAI_MIN} min, autorisations ${AUTORISATIONS}${enDeuxTemps ? `, session persistée ${sessionId}` : ''}) dans ${dossier}`);
      const resultat = await jouer({ binaire, dossier, projet: pose.projet, snapshot: pose.snapshot, outils, deuxTemps: enDeuxTemps ? { phase: 1, sessionId } : null });
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
      if (enDeuxTemps) {
        // Temps 1 fini : la session est persistée, la question (si elle a été posée) attend sa réponse.
        writeFileSync(join(dossier, 'attente.json'), JSON.stringify({ sessionId, finTemps1Ms: Date.now(), attenteMin: ATTENTE_MIN }, null, 2) + '\n');
        if (!args.includes('--sans-noter')) { try { afficher(noterPassage(dossier)); } catch (e) { console.error(`  notation du temps 1 impossible : ${e.message}`); } }
        return deuxiemeTemps({ binaire, dossier });
      }
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
