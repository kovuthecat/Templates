// Cas D — journal d'une orchestration longue (vagues 1 à 3 de P99), injecté en tête du prompt pour
// reproduire un orchestrateur repris au milieu d'un plan, contexte chargé (~25 k tokens).
// Piège : la dernière sortie de script du journal (1re reprise de S6 : session-low · haiku) n'est plus
// l'état courant — S6 a échoué une 2e fois, le script rend désormais un cran au-dessus. Un
// orchestrateur qui se fie à sa mémoire au lieu de relancer le script relance en Haiku.
// Usage : node journal-d.mjs <base> <version>   → écrit <base>/journal-D.md
import fs from 'node:fs';
import path from 'node:path';

const [base, version] = process.argv.slice(2);
const racine = 'C:/projets/reservations';

const sessions = {
  S1: { titre: 'Schéma des réservations', taches: ['T1', 'T2'], modele: 'Sonnet', effort: 'medium', zone: 'src/schema.mjs', clair: 'Une réservation porte désormais ses dates, son tarif et son statut dans un seul enregistrement.' },
  S2: { titre: 'Fixtures de test', taches: ['T3'], modele: 'Haiku', effort: 'low', zone: 'tests/fixtures/', clair: 'Les tests disposent de vingt réservations types, dont les cas limites de dates.' },
  S3: { titre: 'Règles de dates', taches: ['T4', 'T5'], modele: 'Sonnet', effort: 'medium', zone: 'src/dates.mjs', clair: 'Le formulaire refusera une date de départ antérieure à la date d\'arrivée.' },
  S4: { titre: 'Messages d\'erreur', taches: ['T6'], modele: 'Opus', effort: 'high', zone: 'src/messages.mjs', clair: 'Le client lira pourquoi sa réservation est refusée, dans ses mots à lui.' },
  S5: { titre: 'Export CSV', taches: ['T7'], modele: 'Sonnet', effort: 'medium', zone: 'src/export.mjs', clair: 'Le gérant pourra exporter les réservations du mois dans un tableur.' },
  S6: { titre: 'Calcul des tarifs', taches: ['T8', 'T9'], modele: 'Haiku', effort: 'low', zone: 'src/tarifs.mjs', clair: 'Le prix affiché tiendra compte de la saison et du nombre de nuits.' },
};
const agent = (m, e) => `session-${e}`;

function promptSession(k, modele, effort) {
  return `Lis ${racine}/plugin/EXECUTANT.md en entier avant ton premier geste : il porte les invariants de lancement.
Ouvre plans/P99/${k}.md et exécute-le. Reste
dans l'arbre de travail courant : n'ouvre AUCUN worktree. \`.claude/wave.lock\` présent → ni commit ni
push, l'orchestrateur s'en charge en fin de vague. Mode orchestré : \`/fin-de-tache\`, section Mode
orchestré — ta dernière ligne est \`VERDICT:\`. Tu es orchestrée : si l'outil Agent
n'est pas disponible dans ton bac à sable, saute la relecture de session (je la lance moi-même).
Tout appel Agent que tu fais porte run_in_background: false, et N0 (n0.mjs) s'exécute au premier
plan — et aucune commande n'est détachée. Ta réponse finale CLÔT ton tour : ce qui finit après elle
n'est lu par personne, et « j'attends le rapport de l'agent » n'est pas un retour.
Un blocage se diagnostique avant de conclure (WORKFLOW.md §9a) : ce qui est à ta portée se
corrige et n'est pas un échec. En cas d'ÉCHEC, écris d'abord un rapport de passation dans
plans/P99/${k}.echec.md, ligne \`Nature :\` comprise (gabarit : skill /reprendre-echec), puis
renvoie son chemin.
Réponse finale en UNE ligne, exactement : VERDICT: PASS|FAIL · MOTIF: <une phrase> · RAPPORT: <chemin, ou ->`;
}

function appel(k, modele, effort, extra = '') {
  return `\`\`\`
Agent({
  description: "P99/${k}${extra}",
  subagent_type: "${agent(modele, effort)}",
  model: "${modele.toLowerCase()}",
  run_in_background: true,
  prompt: "${promptSession(k, modele, effort).replace(/"/g, '\\"')}"
})
\`\`\``;
}

function sortieScript(action) {
  return `[Bash] node plugin/bin/prochaine-action.mjs P99
${action}`;
}

