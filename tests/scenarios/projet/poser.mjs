// Pose un passage : l'instantané du plugin, le mini-projet vendoré, le dépôt nu `origin`, puis
// l'ÉTAT du scénario — et vérifie la première action du moteur AVANT tout `claude -p`.
// Règle (même que tests/evals-orchestrateur/poser-cas.sh) : une première action autre que l'attendue
// est une fixture à corriger, jamais un attendu à ajuster.
import { execFileSync } from 'node:child_process';
import {
  cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, appendFileSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLANS, indexMd, sessionMd, opsApres, testApres } from './plan.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
export const DEPOT = resolve(ICI, '..', '..', '..');

/** Première action attendue du moteur, par scénario (`prochaine-action.mjs P1 --json`). */
export const ATTENDU = {
  nominal: { action: 'lancer', session: 'S1' },
  'echec-reprise': { action: 'reprendre', session: 'S1' },
  interruption: { action: 'relancer-interrompue', session: 'S1' },
  'revue-incomplete': { action: 'relire', session: 'S1' },
};
export const SCENARIOS = Object.keys(ATTENDU);

const DATE = '2026-10-14';

/** Environnement git isolé : config globale jetable, jamais celle de l'hôte (un agent Haiku a un jour
 * écrit dans `~/.gitconfig` pendant une mesure). */
export function envGit(dossierPassage) {
  return { ...process.env, GIT_CONFIG_GLOBAL: join(dossierPassage, 'gitconfig-jetable'), GIT_TERMINAL_PROMPT: '0' };
}

