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
// Lecture du flux (P20/S5/T8) — `lireFlux`, pure, testée sur des flux enregistrés
// (tests/fixtures/scenarios/*.jsonl) :
//   - un VERDICT se lit dans le RETOUR d'un agent (`task_notification` ou `tool_result` portant son
//     `tool_use_id`, ou le dernier texte du sous-agent), jamais dans le prompt qu'on lui envoie ni dans un
//     fichier qu'il lit : le gabarit `VERDICT: PASS|FAIL|ENQUETE|DECISION` cité par un prompt était lu
//     comme `PASS` (mesure du 2026-10-14, §6 E1 : deux `DECISION` comptés `PASS`, relance inutile à tort) ;
//   - un gabarit (`PASS|FAIL|…`) n'est jamais un verdict ;
//   - la première ligne de la sortie du moteur reste `<action> — …` (`fini`, `pousser`, `cloturer` nus) :
//     c'est elle que lit `moteurDernierAppelModele`, depuis que le moteur rend aussi son texte final.
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

/** Texte d'un bloc `tool_result` (chaîne, ou liste de blocs texte). */
function texteResultat(bloc) {
  return typeof bloc.content === 'string' ? bloc.content : (bloc.content ?? []).map((x) => x.text ?? '').join('\n');
}

const QUESTION = /❓\s*P\d+(?:\/S\d+)?[^\n]*/g;

/** Un vrai verdict : `VERDICT: <mot>` en début de ligne, jamais suivi de `|` (le gabarit
 * `VERDICT: PASS|FAIL|ENQUETE|DECISION` d'un prompt n'en est pas un). */
const VERDICT = /^\s*VERDICT:\s*(PASS|FAIL|ENQUETE|DECISION|QUESTION)\b(?!\s*\|)/m;

/** Le `MOTIF:` d'un verdict (jusqu'au `RAPPORT:` ou à la fin de la ligne). */
const MOTIF = /MOTIF:\s*(.*?)(?:\s*[·|]\s*RAPPORT:|$)/m;

/** Les gestes qu'une sortie de `prochaine-action.mjs --appliquer` énumère avant l'action finale. */
const GESTE_APPLIQUE = /^appliqué — /;

/** Première ligne de la dernière action d'une sortie du moteur : la première ligne non vide qui n'est pas un
 * geste appliqué. Sans `--appliquer` : la première ligne, comme avant. Chaîne vide si rien d'autre que des gestes. */
export function premiereLigneDeLaDerniereAction(texte) {
  return String(texte ?? '').split('\n').map((x) => x.trim()).find((x) => x !== '' && !GESTE_APPLIQUE.test(x)) ?? '';
}

/** Lecture PURE d'un flux `stream-json` : lancements d'agents (avec leur verdict), appels du moteur,
 * questions rendues à l'utilisateur, relances inutiles. Aucun accès disque : testée sur des flux
 * enregistrés (tests/fixtures/scenarios/). */
