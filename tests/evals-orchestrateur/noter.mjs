// Note le rejeu posé par `poser-cas.sh` / `lancer.sh` — cas A (corrigé : S1 seule, D4), B, C.
// Lit la base depuis `${TMPDIR:-/tmp}/evals-orchestrateur-base.txt` (écrite par poser-cas.sh).
// Usage : node tests/evals-orchestrateur/noter.mjs [-v]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const etat = path.join(ici, '.dernier-lancement');
if (!fs.existsSync(etat)) {
  console.error(`Aucune base trouvée (${etat}) — lancer d'abord bash tests/evals-orchestrateur/lancer.sh`);
  process.exit(2);
}
const base = fs.readFileSync(etat, 'utf8').trim();
const out = path.join(base, 'out');
const verbose = process.argv.includes('-v');

// Cas C : les trois lignes `## Issues`, au format posé par S2/T5 (`N. <option> — <coût> · débloque
// <…>`) — recopiées à l'identique. Anti-raccourci (T11) : égalité de LIGNE stricte, sans
// normalisation des backticks ni des espaces — un check qui normalise avant de comparer reproduit
// le flou que D3 supprime.
const ISSUES = [
  '1. Typer parseDate en `Date | null` et traiter null chez les trois appelants — deux fichiers de plus hors zone.',
  '2. Garder `Date` et lever une exception sur entrée invalide — change le contrat public de src/a.mjs.',
  '3. Reporter T2 et livrer T1 seule — la validation des dates reste partielle.',
];