function lancerGit(cwd, env, ...args) {
  return execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

function node(cwd, env, ...args) {
  return execFileSync(process.execPath, args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

function ecrire(chemin, texte) {
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, texte, 'utf8');
}

/** Copie de `plugin/` hors du mini-projet et hors du dépôt : ce que `--plugin-dir` charge. Les
 * `node_modules` n'en fait pas partie. */
function instantane(destination) {
  cpSync(join(DEPOT, 'plugin'), destination, {
    recursive: true,
    filter: (src) => !/[\\/]node_modules([\\/]|$)/.test(src),
  });
}

/** `settings.json` du mini-projet : le socle de permissions du gabarit vendoré. Les hooks n'y sont
 * PAS câblés : ils viennent du plugin chargé par `--plugin-dir` (sinon chacun tournerait deux fois). */
export function settingsProjet(snapshot) {
  const gabarit = JSON.parse(readFileSync(join(snapshot, 'templates', 'project-settings.json'), 'utf8'));
  const propre = {};
  for (const [cle, valeur] of Object.entries(gabarit)) {
    if (cle === 'hooks' || cle === 'outputStyle' || cle === '_comment_hooks' || cle === '_comment_outputStyle') continue;
    propre[cle] = valeur;
  }
  return JSON.stringify(propre, null, 2) + '\n';
}

function commit(cwd, env, message, ...chemins) {
  lancerGit(cwd, env, 'add', '--', ...chemins);
  lancerGit(cwd, env, 'commit', '-q', '-m', message);
}

function actionMoteur(projet, env, ...extra) {
  const sortie = node(projet, env, '.claude/workflow/bin/prochaine-action.mjs', 'P1', '--json', ...extra);
  return JSON.parse(sortie);
}

/** Pose le passage. Rend `{ projet, origin, snapshot, premiere, faitesInitiales, constats }`. */
export function poser({ scenario, dossier }) {
  if (!ATTENDU[scenario]) throw new Error(`scénario inconnu : ${scenario} (${SCENARIOS.join(', ')})`);
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, 'gitconfig-jetable'), '');
  const env = envGit(dossier);
  const snapshot = join(dossier, 'plugin');
  const projet = join(dossier, 'projet');
  const origin = join(dossier, 'origin.git');
  const constats = [];

  instantane(snapshot);
  const version = JSON.parse(readFileSync(join(snapshot, '.claude-plugin', 'plugin.json'), 'utf8')).version;

  // 1. Fichiers de base, puis le workflow VENDORÉ comme dans un vrai projet.
  cpSync(join(ICI, 'base'), projet, { recursive: true });
  node(DEPOT, env, join(snapshot, 'bin', 'sync-workflow.mjs'), '--source', snapshot, '--projet', projet, '--ignorer-cache');
  ecrire(join(projet, '.claude', 'settings.json'), settingsProjet(snapshot));

  // 2. Le plan P1 du scénario (fait du scénario lui-même, pas du moteur).
  const sessions = PLANS[scenario];
  ecrire(join(projet, 'plans', 'P1', 'index.md'), indexMd(scenario, version));
  for (const s of sessions) ecrire(join(projet, 'plans', 'P1', `S${s.k}.md`), sessionMd(scenario, s.k));

  // 3. Dépôt, `origin` nu local avec son amont : sans lui chaque push échouerait et compterait comme
  // une intervention (exception n°1 au README du banc du premier geste).
  lancerGit(dossier, env, 'init', '-q', '--bare', '-b', 'main', origin);
  lancerGit(projet, env, 'init', '-q', '-b', 'main');
  for (const [cle, valeur] of [['user.name', 'scenario'], ['user.email', 'scenario@localhost'], ['core.autocrlf', 'false']]) {
    lancerGit(projet, env, 'config', cle, valeur);
  }
  lancerGit(projet, env, 'remote', 'add', 'origin', origin.replaceAll('\\', '/'));
  lancerGit(projet, env, 'add', '-A');
  lancerGit(projet, env, 'commit', '-q', '-m', 'chore: mini-projet jetable, workflow vendoré');
  lancerGit(projet, env, 'push', '-q', '-u', 'origin', 'main');

  // 4. L'état du scénario.
  const faitesInitiales = [];
  const t1 = () => {
    writeFileSync(join(projet, 'src', 'ops.mjs'), opsApres([1]));
    writeFileSync(join(projet, 'test.mjs'), testApres([1]));
  };

  if (scenario === 'echec-reprise') {
    // T1 commitée avec un test ROUGE (doubler() rend n + 2), puis le rapport d'échec de la session.
    writeFileSync(join(projet, 'src', 'ops.mjs'), opsApres([1], { bogue: true }));
    writeFileSync(join(projet, 'test.mjs'), testApres([1]));
    commit(projet, env, 'feat(ops): doubler(n)\n\nPlan: P1/S1/T1', 'src/ops.mjs', 'test.mjs');
    ecrire(join(projet, 'plans', 'P1', 'S1.echec.md'), `# S1 — échec du ${DATE}

Nature : exécution
Tentatives : reprise=0 enquete=0
Blocage : corriger doubler() dans src/ops.mjs (elle rend n + 2 au lieu de n * 2), puis relancer N0
Auto : non

## Tâche visée
T1 — ajouter doubler() à src/ops.mjs et son cas de test dans test.mjs.

## Où ça a cassé
\`node test.mjs\` : FAIL doubler 6 — Expected values to be strictly equal: 5 !== 6

## Ce qu'il faudrait pour que ça passe
Corriger le corps de doubler() (n * 2), relancer \`node test.mjs\` puis N0 complet avec \`--session P1/S1\`.

## État laissé derrière
- Fichiers modifiés non commités : aucun
- Migration/build/artefact à demi fait : non
- **Faut-il annuler quelque chose avant de reprendre ?** non

## Déjà écarté
- Rien d'écarté : l'erreur est de lecture directe dans la sortie du test.

## Hypothèse en cours
Le corps de doubler() est faux (n + 2) ; le corriger suffit.
`);
    commit(projet, env, `chore(plan): S1 en échec, rapport de passation\n\nPlan: P1/S1`, 'plans/P1/S1.echec.md');
    lancerGit(projet, env, 'push', '-q');
  } else if (scenario === 'interruption') {
    // T1 commitée ; T2 amorcée, non commitée. Aucun rapport de la session elle-même.
    t1();
    commit(projet, env, 'feat(ops): doubler(n)\n\nPlan: P1/S1/T1', 'src/ops.mjs', 'test.mjs');
    lancerGit(projet, env, 'push', '-q');
    // Constat : l'état tel que décrit au plan (sans rapport d'échec) rend `lancer`, pas
    // `relancer-interrompue` — le moteur ne rend cette action que sur un rapport `Nature :
    // interruption`, que l'orchestrateur écrit lui-même à la coupure (`orchestrer-plan/SKILL.md`,
    // « Coupure par quota »). L'état posé porte donc ce rapport.
    const sans = actionMoteur(projet, env);
    constats.push(`sans rapport d'interruption le moteur rend « ${sans.action} », pas « relancer-interrompue » : l'état posé inclut le rapport que l'orchestrateur écrit à la coupure par quota`);
    ecrire(join(projet, 'plans', 'P1', 'S1.echec.md'), `# S1 — échec du ${DATE}

Nature : interruption
Tentatives : reprise=0 enquete=0
Blocage : coupure par quota pendant T2
Agent : a0000000000000000
`);
    commit(projet, env, 'chore(plan): S1 interrompue par quota\n\nPlan: P1/S1', 'plans/P1/S1.echec.md');
    lancerGit(projet, env, 'push', '-q');
    // Travail partiel de T2, laissé dans l'arbre (non commité) : la fonction sans son cas de test.
    writeFileSync(join(projet, 'src', 'ops.mjs'), opsApres([1, 2]));
  } else if (scenario === 'revue-incomplete') {
    // S1 faite : code, preuve N0 complète et statut cochés dans le commit de la tâche ; revue
    // déposée sans `Couverture :`.
    t1();
    ecrire(join(projet, 'plans', 'P1', 'index.md'), indexMd(scenario, version, { cochees: [1] }));
    const sortieN0 = node(projet, env, '.claude/workflow/bin/n0.mjs', '--session', 'P1/S1');
    constats.push(`N0 de pose : ${sortieN0.trim().split('\n').join(' · ')}`);
    commit(projet, env, 'feat(ops): doubler(n)\n\nPlan: P1/S1/T1', 'src/ops.mjs', 'test.mjs', 'plans/P1/index.md', 'plans/P1/S1.n0.json');
    ecrire(join(projet, 'plans', 'P1', 'S1.revue.md'), 'Bloquant : 0\n');
    commit(projet, env, 'revue(P1): S1 relue, 0 bloquant(s)\n\nPlan: P1/S1', 'plans/P1/S1.revue.md');
    lancerGit(projet, env, 'push', '-q');
    faitesInitiales.push('S1');
  }
  // nominal : plan neuf, rien à ajouter au commit initial.

  // 5. Vérification de la première action du moteur — avant tout `claude`.
  const premiere = actionMoteur(projet, env);
  const attendu = ATTENDU[scenario];
  const ok = premiere.action === attendu.action &&
    (premiere.session ?? premiere.sessions?.[0]?.session) === attendu.session;
  if (!ok) {
    throw new Error(
      `fixture non conforme (${scenario}) : le moteur rend « ${premiere.action} ${premiere.session ?? premiere.sessions?.map((s) => s.session).join(',') ?? ''} », ` +
      `attendu « ${attendu.action} ${attendu.session} » — corriger la fixture, pas l'attendu.`,
    );
  }

  const meta = { scenario, version, premiere, faitesInitiales, constats, pose: new Date().toISOString() };
  writeFileSync(join(dossier, 'pose.json'), JSON.stringify(meta, null, 2) + '\n');
  return { projet, origin, snapshot, ...meta };
}

/** Trace d'un fichier de journal du passage (lisible à la main pendant la mise au point). */
export function journaliser(dossier, ligne) {
  appendFileSync(join(dossier, 'journal.txt'), `${new Date().toISOString()} ${ligne}\n`);
}

