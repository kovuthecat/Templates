#!/usr/bin/env node
// Lecteur d'état d'un plan — moitié « lecture » du contrat C2
// (docs/decisions/2026-09-17-autonomie-par-defaut-etat-scripte-push-par-session.md). Le moteur
// d'actions (quoi faire ensuite) est une session distincte, S10 : ce script ne rend ici QUE l'état.
//
// POURQUOI CE FICHIER EXISTE
// Un moteur écrit sur un parseur non éprouvé se débogue deux fois. L'index réel d'un plan a des
// variantes (legacy `gate`, dates optionnelles sur `[x]`, vagues sans session membre) qu'aucune
// fixture inventée à la main ne révèle — d'où des fixtures copiées d'index réels (tests/fixtures/plans/).
//
// USAGE
//   node plugin/bin/prochaine-action.mjs P<n> --etat   (ce dépôt, source)
//   node .claude/workflow/bin/prochaine-action.mjs P<n> --etat   (projet vendoré)
//
//   Sans --etat : « moteur non implémenté (S10) », code 2 — ce script ne décide jamais quoi lancer.
//
// LECTURE SEULE. L'état se dérive des seuls fichiers commités : la table et l'ordonnancement de
// `plans/P<n>/index.md`, les lignes mécaniques de `plans/P<n>/S<k>.echec.md`, la première ligne de
// `plans/P<n>/S<k>.revue.md`, `git log` (repères `Plan: P<n>/S<k>/T<m>`), `.claude/wave.lock`,
// l'avance/retard sur l'amont. Jamais un état deviné : un index illisible rend une erreur nommée.
//
// SORTIE (avec --etat) : un objet JSON sur stdout. Code 0 si l'index a pu être lu (quel que soit
// l'état des sessions qu'il décrit), 2 si l'index est illisible ou si --etat est absent.

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';

const RACINE = process.cwd();

const args = process.argv.slice(2);
const plan = args.find((a) => /^P\d+$/.test(a));
const etat = args.includes('--etat');

if (!plan) {
  console.error('prochaine-action: indiquer un plan (ex. P6)');
  process.exit(2);
}
if (!etat) {
  console.error('prochaine-action: moteur non implémenté (S10)');
  process.exit(2);
}

// ── git, best-effort, jamais bloquant (style maison : plugin/bin/collecter-incidents.mjs) ────────
function git(...a) {
  try {
    return execFileSync('git', a, {
      cwd: RACINE,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
      timeout: 8000,
    }).trim();
  } catch {
    return null;
  }
}

function racineDepot() {
  const commun = git('rev-parse', '--path-format=absolute', '--git-common-dir');
  return commun ? dirname(commun) : RACINE;
}

function etatAmont() {
  const amont = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}');
  if (!amont) return null;
  const comptes = git('rev-list', '--left-right', '--count', `${amont}...HEAD`);
  if (!comptes) return null;
  const [retard, avance] = comptes.split(/\s+/).map(Number);
  if (!Number.isFinite(retard) || !Number.isFinite(avance)) return null;
  return { amont, retard, avance };
}

// ── Parseur d'index (table + ordonnancement) ──────────────────────────────────────────────────────
function erreur(motif) {
  return { erreur: `index illisible : ${motif}` };
}

function lireIndex(dossierPlan) {
  const chemin = join(dossierPlan, 'index.md');
  if (!existsSync(chemin)) return erreur(`${chemin} absent`);

  let texte;
  try {
    texte = readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n');
  } catch (e) {
    return erreur(`${chemin} : ${e.message}`);
  }
  const lignes = texte.split('\n');

  const ligneWorkflow = lignes.find((l) => /^Workflow\s*:/.test(l.trim()));
  const workflow = ligneWorkflow ? (/Workflow\s*:\s*v?(\S+)/.exec(ligneWorkflow)?.[1] ?? null) : null;

  // Table des sessions : colonnes fixées par le squelette (nouveau-plan/references/squelette-index.md).
  const sessions = [];
  for (const ligneBrute of lignes) {
    const l = ligneBrute.trim();
    if (!l.startsWith('|')) continue;
    const cellules = l.split('|').slice(1, -1).map((c) => c.trim());
    if (cellules.length < 9) continue;
    const idSession = /\bS(\d+)\b/.exec(cellules[0]);
    if (!idSession) continue; // en-tête ou ligne de séparateur (---)
    const statut = /\[( |x)\](!)?/.exec(cellules[8]);
    sessions.push({
      session: `S${idSession[1]}`,
      taches: cellules[1],
      titre: cellules[2],
      modele: cellules[3],
      effort: cellules[4],
      env: cellules[5],
      dependDe: cellules[6],
      zone: cellules[7],
      statutBrut: cellules[8],
      coche: statut ? statut[1] === 'x' : false,
      bloquantNonTrie: statut ? Boolean(statut[2]) : false,
      pastille: false, // complété plus bas, depuis l'ordonnancement
    });
  }
  if (sessions.length === 0) return erreur(`aucune session reconnue dans la table (${chemin})`);

  // Ordonnancement : vagues (numéro, label, sessions membres) + marqueur `pastille` par session.
  const vagues = [];
  let dansOrdonnancement = false;
  for (const ligneBrute of lignes) {
    const l = ligneBrute.trim();
    if (/^##\s+Ordonnancement/.test(l)) {
      dansOrdonnancement = true;
      continue;
    }
    if (dansOrdonnancement && /^##\s+/.test(l)) {
      dansOrdonnancement = false;
      continue;
    }
    if (!dansOrdonnancement) continue;

    const enteteVague = /^-\s*\*\*Vague\s+(\d+)(?:\s*—\s*([^*]+?))?\*\*\s*:\s*(.+)$/.exec(l);
    if (enteteVague) {
      const labelBrut = enteteVague[2] ? enteteVague[2].trim() : null;
      const labelNormalise = (labelBrut || '').toLowerCase();
      const membres = enteteVague[3].split('(')[0];
      vagues.push({
        numero: Number(enteteVague[1]),
        label: labelBrut,
        parallelisable: labelNormalise.includes('parallélisable'),
        validationHumaine: labelNormalise.includes('validation-humaine'),
        repriseManuelle: labelNormalise.includes('reprise-manuelle'),
        cloture: labelNormalise.includes('clôture'),
        gateLegacy: labelNormalise.includes('gate'), // ancien mot : signalé, jamais interprété
        sessions: [...membres.matchAll(/S\d+/g)].map((m) => m[0]),
      });
      continue;
    }

    // Ligne « en clair » d'une session : `  - **S<k>** — <texte>`. Seul le mot `pastille` y compte ici.
    const sousLigne = /^-\s*\*\*(S\d+)\*\*\s*[—-]\s*(.*)$/.exec(l);
    if (sousLigne && /\bpastille\b/.test(sousLigne[2])) {
      const s = sessions.find((x) => x.session === sousLigne[1]);
      if (s) s.pastille = true;
    }
  }
  if (vagues.length === 0) return erreur(`aucune vague reconnue sous « ## Ordonnancement » (${chemin})`);

  return { workflow, sessions, vagues };
}

