#!/usr/bin/env node
// Moteur d'actions d'un plan — contrat C2 complet
// (docs/decisions/2026-09-17-autonomie-par-defaut-etat-scripte-push-par-session.md). S2 a écrit la
// moitié « lecture » (l'état) ; S10 ajoute la moitié « décision » (quoi faire ensuite), sur les
// tables de `plugin/skills/orchestrer-plan/references/remediation.md` reprises telles quelles.
//
// POURQUOI CE FICHIER EXISTE
// Budget, table nature → modèle, dépendances et recoupement par les commits sont déterministes ;
// les faire suivre en prose par un modèle est la première source d'erreurs d'aiguillage, payées en
// sessions Opus (P6/S10). Un moteur écrit sur un parseur non éprouvé se débogue deux fois : le
// parseur d'index (ci-dessous, inchangé depuis S2) reste couvert par des fixtures copiées d'index
// réels (tests/fixtures/plans/).
//
// USAGE
//   node plugin/bin/prochaine-action.mjs P<n> [--json]        → une action (ce que fait l'orchestrateur)
//   node plugin/bin/prochaine-action.mjs P<n> --etat [--json] → seulement l'état dérivé (diagnostic)
//   node .claude/workflow/bin/prochaine-action.mjs P<n> [--json]   (projet vendoré)
//
// LECTURE SEULE. L'état se dérive de deux sources, et d'elles seules :
//   - l'ARBRE DE TRAVAIL (commité ou non — le code lit le disque, pour de bonnes raisons : rapport
//     d'échec pas encore commité) : la table, l'ordonnancement et les statuts `[x]` de
//     `plans/P<n>/index.md`, les lignes mécaniques de `plans/P<n>/S<k>.echec.md`, les lignes
//     `Bloquant :` / `Couverture :` / `Reprises :` de `plans/P<n>/S<k>.revue.md` ;
//   - GIT : les commits de tâche (repères `Plan: P<n>/S<k>/T<m>`), les versions commitées des
//     `.echec.md` (compteurs, ligne `Premisse :`, y compris supprimés au PASS), une revue ajoutée puis
//     supprimée, l'avance/retard sur l'amont, l'historique partiel (clone `--depth`).
// Jamais un état deviné : un index illisible rend une erreur nommée ; un historique partiel qu'on ne
// peut pas compléter rend une `question` (source `historique-partiel`) sans rien conclure.
//
// SORTIE : chaque action porte un champ `texte` (P20/S5/T8) : le texte FINAL à relayer tel quel —
// annonce de vague (`lancer`), question avec ses options et « reste lançable » calculé (`question`),
// rapport tiré du disque (`fini`), une phrase pour les autres. Sa première ligne est celle d'avant
// (`<action> — …` ; `pousser`, `fini`, `cloturer` nus) : c'est ce que lisent `noter.mjs` et les mods.
// Avec --json, l'objet (champ `texte` compris) ; sans --json, le `texte`, puis — pour la skill qui
// lit encore les champs — une ligne `— données de l'action …` et les champs de l'action. Code 0
// si l'index a pu être lu (quel que soit l'état des sessions qu'il décrit), 2 si l'index est
// illisible ou si le plan est absent.
//
// Actions `lancer`, `reprendre`, `enqueter` : chaque session/appel porte `agent: { subagent_type:
// "general-purpose", model: "<sonnet|opus|haiku>", effort: "<low|medium|high|xhigh>" }`, prêt à
// recopier dans un appel `Agent(...)` (l'effort se passe à l'outil, il prime sur l'agent) —
// jamais une valeur que le modèle transforme lui-même (D2,
// docs/decisions/2026-09-22-flous-du-workflow.md). Modèle hors Sonnet|Opus|Haiku : pas de champ
// `agent`, un `avertissement` nommant la valeur.
//
// Avant un `lancer` : l'arbre non commité est croisé avec la zone de chaque session de la vague (D1,
// même décision). Recoupement, zone illisible ou `git status` en échec → `question` source
// `arbre-sale`, motifs : fichiers touchés dans une zone, « zone illisible : <segment> », « arbre
// invérifiable ».

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifierPreuve } from './preuve-n0.mjs';
import { lireIndexTexte, normaliserSimple } from './lire-index.mjs';
import { racineDepot as racineDepotDuHook } from '../hooks/lib.mjs';

const RACINE = process.cwd();

const args = process.argv.slice(2);
const plan = args.find((a) => /^P\d+$/.test(a));
const etat = args.includes('--etat');
const json = args.includes('--json');

if (!plan) {
  console.error('prochaine-action: indiquer un plan (ex. P6)');
  process.exit(2);
}

// ── git, best-effort, jamais bloquant (style maison : plugin/bin/collecter-incidents.mjs) ────────
function git(...a) {
  try {
    return execFileSync('git', a, {
      cwd: RACINE,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
      timeout: 8000,
    }).trim();
  } catch {
    return null;
  }
}

// `racineDepot` : celle de `plugin/hooks/lib.mjs` (bin/ et hooks/ sont vendorés côte à côte,
// `sync-workflow.mjs`) — plus de copie à tenir synchronisée à la main (P20/S4/T6). `null` si la racine ne
// peut pas être établie avec certitude (worktree lié d'un dépôt à `.git` déplacé, sonde du 2026-09-24,
// plans/P10/S1.md) — jamais une racine devinée.
const racineDepot = () => racineDepotDuHook(RACINE);

/** Rebase en cours (fusion ou apply) : jamais résolu depuis un script, toujours une `question`
 * (T5, P10/S2). `--path-format=absolute` : même convention que `racineDepot`, insensible au cwd. */
function rebaseEnCours() {
  for (const nom of ['rebase-merge', 'rebase-apply']) {
    const chemin = git('rev-parse', '--path-format=absolute', '--git-path', nom);
    if (chemin && existsSync(chemin)) return true;
  }
  return false;
}

/** Fichiers **suivis** modifiés, jamais les non suivis (`--untracked-files=no`) : un arbre sale au
 * sens de `pousser` (T5, P10/S2, incident ebm-msp) — distinct de `fichiersSales()` ci-dessous, qui
 * inclut les non-suivis pour le contrôle de zone avant `lancer` (D1). `null` (git en échec) compte
 * comme sale : jamais un arbre invérifiable traité comme propre. */
function arbreTrackedSale() {
  const sortie = git('status', '--porcelain', '--untracked-files=no');
  return sortie === null || sortie.length > 0;
}

function etatAmont() {
  const amont = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}');
  if (!amont) return null;
  const comptes = git('rev-list', '--left-right', '--count', `${amont}...HEAD`);
  if (!comptes) return null;
  const [retard, avance] = comptes.split(/\s+/).map(Number);
  if (!Number.isFinite(retard) || !Number.isFinite(avance)) return null;
  return { amont, retard, avance };
}

// ── Lecture de l'index : un seul lecteur, `./lire-index.mjs` (P20/S4/T6) ──────────────────────────
// Le moteur n'a plus son propre parseur : table, ordonnancement, en-têtes (`Workflow :`, `Preuve N0 :`,
// `Remédiation Opus :`, `Clos :`) viennent du module que lisent aussi le vérificateur et les hooks.
function erreur(motif) {
  return { erreur: `index illisible : ${motif}` };
}

function lireIndex(dossierPlan) {
  const chemin = join(dossierPlan, 'index.md');
  if (!existsSync(chemin)) return erreur(`${chemin} absent`);
  let texte;
  try {
    texte = readFileSync(chemin, 'utf8');
  } catch (e) {
    return erreur(`${chemin} : ${e.message}`);
  }
  const index = lireIndexTexte(texte, chemin);
  if (index.erreur) return index;
  return { ...index, preuveN0: index.preuveN0 === 'requise' };
}

