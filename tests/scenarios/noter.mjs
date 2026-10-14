#!/usr/bin/env node
// Note un passage de tests/scenarios/ : lit le `stream-json` de `claude -p` ET l'état final du
// mini-projet (jamais le seul récit du modèle).
//
//   node tests/scenarios/noter.mjs                  # le dernier passage joué
//   node tests/scenarios/noter.mjs <dossier>...     # des passages précis
//   node tests/scenarios/noter.mjs --tous           # tous les passages du dossier temporaire
//   node tests/scenarios/noter.mjs -v               # + le détail des lancements d'agents
//
// Cinq mesures par passage :
//   coût                  total_cost_usd, tours, durée, modelUsage par modèle ;
//   interventions         questions « ❓ P1/S… » rendues à l'utilisateur (un `claude -p` s'arrête sur la
//                         première ; attendu 0) ;
//   relances inutiles     lancements d'une session déjà faite au moment du lancement (état posé, ou
//                         VERDICT: PASS lu plus tôt dans le flux) ;
//   preuves valides       chaque plans/P1/S<k>.n0.json vérifié par plugin/bin/preuve-n0.mjs ;
//   issue                 action du moteur, relancé ICI sur l'état final — attendu `fini`.
//
// Anti-raccourci (S6/T11) : un passage n'est `abouti` que si (1) le moteur, relancé par ce script sur
// l'état final, rend `fini`, (2) le dernier appel du moteur par le modèle lui-même rendait `fini`
// aussi, (3) les commits de tâche du plan sont dans le dépôt nu `origin` (`git log main`), et (4) le
// dépôt est poussé (HEAD == origin/main).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const DEPOT = resolve(ICI, '..', '..');
const RACINE = join(tmpdir(), 'scenarios-templates');
const { verifierPreuve } = await import(pathToFileURL(join(DEPOT, 'plugin', 'bin', 'preuve-n0.mjs')).href);

function git(cwd, env, ...args) {
  try {
    return execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }).trim();
  } catch { return null; }
}

function envDe(dossier) {
  return { ...process.env, GIT_CONFIG_GLOBAL: join(dossier, 'gitconfig-jetable'), GIT_TERMINAL_PROMPT: '0' };
}

function lireJson(chemin, defaut = null) {
  try { return JSON.parse(readFileSync(chemin, 'utf8')); } catch { return defaut; }
}

/** Tous les textes d'un événement (blocs texte, résultats d'outils) en une seule chaîne. */
function texteDe(evenement) {
  const morceaux = [];
  const contenu = evenement.message?.content;
  if (typeof contenu === 'string') morceaux.push(contenu);
  else for (const c of contenu ?? []) {
    if (c.type === 'text') morceaux.push(c.text);
    else if (c.type === 'tool_result') {
      morceaux.push(typeof c.content === 'string' ? c.content : (c.content ?? []).map((x) => x.text ?? '').join('\n'));
    }
  }
  for (const cle of ['summary', 'result', 'text', 'content']) if (typeof evenement[cle] === 'string') morceaux.push(evenement[cle]);
  return morceaux.join('\n');
}

/** Sessions et tâches du plan, lues dans l'index FINAL du mini-projet. */
function lireIndex(projet) {
  const chemin = join(projet, 'plans', 'P1', 'index.md');
  if (!existsSync(chemin)) return { sessions: [], clos: false };
  const texte = readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n');
  const sessions = [];
  for (const ligne of texte.split('\n')) {
    if (!ligne.trim().startsWith('|')) continue;
    const c = ligne.split('|').slice(1, -1).map((x) => x.trim());
    const id = /\bS(\d+)\b/.exec(c[0] ?? '');
    if (!id || c.length < 9) continue;
    const taches = [];
    const m = /^T(\d+)(?:-T(\d+))?$/.exec(c[1]);
    if (m) for (let t = Number(m[1]); t <= Number(m[2] ?? m[1]); t++) taches.push(t);
    sessions.push({ session: `S${id[1]}`, taches, cochee: /\[x\]/.test(c[8]) });
  }
  return { sessions, clos: /^Clos\s*:/m.test(texte) };
}

