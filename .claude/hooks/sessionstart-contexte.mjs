// Hook SessionStart — rend visible la dérive du contexte au lieu de la laisser se découvrir
// trois semaines plus tard. N'écrit RIEN si tout est sain (coût token nul dans le cas nominal).

import {
  lireEntree, repertoireProjet, estUnDepot, git, depassements, vagueParallele, repondre, riendafaire,
} from './lib.mjs';

const entree = await lireEntree();
const cwd = repertoireProjet(entree);

if (!estUnDepot(cwd)) riendafaire();

const lignes = [];

if (vagueParallele(cwd)) {
  lignes.push(
    '**Vague parallèle en cours** (`.claude/wave.lock`) : ne touche ni STATUS.md, ni TASKS.md, ' +
    "ni plans/P*/index.md ; ni commit ni push (ils sont bloqués par hook)."
  );
}

const dernierStatus = git(cwd, 'log', '-1', '--format=%H', '--', 'STATUS.md');
if (dernierStatus) {
  const retard = git(cwd, 'rev-list', '--count', `${dernierStatus}..HEAD`);
  if (retard && Number(retard) >= 3) {
    lignes.push(`**STATUS.md a ${retard} commits de retard** — vérifie qu'il décrit encore l'état réel.`);
  }
}

for (const d of depassements(cwd)) {
  lignes.push(`**${d.fichier} : ${d.lignes}/${d.plafond} lignes** — archivage dû (/purge-contexte).`);
}

if (lignes.length === 0) riendafaire();

repondre({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: `État du contexte projet (hook workflow) :\n- ${lignes.join('\n- ')}`,
  },
});