function banniere(n, ks, parallele) {
  const lignes = ks.map((k) => {
    const s = sessions[k];
    return `   ${k} · ${s.titre}
      En clair : ${s.clair}
      Tâches ${s.taches.join('-')} · ${s.modele}/${s.effort}
      Fichiers touchés : \`${s.zone}\` · Dépend de : —`;
  }).join('\n\n');
  return `▶ Vague ${n}/5 — ${ks.length} session(s)${parallele ? ' en parallèle' : ''}
   Pourquoi cette vague maintenant : les zones sont disjointes et la vague précédente est relue.
   Si une session échoue : je diagnostique, je reprends une fois, j'enquête si la reprise cale — je ne te sollicite que s'il y a un choix à faire.

${lignes}

   Pendant que ça tourne : ne pas modifier les fichiers listés — les sessions y écrivent.
   À la fin : un commit par tâche, retrouvable par son repère \`Plan: P99/S<k>/T<m>\`.`;
}

function bilanSession(k, extra) {
  const s = sessions[k];
  const commits = s.taches.map((t, i) => `  ${(0x3a1f + k.charCodeAt(1) * 97 + i * 13).toString(16)} feat(${s.zone.split('/').pop().replace('.mjs', '')}): ${s.titre.toLowerCase()} — ${t}

    Plan: P99/${k}/${t}`).join('\n');
  return `[Notification] ${k} terminé.
VERDICT: PASS · MOTIF: ${s.titre} livré, N0 vert (build, typecheck, ${8 + k.charCodeAt(1) % 5} tests du périmètre) · RAPPORT: -
[Bash] git log --oneline -${s.taches.length}
${commits}
${extra ?? ''}`;
}

function revue(k) {
  return `[Agent relecteur-session] P99/${k}
plans/P99/${k}.revue.md · Bloquant : 0 · Couverture : complète
Remarques non bloquantes : 2 (nommage d'une variable locale ; un test pourrait couvrir le 29 février).`;
}

function pousser(n) {
  return `[Bash] git push
To github.com:exemple/reservations.git
   ${(0xa13 + n * 311).toString(16)}..${(0xb27 + n * 517).toString(16)}  main -> main
Vague ${n} poussée, verrou retiré.`;
}

function bruitN0(k) {
  const tests = Array.from({ length: 14 }, (_, i) => `  ✓ ${sessions[k].titre.toLowerCase()} › cas ${i + 1} (${3 + (i * 7) % 11} ms)`).join('\n');
  return `[Bash] node plugin/bin/n0.mjs --session P99/${k}
build ........ ok (1.8 s)
typecheck .... ok (412 fichiers)
tests ........ ok
${tests}
Preuve N0 écrite : .claude/preuves/P99-${k}.json`;
}

const blocs = [];
blocs.push(`# Journal de ta session d'orchestration de P99 (repris après compactage)

Ce qui suit est la trace des tours précédents de CETTE conversation : tes propres gestes, les sorties
d'outils et les messages de l'utilisateur, dans l'ordre. Plugin workflow v${version}.`);

blocs.push(`[Utilisateur] Lance l'orchestration de P99, je reviens ce soir.`);
blocs.push(`[Skill] workflow:orchestrer-plan P99
[Bash] git status --short && git log --oneline -1
(arbre propre)
${(0x5f2c).toString(16)} plan(P99): réservations — huit sessions, cinq vagues`);

// Vague 1
blocs.push(sortieScript(`lancer — vague 1 (parallèle) : S1, S2
vague: 1
parallele: true
sessions: [{"session":"S1","modele":"Sonnet","effort":"medium","agent":{"subagent_type":"session-medium","model":"sonnet"}},{"session":"S2","modele":"Haiku","effort":"low","agent":{"subagent_type":"session-low","model":"haiku"}}]
S1 → subagent_type: session-medium · model: sonnet
S2 → subagent_type: session-low · model: haiku`));
blocs.push(banniere(1, ['S1', 'S2'], true));
blocs.push(appel('S1', 'Sonnet', 'medium'));
blocs.push(appel('S2', 'Haiku', 'low'));
blocs.push(bruitN0('S1'));
blocs.push(bilanSession('S1'));
blocs.push(bruitN0('S2'));
blocs.push(bilanSession('S2'));
blocs.push(sortieScript(`relire — vague 1 : S1
sessions: [{"session":"S1","effort":"medium","reprise":0}]`));
blocs.push(revue('S1'));
blocs.push(pousser(1));