export function lireFlux(evenements, pose = {}) {
  const lancements = [];
  const appelsMoteur = [];
  const questions = new Set();
  const sendMessages = [];
  evenements.forEach((e, ordre) => {
    if (e.type !== 'assistant') return;
    for (const c of e.message?.content ?? []) {
      if (c.type === 'text') for (const m of c.text.matchAll(QUESTION)) questions.add(m[0].trim());
      if (c.type !== 'tool_use') continue;
      if (c.name === 'AskUserQuestion') questions.add(`AskUserQuestion:${c.id}`);
      if (c.name === 'SendMessage') sendMessages.push({ id: c.id, ordre, to: c.input?.to ?? null, message: String(c.input?.message ?? '') });
      if (c.name === 'Bash' && /node\s+\S*prochaine-action\.mjs/.test(c.input?.command ?? '')) appelsMoteur.push({ id: c.id, ordre });
      if (c.name !== 'Agent' && c.name !== 'Task') continue;
      const desc = c.input?.description ?? '';
      const m = /^P(\d+)\/(S\d+)(?:\s+(.*))?$/.exec(desc);
      const suffixe = (m?.[3] ?? '').toLowerCase();
      const revue = /relecteur/.test(c.input?.subagent_type ?? '') || /revue/.test(suffixe);
      lancements.push({
        id: c.id, ordre, desc, session: m ? m[2] : null,
        genre: revue ? 'revue' : /reprise/.test(suffixe) ? 'reprise' : /enqu/.test(suffixe) ? 'enquete' : /pr[ée]misse/.test(suffixe) ? 'premisse' : m ? 'session' : 'autre',
        agent: c.input?.subagent_type ?? null, modele: c.input?.model ?? null, effort: c.input?.effort ?? null, arrierePlan: c.input?.run_in_background ?? null,
      });
    }
  });
  for (const e of evenements) if (e.type === 'result' && typeof e.result === 'string') for (const m of e.result.matchAll(QUESTION)) questions.add(m[0].trim());

  // ── Verdicts : lus dans le RETOUR de l'agent, associé par identifiant d'appel — jamais dans son prompt.
  //   rang 0  `task_notification` (agent d'arrière-plan : `summary`) ;
  //   rang 1  `tool_result` de l'appel, au niveau du modèle qui orchestre (agent au premier plan) ;
  //   rang 2  dernier texte du sous-agent (`parent_tool_use_id` = l'appel) — repli.
  for (const l of lancements) {
    const candidats = [];
    evenements.forEach((e, i) => {
      if (i <= l.ordre) return;
      if (e.type === 'system' && e.subtype === 'task_notification' && e.tool_use_id === l.id) {
        candidats.push({ i, rang: 0, texte: String(e.summary ?? '') });
      }
      if (e.type === 'user') {
        for (const c of Array.isArray(e.message?.content) ? e.message.content : []) {
          if (c.type === 'tool_result' && c.tool_use_id === l.id) candidats.push({ i, rang: 1, texte: texteResultat(c) });
        }
      }
      if (e.type === 'assistant' && e.parent_tool_use_id === l.id) {
        for (const c of e.message?.content ?? []) if (c.type === 'text') candidats.push({ i, rang: 2, texte: c.text });
      }
    });
    candidats.sort((a, b) => a.rang - b.rang || (a.rang === 2 ? b.i - a.i : a.i - b.i));
    for (const c of candidats) {
      const v = VERDICT.exec(c.texte);
      if (v) { l.verdict = v[1]; l.ordreVerdict = c.i; l.motif = MOTIF.exec(c.texte.slice(v.index))?.[1]?.trim() ?? null; break; }
    }
  }

  // ── SendMessage (P20/S6) : compté, avec le retour de l'appel — une erreur (agent introuvable, session
  //    fermée) se lit dans le `tool_result`, jamais se déduit.
  for (const m of sendMessages) {
    evenements.forEach((e, i) => {
      if (i <= m.ordre || e.type !== 'user') return;
      for (const c of Array.isArray(e.message?.content) ? e.message.content : []) {
        if (c.type === 'tool_result' && c.tool_use_id === m.id) {
          m.retour = texteResultat(c).slice(0, 500);
          m.ordreRetour = i;
          m.erreur = c.is_error === true || /not found|no (such )?agent|unknown agent|introuvable|cannot resume|could not|failed/i.test(m.retour);
        }
      }
    });
  }

  // ── Relances inutiles : lancement d'une session déjà faite (état posé, ou VERDICT: PASS lu avant) ──
  const faites = new Set(pose.faitesInitiales ?? []);
  const relancesInutiles = [];
  for (const l of lancements.filter((x) => x.session && (x.genre === 'session' || x.genre === 'reprise'))) {
    const dejaPasse = lancements.some((p) => p.session === l.session && p.verdict === 'PASS' && p.ordreVerdict < l.ordre);
    if (faites.has(l.session) || dejaPasse) relancesInutiles.push(`${l.session}@${l.ordre}`);
  }

  // ── Dernier appel du moteur par le modèle lui-même : la PREMIÈRE ligne de la DERNIÈRE action de son résultat
  //    — `<action> — …` (`fini`, `pousser`, `cloturer` nus), inchangée depuis que le moteur rend aussi son texte
  //    final. Sous `--appliquer` (P20/S7), un appel enchaîne des gestes : une ligne `appliqué — <geste>` par geste,
  //    PUIS l'action finale. Ces lignes ne sont jamais l'action : la dernière action commence à la première
  //    ligne qui n'en est pas une, après la dernière d'entre elles (sortie coupée avant l'action : aucune).
  let moteurDernierAppelModele = null;
  const dernier = appelsMoteur.at(-1);
  if (dernier) {
    for (const e of evenements) {
      for (const c of e.type === 'user' ? (Array.isArray(e.message?.content) ? e.message.content : []) : []) {
        if (c.type === 'tool_result' && c.tool_use_id === dernier.id) {
          moteurDernierAppelModele = premiereLigneDeLaDerniereAction(texteResultat(c));
        }
      }
    }
  }
  return { lancements, appelsMoteur, questions, relancesInutiles, moteurDernierAppelModele, sendMessages };
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

/** H1 du plan P20 — « une session arrêtée sur une question reprend par `SendMessage` avec tout son contexte,
 * même après une longue attente » — lue sur un passage du scénario `arret-relaye` :
 *   confirmée   un `SendMessage` sans erreur, et la MÊME session restitue le mot qu'elle avait lu avant l'arrêt
 *               (le fichier est supprimé, le mot n'est ni dans la question ni dans la réponse du banc) ;
 *   réfutée     le `SendMessage` échoue (agent introuvable…), ou il aboutit et le mot est perdu ;
 *   indéterminée  pas de question écrite, pas de `SendMessage`, ou mot retrouvé par une relecture de l'historique git.
 * Dans tous les cas une mesure, jamais un échec de la session. */
export function evaluerH1({ evenements, lancements, sendMessages, pose, reprise, projet, env }) {
  const mot = pose.mot ?? null;
  const s1 = lancements.filter((l) => l.session === 'S1');
  const aQuestion = s1.some((l) => l.verdict === 'QUESTION');
  const fichier = projet ? 'plans/P1/S1.question.md' : null;
  // Le mot ne doit figurer dans AUCUNE version commitée de la question (anti-raccourci).
  const historique = projet && existsSync(projet) ? (git(projet, env, 'log', '--all', '-p', '--format=', '--', fichier) ?? '') : '';
  const motDansQuestion = mot !== null && historique.includes(mot);
  const motDansReponse = mot !== null && String(reprise?.reponse ?? '').includes(mot);
  const premier = sendMessages[0] ?? null;
  const resultat = { question: aQuestion, attenteMs: reprise?.attenteReelleMs ?? null, mot, sendMessages: sendMessages.length, motDansQuestion, motDansReponse };
  if (!aQuestion && !premier) return { ...resultat, issue: 'indéterminée', preuve: "aucune session n'a rendu VERDICT: QUESTION" };
  if (motDansQuestion || motDansReponse) return { ...resultat, issue: 'indéterminée', preuve: 'le mot figure dans la question ou dans la réponse : la restitution ne prouve rien' };
  if (!premier) {
    const reprisesFroid = lancements.filter((l) => l.session === 'S1' && l.genre === 'reprise').length;
    return { ...resultat, issue: 'indéterminée', preuve: `aucun SendMessage (reprises à froid lancées : ${reprisesFroid}) — voir les lancements` };
  }
  if (premier.erreur) {
    return { ...resultat, issue: 'réfutée', preuve: `SendMessage en erreur : ${premier.retour ?? '(retour absent)'}`, repliFroid: lancements.filter((l) => l.session === 'S1' && l.genre === 'reprise').length };
  }
  // Après le SendMessage : le retour de l'appel, les notifications, les textes du modèle — jamais le message envoyé.
  const apres = evenements.slice(premier.ordre + 1);
  const textes = [];
  apres.forEach((e, j) => {
    if (e.type === 'system' && e.subtype === 'task_notification') textes.push(['notification', String(e.summary ?? ''), j]);
    if (e.type === 'result' && typeof e.result === 'string') textes.push(['résultat', e.result, j]);
    if (e.type === 'user') for (const c of Array.isArray(e.message?.content) ? e.message.content : []) if (c.type === 'tool_result' && c.tool_use_id === premier.id) textes.push(['retour du SendMessage', texteResultat(c), j]);
    if (e.type === 'assistant') for (const c of e.message?.content ?? []) if (c.type === 'text') textes.push([e.parent_tool_use_id ? 'texte de la session' : 'texte de l\'orchestrateur', c.text, j]);
  });
  const trouve = textes.find(([, t]) => mot !== null && t.includes(mot));
  // Seuls comptent les gestes de la session AVANT qu'elle restitue le mot (le relecteur, ensuite, lit ce qu'il veut).
  // Relecture suspecte : un geste de la SESSION (pas de l'orchestrateur) qui peut rendre le mot — `mot.txt`, ou
  // un diff/patch de l'historique (`git show`, `git diff`, `git log -p`). Un `git log --format='%h %s'` ne le peut pas.
  const REVELATEUR = /mot\.txt|git\s+(show|diff)\b|git\s+log\b[^|&;\n]*(\s-p\b|--patch|\s-u\b|--stat|\s-S|\s-G)/;
  const relectures = apres.slice(0, trouve ? trouve[2] + 1 : apres.length).filter((e) => e.type === 'assistant' && e.parent_tool_use_id).flatMap((e) => e.message?.content ?? [])
    // Edit/Write n'affichent rien : une édition de l'index dont la zone cite `docs/mot.txt` n'est pas une relecture.
    .filter((c) => c.type === 'tool_use' && !['Edit', 'Write'].includes(c.name) && REVELATEUR.test(JSON.stringify(c.input ?? {}))).map((c) => String(c.input?.command ?? c.input?.file_path ?? '').slice(0, 120));
  if (!trouve) return { ...resultat, issue: 'réfutée', preuve: 'SendMessage sans erreur, mais le mot lu avant l\'arrêt n\'est restitué nulle part : contexte perdu' };
  const i = trouve[1].indexOf(mot);
  const extrait = trouve[1].slice(Math.max(0, i - 60), i + mot.length + 60).replace(/\s+/g, ' ');
  if (relectures.length > 0) return { ...resultat, issue: 'indéterminée', preuve: `mot restitué (${trouve[0]} : « ${extrait} »), mais l'historique ou mot.txt a été relu : ${relectures.join(' | ')}`, relectures };
  return { ...resultat, issue: 'confirmée', preuve: `mot restitué par la même session (${trouve[0]} : « ${extrait} »), contenu du fichier effacé, aucune relecture` };
}

export function noterPassage(dossier) {
  const pose = lireJson(join(dossier, 'pose.json'), {});
  const meta = lireJson(join(dossier, 'meta.json'), {});
  const projet = join(dossier, 'projet');
  const origin = join(dossier, 'origin.git');
  const env = envDe(dossier);
  const cheminStream = join(dossier, 'out', 'stream.jsonl');
  const alertes = [];

  const lireEvenements = (chemin) => (existsSync(chemin)
    ? readFileSync(chemin, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
    : []);
  // Passage en deux temps (P20/S6) : le flux du temps 2 (`claude -p --resume`) suit celui du temps 1.
  const evenementsTemps1 = lireEvenements(cheminStream);
  const evenementsTemps2 = lireEvenements(join(dossier, 'out', 'stream-reprise.jsonl'));
  const evenements = [...evenementsTemps1, ...evenementsTemps2];
  if (evenements.length === 0) alertes.push('flux vide : claude n\'a rien produit (voir out/stderr.txt)');
  const init = evenements.find((e) => e.type === 'system' && e.subtype === 'init');
  const resultats = evenements.filter((e) => e.type === 'result');
  const resultat = resultats.at(-1) ?? null;
  const sommeResultats = (champ) => (resultats.length > 0 && resultats.every((x) => typeof x[champ] === 'number') ? resultats.reduce((t, x) => t + x[champ], 0) : null);

  // Le plugin chargé doit être l'instantané du passage, jamais celui du cache.
  if (init) {
    const brut = JSON.stringify(init.plugins ?? init.slash_commands ?? '');
    const instantane = join(dossier, 'plugin').replaceAll('\\', '/');
    if (!brut.replaceAll('\\\\', '/').replaceAll('\\', '/').includes(instantane)) {
      alertes.push('l\'événement init ne montre pas l\'instantané du plugin : un résultat obtenu avec le plugin du cache ne mesure rien');
    }
  }

  // ── Lancements d'agents, verdicts, questions : lecture pure du flux ───────────────────────────
  const { lancements, appelsMoteur, questions, relancesInutiles, moteurDernierAppelModele: moteurModele, sendMessages } = lireFlux(evenements, pose);

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
    cout: sommeResultats('total_cost_usd'),
    tours: sommeResultats('num_turns'),
    dureeS: sommeResultats('duration_ms') ? Math.round(sommeResultats('duration_ms') / 1000) : null,
    arret: resultat ? `${resultat.subtype ?? ''}${resultat.is_error ? ' (erreur)' : ''}${resultat.terminal_reason ? ` · ${resultat.terminal_reason}` : ''}` : 'aucun résultat',
    modelUsage: Object.fromEntries(modeles.map((m) => [m, { cout: modelUsage[m].costUSD ?? null, entree: modelUsage[m].inputTokens ?? null, sortie: modelUsage[m].outputTokens ?? null }])),
    sessionsLancees: lancements.filter((l) => l.genre === 'session').length,
    reprises: lancements.filter((l) => l.genre === 'reprise').length,
    revues,
    lancements: lancements.map((l) => ({ desc: l.desc, agent: l.agent, modele: l.modele, effort: l.effort, genre: l.genre, verdict: l.verdict ?? null })),
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
    sendMessages: sendMessages.map((m) => ({ to: m.to, message: m.message.slice(0, 200), erreur: m.erreur ?? null, retour: m.retour ?? null })),
    h1: (pose.scenario ?? meta.scenario) === 'arret-relaye'
      ? evaluerH1({ evenements, lancements, sendMessages, pose, reprise: lireJson(join(dossier, 'meta-reprise.json')), projet, env })
      : null,
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
  if (n.sendMessages?.length) console.log(`SendMessage : ${n.sendMessages.length} appel(s)${n.sendMessages.some((m) => m.erreur) ? ' dont en erreur' : ''}`);
  if (n.h1) console.log(`H1 : ${n.h1.issue} — ${n.h1.preuve} (attente réelle : ${n.h1.attenteMs === null ? '—' : `${(n.h1.attenteMs / 60000).toFixed(1)} min`})`);
  for (const a of n.alertes) console.log(`ATTENTION — ${a}`);
  if (verbeux) for (const l of n.lancements) console.log(`  agent ${l.genre.padEnd(8)} ${l.desc || '(sans description)'} · ${l.agent ?? '?'} · ${l.modele ?? '?'} · ${l.effort ?? '?'} · ${l.verdict ?? 'pas de verdict lu'}`);
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
