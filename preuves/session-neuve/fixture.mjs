// Fixture de la preuve P15 : écrit un témoin de travail pour la session de test A ou B.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const i = process.argv.indexOf('--session');
const s = i === -1 ? undefined : process.argv[i + 1];
if (s !== 'A' && s !== 'B') {
  console.error('usage: node preuves/session-neuve/fixture.mjs --session <A|B>');
  process.exit(2);
}
const dir = join('plans', 'P95', 'sorties');
mkdirSync(dir, { recursive: true });
const ligne = { session: s, iso: new Date().toISOString(), pid: process.pid, cwd: process.cwd() };
writeFileSync(join(dir, `${s}.travail`), JSON.stringify(ligne) + '\n');
console.log(`fixture ${s} ok`);