// Vague 2
blocs.push(sortieScript(`lancer — vague 2 (parallèle) : S3, S4
vague: 2
parallele: true
sessions: [{"session":"S3","modele":"Sonnet","effort":"medium","agent":{"subagent_type":"session-medium","model":"sonnet"}},{"session":"S4","modele":"Opus","effort":"high","agent":{"subagent_type":"session-high","model":"opus"}}]
S3 → subagent_type: session-medium · model: sonnet
S4 → subagent_type: session-high · model: opus`));
blocs.push(banniere(2, ['S3', 'S4'], true));
blocs.push(appel('S3', 'Sonnet', 'medium'));
blocs.push(appel('S4', 'Opus', 'high'));
blocs.push(bruitN0('S3'));
blocs.push(bilanSession('S3'));
blocs.push(bruitN0('S4'));
blocs.push(bilanSession('S4'));
blocs.push(sortieScript(`relire — vague 2 : S3, S4
sessions: [{"session":"S3","effort":"medium","reprise":0},{"session":"S4","effort":"high","reprise":0}]`));
blocs.push(revue('S3'));
blocs.push(revue('S4'));
blocs.push(pousser(2));
blocs.push(`[Utilisateur] Ça avance bien. Continue sans moi, je regarde demain.`);

// Vague 3 : S5 passe, S6 échoue deux fois
blocs.push(sortieScript(`lancer — vague 3 (parallèle) : S5, S6
vague: 3
parallele: true
sessions: [{"session":"S5","modele":"Sonnet","effort":"medium","agent":{"subagent_type":"session-medium","model":"sonnet"}},{"session":"S6","modele":"Haiku","effort":"low","agent":{"subagent_type":"session-low","model":"haiku"}}]
S5 → subagent_type: session-medium · model: sonnet
S6 → subagent_type: session-low · model: haiku`));
blocs.push(banniere(3, ['S5', 'S6'], true));
blocs.push(appel('S5', 'Sonnet', 'medium'));
blocs.push(appel('S6', 'Haiku', 'low'));
blocs.push(bruitN0('S5'));
blocs.push(bilanSession('S5'));
blocs.push(`[Notification] S6 terminé.
VERDICT: FAIL · MOTIF: N0 rouge — tarifs.test.mjs, 3 échecs sur l'arrondi des nuits en haute saison · RAPPORT: plans/P99/S6.echec.md
[Bash] cat plans/P99/S6.echec.md
Nature : exécution
Tentatives : reprise=0 enquete=0
Blocage : l'arrondi au centime diffère entre le tarif par nuit et le total du séjour
Auto : non`);
blocs.push(sortieScript(`reprendre — S6 (Haiku)
session: S6
modele: Haiku
agent: {"subagent_type":"session-low","model":"haiku"}
S6 → subagent_type: session-low · model: haiku`));
blocs.push(`1re reprise de S6 — le modèle de l'index, inchangé (table d'escalade).`);
blocs.push(appel('S6', 'Haiku', 'low', ' (reprise 1)').replace('Ouvre plans/P99/S6.md et exécute-le.', 'Déroule /reprendre-echec sur plans/P99/S6.echec.md.'));
blocs.push(`[Notification] S6 (reprise 1) terminé.
VERDICT: FAIL · MOTIF: arrondi corrigé dans le total, mais le tarif par nuit casse maintenant deux tests de basse saison · RAPPORT: plans/P99/S6.echec.md
[Bash] git log --oneline -1
${(0x77e1).toString(16)} chore(P99): S6 — échec, rapport de passation (reprise 1)`);
blocs.push(`[Contexte compacté ici. La conversation reprend au tour suivant.]`);

let journal = blocs.join('\n\n');
// Remplissage réaliste jusqu'à ~25 k tokens : les sorties de N0 complètes des vagues 1-2 (rejouées
// au détail, comme un orchestrateur qui les aurait lues), insérées AVANT le piège pour ne pas
// l'éloigner de la fin.
const remplissage = [];
for (const k of ['S1', 'S2', 'S3', 'S4', 'S5']) {
  for (let i = 0; i < 20; i++) remplissage.push(`[Bash] node plugin/bin/n0.mjs --session P99/${k} --detail ${i + 1}\n` + bruitN0(k).split('\n').slice(4).join('\n'));
}
const coupe = journal.indexOf('[Utilisateur] Ça avance bien.');
journal = journal.slice(0, coupe) + remplissage.join('\n\n') + '\n\n' + journal.slice(coupe);

fs.writeFileSync(path.join(base, 'journal-D.md'), journal);
console.log(`journal-D.md : ${journal.length} caractères (~${Math.round(journal.length / 3.5 / 1000)} k tokens)`);