// ── Tâches d'une session, commitées ou non ────────────────────────────────────────────────────────
function parseTaches(champ) {
  const nums = new Set();
  for (const morceau of String(champ || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = /^T(\d+)(?:-T(\d+))?$/.exec(morceau);
    if (!m) continue;
    const debut = Number(m[1]);
    const fin = m[2] ? Number(m[2]) : debut;
    for (let i = debut; i <= fin; i++) nums.add(i);
  }
  return [...nums].sort((a, b) => a - b);
}

// ── Historique partiel (T3, P19/S3) ──────────────────────────────────────────────────────────────
// Une session cloud clone avec une profondeur limitée : les commits de tâche anciens deviennent
// invisibles. Le moteur tente `git fetch --unshallow` ; s'il échoue, il rend une `question` et ne
// conclut rien sur l'état du plan.
// Délai de l'appel dédié : le helper `git()` (8 s, erreur rendue `null`) tuerait un vrai fetch sur le
// réseau d'une session cloud — chaque appel rendrait alors la question. Au moins 120 s.
const DELAI_UNSHALLOW_MS = 180000;

function historiquePartiel() {
  return git('rev-parse', '--is-shallow-repository') === 'true';
}

/** `null` si le fetch a réussi, sinon le texte de l'erreur de git (stderr conservé pour le motif). */
function completerHistorique() {
  try {
    execFileSync('git', ['fetch', '--unshallow'], {
      cwd: RACINE,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      timeout: DELAI_UNSHALLOW_MS,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
    return null;
  } catch (e) {
    const brut = e.killed ? `délai de ${DELAI_UNSHALLOW_MS / 1000} s dépassé` : String(e.stderr || e.message || '').trim();
    return brut.replace(/\s+/g, ' ').slice(0, 300) || 'erreur git inconnue';
  }
}

/** `null` si l'historique est complet (ou a pu être complété) ; sinon la `question` à rendre. */
function verifierHistoriqueComplet() {
  if (!historiquePartiel()) return null;
  const erreurFetch = completerHistorique();
  if (erreurFetch === null && !historiquePartiel()) return null;
  const detail = erreurFetch ?? 'le dépôt reste superficiel après le fetch';
  return {
    action: 'question',
    motif:
      `historique git partiel (clone superficiel) : \`git fetch --unshallow\` a échoué (${detail}). ` +
      "Le moteur n'a rien conclu sur l'état du plan — lancer `git fetch --unshallow` à la main, puis relancer.",
    options: { source: 'historique-partiel', erreur: detail },
  };
}

function refsCommitees() {
  const messages = git('log', '--format=%B') || '';
  const refs = new Set();
  for (const m of messages.matchAll(/Plan:\s*(P\d+)\/(S\d+)\/(T\d+)/g)) {
    refs.add(`${m[1]}/${m[2]}/${m[3]}`);
  }
  return refs;
}

/** Un fichier **ajouté** par un commit, même s'il a été supprimé depuis (T6, P10/S2) — évite qu'une
 * revue déposée puis rangée au tri de clôture ne relance `relire` (constat 2026-09-24, même technique
 * que `plugin/hooks/lib.mjs` `revuesManquantes` : `git log --diff-filter=A`). `chemin` relatif à la
 * racine du dépôt (git tourne avec `cwd: RACINE`). */
function ajouteParUnCommit(chemin) {
  const sortie = git('log', '--diff-filter=A', '--format=%H', '--', chemin);
  return Boolean(sortie);
}

// ── `.echec.md` : les lignes mécaniques, défauts du gabarit quand une ligne manque ───────────────────
// (plugin/skills/reprendre-echec/SKILL.md, section « Gabarit »). Cinq mots de nature reconnus (T4,
// P10/S2) : `environnement`, `exécution`, `prémisse`, `filtre`, `interruption` — les deux derniers
// n'ont pas encore de traitement particulier ici (T5), mais une valeur non reconnue est déjà
// signalée plutôt que silencieusement absorbée.
const NATURES_VALIDES = ['environnement', 'exécution', 'prémisse', 'filtre', 'interruption'];
const NATURES_PAR_FORME_SIMPLE = Object.fromEntries(NATURES_VALIDES.map((n) => [normaliserSimple(n), n]));
// « premisse » et « execution » (sans accent) sont les fautes de frappe attendues.
NATURES_PAR_FORME_SIMPLE.premisse = 'prémisse';
NATURES_PAR_FORME_SIMPLE.execution = 'exécution';

/** `{ nature, inconnue }` — `nature` retombe sur `exécution` (défaut documenté) que la valeur brute
 * soit absente ou non reconnue ; `inconnue` porte la valeur brute **seulement** quand elle était
 * présente et non reconnue (jamais sur une ligne absente) — c'est ce qui distingue un défaut
 * silencieux d'une valeur à questionner (T4, P10/S2). */
function normaliserNature(brut) {
  if (!brut) return { nature: 'exécution', inconnue: null };
  const simple = normaliserSimple(brut);
  const trouvee = NATURES_PAR_FORME_SIMPLE[simple];
  if (trouvee) return { nature: trouvee, inconnue: null };
  return { nature: 'exécution', inconnue: brut };
}

/** Valeur de la première ligne `<clé> : <valeur>` du texte, clé comparée sans casse ni accents
 * (même normalisation que les valeurs, `normaliserSimple`) — `Prémisse`, `PREMISSE` et `premisse`
 * sont la même clé (T4, P19/S3 : une graphie recopiée à la main ne doit pas faire boucler le moteur).
 * `null` si la ligne manque. */
function valeurDeCle(texte, nom) {
  const cible = normaliserSimple(nom);
  for (const ligne of texte.split('\n')) {
    const i = ligne.indexOf(':');
    if (i < 0) continue;
    if (normaliserSimple(ligne.slice(0, i)) === cible) return ligne.slice(i + 1).trim();
  }
  return null;
}

/** `{ reprise, enquete }` écrits dans la ligne `Tentatives :` d'une version du rapport. Reprises et
 * enquêtes lues séparément : un séparateur inhabituel entre les deux (« · » au lieu d'un espace,
 * constat 2026-09-24 : « reprise=1 · enquete=0 » lu 0/0) ne doit plus faire perdre l'un ou l'autre. */
function lireTentatives(texte) {
  const brut = valeurDeCle(texte, 'Tentatives');
  const repriseM = brut && /reprise\s*=\s*(\d+)/i.exec(brut);
  const enqueteM = brut && /enqu[eê]te\s*=\s*(\d+)/i.exec(brut);
  return { reprise: repriseM ? Number(repriseM[1]) : 0, enquete: enqueteM ? Number(enqueteM[1]) : 0 };
}

/** Toutes les versions **commitées** d'un fichier (y compris avant sa suppression au PASS), texte
 * normalisé en `\n`. `chemin` relatif à la racine du dépôt. Une version absente au commit
 * (suppression) est ignorée. Opérations locales : le délai de `git()` suffit (T4, P19/S3). */
function versionsCommitees(chemin) {
  const hashes = (git('log', '--format=%H', '--', chemin) || '').split('\n').filter(Boolean);
  const textes = [];
  for (const h of hashes) {
    const texte = git('show', `${h}:${chemin}`);
    if (texte !== null) textes.push(texte.replace(/\r\n/g, '\n'));
  }
  return textes;
}

function maxTentatives(textes) {
  return textes.map(lireTentatives).reduce(
    (max, v) => ({ reprise: Math.max(max.reprise, v.reprise), enquete: Math.max(max.enquete, v.enquete) }),
    { reprise: 0, enquete: 0 },
  );
}

/** Un échec d'environnement qui se répète à l'identique (P20/S3/T5, constat B de la mesure) : la ligne
 * `Blocage :` de la version courante est celle de la version **commitée précédente**, et celle-ci
 * était déjà de nature `environnement`. « Précédente » = la plus récente version commitée dont le texte
 * diffère de l'arbre de travail (celle qui lui est identique EST l'état courant, pas une tentative
 * antérieure). Lit le même historique que les compteurs (`versionsCommitees`, du plus récent au plus
 * ancien) : une reprise qui oublie d'incrémenter `Tentatives :` ne fait pas boucler le moteur. */
function blocageRepeteDepuisEnvironnement(texte, blocage, anterieures) {
  if (!blocage) return false;
  const precedente = anterieures.find((v) => v.trim() !== texte.trim());
  if (!precedente) return false;
  if (normaliserNature(valeurDeCle(precedente, 'Nature')).nature !== 'environnement') return false;
  const forme = (b) => String(b ?? '').replace(/[\s`*]+/g, ' ').trim().toLowerCase();
  const blocagePrecedent = valeurDeCle(precedente, 'Blocage');
  return blocagePrecedent !== null && forme(blocagePrecedent) === forme(blocage);
}

function lireEchec(chemin, relatif) {
  const texte = readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n');
  const valeur = (nom) => valeurDeCle(texte, nom);
  const anterieures = relatif ? versionsCommitees(relatif) : [];

  const { nature, inconnue: natureInconnue } = normaliserNature(valeur('Nature'));

  // Compteurs = le MAXIMUM sur l'arbre de travail et sur toutes les versions commitées du rapport
  // (T4, P19/S3) : une reprise qui remet `reprise=0`, ou qui supprime puis recrée le fichier, ne
  // remet plus le budget à zéro. Revers assumé : une reprise qui OUBLIE d'incrémenter reste non
  // comptée — le correctif complet (le moteur écrit lui-même le compteur) est le point 10b du plan 2.
  const tentatives = maxTentatives([texte, ...anterieures]);

  const blocage = valeur('Blocage'); // absente ⇒ démarrage à froid (pas de canal court)
  const blocageRepete = blocageRepeteDepuisEnvironnement(texte, blocage, anterieures);
  const mesure = valeur('Mesure'); // optionnelle : seulement une prémisse mesurée et commitée

  // Auto : oui, suivi d'un séparateur quelconque (·, -, ,, espace) puis `option <m>`. Un « oui » sans
  // numéro d'option vaut « non », avec un avertissement (T4, P10/S2) — jamais un `reprendre` sur une
  // option qui n'existe pas.
  const autoBrut = valeur('Auto');
  let auto = 'non';
  let avertissementAuto = null;
  if (autoBrut) {
    const simple = autoBrut.replace(/[`*]/g, '').trim();
    if (/^oui/i.test(simple)) {
      const m = /^oui[\s·\-,]*option\s*(\d+)/i.exec(simple);
      if (m) {
        auto = `oui · option ${m[1]}`;
      } else {
        avertissementAuto = 'Auto : oui sans option — ignoré';
      }
    }
  }

  // Une prémisse réfutée par `verificateur-premisse` (§9c) : l'orchestrateur ajoute cette ligne au
  // rapport avant de rappeler le script (T5, P10/S2) — casse et accents libres.
  const premisseBrut = valeur('Premisse');
  const premisseSimple = premisseBrut === null ? null : normaliserSimple(premisseBrut);
  const premisseStatut = premisseSimple === null
    ? null
    : (['refutee', 'confirmee', 'indecidable'].find((v) => premisseSimple.startsWith(v)) ?? 'illisible');
  const premisseRefutee = premisseStatut === 'refutee';
  // Une ligne `Premisse :` présente dans une version commitée antérieure : la vérification a déjà eu
  // lieu, même si la ligne a été retirée depuis — jamais revérifiée (T4, P19/S3).
  const premisseDejaVerifiee = anterieures.some((v) => valeurDeCle(v, 'Premisse') !== null);

  return {
    nature,
    natureInconnue,
    tentatives,
    blocage,
    blocageRepete,
    mesure,
    auto,
    avertissementAuto,
    premisseRefutee,
    premisseStatut,
    premisseBrut,
    premisseDejaVerifiee,
    demarrageAFroid: !blocage,
  };
}

function lireRevue(chemin, texte = readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n')) {
  const m = /^Bloquant\s*:\s*(\d+)/m.exec(texte);
  const couverture = /^Couverture\s*:\s*(.+)$/m.exec(texte)?.[1].trim();
  const reprises = Number(/^Reprises\s*:\s*(\d+)$/m.exec(texte)?.[1] ?? 0);
  const dependances = /^Dépendances\s*:\s*(.+)$/m.exec(texte)?.[1].trim();
  return { bloquant: m ? Number(m[1]) : null,
    // Sans `Couverture :` la revue est à refaire, même avec `Bloquant :` (T5, P19/S3) : une
    // relecture écrite sur une ligne, au format de la réponse du relecteur, ne passe plus pour complète.
    couverture: m && couverture ? couverture : 'invalide',
    reprises, dependances: dependances === 'libres' ? 'libres' : 'bloquées' };
}

// ── Moteur (S10) — table « la nature décide » de remediation.md, reprise telle quelle ────────────────
// Budget (WORKFLOW.md §9c) : 2 reprises + 1 enquête par session, 2 enquêtes par plan. Vit dans les
// lignes mécaniques d'un .echec.md (survit à une orchestration interrompue). Un .echec.md disparaît
// au PASS (reprendre-echec Étape 5) : les compteurs se lisent donc sur TOUT l'historique git du
// rapport (maximum des valeurs écrites, `lireEchec`), et le total « par plan » somme les maxima de
// tous les `S*.echec.md` ayant existé (`enquetesDuPlan`). Revers assumé : une reprise qui oublie
// d'incrémenter `Tentatives :` reste non comptée — le moteur n'écrit pas encore le compteur (10b, plan 2).

const UN_CRAN_AU_DESSUS = { Haiku: 'Sonnet', Sonnet: 'Opus' };

// Effort lançable depuis un index — `max` en est exclu à dessein : WORKFLOW.md §3 le réserve à
// `/effort max` en session, jamais à une colonne d'index (décision 2026-09-18).
const EFFORTS_LANCABLES = ['low', 'medium', 'high', 'xhigh'];

// ── D2 : appel d'agent prêt à recopier — le script rend `subagent_type`, `model` (minuscules) et
// `effort`, jamais une valeur que l'orchestrateur transforme à la main (docs/decisions/2026-09-22-…). ──
const MODELES_VALIDES = ['Sonnet', 'Opus', 'Haiku'];
const EFFORT_DU_MODELE = { Opus: 'high', Sonnet: 'medium', Haiku: 'medium' };

/** `{ subagent_type, model, effort }` prêt à recopier dans un appel `Agent(...)`, ou `null` si le
 * modèle est hors Sonnet|Opus|Haiku — jamais un `model` inventé. L'effort est passé à l'outil : il
 * prime sur le frontmatter, donc un agent générique suffit. */
function appelAgent(modele, effort) {
  if (!MODELES_VALIDES.includes(modele)) return null;
  return { subagent_type: 'general-purpose', model: modele.toLowerCase(), effort };
}

/** Effort d'une reprise ou d'une relance : celui de la ligne de l'index (il ne change pas quand le
 * modèle monte) ; repli sur la table par modèle si la ligne porte un effort non lançable. */
function effortDeReprise(session, modele) {
  return EFFORTS_LANCABLES.includes(session.effort) ? session.effort : EFFORT_DU_MODELE[modele];
}

/** `{ agent }` à étaler sur une session/action, ou `{ avertissement }` nommant la valeur si le
 * modèle est inconnu — jamais les deux, jamais un `agent` deviné. */
function champAgent(modele, effort) {
  const agent = appelAgent(modele, effort);
  if (agent) return { agent };
  return {
    avertissement: `modèle inconnu ("${modele}") : pas d'appel d'agent composé (Sonnet, Opus ou Haiku attendus)`,
  };
}

// ── D1 : arrêt sur arbre sale dans la zone d'une vague — croisement mécanique fait par le script,
// jamais délégué (docs/decisions/2026-09-22-…). ──────────────────────────────────────────────────
/** Chemins d'une zone = seuls les segments entre backticks de la cellule « Zone modifiée » ; le texte
 * hors backticks ( `(§9a, §9c)`, `(4 fichiers créés)`, `(nouveau)` ) est ignoré. Accolades développées
 * avant comparaison. Segment avec `*`/`**` ou accolades non appariées → zone illisible. */
function cheminsDeZone(cellule) {
  const segments = [...String(cellule || '').matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  const chemins = [];
  for (const seg of segments) {
    const ouvrantes = (seg.match(/\{/g) || []).length;
    const fermantes = (seg.match(/\}/g) || []).length;
    if (seg.includes('*') || ouvrantes !== fermantes) {
      return { chemins: [], illisible: seg };
    }
    if (ouvrantes === 0) {
      chemins.push(seg);
      continue;
    }
    const m = /^(.*)\{([^{}]*)\}(.*)$/.exec(seg);
    if (!m) return { chemins: [], illisible: seg };
    const [, prefixe, options, suffixe] = m;
    for (const option of options.split(',')) chemins.push(`${prefixe}${option.trim()}${suffixe}`);
  }
  return { chemins, illisible: null };
}

/** Chemins bruts depuis `git status --porcelain -z --untracked-files=all` : pas de guillemets, pas de
 * repli `?? dossier/` (chaque fichier d'un dossier non suivi compte individuellement, D1). `null` si
 * `git` échoue — jamais un arbre deviné. Renommage/copie (code X ou Y = R/C) : le chemin d'origine
 * (champ `-z` suivant) compte aussi. */
function fichiersSales() {
  const sortie = git('status', '--porcelain', '-z', '--untracked-files=all');
  if (sortie === null) return null;
  const bruts = sortie.split('\0').filter((s) => s.length > 0);
  const fichiers = [];
  for (let i = 0; i < bruts.length; i++) {
    const entree = bruts[i];
    fichiers.push(entree.slice(3));
    if (entree[0] === 'R' || entree[0] === 'C') {
      i++;
      if (i < bruts.length) fichiers.push(bruts[i]);
    }
  }
  return fichiers;
}

/** Segment terminé par `/` = dossier → préfixe ; sinon égalité de chemin (D1). */
function cheminToucheZone(chemin, zoneChemin) {
  return zoneChemin.endsWith('/') ? chemin.startsWith(zoneChemin) : chemin === zoneChemin;
}

/** Avant un `lancer` : croise l'arbre non commité avec la zone de chaque session à lancer. `null` si
 * rien à signaler (l'appelant rend `lancer`) ; sinon la `question` à rendre à sa place. */
function arreteSurArbreSale(aLancer, plan) {
  const sales = fichiersSales();
  if (sales === null) {
    return {
      action: 'question',
      motif: 'arbre invérifiable : `git status` a échoué',
      options: { source: 'arbre-sale', motif: 'arbre-inverifiable' },
    };
  }
  const prefixePlan = `plans/${plan}/`;
  for (const s of aLancer) {
    const { chemins, illisible } = cheminsDeZone(s.zone);
    if (illisible) {
      return {
        action: 'question',
        motif: `zone illisible : ${illisible} (${s.session})`,
        options: { source: 'arbre-sale', session: s.session, segment: illisible },
      };
    }
    if (chemins.length === 0) continue; // zone `aucune` (ou vide) : aucun contrôle pour elle
    // Fichiers du plan en cours ignorés, sauf s'ils sont nommés par cette zone (D1).
    const candidats = sales.filter((f) => !f.startsWith(prefixePlan) || chemins.includes(f));
    const touches = candidats.filter((f) => chemins.some((c) => cheminToucheZone(f, c)));
    if (touches.length > 0) {
      return {
        action: 'question',
        motif: `arbre sale dans la zone de ${s.session} : ${touches.join(', ')}`,
        options: { source: 'arbre-sale', session: s.session, fichiers: touches },
      };
    }
  }
  return null;
}

function questionBudget(session, nature = 'reprise') {
  const mot = nature === 'enquete' ? "d'enquête" : 'de reprises';
  return {
    action: 'question',
    motif: `budget ${mot} épuisé sur ${session.session}`,
    options: { source: 'budget-epuise', session: session.session },
  };
}

/** Panne d'environnement : une seule reprise (P20/S3/T5), puis une question — jamais sans options.
 * `liste` est rendue ici, dans le JSON de l'action : le rapport de passation d'un échec d'environnement
 * n'a pas obligatoirement de `## Issues` (gabarit-echec.md), l'orchestrateur n'invente rien. Source
 * `budget-epuise` conservée : c'est celle que l'orchestrateur sait déjà relayer. */
function questionEnvironnement(session, e) {
  const id = session.session;
  const geste = e.blocage ? e.blocage.replace(/\s+/g, ' ').trim() : `voir plans/${plan}/${id}.echec.md`;
  return {
    action: 'question',
    motif: e.blocageRepete
      ? `panne d'environnement identique à la tentative précédente sur ${id} : une seule reprise est permise`
      : `budget de reprises épuisé sur ${id} : une panne d'environnement n'a droit qu'à une reprise`,
    options: {
      source: 'budget-epuise',
      session: id,
      nature: 'environnement',
      blocage: e.blocage ?? null,
      liste: [
        `Régler l'environnement (${geste}), puis relancer — débloque ${id}`,
        `Reprendre la session à la main — débloque ${id}`,
        'Sortir la session du plan — débloque les autres sessions',
      ],
    },
  };
}

/** Une session à lancer porte un effort non lançable — refuser en nommant §3 plutôt que propager
 * un effort que l'outil `Agent` n'accepte pas. */
function questionEffortInvalide(session) {
  if (session.effort === 'max') {
    return {
      action: 'question',
      motif:
        `${session.session} porte l'effort "max" : non réglable depuis un index ` +
        `(WORKFLOW.md §3, \`/effort max\` en session seulement)`,
      options: { source: 'effort-invalide', session: session.session, effort: session.effort },
    };
  }
  return {
    action: 'question',
    motif: `${session.session} porte un effort inconnu ("${session.effort}") — valeurs acceptées : ${EFFORTS_LANCABLES.join(', ')}`,
    options: { source: 'effort-invalide', session: session.session, effort: session.effort },
  };
}

function questionNatureInconnue(session, valeur) {
  return {
    action: 'question',
    motif: `${session.session} : \`Nature :\` non reconnue ("${valeur}") — environnement, exécution, prémisse, filtre ou interruption attendus`,
    options: { source: 'nature-inconnue', session: session.session, valeur },
  };
}

function questionBudgetOpus(session) {
  return {
    action: 'question',
    motif: `remédiation Opus déjà consommée sur ce plan : budget épuisé pour ${session.session}`,
    options: { source: 'budget-opus', session: session.session },
  };
}

/** Décision pour UNE session en échec (table « la nature décide », remediation.md).
 * `remediationOpusDeja` : la ligne `Remédiation Opus :` de l'index (T6, P10/S2) — au plus une passe
 * Opus (reprise ou enquête, session Opus comprise) par plan. */
function remedier(session, enqueteTotalPlan, remediationOpusDeja) {
  const e = session.echec;
  const modeleIndex = session.modele;

  // Valeur de `Nature :` présente mais non reconnue → question avant tout diagnostic (T4, P10/S2).
  if (e.natureInconnue) return questionNatureInconnue(session, e.natureInconnue);

  // Filtre de contenu : nature à part, jamais reprise à l'identique (§9a) — toujours une question,
  // même devant un `Auto : oui · option <m>` déjà posé (T5, P10/S2).
  if (e.nature === 'filtre') {
    return {
      action: 'question',
      motif: `filtre de contenu sur ${session.session} : jamais repris à l'identique`,
      options: { source: 'filtre', session: session.session },
    };
  }

  // `Auto : oui · option <m>` — remède déjà connu, prioritaire sur la nature (C5, WORKFLOW.md §9c).
  const auto = e.auto && /^oui\s*·\s*option\s*(\d+)/i.exec(e.auto);
  if (auto) {
    if (e.tentatives.reprise >= 2) return questionBudget(session);
    return { action: 'reprendre', session: session.session, modele: modeleIndex, option: Number(auto[1]) };
  }

  // Une prémisse réfutée par `verificateur-premisse` (l'orchestrateur a ajouté `Premisse : refutee`
  // au rapport avant de rappeler le script, T5/P10/S2) suit désormais la branche `exécution` : la
  // vraie cause est ailleurs que là où la session l'a cherchée.
  const nature = e.nature === 'prémisse' && e.premisseRefutee ? 'exécution' : e.nature;

  if (nature === 'prémisse') {
    if (e.mesure) {
      const commit = /^(\S+)/.exec(e.mesure)?.[1];
      const existe = commit ? git('cat-file', '-e', commit) !== null : false;
      if (existe) {
        return {
          action: 'question',
          motif: `prémisse prouvée par une mesure commitée sur ${session.session} (${commit})`,
          options: { source: 'etape6', cas: 'premisse-confirmee', session: session.session },
        };
      }
      // Commit cité introuvable : la mesure ne prouve plus rien, retomber sur « sans Mesure ».
    }
    // `verifier-premisse` une fois par session (T4, P19/S3) : le résultat de la vérification est écrit
    // dans le rapport (`Premisse : confirmee|indecidable|refutee · <preuve>`) et jamais revérifié.
    // `refutee` est déjà aiguillée vers `exécution` plus haut.
    const q = (cas, motif) => ({
      action: 'question',
      motif: `${motif} sur ${session.session}`,
      options: { source: 'etape6', cas, session: session.session },
    });
    if (e.premisseStatut === 'confirmee') return q('premisse-confirmee', `prémisse confirmée par verificateur-premisse (${e.premisseBrut})`);
    if (e.premisseStatut === 'indecidable') return q('premisse-indecidable', `prémisse invérifiable par lecture (${e.premisseBrut})`);
    if (e.premisseStatut === 'illisible') return q('premisse-illisible', `ligne \`Premisse :\` non reconnue ("${e.premisseBrut}") — refutee, confirmee ou indecidable attendus`);
    if (e.premisseDejaVerifiee) return q('premisse-deja-verifiee', 'prémisse déjà vérifiée (ligne `Premisse :` présente dans une version commitée du rapport, retirée depuis)');
    // Chemin complété par l'appelant (prochaineAction), qui seul connaît le plan.
    return { action: 'verifier-premisse', session: session.session };
  }

  // Une panne d'environnement n'a droit qu'à UNE reprise (la 2e brûlait le budget sur la même permission,
  // mesure du 2026-10-15) ; un `Blocage :` identique à celui de la tentative précédente vaut une reprise
  // consommée même si le compteur n'a pas été incrémenté.
  if (nature === 'environnement') {
    if (e.tentatives.reprise >= 1 || e.blocageRepete) return questionEnvironnement(session, e);
    return { action: 'reprendre', session: session.session, modele: modeleIndex };
  }

  // `exécution`, prémisse réfutée, ou nature absente (défaut du parseur d'échec — reprendre-echec/
  // SKILL.md « Gabarit »). Décision du 2026-09-24, points 4 et 6 : la 1re reprise tourne sur le
  // modèle de l'index, la 2e un cran au-dessus ; au plus une passe Opus de remédiation par plan
  // (T6, P10/S2).
  let modeleCible;
  let typeAction;
  if (modeleIndex === 'Opus') {
    if (e.blocage) {
      if (e.tentatives.reprise >= 2) return questionBudget(session);
      modeleCible = 'Opus';
      typeAction = 'reprendre';
    } else {
      if (e.tentatives.enquete >= 1 || enqueteTotalPlan >= 2) return questionBudget(session, 'enquete');
      modeleCible = 'Opus';
      typeAction = 'enqueter';
    }
  } else {
    if (e.tentatives.reprise >= 2) return questionBudget(session);
    modeleCible = e.tentatives.reprise >= 1 ? (UN_CRAN_AU_DESSUS[modeleIndex] ?? 'Sonnet') : modeleIndex;
    typeAction = 'reprendre';
  }

  if (modeleCible === 'Opus' && remediationOpusDeja >= 1) return questionBudgetOpus(session);
  return { action: typeAction, session: session.session, modele: modeleCible };
}

/** Une action parmi celles de C2, dérivée de l'état déjà assemblé (`sortie`). Ordre des tests (T5,
 * P10/S2, incident ebm-msp 2026-09-24) : rebase, racine introuvable, interruption, `pousser` (arbre propre
 * seulement), le reste inchangé. */
function prochaineAction(sortie) {
  if (sortie.depot.rebase) {
    return {
      action: 'question',
      motif: 'rebase en cours : le résoudre avant de reprendre le plan',
      options: { source: 'rebase' },
    };
  }

  if (sortie.depot.racineIntrouvable) {
    return {
      action: 'question',
      motif: 'racine du dépôt introuvable (worktree lié d\'un dépôt à `.git` déplacé) : reprendre depuis l\'arbre principal',
      options: { source: 'racine-introuvable' },
    };
  }

  // Un plan clos est fini, sessions non cochées comprises : une session abandonnée, ou une preuve
  // dont les statuts vivent sur sa branche jetable, ne se relance pas (clôtures du 2026-10-08).
  if (sortie.clos) return { action: 'fini' };

  const vagues = [...sortie.vagues].sort((a, b) => a.numero - b.numero);

  // Une session interrompue par quota (nature `interruption`) se relance avant tout `pousser`, et
  // ne consomme aucune reprise du budget (décision 2026-09-24, point 7).
  for (const vague of vagues) {
    const membres = vague.sessions.map((id) => sortie.sessions.find((s) => s.session === id)).filter(Boolean);
    const interrompue = membres.find((s) => s.etat === 'echec' && s.echec?.nature === 'interruption');
    if (interrompue) {
      return {
        action: 'relancer-interrompue',
        session: interrompue.session,
        modele: interrompue.modele,
        ...champAgent(interrompue.modele, effortDeReprise(interrompue, interrompue.modele)),
      };
    }
  }

  if (sortie.depot.amont && sortie.depot.amont.avance > 0) {
    if (sortie.depot.arbreSale) {
      return {
        action: 'question',
        motif: 'arbre non commité : impossible de pousser sans perdre ou masquer ce diff',
        options: { source: 'arbre-sale' },
      };
    }
    return { action: 'pousser' };
  }

  if (sortie.preuveN0 && !sortie.clos) {
    const invalide = sortie.sessions.find(s => s.etat === 'faite' && !s.preuve?.ok);
    if (invalide) return { action: 'valider-n0', session: invalide.session,
      motif: invalide.preuve?.motif ?? 'preuve N0 absente' };
  }
  const compromises = (s, visites = new Set()) => {
    if (visites.has(s.session)) return true;
    const suivants = new Set([...visites, s.session]);
    return (s.dependDe.match(/S\d+/g) ?? []).some(id => {
      const dep = sortie.sessions.find(x => x.session === id);
      return !dep || dep.etat !== 'faite' ||
        (dep.revue?.bloquant > 0 && dep.revue.dependances !== 'libres') || compromises(dep, suivants);
    });
  };
  const bloques = [];
  // Enquêtes du plan = somme, sur tous les `S*.echec.md` ayant existé (présents ou supprimés au PASS),
  // du maximum d'`enquete` de chacun (T4, P19/S3) — calculée à l'assemblage, depuis git.
  const enqueteTotalPlan = sortie.enquetesPlan ?? 0;

  for (const vague of vagues) {
    const membres = vague.sessions
      .map((id) => sortie.sessions.find((s) => s.session === id))
      .filter(Boolean);

    const enEchec = membres.find((s) => s.etat === 'echec');
    if (enEchec) {
      if (vague.repriseManuelle) {
        return {
          action: 'question',
          motif: `vague ${vague.numero} marquée reprise-manuelle : arrêt sur l'échec de ${enEchec.session}`,
          options: { source: 'reprise-manuelle', session: enEchec.session },
        };
      }
      const decision = remedier(enEchec, enqueteTotalPlan, sortie.remediationOpus ?? 0);
      if (decision.action === 'verifier-premisse') {
        decision.chemin = `plans/${sortie.plan}/${enEchec.session}.echec.md`;
      }
      if (decision.action === 'reprendre' || decision.action === 'enqueter') {
        Object.assign(decision, champAgent(decision.modele, effortDeReprise(enEchec, decision.modele)));
      }
      if (enEchec.echec.avertissementAuto) {
        decision.avertissement = decision.avertissement
          ? `${decision.avertissement} · ${enEchec.echec.avertissementAuto}`
          : enEchec.echec.avertissementAuto;
      }
      return decision;
    }

    const toutesFaites = membres.every((s) => s.etat === 'faite'); // vrai par défaut si vague sans membre (clôture)
    // Vague entièrement faite : revue (plans stampés `Workflow :` seulement — un plan antérieur à
    // C4/C3 n'a jamais produit de .revue.md, lui en exiger un serait un état deviné), puis
    // validation-humaine.
    if (sortie.workflow) {
      // Une session `low` n'est jamais relue (C7, relecteur-session.md « Sessions à sauter ») —
      // exclue ici, au seul endroit qui décide quoi relire (T3, P7/S2), plutôt que de compter sur
      // la prose du relecteur pour l'appliquer.
      const sansRevue = membres.filter(
        (s) =>
          s.etat === 'faite' &&
          s.effort !== 'low' &&
          s.zone &&
          s.zone.replace(/`/g, '').trim().toLowerCase() !== 'aucune' &&
          (!s.revue || s.revue.couverture !== 'complète'),
      );
      if (sansRevue.length > 0) {
        const epuisee = sansRevue.find(s => s.revue && s.revue.reprises >= 1);
        if (epuisee) return { action: 'question', motif: `revue ${epuisee.session} interrompue après une reprise`,
          options: { source: 'revue-incomplete', session: epuisee.session } };
        return {
          action: 'relire',
          vague: vague.numero,
          sessions: sansRevue.map((s) => ({ session: s.session, effort: s.effort, reprise: s.revue ? 1 : 0 })),
        };
      }
    }

    // « validée » (accents/casse libres) dans le libellé de la vague l'acquitte explicitement
    // (T5, P10/S2) — l'acquittement implicite par le démarrage de la vague suivante reste valable.
    if (vague.validationHumaine && !vague.validee &&
        (toutesFaites || (membres.some(s => s.etat === 'faite') &&
          !membres.some(s => s.etat === 'a-lancer' && !compromises(s))))) {
      const suivante = vagues.find((v) => v.numero === vague.numero + 1);
      const suivanteDemarree = suivante
        ? suivante.sessions.some((id) => {
            const s = sortie.sessions.find((x) => x.session === id);
            return s && s.etat !== 'a-lancer';
          })
        : false;
      if (!suivanteDemarree) {
        return { action: 'validation-humaine', vague: vague.numero };
      }
    }
    if (!toutesFaites) {
      const candidats = membres.filter((s) => s.etat === 'a-lancer');
      bloques.push(...candidats.filter(comp => compromises(comp)).map(s => s.session));
      const aLancer = candidats.filter(s => !compromises(s));
      if (aLancer.length === 0) continue;
      const effortInvalide = aLancer.find((s) => !EFFORTS_LANCABLES.includes(s.effort));
      if (effortInvalide) return questionEffortInvalide(effortInvalide);
      const questionArbre = arreteSurArbreSale(aLancer, sortie.plan);
      if (questionArbre) return questionArbre;
      return {
        action: 'lancer',
        vague: vague.numero,
        sessions: aLancer.map((s) => ({
          session: s.session,
          modele: s.modele,
          effort: s.effort,
          ...champAgent(s.modele, s.effort),
        })),
      };
    }

    // Sinon : vague déjà validée (explicitement, ou implicitement par le démarrage de la suivante) —
    // continuer.
  }

  // Une session `a-lancer` qui n'appartient à aucune vague ne sera jamais lancée par la boucle
  // ci-dessus : le dire plutôt que rendre `fini` sur un plan qui a encore du travail non ordonnancé
  // (T4, P10/S2).
  const idsDansVagues = new Set(vagues.flatMap((v) => v.sessions));
  const horsVague = sortie.sessions.filter((s) => s.etat === 'a-lancer' && !idsDansVagues.has(s.session));
  if (horsVague.length > 0) {
    return {
      action: 'question',
      motif: `session(s) absente(s) de toute vague de l'Ordonnancement : ${horsVague.map((s) => s.session).join(', ')}`,
      options: { source: 'session-hors-vague', sessions: horsVague.map((s) => s.session) },
    };
  }

  if (bloques.length > 0) return { action: 'question', motif: `prérequis non validés : ${bloques.join(', ')}`,
    options: { source: 'dependance-revue', sessions: bloques } };

  // Clôture (T6, P10/S2, décision 2026-09-24 point 4) : un plan stampé `Workflow :` sans `Clos :`
  // dans l'index revient à l'orchestrateur pour `fin-de-plan.md`, qui pose le marqueur — un plan déjà
  // clos, ou antérieur à C4 (jamais stampé), rend directement `fini`.
  if (sortie.workflow && !sortie.clos) {
    return { action: 'cloturer' };
  }
  return { action: 'fini' };
}

/** Écart `Workflow : v` index ↔ version courante — un avertissement, jamais une action (Étape 4). */
function avertissementVersion(sortie) {
  if (!sortie.workflow) return null;
  try {
    const binDir = dirname(fileURLToPath(import.meta.url));
    const manifestSource = join(binDir, '..', '.claude-plugin', 'plugin.json');
    const racine = racineDepot();
    const manifestVendore = racine ? join(racine, '.claude', 'workflow', 'manifest.json') : null;
    let versionCourante = null;
    if (existsSync(manifestSource)) {
      versionCourante = JSON.parse(readFileSync(manifestSource, 'utf8')).version;
    } else if (manifestVendore && existsSync(manifestVendore)) {
      versionCourante = JSON.parse(readFileSync(manifestVendore, 'utf8')).version;
    }
    if (versionCourante && sortie.workflow.replace(/^v/, '') !== String(versionCourante).replace(/^v/, '')) {
      return `index déclare Workflow : v${sortie.workflow}, plugin en v${versionCourante}`;
    }
  } catch {
    /* best-effort, jamais bloquant */
  }
  return null;
}

// ── Textes finaux (P20/S5/T8, point 10a de la revue externe du 2026-10-13) ───────────────────────────
// Chaque action porte un champ `texte` : le texte FINAL à relayer tel quel (annonce de vague, question
// avec ses options, rapport final). Le moteur ne connaît que le disque et git, il ne rédige que ce
// qu'il peut lire : les `subagent_tokens` et les motifs rendus dans la conversation ne sont pas sur
// disque — le texte le dit (« à compléter par l'orchestrateur ») plutôt que d'inventer une valeur.
// La PREMIÈRE ligne reste celle d'avant (`<action> — …`) : c'est ce que lisent `noter.mjs` et les mods.
// Les gabarits sont ceux de `orchestrer-plan/SKILL.md` (Étapes 1 et 3), déplacés ici sans changement
// de forme ; S12 réduira la skill à « relaie `texte` ».

/** Espaces et retours à la ligne ramenés à un seul espace — une phrase d'index écrite sur plusieurs
 * lignes se relaie sur une seule, mot pour mot. */
const une = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

function premiereLigne(action) {
  switch (action.action) {
    case 'lancer':
      return `lancer — vague ${action.vague} : ${action.sessions.map((s) => s.session).join(', ') || '—'}`;
    case 'verifier-premisse':
      return `verifier-premisse — ${action.session}`;
    case 'reprendre':
      return `reprendre — ${action.session} (${action.modele}${action.option ? ` · option ${action.option}` : ''})`;
    case 'enqueter':
      return `enqueter — ${action.session} (${action.modele})`;
    case 'relancer-interrompue':
      return `relancer-interrompue — ${action.session} (${action.modele})`;
    case 'relire':
      return `relire — vague ${action.vague} : ${action.sessions.map((s) => s.session).join(', ')}`;
    case 'valider-n0':
      return `valider-n0 — ${action.session}`;
    case 'validation-humaine':
      return `validation-humaine — vague ${action.vague}`;
    case 'question':
      return `question — ${action.motif}`;
    default: // pousser, fini, cloturer : une ligne nue, comme avant
      return action.action;
  }
}

// ── Prose de l'Ordonnancement : *Pourquoi maintenant* et lignes « en clair » COMPLÈTES ───────────────
// Le lecteur d'index (`lire-index.mjs`) ne garde que la première ligne d'une phrase « en clair » et
// ignore le *Pourquoi maintenant* ; un index réel les écrit sur plusieurs lignes (plans/P20/index.md).
// Relayer une phrase coupée serait la relayer fausse : ce balayage reprend la prose, et elle seule.
// Table, vagues et statuts restent lus par le lecteur unique.
function lireProse(texte) {
  const vagues = new Map(); // numero → { pourquoi, enClair: { S<k>: texte } }
  let dans = false;
  let vague = null;
  let cible = null; // { objet, cle } : où se prolonge une ligne de continuation
  for (const brute of String(texte ?? '').replace(/\r\n/g, '\n').split('\n')) {
    const l = brute.trim();
    if (/^##\s+Ordonnancement/.test(l)) { dans = true; continue; }
    if (dans && /^##\s+/.test(l)) break;
    if (!dans) continue;
    const v = /^(?:-\s*)?\*\*Vague\s+(\d+)/.exec(l);
    if (v) {
      vague = { pourquoi: '', enClair: {} };
      vagues.set(Number(v[1]), vague);
      cible = null;
      continue;
    }
    if (!vague) continue;
    const p = /^\*Pourquoi maintenant\*\s*:\s*(.*)$/.exec(l);
    if (p) { vague.pourquoi = p[1]; cible = { objet: vague, cle: 'pourquoi' }; continue; }
    const s = /^-\s*\*\*(S\d+)\*\*\s*[—-]\s*(.*)$/.exec(l);
    if (s) { vague.enClair[s[1]] = s[2]; cible = { objet: vague.enClair, cle: s[1] }; continue; }
    if (l === '' || l.startsWith('- ')) { cible = null; continue; }
    if (cible) cible.objet[cible.cle] += ` ${l}`;
  }
  for (const v of vagues.values()) {
    v.pourquoi = une(v.pourquoi);
    for (const k of Object.keys(v.enClair)) v.enClair[k] = une(v.enClair[k]);
  }
  return { vagues };
}

const idsDeDependance = (s) => s.dependDe.match(/S\d+/g) ?? [];
const sessionDe = (sortie, id) => sortie.sessions.find((x) => x.session === id);

// ── Annonce de vague (Étape 1 de la skill) ───────────────────────────────────────────────────────────
function texteLancer(action, sortie, prose) {
  const vagues = [...sortie.vagues].sort((a, b) => a.numero - b.numero);
  const vague = vagues.find((v) => v.numero === action.vague);
  const suivante = vagues.find((v) => v.numero === action.vague + 1);
  const proseVague = prose.vagues.get(action.vague);
  const sansClair = [];
  const out = [];
  out.push(`▶ Vague ${action.vague}/${vagues.length} — ${action.sessions.length} session(s)`);
  out.push(`   Pourquoi cette vague maintenant : ${proseVague?.pourquoi || "(non renseigné dans l'index)"}`);
  out.push(
    `   Si une session échoue : ${
      vague?.repriseManuelle
        ? "reprise manuelle — je m'arrête et je te rends la main"
        : "je diagnostique, je reprends une fois, j'enquête si la reprise cale — je ne te sollicite que s'il y a un choix à faire, et sous forme de question"
    }`,
  );
  out.push(
    `   Fin de vague : ${
      vague?.validationHumaine
        ? 'validation humaine — je m\'arrête pour ton jugement'
        : suivante
          ? `j'enchaîne sur la vague ${suivante.numero}`
          : 'je passe à la clôture du plan'
    }`,
  );
  for (const { session: id } of action.sessions) {
    const s = sessionDe(sortie, id);
    const clair = proseVague?.enClair[id];
    out.push('');
    out.push(`   ${id} · ${s?.titre ?? ''}`);
    if (clair) out.push(`      En clair : ${une(clair)}`);
    else sansClair.push(id);
    out.push(`      Tâches ${s?.taches ?? '—'} · ${s?.modele ?? '?'}/${s?.effort ?? '?'}`);
    const ids = s ? idsDeDependance(s) : [];
    const passees = ids.length > 0 && ids.every((d) => sessionDe(sortie, d)?.etat === 'faite');
    const dep = ids.length === 0 ? '—' : `${ids.join(', ')}${passees ? `, déjà passée${ids.length > 1 ? 's' : ''}` : ''}`;
    out.push(`      Fichiers touchés : ${s?.zone ?? '—'} · Dépend de : ${dep}`);
  }
  out.push('');
  out.push('   Pendant que ça tourne : ne pas modifier les fichiers listés — les sessions y écrivent.');
  out.push(`   À la fin : un commit par tâche, retrouvable par son repère \`Plan: ${sortie.plan}/S<k>/T<m>\`.`);
  if (sansClair.length > 0) {
    out.push(`   Index sans ligne « en clair » pour ${sansClair.join(', ')} : annoncé sans elle, jamais inventée.`);
  }
  return out.join('\n');
}

// ── `## Issues` d'un rapport d'échec : les options, recopiées ligne à ligne ──────────────────────────
const CLES_MECANIQUES = ['nature', 'tentatives', 'blocage', 'mesure', 'auto', 'premisse'];

/** `{ lignes, recommandation }` — `lignes` : les lignes de la section `## Issues`, sans rien changer ;
 * `recommandation` : le texte d'une ligne « Recommandation : … » si le rapport en porte une. La section
 * s'arrête au titre suivant, ou à une ligne mécanique (`Premisse :` est ajoutée EN FIN de fichier par
 * l'orchestrateur, après les issues — elle n'est pas une option). Rapport absent ou sans section :
 * `{ lignes: [], recommandation: null }`. */
function lireIssues(id) {
  const chemin = join(RACINE, 'plans', plan, `${id}.echec.md`);
  if (!existsSync(chemin)) return { lignes: [], recommandation: null };
  const lignes = [];
  let recommandation = null;
  let dans = false;
  for (const brute of readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n').split('\n')) {
    if (/^##\s+Issues\s*$/i.test(brute.trim())) { dans = true; continue; }
    if (!dans) continue;
    if (/^##\s/.test(brute)) break;
    const cle = /^([A-Za-zÀ-ÿ ]+?)\s*:/.exec(brute.trim());
    if (cle && CLES_MECANIQUES.includes(normaliserSimple(cle[1]))) break;
    const reco = /^(?:ma\s+)?recommandation\s*:\s*(.*)$/i.exec(brute.trim());
    if (reco) { recommandation = reco[1].trim(); continue; }
    if (brute.trim() !== '') lignes.push(brute.replace(/\s+$/, ''));
  }
  return { lignes, recommandation };
}

// ── Questions (Étape 3 de la skill) : une entrée par `options.source` ────────────────────────────────
const REPLI_SESSION = (id) => [
  `Reprendre la session à la main — débloque ${id}`,
  'Sortir la session du plan — débloque les autres sessions',
];
const ARBRE_SALE_FICHIERS = [
  'Committer ces fichiers toi-même, puis relancer — débloque la vague',
  'Les mettre de côté (git stash), puis relancer — débloque la vague, tes changements restent récupérables',
  'Sortir la session concernée de la vague (index) — débloque les autres sessions',
];
const ARBRE_SALE_ZONE = [
  'Réécrire ce segment en chemins explicites dans l\'index, puis relancer — débloque la vague',
  'Sortir la session concernée de la vague (index) — débloque les autres sessions',
];

/** Sources dont la question vise le plan entier, pas une session : rien ne reste lançable sans
 * décider, et l'en-tête de la question ne porte pas de `S<k>`. */
const SOURCES_PLAN = ['rebase', 'racine-introuvable', 'historique-partiel', 'session-hors-vague'];

/** `{ question, options, graines, rapport }` pour une `question` du moteur, ou `null` si la source est
 * inconnue (l'appelant rend alors l'option unique « mettre à jour le workflow »). `options` : listes
 * fixes de la skill (arbre-sale, zone illisible, revue-incomplete, dependance-revue), `liste` de S3
 * (panne d'environnement), sinon un repli dont chaque première ligne reprend le motif du moteur ; la
 * section `## Issues` du rapport, quand il y en a une, les remplace (`redigerQuestion`). */
function definirQuestion(action, sortie) {
  const o = action.options ?? {};
  const id = o.session ?? null;
  const ids = o.sessions ?? [];
  const nomsIds = ids.join(', ');
  switch (o.source) {
    case 'rebase':
      return {
        question: 'Un rebase est en cours : comment le résoudre avant de reprendre le plan ?',
        options: ['Résoudre le rebase à la main (`git rebase --abort`, ou `--continue` une fois les conflits réglés), puis relancer — débloque le plan'],
        graines: [],
      };
    case 'racine-introuvable':
      return {
        question: "La racine du dépôt est introuvable : depuis où reprendre le plan ?",
        options: ["Reprendre depuis l'arbre principal du dépôt (pas depuis ce worktree lié), puis relancer — débloque le plan"],
        graines: [],
      };
    case 'historique-partiel':
      return {
        question: "L'historique git du clone est partiel et n'a pas pu être complété : que fait-on ?",
        options: ['Lancer `git fetch --unshallow` à la main, puis relancer — débloque le plan'],
        graines: [],
      };
    case 'arbre-sale':
      if (o.motif === 'arbre-inverifiable') {
        return {
          question: 'Git ne répond pas dans ce dépôt : que fait-on ?',
          options: ['Vérifier git dans ce dépôt, puis relancer — débloque la vague'],
          graines: id ? [id] : [],
        };
      }
      if (o.segment) {
        return {
          question: `La zone modifiée de ${id} ne se lit pas (« ${o.segment} ») : que fait-on ?`,
          options: ARBRE_SALE_ZONE,
          graines: id ? [id] : [],
        };
      }
      if (id) {
        return {
          question: `Des fichiers non commités recoupent la zone de ${id} : que fait-on ?`,
          options: ARBRE_SALE_FICHIERS,
          graines: [id],
        };
      }
      return {
        question: 'Des fichiers non commités empêchent de pousser : que fait-on ?',
        options: [
          'Committer ces fichiers toi-même, puis relancer — débloque le push',
          'Les mettre de côté (git stash), puis relancer — débloque le push, tes changements restent récupérables',
        ],
        graines: [],
      };
    case 'budget-epuise':
      return {
        question: o.nature === 'environnement'
          ? `Une panne d'environnement bloque ${id} : que fait-on ?`
          : `Le budget de reprises ou d'enquête de ${id} est épuisé : que fait-on ?`,
        options: Array.isArray(o.liste) && o.liste.length > 0 ? o.liste : REPLI_SESSION(id),
        graines: [id],
      };
    case 'budget-opus':
      return {
        question: `La remédiation Opus du plan est déjà consommée : que fait-on pour ${id} ?`,
        options: REPLI_SESSION(id),
        graines: [id],
      };
    case 'effort-invalide':
      return {
        question: `L'effort de ${id} ("${o.effort}") ne se lance pas depuis l'index : que fait-on ?`,
        options: [
          `Corriger la colonne Effort de ${id} dans l'index (low, medium, high ou xhigh), puis relancer — débloque ${id}`,
          'Sortir la session du plan — débloque les autres sessions',
        ],
        graines: [id],
      };
    case 'nature-inconnue':
      return {
        question: `La ligne \`Nature :\` du rapport de ${id} n'est pas reconnue ("${o.valeur}") : que fait-on ?`,
        options: [
          `Corriger la ligne \`Nature :\` de plans/${plan}/${id}.echec.md (environnement, exécution, prémisse, filtre ou interruption), puis relancer — débloque ${id}`,
          ...REPLI_SESSION(id),
        ],
        graines: [id],
      };
    case 'filtre':
      return {
        question: `Un filtre de contenu a arrêté ${id} : que fait-on ?`,
        options: [
          `Reformuler la tâche qui déclenche le filtre dans plans/${plan}/${id}.md, puis relancer — débloque ${id}`,
          ...REPLI_SESSION(id),
        ],
        graines: [id],
      };
    case 'etape6': {
      const phrases = {
        'premisse-confirmee': `Le constat de ${id} est confirmé : le plan repose sur une prémisse fausse — que fait-on ?`,
        'premisse-indecidable': `La prémisse de ${id} ne se vérifie pas par lecture : que fait-on ?`,
        'premisse-illisible': `La ligne \`Premisse :\` du rapport de ${id} est illisible : que fait-on ?`,
        'premisse-deja-verifiee': `La prémisse de ${id} a déjà été vérifiée, sans issue écrite : que fait-on ?`,
      };
      const premiere = {
        'premisse-confirmee': `Réviser le plan pour tenir compte de ce constat (\`/cadrer\`, puis \`/nouveau-plan\`), puis relancer — débloque ${id}`,
        'premisse-indecidable': `Sonder la prémisse à la main (une mesure commitée), puis relancer — débloque ${id}`,
        'premisse-illisible': `Corriger la ligne \`Premisse :\` du rapport (refutee, confirmee ou indecidable), puis relancer — débloque ${id}`,
        'premisse-deja-verifiee': `Réviser le plan pour tenir compte de ce constat (\`/cadrer\`, puis \`/nouveau-plan\`), puis relancer — débloque ${id}`,
      };
      const cas = phrases[o.cas] ? o.cas : 'premisse-confirmee';
      return {
        question: phrases[cas],
        options: [premiere[cas], ...REPLI_SESSION(id)],
        graines: [id],
      };
    }
    case 'reprise-manuelle':
      return {
        question: `La vague est en reprise manuelle et ${id} a échoué : que fait-on ?`,
        options: [
          `Reprendre ${id} à la main (rapport : plans/${plan}/${id}.echec.md), puis relancer — débloque ${id}`,
          'Sortir la session du plan — débloque les autres sessions',
        ],
        graines: [id],
      };
    case 'revue-incomplete':
      return {
        question: `La revue de ${id} est restée incomplète après une reprise : que fait-on ?`,
        options: [
          `Terminer la revue de ${id} à la main (plans/${plan}/${id}.revue.md : \`Bloquant :\` et \`Couverture : complète\`), puis relancer — débloque la vague suivante`,
          `Reporter le plan — la revue de ${id} reste interrompue, sa couverture n'est pas annoncée complète`,
        ],
        graines: [id],
        rapport: `plans/${plan}/${id}.revue.md`,
      };
    case 'dependance-revue': {
      const bloquantes = new Set();
      const remonter = (s, vus = new Set()) => {
        for (const d of idsDeDependance(s)) {
          if (vus.has(d)) continue;
          vus.add(d);
          const dep = sessionDe(sortie, d);
          if (!dep) continue;
          if (dep.etat === 'faite' && dep.revue?.bloquant > 0 && dep.revue.dependances !== 'libres') bloquantes.add(d);
          remonter(dep, vus);
        }
      };
      for (const r of ids) { const s = sessionDe(sortie, r); if (s) remonter(s); }
      const sources = [...bloquantes];
      return {
        question: `Les prérequis de ${nomsIds} ont des bloquants de revue non triés : que fait-on ?`,
        options: [
          `Corriger le prérequis${sources.length > 1 ? 's' : ''} ${sources.join(', ') || '(voir sa revue)'} (bloquants de sa revue), puis relancer — débloque ${nomsIds}`,
          `Réviser explicitement la dépendance dans l'index (colonne Dépend de), preuve à l'appui — débloque ${nomsIds}`,
        ],
        graines: [], // les sessions en attente ne sont pas des graines : leurs dépendances les bloquent déjà
        rapport: sources.length > 0 ? `plans/${plan}/${sources[0]}.revue.md` : null,
        attente: ids,
      };
    }
    case 'session-hors-vague':
      return {
        question: `Des sessions ne sont dans aucune vague de l'Ordonnancement (${nomsIds}) : que fait-on ?`,
        options: [
          `Ajouter ${nomsIds} à une vague de l'Ordonnancement de l'index, puis relancer — débloque ${nomsIds}`,
          `Sortir ${nomsIds} du plan — débloque la fin du plan`,
        ],
        graines: [],
      };
    default:
      return null;
  }
}

/** Sessions encore lançables sans que l'utilisateur tranche : non faites, sans échec, dont AUCUNE
 * dépendance — directe ou transitive — n'est une session bloquée (`graines`), en échec, ou une
 * faite à bloquants de revue non libres. `null` si l'état des sessions est inconnu. */
function resteLancable(sortie, graines) {
  if (!sortie?.sessions?.every((s) => s.etat)) return null;
  const memo = new Map();
  const bloque = (s, pile = new Set()) => {
    if (memo.has(s.session)) return memo.get(s.session);
    if (pile.has(s.session)) return true;
    const pile2 = new Set([...pile, s.session]);
    let r = graines.includes(s.session) || s.etat === 'echec';
    if (!r) {
      r = idsDeDependance(s).some((d) => {
        const dep = sessionDe(sortie, d);
        if (!dep) return true;
        if (graines.includes(d)) return true;
        if (dep.etat === 'faite') return dep.revue?.bloquant > 0 && dep.revue.dependances !== 'libres';
        return bloque(dep, pile2);
      });
    }
    memo.set(s.session, r);
    return r;
  };
  return sortie.sessions.filter((s) => s.etat === 'a-lancer' && !bloque(s)).map((s) => s.session);
}

/** `❓ P<n>/S<k> — …` : la question au format imposé, options comprises. Source ou action inconnue :
 * option unique « mettre à jour le workflow » (le moteur la rédige lui-même, la skill n'a plus à la
 * décrire). */
function redigerQuestion(action, sortie) {
  const o = action.options ?? {};
  let def = definirQuestion(action, sortie);
  let inconnue = false;
  if (!def) {
    inconnue = true;
    def = {
      question: `Le moteur rend une source de question inconnue (${o.source ?? action.action}) : que fait-on ?`,
      options: ['Mettre à jour le workflow (`/maj-workflow`), puis relancer — débloque le plan'],
      graines: [],
    };
  }
  const id = o.session ?? (o.sessions ?? [])[0] ?? null;
  const issues = o.session && !inconnue ? lireIssues(o.session) : { lignes: [], recommandation: null };
  // Listes FIXES de la skill (arbre-sale, revue-incomplete, dependance-revue) : jamais remplacées par
  // un rapport d'échec qui n'a pas ces options en vue. Le reste : `## Issues` du rapport si elle existe.
  const fixes = ['arbre-sale', 'revue-incomplete', 'dependance-revue'].includes(o.source);
  const delIssues = !fixes && issues.lignes.length > 0;
  const options = delIssues
    ? issues.lignes
    : def.options.map((opt, i) => `${i + 1}. ${opt}`);

  const sessionEnTete = id ? `${plan}/${id}` : plan;
  const echecChemin = o.session && existsSync(join(RACINE, 'plans', plan, `${o.session}.echec.md`))
    ? `plans/${plan}/${o.session}.echec.md`
    : null;
  const rapport = def.rapport ?? echecChemin ?? '—';

  let reste;
  if (o.session && !SOURCES_PLAN.includes(o.source) || def.attente) {
    const liste = resteLancable(sortie, def.graines);
    reste = liste === null ? "inconnu (l'état des sessions n'a pas pu être lu)" : liste.length > 0 ? liste.join(', ') : 'rien';
  } else {
    reste = 'rien';
  }

  const out = [];
  out.push(`❓ ${sessionEnTete} — ${def.question}`);
  out.push(`   Pourquoi je m'arrête ici : ${action.motif}`);
  if (echecChemin) {
    const blocage = valeurDeCle(readFileSync(join(RACINE, echecChemin), 'utf8').replace(/\r\n/g, '\n'), 'Blocage');
    if (blocage && !action.motif.includes(blocage)) out.push(`     Blocage noté dans le rapport : ${une(blocage)}`);
  }
  out.push('');
  for (const l of options) out.push(`   ${l}`);
  // Pas de `## Issues` : options de repli du moteur — dit une fois, jamais présentées comme celles
  // d'une enquête (la skill demandait de le dire quand la section manque).
  if (echecChemin && !delIssues && !fixes && !inconnue) {
    out.push("   (le rapport n'a pas de section `## Issues` : options de repli du moteur)");
  }
  out.push('');
  if (delIssues && issues.recommandation) {
    out.push(`   Ma recommandation : ${issues.recommandation.replace(/^(?:ma\s+)?recommandation\s*:\s*/i, '')}`);
  }
  out.push(`   Rapport : ${rapport} · reste lançable sans décider : ${reste}`);
  if (inconnue) out.push("   Une action ou une source inconnue du moteur est un incident du workflow (§9b, nature `orchestration`).");
  return out.join('\n');
}

// ── Rapport final (`fini`) : tiré du disque ──────────────────────────────────────────────────────────
function incidentsDuPlan() {
  const dossier = join(RACINE, 'docs', 'workflow', 'incidents');
  if (!existsSync(dossier)) return [];
  const motif = new RegExp(`\\bPlan\\s*:\\s*${plan}\\b`);
  return readdirSync(dossier)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => motif.test(readFileSync(join(dossier, f), 'utf8').split('\n').slice(0, 15).join('\n')))
    .sort()
    .map((f) => `docs/workflow/incidents/${f}`);
}

/** Les `N1 S<k> : à faire — <écran>` consignés dans le bilan de session d'un `S<k>.md`. */
function n1ALfaire(id) {
  const chemin = join(RACINE, 'plans', plan, `${id}.md`);
  if (!existsSync(chemin)) return [];
  const texte = readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n');
  const debut = texte.search(/^##\s+Bilan de session/m);
  if (debut < 0) return [];
  const trouves = [];
  for (const l of texte.slice(debut).split('\n')) {
    const m = /^\W*N1(?:\s+S\d+)?\s*:\s*à faire\s*[—-]\s*(.+?)\s*$/i.exec(l);
    if (m && !m[1].startsWith('<')) trouves.push(`N1 ${id} : à faire — ${m[1]}`);
  }
  return trouves;
}

function texteFini(action, sortie) {
  const out = [];
  out.push(`Plan ${sortie.plan} — rapport final (${sortie.sessions.length} session(s))`);
  const n1 = [];
  for (const s of sortie.sessions) {
    const statut = s.etat === 'faite' ? 'PASS' : s.etat === 'echec' ? 'FAIL' : 'non faite (plan clos)';
    const chemin = `plans/${sortie.plan}/${s.session}.echec.md`;
    const textes = versionsCommitees(chemin);
    if (existsSync(join(RACINE, chemin))) textes.push(readFileSync(join(RACINE, chemin), 'utf8').replace(/\r\n/g, '\n'));
    const t = maxTentatives(textes);
    const reprises = [
      t.reprise > 0 ? `${t.reprise} reprise(s)` : null,
      t.enquete > 0 ? `${t.enquete} enquête(s)` : null,
    ].filter(Boolean);
    let revue;
    const fichierRevue = `plans/${sortie.plan}/${s.session}.revue.md`;
    if (s.revue) {
      if (s.revue.bloquant === null) revue = 'revue illisible';
      else if (s.revue.bloquant > 0) {
        revue = `revue : ${s.revue.bloquant} bloquant(s)${existsSync(join(RACINE, fichierRevue)) ? ` → ${fichierRevue}` : ' (revue rangée au tri de clôture)'}`;
      } else revue = 'revue : 0 bloquant';
    } else if (!sortie.workflow) revue = 'revue : — (plan antérieur à la revue)';
    else if (s.effort === 'low' || !s.zone || s.zone.replace(/`/g, '').trim().toLowerCase() === 'aucune') revue = 'revue : sautée (low ou zone aucune)';
    else revue = 'revue : absente';
    out.push(`   ${s.session} · ${statut} · ${s.titre}${reprises.length ? ` · ${reprises.join(' + ')}` : ''} · ${revue}`);
    n1.push(...n1ALfaire(s.session));
  }
  const incidents = incidentsDuPlan();
  out.push(`   Incidents du plan : ${incidents.length > 0 ? incidents.join(', ') : 'aucun'}`);
  if (n1.length > 0) for (const l of n1) out.push(`   ${l}`);
  else out.push('   N1 : rien à faire');
  out.push('   Tokens : à compléter par l\'orchestrateur (une ligne `subagent_tokens` par session — absents du disque).');
  return out.join('\n');
}

// ── Les autres actions : une ligne, et ce qu'elle demande ────────────────────────────────────────────
function texteSimple(action, sortie) {
  const nomPlan = sortie?.plan ?? plan;
  const l = [];
  switch (action.action) {
    case 'verifier-premisse':
      l.push(`   Vérifier l'affirmation de « Ce qu'il faudrait pour que ça passe » de ${action.chemin}.`);
      break;
    case 'reprendre':
      l.push(`   Reprise de ${action.session} sur ${action.modele}${action.option ? `, option ${action.option} de la section ## Issues` : ''}.`);
      break;
    case 'enqueter':
      l.push(`   Enquête en lecture seule sur ${action.session} (${action.modele}).`);
      break;
    case 'relancer-interrompue':
      l.push(`   ${action.session} a été coupée par un quota : la relancer, hors budget de reprises.`);
      break;
    case 'relire':
      l.push(`   Relecture de ${action.sessions.map((s) => `${s.session} (effort ${s.effort}${s.reprise ? ', reprise' : ''})`).join(', ')}.`);
      break;
    case 'valider-n0':
      l.push(`   La preuve N0 de ${action.session} manque ou est invalide : ${action.motif}.`);
      break;
    case 'pousser':
      l.push('   Des commits locaux ne sont pas poussés : `git pull --rebase`, puis `git push`.');
      break;
    case 'cloturer':
      l.push('   Toutes les sessions sont faites : dérouler la clôture du plan (`fin-de-tache/references/fin-de-plan.md`).');
      break;
    case 'validation-humaine': {
      const v = sortie?.vagues.find((x) => x.numero === action.vague);
      const noms = (v?.sessions ?? []).map((id) => {
        const s = sessionDe(sortie, id);
        return s ? `${id} (${s.titre})` : id;
      });
      l.push(`   La vague ${action.vague} (${noms.join(', ') || '—'}) attend ton jugement : aucune mesure ne le remplace.`);
      l.push(`   Au « oui » : ajouter \`· validée\` au libellé de la vague ${action.vague} dans plans/${nomPlan}/index.md, committer, pousser, puis relancer.`);
      break;
    }
    default:
      break;
  }
  return l;
}

/** Le champ `texte` d'une action : première ligne inchangée, puis le texte final à relayer.
 * `sortie` : l'état assemblé (`null` seulement avant la lecture de l'état : historique partiel). */
function redigerTexte(action, sortie, prose) {
  const out = [premiereLigne(action)];
  switch (action.action) {
    case 'lancer':
      out.push(texteLancer(action, sortie, prose));
      break;
    case 'question':
      out.push(redigerQuestion(action, sortie));
      break;
    case 'fini':
      out.push(texteFini(action, sortie));
      break;
    default:
      out.push(...texteSimple(action, sortie));
  }
  if (action.avertissement) out.push(`Avertissement : ${action.avertissement}`);
  return out.join('\n');
}

const MARQUE_DONNEES = '— données de l\'action pour le moteur, à ne pas relayer —';

/** Sortie sans `--json` : le `texte`, puis (si l'action en porte) ses champs et ses appels d'agent —
 * ce que la skill d'orchestration lit encore tant que S12 ne l'a pas réduite à « relaie `texte` ». */
function formaterTexte(action) {
  const champs = Object.entries(action)
    .filter(([cle]) => cle !== 'action' && cle !== 'texte')
    .map(([cle, valeur]) => `${cle}: ${typeof valeur === 'object' ? JSON.stringify(valeur) : valeur}`);
  const donnees = [...champs, ...lignesAppelAgent(action)];
  return [action.texte ?? premiereLigne(action), ...(donnees.length > 0 ? ['', MARQUE_DONNEES, ...donnees] : [])].join('\n');
}

/** Une ligne lisible par appel d'agent prêt à recopier (D2) — `S1 → subagent_type: general-purpose ·
 * model: sonnet · effort: low` — pour la sortie sans `--json` de `lancer`, `reprendre`, `enqueter`. */
function lignesAppelAgent(action) {
  const ligne = (session, agent) => `${session} → subagent_type: ${agent.subagent_type} · model: ${agent.model} · effort: ${agent.effort}`;
  if (action.action === 'lancer') {
    return action.sessions.filter((s) => s.agent).map((s) => ligne(s.session, s.agent));
  }
  if (
    (action.action === 'reprendre' || action.action === 'enqueter' || action.action === 'relancer-interrompue') &&
    action.agent
  ) {
    return [ligne(action.session, action.agent)];
  }
  return [];
}

// ── Assemblage ─────────────────────────────────────────────────────────────────────────────────────
const dossierPlan = join(RACINE, 'plans', plan);
const index = lireIndex(dossierPlan);
if (index.erreur) {
  console.error(`prochaine-action: ${index.erreur}`);
  process.exit(2);
}

// Historique partiel (T3, P19/S3) : avant toute lecture de l'historique. Un clone `--depth` a perdu
// les commits de tâche plus anciens — lu comme complet, il ferait relancer une session déjà faite.
const questionPartiel = verifierHistoriqueComplet();
if (questionPartiel) {
  questionPartiel.texte = redigerTexte(questionPartiel, null, { vagues: new Map() });
  process.stdout.write((json ? JSON.stringify(questionPartiel, null, 2) : formaterTexte(questionPartiel)) + '\n');
  process.exit(0);
}

const refs = refsCommitees();
for (const s of index.sessions) {
  const cheminEchec = join(dossierPlan, `${s.session}.echec.md`);
  const cheminRevue = join(dossierPlan, `${s.session}.revue.md`);

  const taches = parseTaches(s.taches).map((n) => `${plan}/${s.session}/T${n}`);
  const toutesCommitees = taches.length > 0 && taches.every((ref) => refs.has(ref));

  if (s.coche) {
    s.etat = 'faite';
  } else if (existsSync(cheminEchec)) {
    s.etat = 'echec';
  } else if (toutesCommitees) {
    s.etat = 'faite';
  } else {
    s.etat = 'a-lancer';
  }

  s.preuve = index.preuveN0 && s.etat === 'faite' ? verifierPreuve(RACINE, `${plan}/${s.session}`) : null;
  s.echec = s.etat === 'echec' ? lireEchec(cheminEchec, `plans/${plan}/${s.session}.echec.md`) : null;
  // Une revue toujours présente se lit normalement ; une revue **ajoutée par un commit** puis
  // supprimée depuis (tri de clôture) compte comme faite mais sans `Bloquant :` à relire — le
  // fichier n'existe plus (T6, P10/S2).
  if (existsSync(cheminRevue)) {
    s.revue = lireRevue(cheminRevue);
  } else if (ajouteParUnCommit(`plans/${plan}/${s.session}.revue.md`)) {
    const derniere = git('log', '-1', '--diff-filter=AM', '--format=%H', '--', `plans/${plan}/${s.session}.revue.md`);
    const texte = derniere ? git('show', `${derniere}:plans/${plan}/${s.session}.revue.md`) : null;
    s.revue = texte ? lireRevue(cheminRevue, texte) : null;
  } else {
    s.revue = null;
  }
}

/** Somme, sur tous les `plans/P<n>/S<k>.echec.md` ayant existé dans l'historique ou présents dans
 * l'arbre de travail, du maximum d'`enquete` de chacun (T4, P19/S3). */
function enquetesDuPlan() {
  const prefixe = `plans/${plan}/`;
  const motif = new RegExp(`^${prefixe}S\\d+\\.echec\\.md$`);
  const chemins = new Set(
    (git('log', '--format=', '--name-only', '--', prefixe) || '').split('\n').map((l) => l.trim()).filter((l) => motif.test(l)),
  );
  for (const s of index.sessions) {
    if (existsSync(join(dossierPlan, `${s.session}.echec.md`))) chemins.add(`${prefixe}${s.session}.echec.md`);
  }
  let total = 0;
  for (const chemin of chemins) {
    const textes = versionsCommitees(chemin);
    if (existsSync(join(RACINE, chemin))) textes.push(readFileSync(join(RACINE, chemin), 'utf8').replace(/\r\n/g, '\n'));
    total += maxTentatives(textes).enquete;
  }
  return total;
}

// Racine introuvable (worktree lié d'un dépôt à `.git` déplacé) : le moteur ne conclut rien, il pose
// une question (plugin/hooks/lib.mjs `racineIntrouvable`, même refus par défaut côté hook).
const racineActuelle = racineDepot();
const sortie = {
  plan,
  workflow: index.workflow,
  clos: index.clos,
  preuveN0: index.preuveN0,
  remediationOpus: index.remediationOpus,
  enquetesPlan: enquetesDuPlan(),
  depot: {
    racineIntrouvable: racineActuelle === null,
    amont: etatAmont(),
    rebase: rebaseEnCours(),
    arbreSale: arbreTrackedSale(),
  },
  vagues: index.vagues,
  sessions: index.sessions,
};

if (etat) {
  process.stdout.write(JSON.stringify(sortie, null, 2) + '\n');
  process.exit(0);
}

const action = prochaineAction(sortie);
const avertissement = avertissementVersion(sortie);
if (avertissement) {
  // Ne pas écraser un avertissement déjà posé (modèle inconnu, D2) : les deux comptent.
  action.avertissement = action.avertissement ? `${action.avertissement} · ${avertissement}` : avertissement;
}

// Le texte final, rédigé en dernier : il porte aussi l'avertissement de version posé ci-dessus.
action.texte = redigerTexte(action, sortie, lireProse(readFileSync(join(dossierPlan, 'index.md'), 'utf8')));

process.stdout.write((json ? JSON.stringify(action, null, 2) : formaterTexte(action)) + '\n');
process.exit(0);
