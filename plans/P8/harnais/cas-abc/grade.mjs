import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const out = path.join(here, 'out');
const verbose = process.argv.includes('-v');

const ISSUES = [
  'Typer parseDate en `Date | null` et traiter null chez les trois appelants — deux fichiers de plus hors zone.',
  'Garder `Date` et lever une exception sur entrée invalide — change le contrat public de src/a.mjs.',
  'Reporter T2 et livrer T1 seule — la validation des dates reste partielle.',
];
const CHECKS = {
  A: {
    annonce: (t) => /▶\s*Vague 1/.test(t),
    enClairS1: (t) => t.includes("Le formulaire refusera une date de départ antérieure à la date d'arrivée."),
    enClairS2: (t) => t.includes('Le client lira pourquoi sa réservation est refusée, dans ses mots à lui.'),
    agentLow: (t) => /session-low/.test(t),
    agentHigh: (t) => /session-high/.test(t),
    modeles: (t) => /model:\s*"?opus/i.test(t) && /model:\s*"?sonnet/i.test(t),
  },
  B: {
    agentHigh: (t) => /subagent_type:\s*"(workflow:)?session-high"/.test(t),
    opus: (t) => /model:\s*"?opus/i.test(t),
    reprendreEchec: (t) => /reprendre-echec/.test(t) && /plans\/P9\/S1\.echec\.md/.test(t),
    pasCanalCourt: (t) => !/SendMessage\(\{/.test(t),
    pasFork: (t) => !/subagent_type:\s*"fork"/.test(t),
  },
  C: {
    format: (t) => /❓\s*P9\/S1/.test(t),
    issue1: (t) => t.includes(ISSUES[0]),
    issue2: (t) => t.includes(ISSUES[1]),
    issue3: (t) => t.includes(ISSUES[2]),
    reco: (t) => /Ma recommandation/.test(t),
    lancable: (t) => /reste lançable[^\n]*:\s*\**rien/i.test(t),
  },
};

const rows = [], agg = {};
for (const f of fs.readdirSync(out).filter((f) => f.endsWith('.jsonl')).sort()) {
  const [cas, , effort] = f.replace('.jsonl', '').split('-');
  const ev = fs.readFileSync(path.join(out, f), 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const tools = [], texts = [];
  let res = null;
  for (const e of ev) {
    if (e.type === 'assistant') for (const c of e.message?.content ?? []) {
      if (c.type === 'tool_use') tools.push(`${c.name}: ${JSON.stringify(c.input)}`);
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
  if (verbose) console.log(`\n## ${f}\n${tools.map((t) => t.slice(0, 160)).join('\n')}\n--- final:\n${final.slice(0, 1500)}`);
}
for (const cas of 'ABC') console.table(rows.filter((r) => r.run.startsWith(cas)));
console.table(Object.fromEntries(Object.entries(agg).map(([k, v]) => [k, { PASS: `${v.pass}/${v.n}`, coutMoy: (v.cost / v.n).toFixed(3), sMoy: Math.round(v.s / v.n), toursMoy: (v.turns / v.n).toFixed(1) }])));
