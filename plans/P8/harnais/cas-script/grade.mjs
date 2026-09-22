import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const out = path.join(here, process.argv[2] ?? 'out2');
const verbose = process.argv.includes('-v');
const rows = [];
for (const f of fs.readdirSync(out).filter(f => f.endsWith('.jsonl')).sort()) {
  const ev = fs.readFileSync(path.join(out, f), 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const tools = [], texts = [], results = {};
  let res = null;
  for (const e of ev) {
    if (e.type === 'assistant') for (const c of e.message?.content ?? []) {
      if (c.type === 'tool_use') tools.push({ id: c.id, name: c.name, input: JSON.stringify(c.input) });
      if (c.type === 'text') texts.push(c.text);
    }
    if (e.type === 'user') for (const c of e.message?.content ?? []) if (c.type === 'tool_result') results[c.tool_use_id] = JSON.stringify(c.content);
    if (e.type === 'result') res = e;
  }
  const scriptCalls = tools.filter(t => t.name === 'Bash' && t.input.includes('prochaine-action'));
  const scriptSaid = scriptCalls.some(t => /verifier-premisse/.test(results[t.id] ?? ''));
  const final = res?.result || texts.at(-1) || '';
  const answer = /verifier-premisse/.test(final) && /\bS2\b/.test(final);
  const wrong = /\b(reprendre|enqueter|question|lancer-vague|pousser)\b/.test(final.split('\n').slice(0, 6).join(' '));
  rows.push({ run: f.replace('.jsonl', ''), script: scriptCalls.length > 0, scriptOK: scriptSaid, answer, PASS: scriptCalls.length > 0 && answer, turns: res?.num_turns, cost: res?.total_cost_usd?.toFixed(3), s: Math.round((res?.duration_ms ?? 0) / 1000), stop: res?.subtype, nTools: tools.length });
  if (verbose) console.log(`\n## ${f}\n${tools.map(t => `${t.name}: ${t.input.slice(0, 140)}`).join('\n')}\n--- final:\n${final.slice(0, 700)}`);
}
console.table(rows);
