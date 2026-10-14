// Tests du mini-projet : aucune dépendance, un cas par ligne de `cas`.
import assert from 'node:assert/strict';
import { add } from './src/ops.mjs';

const cas = [
  ['add 1 + 2', () => assert.equal(add(1, 2), 3)],
];

let rouge = 0;
for (const [nom, verifier] of cas) {
  try {
    verifier();
    console.log(`ok   ${nom}`);
  } catch (e) {
    rouge++;
    console.log(`FAIL ${nom} — ${String(e.message).split('\n')[0]}`);
  }
}
process.exit(rouge === 0 ? 0 : 1);