const CHECKS = {
  // A — corrigé (T11) : la skill impose un préflight puis S1 SEULE dans le premier message (D4).
  A: {
    s1Seule: (t) => /subagent_type:\s*"?(workflow:)?session-low"?/.test(t) && !/subagent_type:\s*"?(workflow:)?session-high"?/.test(t) && !/model:\s*"?opus/i.test(t),
    agentLow: (t) => /subagent_type:\s*"?(workflow:)?session-low"?/.test(t),
    modeleSonnet: (t) => /model:\s*"?sonnet/i.test(t),
    enClairS1: (t) => t.includes("Le formulaire refusera une date de départ antérieure à la date d'arrivée."),
    pasResumeurGit: (t) => !/resumeur-git/.test(t),
  },
  B: {
    agentHigh: (t) => /subagent_type:\s*"?(workflow:)?session-high"?/.test(t),
    opus: (t) => /model:\s*"?opus/i.test(t),
    reprendreEchec: (t) => /reprendre-echec/.test(t) && /plans\/P9\/S1\.echec\.md/.test(t),
    pasCanalCourt: (t) => !/SendMessage\(/.test(t),
    pasFork: (t) => !/subagent_type:\s*"?fork"?/.test(t),
  },
  C: {
    format: (t) => /❓\s*P9\/S1/.test(t),
    // Égalité de ligne stricte : la ligne attendue doit apparaître telle quelle (trim des seuls
    // espaces de bord de ligne), pas en sous-chaîne noyée ni après normalisation.
    issue1: (t) => lignes(t).includes(ISSUES[0]),
    issue2: (t) => lignes(t).includes(ISSUES[1]),
    issue3: (t) => lignes(t).includes(ISSUES[2]),
    reco: (t) => /Ma recommandation/.test(t),
    lancable: (t) => /reste lançable[^\n]*:\s*\**rien/i.test(t),
  },
};

function lignes(t) {
  return t.split('\n').map((l) => l.trim());
}

// Un geste peut arriver par deux canaux : écrit en clair (le bac à sable n'a pas l'outil, ce que le
// prompt demande) ou **tenté** comme appel d'outil, refusé par `--tools` avec
// « No such tool available: Agent ». Mesuré le 2026-09-22 : l'essai B-3 portait le bon
// `subagent_type`/`model` dans l'input d'un tool_use `Agent`, invisible au grader, noté raté alors
// que le geste était juste. On rend l'appel refusé dans la forme que le prompt réclame, pour que les
// critères mesurent le geste et non le canal — les attendus, eux, ne changent pas.
function renduAppel(nom, input) {
  const corps = Object.entries(input ?? {}).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`).join('\n');
  return `${nom}({\n${corps}\n})`;
}

const rows = [];
const agg = {};
const alertesPlugin = [];
const fichiers = fs.existsSync(out) ? fs.readdirSync(out).filter((f) => f.endsWith('.jsonl')).sort() : [];
if (fichiers.length === 0) {
  console.error(`Rien à noter dans ${out} — lancer d'abord bash tests/evals-orchestrateur/lancer.sh`);
  process.exit(2);
}

for (const f of fichiers) {
  const [cas, , effort] = f.replace('.jsonl', '').split('-');
  const ev = fs.readFileSync(path.join(out, f), 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const tools = [], texts = [];
  let res = null, init = null;
  for (const e of ev) {
    if (e.type === 'system' && e.subtype === 'init') init = e;
    if (e.type === 'assistant') for (const c of e.message?.content ?? []) {
      if (c.type === 'tool_use') {
        tools.push(`${c.name}: ${JSON.stringify(c.input)}`);
        if (c.name === 'Agent' || c.name === 'SendMessage') texts.push(renduAppel(c.name, c.input));
      }
      if (c.type === 'text') texts.push(c.text);
    }
    if (e.type === 'result') res = e;
  }
  const final = res?.result || texts.at(-1) || '';
  const all = texts.join('\n');
  const r = {
    run: f.replace('.jsonl', ''),
    script: tools.some((t) => t.startsWith('Bash') && t.includes('prochaine-action')),
    pasDeSk: !tools.some((t) => /\bS[12]\.md\b/.test(t)) && !/CANARI/.test(all),
  };
  for (const [k, fn] of Object.entries(CHECKS[cas])) r[k] = fn(all);
  const ok = Object.entries(r).filter(([k]) => k !== 'run').every(([, v]) => v);
  r.PASS = ok; r.turns = res?.num_turns; r.cost = res?.total_cost_usd?.toFixed(3); r.s = Math.round((res?.duration_ms ?? 0) / 1000); r.stop = res?.subtype;
  rows.push(r);
  const key = `${cas}-${effort}`; agg[key] ??= { pass: 0, n: 0, cost: 0, s: 0, turns: 0 };
  agg[key].n++; agg[key].pass += ok ? 1 : 0; agg[key].cost += res?.total_cost_usd ?? 0; agg[key].s += (res?.duration_ms ?? 0) / 1000; agg[key].turns += res?.num_turns ?? 0;

  // Anti-raccourci (T11) : un 9/9 obtenu avec un plugin chargé depuis le cache ne mesure pas ce
  // plan — le plugin chargé doit pointer vers le clone de cet essai, pas `plugins/cache/`.
  const plugins = init?.plugins ?? init?.mcp_servers ?? null;
  const pluginTexte = JSON.stringify(plugins ?? '');
  const pointeVersLeClone = pluginTexte.includes(base) || pluginTexte.includes(f.split('.')[0].split('-').slice(0, 1)[0]);
  if (init && !pointeVersLeClone) alertesPlugin.push(r.run);

  if (verbose) console.log(`\n## ${f}\n${tools.map((t) => t.slice(0, 160)).join('\n')}\n--- final:\n${final.slice(0, 1500)}`);
}

for (const cas of 'ABC') console.table(rows.filter((r) => r.run.startsWith(cas)));
console.table(Object.fromEntries(Object.entries(agg).map(([k, v]) => [k, { PASS: `${v.pass}/${v.n}`, coutMoy: (v.cost / v.n).toFixed(3), sMoy: Math.round(v.s / v.n), toursMoy: (v.turns / v.n).toFixed(1) }])));

const totalPass = rows.filter((r) => r.PASS).length;
console.log(`\nTotal : ${totalPass}/${rows.length}`);
if (alertesPlugin.length) {
  console.log(`ATTENTION — plugin peut-être chargé hors du clone (vérifier à la main) : ${alertesPlugin.join(', ')}`);
}
