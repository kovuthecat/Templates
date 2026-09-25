#!/usr/bin/env node
// Régressions v0.48 : scripts réels, dépôts jetables, pas de modèle payant.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { verifierPreuve } from '../plugin/bin/preuve-n0.mjs';
const root = resolve(import.meta.dirname, '..');
const dirs = [];
let echecs = 0;
function cas(nom, fn) { try { fn(); console.log(`OK ${nom}`); } catch (e) { echecs++; console.error(`FAIL ${nom}: ${e.stack}`); } }
function git(d, ...a) { return execFileSync('git', a, { cwd:d, encoding:'utf8', stdio:'pipe' }).trim(); }
function put(d, p, s) { mkdirSync(resolve(d,p,'..'),{recursive:true}); writeFileSync(join(d,p),s); }
function commit(d, message='fixture') { git(d,'add','-A'); git(d,'commit','-qm',message); }
function run(d, script, ...args) { return spawnSync(process.execPath,[join(root,'plugin/bin',script),...args],{cwd:d,encoding:'utf8'}); }
function depot() {
 const d=mkdtempSync(join(tmpdir(),'wf-preuves-')); dirs.push(d); git(d,'init','-q');
 git(d,'config','user.name','Test'); git(d,'config','user.email','test@local');
 put(d,'.gitignore','.claude/n0/\n'); put(d,'src/a.mjs','export const a = 1;\n');
 put(d,'.claude/n0.json',JSON.stringify({commandes:[{nom:'syntax',cmd:'node --check src/a.mjs'}]}));
 commit(d); return d;
}
function index(d,{proof=false, first='[x]',third=false}={}) {
 put(d,'plans/P1/index.md',`# P1\nWorkflow : v0.48.0\n${proof?'Preuve N0 : requise\n':''}
## Sessions
| Session | Tâches | Titre | Modèle | Effort | Env. | Dépend de | Zone modifiée | Statut |
| S1 | T1 | A | Sonnet | medium | — | — | \`src/a.mjs\` | ${first} |
| S2 | T2 | B | Sonnet | medium | — | S1 | \`src/b.js\` | [ ] |
${third?'| S3 | T3 | C | Sonnet | medium | — | — | `src/c.js` | [ ] |':''}
## Ordonnancement
- **Vague 1** : S1.
- **Vague 2** : S2.
${third?'- **Vague 3** : S3.':''}
`);
}
function revue(d,content='Bloquant : 0\nCouverture : complète\nReprises : 0\nDépendances : libres\n') { put(d,'plans/P1/S1.revue.md',content); }
function action(d) {const r=run(d,'prochaine-action.mjs','P1','--json');assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
function preuve(d,args=[]) {const r=run(d,'n0.mjs','--session','P1/S1',...args);assert.equal(r.status,0,r.stdout+r.stderr);commit(d,'T1\n\nPlan: P1/S1/T1');}
cas('revue inachevée → une reprise, jamais assimilée à complète',()=>{const d=depot();index(d);revue(d,'Bloquant : 0\nCouverture : en cours\n');commit(d);assert.equal(action(d).action,'relire');assert.equal(action(d).sessions[0].reprise,1);});
cas('revue toujours inachevée après reprise → question',()=>{const d=depot();index(d);revue(d,'Bloquant : 0\nCouverture : en cours\nReprises : 1\n');commit(d);assert.equal(action(d).options.source,'revue-incomplete');});
cas('bloquant de prérequis → indépendante lancée, dépendante suspendue',()=>{const d=depot();index(d,{third:true});revue(d,'Bloquant : 1\nCouverture : complète\nDépendances : bloquées\n');commit(d);assert.deepEqual(action(d).sessions.map(s=>s.session),['S3']);});
cas('bloquant sans impact prérequis → dépendante lancée',()=>{const d=depot();index(d);revue(d,'Bloquant : 1\nCouverture : complète\nDépendances : libres\n');commit(d);assert.equal(action(d).sessions[0].session,'S2');});
cas('blocage prérequis sans session indépendante → question',()=>{const d=depot();index(d);revue(d,'Bloquant : 1\nCouverture : complète\n');commit(d);assert.equal(action(d).options.source,'dependance-revue');});
cas('preuve obligatoire absente malgré [x] → valider-n0',()=>{const d=depot();index(d,{proof:true});revue(d);commit(d);assert.equal(action(d).action,'valider-n0');});
cas('preuve complète commitée → passage moteur ; sessions suivantes ne la périment pas',()=>{const d=depot();index(d,{proof:true});revue(d);preuve(d);assert.equal(verifierPreuve(d,'P1/S1').ok,true);assert.equal(action(d).action,'lancer');put(d,'src/b.js','export const b=2;');commit(d,'Plan: P1/S2/T2');assert.equal(verifierPreuve(d,'P1/S1').ok,true);});
cas('preuve ciblée ne valide pas N0 complet',()=>{const d=depot();preuve(d,['--seulement','syntax']);assert.equal(verifierPreuve(d,'P1/S1').ok,false);});
cas('code changé entre N0 et commit → preuve périmée',()=>{const d=depot();assert.equal(run(d,'n0.mjs','--session','P1/S1').status,0);put(d,'src/a.mjs','export const a=2;');commit(d,'Plan: P1/S1/T1');assert.equal(verifierPreuve(d,'P1/S1').ok,false);});
cas('nouveau fichier entre N0 et commit → preuve périmée',()=>{const d=depot();assert.equal(run(d,'n0.mjs','--session','P1/S1').status,0);put(d,'src/new.js','export const x=1;');commit(d,'Plan: P1/S1/T1');assert.equal(verifierPreuve(d,'P1/S1').ok,false);});
cas('nouveau commit de tâche après preuve → refus',()=>{const d=depot();preuve(d);put(d,'src/a.mjs','export const a=2;');commit(d,'Plan: P1/S1/T1');assert.equal(verifierPreuve(d,'P1/S1').ok,false);});
cas('preuve modifiée sans commit → refus',()=>{const d=depot();preuve(d);put(d,'plans/P1/S1.n0.json',readFileSync(join(d,'plans/P1/S1.n0.json'),'utf8')+'\n');assert.equal(verifierPreuve(d,'P1/S1').ok,false);});
cas('N0 rouge écrase la preuve verte et interdit PASS',()=>{const d=depot();preuve(d);put(d,'src/a.mjs','export const a=;');const r=run(d,'n0.mjs','--session','P1/S1');assert.equal(r.status,1,r.stdout+r.stderr);commit(d,'Plan: P1/S1/T1');assert.equal(verifierPreuve(d,'P1/S1').ok,false);});
cas('entrées modifiées par la commande → FAIL malgré exit 0',()=>{const d=depot();put(d,'muter.mjs',"import{writeFileSync}from'node:fs';writeFileSync('src/a.mjs','export const a=2;');");put(d,'.claude/n0.json',JSON.stringify({commandes:[{nom:'muter',cmd:'node muter.mjs'}]}));assert.equal(run(d,'n0.mjs','--session','P1/S1').status,1);});
cas('configuration modifiée entre N0 et commit → refus',()=>{const d=depot();assert.equal(run(d,'n0.mjs','--session','P1/S1').status,0);put(d,'.claude/n0.json',JSON.stringify({commandes:[{nom:'autre',cmd:'node --check src/a.mjs'}]}));commit(d,'Plan: P1/S1/T1');assert.equal(verifierPreuve(d,'P1/S1').ok,false);});
cas('session mal formée ne peut écrire hors plans',()=>{const d=depot();assert.equal(run(d,'n0.mjs','--session','../x').status,2);});
function planValide(d){
 index(d,{proof:true,first:'[ ]'});
 put(d,'plans/P1/S1.md','### Objectif\nA\n### Lire / Modifier\n- Modifier : `src/a.mjs`\n### Validation\nN0 auto : `node n0.mjs` → PASS\n');
 put(d,'plans/P1/S2.md','### Objectif\nB\n### Lire / Modifier\n- Lire : `src/a.mjs`\n- Modifier : `src/b.js` (créer)\n### Validation\nN0 auto : `node n0.mjs` → PASS\n');
}
function ecarts(d){const r=run(d,'verifier-plan.mjs','P1','--json');assert.ok([0,1].includes(r.status),r.stderr);return JSON.parse(r.stdout);}
cas('plan canonique valide → RAS',()=>{const d=depot();planValide(d);assert.equal(ecarts(d).resultat,'RAS');});
cas('chemin inexistant non déclaré créé → écart',()=>{const d=depot();planValide(d);put(d,'plans/P1/S2.md',readFileSync(join(d,'plans/P1/S2.md'),'utf8').replace(' (créer)',''));assert.ok(ecarts(d).erreurs.some(e=>e.motif.includes('absent sans création')));});
cas('dépendance inexistante → écart',()=>{const d=depot();planValide(d);put(d,'plans/P1/index.md',readFileSync(join(d,'plans/P1/index.md'),'utf8').replace('| S1 | `src/b.js`','| S9 | `src/b.js`'));assert.ok(ecarts(d).erreurs.some(e=>e.controle===4));});
cas('écritures parallèles même fichier → écart',()=>{const d=depot();planValide(d);put(d,'plans/P1/index.md',readFileSync(join(d,'plans/P1/index.md'),'utf8').replace('- **Vague 1** : S1.\n- **Vague 2** : S2.','- **Vague 1 — parallélisable** : S1 · S2.'));put(d,'plans/P1/S2.md',readFileSync(join(d,'plans/P1/S2.md'),'utf8').replace('`src/b.js` (créer)','`src/a.mjs`'));assert.ok(ecarts(d).erreurs.some(e=>e.controle===2));});
cas('settings édités → écart 12',()=>{const d=depot();planValide(d);put(d,'plans/P1/S2.md',readFileSync(join(d,'plans/P1/S2.md'),'utf8')+'\n- Modifier : `.claude/settings.json` (créer)\n');assert.ok(ecarts(d).erreurs.some(e=>e.controle===12));});
cas('format de fichiers ambigu → signalé, pas RAS',()=>{const d=depot();planValide(d);put(d,'plans/P1/S1.md','### Objectif\nA\n### Lire / Modifier\n`src/a.mjs`\n### Validation\nN0 auto : `node n0.mjs`');assert.equal(ecarts(d).resultat,'ECART');});
cas('normalisation CRLF Git → preuve valide',()=>{const d=depot();git(d,'config','core.autocrlf','true');put(d,'src/a.mjs','export const a=1;\r\n');preuve(d);assert.equal(verifierPreuve(d,'P1/S1').ok,true);});
cas('checkout CRLF de la preuve reste valide',()=>{const d=depot();git(d,'config','core.autocrlf','true');preuve(d);rmSync(join(d,'plans/P1/S1.n0.json'));git(d,'checkout','--','plans/P1/S1.n0.json');assert.equal(verifierPreuve(d,'P1/S1').ok,true);});
cas('revue mal formée → reprise, jamais complète',()=>{const d=depot();index(d);revue(d,'rapport incomplet');commit(d);assert.equal(action(d).action,'relire');});
cas('forme mixte de chemins ne cache pas settings',()=>{const d=depot();planValide(d);put(d,'plans/P1/S2.md',readFileSync(join(d,'plans/P1/S2.md'),'utf8')+'\n- **Modifier** : `.claude/settings.json`\n');assert.equal(ecarts(d).resultat,'ECART');});
cas('validation absente de T2 détectée même avec T1 valide',()=>{const d=depot();planValide(d);put(d,'plans/P1/S1.md','## T1 — A\n'+readFileSync(join(d,'plans/P1/S1.md'),'utf8')+'\n## T2 — B\n### Objectif\nB\n');assert.ok(ecarts(d).erreurs.some(e=>e.controle===3));});
cas('extension ancien plan ne force pas preuve N0',()=>{const d=depot();planValide(d);put(d,'plans/P1/index.md',readFileSync(join(d,'plans/P1/index.md'),'utf8').replace('Preuve N0 : requise\n',''));assert.equal(run(d,'verifier-plan.mjs','P1','--extension').status,0);});
cas('vague partiellement bloquée : revue de la session livrée avant la suivante',()=>{
 const d=depot();index(d,{third:true});let texte=readFileSync(join(d,'plans/P1/index.md'),'utf8');
 texte=texte.replace('| S3 | T3 | C | Sonnet | medium | — | — | `src/c.js` | [ ] |','| S3 | T3 | C | Sonnet | medium | — | — | `src/c.js` | [x] |\n| S4 | T4 | D | Sonnet | medium | — | S3 | `src/d.js` | [ ] |');
 texte=texte.replace('- **Vague 2** : S2.\n- **Vague 3** : S3.','- **Vague 2** : S2 · S3.\n- **Vague 3** : S4.');
 put(d,'plans/P1/index.md',texte);revue(d,'Bloquant : 1\nCouverture : complète\nDépendances : bloquées\n');commit(d);
 assert.equal(action(d).action,'relire');assert.equal(action(d).sessions[0].session,'S3');
});
for(const d of dirs) rmSync(d,{recursive:true,force:true});
console.log(`${echecs} échec(s)`); process.exitCode=echecs?1:0;