export function noterPassage(dossier) {
  const pose = lireJson(join(dossier, 'pose.json'), {});
  const meta = lireJson(join(dossier, 'meta.json'), {});
  const projet = join(dossier, 'projet');
  const origin = join(dossier, 'origin.git');
  const env = envDe(dossier);
  const cheminStream = join(dossier, 'out', 'stream.jsonl');
  const alertes = [];

  const evenements = existsSync(cheminStream)
    ? readFileSync(cheminStream, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
    : [];
  if (evenements.length === 0) alertes.push('flux vide : claude n\'a rien produit (voir out/stderr.txt)');
  const init = evenements.find((e) => e.type === 'system' && e.subtype === 'init');
  const resultat = [...evenements].reverse().find((e) => e.type === 'result') ?? null;

  // Le plugin chargé doit être l'instantané du passage, jamais celui du cache.
  if (init) {
    const brut = JSON.stringify(init.plugins ?? init.slash_commands ?? '');
    const instantane = join(dossier, 'plugin').replaceAll('\\', '/');
    if (!brut.replaceAll('\\\\', '/').replaceAll('\\', '/').includes(instantane)) {
      alertes.push('l\'événement init ne montre pas l\'instantané du plugin : un résultat obtenu avec le plugin du cache ne mesure rien');
    }
  }

  // ── Lancements d'agents, dans l'ordre du flux ─────────────────────────────────────────────────
  const lancements = [];
  const appelsMoteur = [];
  const questions = new Set();
  evenements.forEach((e, ordre) => {
    if (e.type !== 'assistant') return;
    for (const c of e.message?.content ?? []) {
      if (c.type === 'text') for (const m of c.text.matchAll(/❓\s*P\d+\/S\d+[^\n]*/g)) questions.add(m[0].trim());
      if (c.type !== 'tool_use') continue;
      if (c.name === 'AskUserQuestion') questions.add(`AskUserQuestion:${c.id}`);
      if (c.name === 'Bash' && /prochaine-action/.test(c.input?.command ?? '')) appelsMoteur.push({ id: c.id, ordre });
      if (c.name !== 'Agent' && c.name !== 'Task') continue;
      const desc = c.input?.description ?? '';
      const m = /^P(\d+)\/(S\d+)(?:\s+(.*))?$/.exec(desc);
      const suffixe = (m?.[3] ?? '').toLowerCase();
      const revue = /relecteur/.test(c.input?.subagent_type ?? '') || /revue/.test(suffixe);
      lancements.push({
        id: c.id, ordre, desc, session: m ? m[2] : null,
        genre: revue ? 'revue' : /reprise/.test(suffixe) ? 'reprise' : /enqu/.test(suffixe) ? 'enquete' : /pr[ée]misse/.test(suffixe) ? 'premisse' : m ? 'session' : 'autre',
        agent: c.input?.subagent_type ?? null, modele: c.input?.model ?? null, arrierePlan: c.input?.run_in_background ?? null,
      });
    }
  });
  if (resultat?.result && /❓\s*P\d+\/S\d+/.test(resultat.result)) for (const m of resultat.result.matchAll(/❓\s*P\d+\/S\d+[^\n]*/g)) questions.add(m[0].trim());

  // ── Verdicts : le premier VERDICT: lu après un lancement, associé par identifiant d'appel ou par
  // description (`P1/S1`) — heuristique, à valider sur le premier vrai passage.
  const utilises = new Set();
  for (const l of lancements) {
    for (let i = l.ordre + 1; i < evenements.length; i++) {
      if (utilises.has(i)) continue;
      const brut = JSON.stringify(evenements[i]);
      const texte = texteDe(evenements[i]);
      const v = /VERDICT:\s*(PASS|FAIL|ENQUETE|DECISION)/.exec(texte);
      if (!v) continue;
      if (brut.includes(l.id) || (l.desc && texte.includes(l.desc))) { l.verdict = v[1]; l.ordreVerdict = i; utilises.add(i); break; }
    }
  }

  // ── Relances inutiles ─────────────────────────────────────────────────────────────────────────
  const faites = new Set(pose.faitesInitiales ?? []);
  const relancesInutiles = [];
  for (const l of lancements.filter((x) => x.session && (x.genre === 'session' || x.genre === 'reprise'))) {
    const dejaPasse = lancements.some((p) => p.session === l.session && p.verdict === 'PASS' && p.ordreVerdict < l.ordre);
    if (faites.has(l.session) || dejaPasse) relancesInutiles.push(`${l.session}@${l.ordre}`);
  }

  // ── État final ────────────────────────────────────────────────────────────────────────────────
  const index = lireIndex(projet);
  let moteurFinal = null;
  if (existsSync(projet)) {
    try {
      moteurFinal = JSON.parse(execFileSync(process.execPath, ['.claude/workflow/bin/prochaine-action.mjs', 'P1', '--json'],
        { cwd: projet, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }));
    } catch (e) { alertes.push(`moteur relancé sur l'état final : échec (${String(e.message).split('\n')[0]})`); }
  }
  const issue = moteurFinal?.action ?? 'inconnue';

  // Dernier appel du moteur par le modèle lui-même : son résultat.
  let moteurModele = null;
  const dernier = appelsMoteur.at(-1);
  if (dernier) {
    for (const e of evenements) {
      for (const c of e.type === 'user' ? (e.message?.content ?? []) : []) {
        if (c.type === 'tool_result' && c.tool_use_id === dernier.id) {
          const t = typeof c.content === 'string' ? c.content : (c.content ?? []).map((x) => x.text ?? '').join('\n');
          moteurModele = t.split('\n').map((s) => s.trim()).find(Boolean) ?? '';
        }
      }
    }
  }
  const relanceFinal = moteurModele !== null && /^fini\b/.test(moteurModele);

  // Commits de tâche dans le dépôt nu, et dépôt poussé.
  const messagesOrigin = existsSync(origin) ? (git(origin, env, 'log', 'main', '--format=%B') ?? '') : '';
  const tachesAttendues = index.sessions.flatMap((s) => s.taches.map((t) => `P1/${s.session}/T${t}`));
  const tachesManquantes = tachesAttendues.filter((r) => !messagesOrigin.includes(`Plan: ${r}`));
  const pousse = existsSync(projet) && git(projet, env, 'rev-parse', 'HEAD') === git(origin, env, 'rev-parse', 'main');

  // Preuves N0 : une par session du plan.
  const preuves = index.sessions.map((s) => {
    const p = existsSync(projet) ? verifierPreuve(projet, `P1/${s.session}`) : { ok: false, motif: 'projet absent' };
    return { session: s.session, ok: p.ok === true, motif: p.ok === true ? null : p.motif };
  });

  // ── Coût ──────────────────────────────────────────────────────────────────────────────────────
  const modelUsage = resultat?.modelUsage ?? {};
  const modeles = Object.keys(modelUsage);
  const revues = lancements.filter((l) => l.genre === 'revue').length;
  const orchestrateur = (meta.modele ?? 'haiku').toLowerCase();
  const autres = modeles.filter((m) => !m.toLowerCase().includes(orchestrateur));
  let h2 = 'indécidable (un seul modèle dans modelUsage)';
  if (modeles.length > 1) h2 = revues > 0 || lancements.length > 0 ? `inclus : modelUsage porte aussi ${autres.join(', ')}` : 'à lire à la main';
  else if (modeles.length === 1 && lancements.length > 0 && lancements.every((l) => (l.modele ?? orchestrateur) === orchestrateur) && revues === 0) h2 = 'indécidable (sessions et orchestrateur sur le même modèle, aucune revue)';
  else if (modeles.length === 1 && autres.length === 0 && revues > 0) h2 = 'NON inclus : une revue (relecteur-session, Sonnet) a tourné, modelUsage ne porte que le modèle de l\'orchestrateur';

  const abouti = issue === 'fini' && relanceFinal && tachesManquantes.length === 0 && tachesAttendues.length > 0 && pousse && !resultat?.is_error;
  if (issue === 'fini' && !relanceFinal) alertes.push('moteur `fini` à l\'état final, mais le modèle ne l\'a pas relancé en dernier : passage non abouti');
  const refus = (resultat?.permission_denials ?? []).map((d) => d.tool_name ?? JSON.stringify(d)).slice(0, 10);
  if (refus.length) alertes.push(`outils refusés : ${[...new Set(refus)].join(', ')}`);

  const note = {
    passage: dossier.split(/[\\/]/).pop(),
    scenario: pose.scenario ?? meta.scenario ?? '?',
    abouti,
    issue,
    moteurDernierAppelModele: moteurModele,
    cout: resultat?.total_cost_usd ?? null,
    tours: resultat?.num_turns ?? null,
    dureeS: resultat?.duration_ms ? Math.round(resultat.duration_ms / 1000) : null,
    arret: resultat ? `${resultat.subtype ?? ''}${resultat.is_error ? ' (erreur)' : ''}${resultat.terminal_reason ? ` · ${resultat.terminal_reason}` : ''}` : 'aucun résultat',
    modelUsage: Object.fromEntries(modeles.map((m) => [m, { cout: modelUsage[m].costUSD ?? null, entree: modelUsage[m].inputTokens ?? null, sortie: modelUsage[m].outputTokens ?? null }])),
    sessionsLancees: lancements.filter((l) => l.genre === 'session').length,
    reprises: lancements.filter((l) => l.genre === 'reprise').length,
    revues,
    lancements: lancements.map((l) => ({ desc: l.desc, agent: l.agent, modele: l.modele, genre: l.genre, verdict: l.verdict ?? null })),
    relancesInutiles,
    interventions: questions.size,
    questions: [...questions],
    preuves,
    preuvesValides: `${preuves.filter((p) => p.ok).length}/${preuves.length}`,
    tachesManquantesDansOrigin: tachesManquantes,
    pousse,
    clos: index.clos,
    h2,
    claude: meta.claude ?? null,
    pluginVersion: meta.pluginVersion ?? pose.version ?? null,
    depot: meta.depot ?? null,
    alertes,
  };
  writeFileSync(join(dossier, 'note.json'), JSON.stringify(note, null, 2) + '\n');
  return note;
}

export function afficher(n, verbeux = false) {
  const usd = (x) => (x === null || x === undefined ? '—' : `$${Number(x).toFixed(3)}`);
  console.log(`\n== ${n.passage} — ${n.abouti ? 'ABOUTI' : 'NON ABOUTI'} (issue du moteur : ${n.issue})`);
  console.table([{
    scenario: n.scenario, coût: usd(n.cout), tours: n.tours ?? '—', 'durée s': n.dureeS ?? '—',
    sessions: n.sessionsLancees, reprises: n.reprises, revues: n.revues,
    'relances inutiles': n.relancesInutiles.length, questions: n.interventions, 'preuves valides': n.preuvesValides,
    poussé: n.pousse ? 'oui' : 'non', clos: n.clos ? 'oui' : 'non',
  }]);
  const mu = Object.entries(n.modelUsage);
  if (mu.length) console.table(Object.fromEntries(mu.map(([m, v]) => [m, { coût: usd(v.cout), entrée: v.entree, sortie: v.sortie }])));
  console.log(`arrêt : ${n.arret} · H2 : ${n.h2}`);
  if (n.tachesManquantesDansOrigin.length) console.log(`commits de tâche absents d'origin/main : ${n.tachesManquantesDansOrigin.join(', ')}`);
  for (const q of n.questions) console.log(`question rendue : ${q}`);
  for (const a of n.alertes) console.log(`ATTENTION — ${a}`);
  if (verbeux) for (const l of n.lancements) console.log(`  agent ${l.genre.padEnd(8)} ${l.desc || '(sans description)'} · ${l.agent ?? '?'} · ${l.modele ?? '?'} · ${l.verdict ?? 'pas de verdict lu'}`);
}

function passagesDisponibles() {
  if (!existsSync(RACINE)) return [];
  return readdirSync(RACINE, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(RACINE, d.name, 'out', 'stream.jsonl')))
    .map((d) => join(RACINE, d.name)).sort();
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const argv = process.argv.slice(2);
  const verbeux = argv.includes('-v');
  let dossiers = argv.filter((a) => !a.startsWith('-'));
  if (argv.includes('--tous')) dossiers = passagesDisponibles();
  else if (dossiers.length === 0) {
    const dernier = join(RACINE, 'dernier.txt');
    if (existsSync(dernier)) dossiers = [readFileSync(dernier, 'utf8').trim()];
  }
  if (dossiers.length === 0) {
    console.error(`Aucun passage à noter dans ${RACINE} — lancer d'abord node tests/scenarios/lancer.mjs --scenario nominal`);
    process.exit(2);
  }
  for (const d of dossiers) afficher(noterPassage(resolve(d)), verbeux);
}