// ── Tâches d'une session, commitées ou non ────────────────────────────────────────────────────────
function parseTaches(champ) {
  const nums = new Set();
  for (const morceau of String(champ || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = /^T(\d+)(?:-T(\d+))?$/.exec(morceau);
    if (!m) continue;
    const debut = Number(m[1]);
    const fin = m[2] ? Number(m[2]) : debut;
    for (let i = debut; i <= fin; i++) nums.add(i);
  }
  return [...nums].sort((a, b) => a - b);
}

function refsCommitees() {
  const messages = git('log', '--format=%B') || '';
  const refs = new Set();
  for (const m of messages.matchAll(/Plan:\s*(P\d+)\/(S\d+)\/(T\d+)/g)) {
    refs.add(`${m[1]}/${m[2]}/${m[3]}`);
  }
  return refs;
}

// ── `.echec.md` : les cinq lignes mécaniques, défauts du gabarit quand une ligne manque ─────────────
// (plugin/skills/reprendre-echec/SKILL.md, section « Gabarit »).
function lireEchec(chemin) {
  const texte = readFileSync(chemin, 'utf8');
  const valeur = (nom) => {
    const m = new RegExp(`^${nom}\\s*:\\s*(.*)$`, 'mi').exec(texte);
    return m ? m[1].trim() : null;
  };

  const nature = valeur('Nature') || 'exécution'; // absente ⇒ l'orchestrateur suppose « exécution »

  const tentativesBrut = valeur('Tentatives');
  const tm = tentativesBrut && /reprise\s*=\s*(\d+)\s*enquete\s*=\s*(\d+)/i.exec(tentativesBrut);
  const tentatives = tm
    ? { reprise: Number(tm[1]), enquete: Number(tm[2]) }
    : { reprise: 0, enquete: 0 }; // absente ⇒ budget non consommé

  const blocage = valeur('Blocage'); // absente ⇒ démarrage à froid (pas de canal court)
  const mesure = valeur('Mesure'); // optionnelle : seulement une prémisse mesurée et commitée

  const autoBrut = valeur('Auto');
  const auto = autoBrut && /^oui/i.test(autoBrut) ? autoBrut : 'non'; // absente ⇒ non

  return { nature, tentatives, blocage, mesure, auto, demarrageAFroid: !blocage };
}

function lireRevue(chemin) {
  const texte = readFileSync(chemin, 'utf8');
  const m = /^Bloquant\s*:\s*(\d+)/m.exec(texte);
  return { bloquant: m ? Number(m[1]) : null };
}

// ── Assemblage ─────────────────────────────────────────────────────────────────────────────────────
const dossierPlan = join(RACINE, 'plans', plan);
const index = lireIndex(dossierPlan);
if (index.erreur) {
  console.error(`prochaine-action: ${index.erreur}`);
  process.exit(2);
}

const refs = refsCommitees();
for (const s of index.sessions) {
  const cheminEchec = join(dossierPlan, `${s.session}.echec.md`);
  const cheminRevue = join(dossierPlan, `${s.session}.revue.md`);

  const taches = parseTaches(s.taches).map((n) => `${plan}/${s.session}/T${n}`);
  const toutesCommitees = taches.length > 0 && taches.every((ref) => refs.has(ref));

  if (s.coche) {
    s.etat = 'faite';
  } else if (existsSync(cheminEchec)) {
    s.etat = 'echec';
  } else if (toutesCommitees) {
    s.etat = 'faite';
  } else {
    s.etat = 'a-lancer';
  }

  s.echec = s.etat === 'echec' ? lireEchec(cheminEchec) : null;
  s.revue = existsSync(cheminRevue) ? lireRevue(cheminRevue) : null;
}

const sortie = {
  plan,
  workflow: index.workflow,
  depot: {
    waveLock: existsSync(join(racineDepot(), '.claude', 'wave.lock')),
    amont: etatAmont(),
  },
  vagues: index.vagues,
  sessions: index.sessions,
};

process.stdout.write(JSON.stringify(sortie, null, 2) + '\n');
process.exit(0);
