#!/usr/bin/env node
// Instrument de la preuve P14 : lit les transcriptions de session (.jsonl) de Claude Code.
//   --attendre --prompt "<texte>" --depuis <ms epoch> --max <s>   trouve la transcription d'une session lancée
//   --lire <fichier>                                              une ligne par requête + résumé
// Aucune dépendance.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const flag = (n) => argv.includes(n);

const racine = path.join(os.homedir(), '.claude', 'projects');

function enregistrements(fichier) {
  const out = [];
  for (const l of fs.readFileSync(fichier, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { out.push(JSON.parse(l)); } catch { /* ligne tronquée en cours d'écriture */ }
  }
  return out;
}

function texteUser(r) {
  const c = r?.message?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map((b) => (b.type === 'text' ? b.text : '')).join('\n');
  return '';
}

function estToolResult(r) {
  const c = r?.message?.content;
  return Array.isArray(c) && c.some((b) => b.type === 'tool_result');
}

function trouveEffort(o) {
  if (o && typeof o === 'object') {
    if (typeof o.effort === 'string') return o.effort;
    for (const v of Object.values(o)) { const e = trouveEffort(v); if (e) return e; }
  }
  return undefined;
}

function tousJsonl() {
  const r = [];
  if (!fs.existsSync(racine)) return r;
  for (const d of fs.readdirSync(racine)) {
    const dir = path.join(racine, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.jsonl')) r.push(path.join(dir, f));
  }
  return r;
}

function candidat(fichier, prompt, depuis) {
  let recs;
  try { recs = enregistrements(fichier); } catch { return false; }
  const premier = recs.find((r) => r.timestamp);
  if (!premier || Date.parse(premier.timestamp) < depuis) return false;
  const users = recs.filter((r) => r.type === 'user' && !estToolResult(r)).slice(0, 3);
  return users.some((u) => texteUser(u).includes(prompt));
}

const dort = (ms) => new Promise((r) => setTimeout(r, ms));

async function attendre() {
  const prompt = opt('--prompt');
  const depuis = Number(opt('--depuis'));
  const max = Number(opt('--max') ?? 600);
  if (!prompt || !depuis) { console.error('usage: --attendre --prompt <texte> --depuis <ms> --max <s>'); process.exit(2); }
  const fin = Date.now() + max * 1000;
  while (Date.now() < fin) {
    for (const f of tousJsonl()) {
      if (!candidat(f, prompt, depuis)) continue;
      const recs = enregistrements(f);
      const verdict = recs.some((r) => r.type === 'assistant' && JSON.stringify(r.message?.content ?? '').includes('VERDICT:'));
      if (verdict) { console.log(f); process.exit(0); }
    }
    await dort(10000);
  }
  console.log('délai');
  process.exit(1);
}

function lire(fichier) {
  const recs = enregistrements(fichier);
  const requetes = new Map(); // message.id -> { rang, model, effort, ou, cache, outils }
  recs.forEach((r, i) => {
    if (r.type !== 'assistant' || !r.message) return;
    const id = r.message.id ?? `sans-id-${i}`;
    let q = requetes.get(id);
    if (!q) {
      q = { model: '', effort: undefined, ou: '', cache: undefined, outils: [] };
      requetes.set(id, q);
    }
    if (r.message.model && !q.model) q.model = r.message.model;
    const cc = r.message.usage?.cache_creation_input_tokens;
    if (typeof cc === 'number' && (q.cache === undefined || cc > q.cache)) q.cache = cc;
    if (!q.effort) {
      let e = trouveEffort(r);
      if (e) q.ou = 'enregistrement assistant';
      else { e = i > 0 ? trouveEffort(recs[i - 1]) : undefined; if (e) q.ou = 'enregistrement précédent'; }
      if (e) q.effort = e;
    }
    for (const b of r.message.content ?? []) if (b.type === 'tool_use') q.outils.push(b.name);
  });
  console.log('rang\tmodel\teffort\tcache_creation\toutils\t(effort trouvé dans)');
  let rang = 0;
  const caches = [];
  const outils = new Set();
  for (const q of requetes.values()) {
    rang++;
    caches.push(q.cache ?? 0);
    q.outils.forEach((o) => outils.add(o));
    console.log([rang, q.model || '—', q.effort ?? '—', q.cache ?? '—', q.outils.join(',') || '—', q.ou || '—'].join('\t'));
  }
  const tours = recs.filter((r) => r.type === 'user' && !estToolResult(r)).length;
  const reste = caches.slice(1);
  const rapport = caches[0] > 0 && reste.length ? Math.max(...reste) / caches[0] : undefined;
  console.log(`requêtes: ${rang} · tours: ${tours} · outils: ${[...outils].join(',') || '—'}`);
  console.log(`rapport max(cache 2..n)/cache 1: ${rapport === undefined ? '—' : rapport.toFixed(3)}`);
  if (!rang) process.exit(1);
}

if (flag('--attendre')) await attendre();
else if (opt('--lire')) lire(opt('--lire'));
else { console.error('usage: --attendre … | --lire <fichier>'); process.exit(2); }
