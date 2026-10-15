import type { Register } from 'claude-code'
import { analyserIndex } from './lire-index.mjs'

// Garde-fous du workflow (porte de la preuve P13, mods O1 et O3). Silencieux : aucune ecriture,
// aucun refus ; une lecture qui echoue laisse l'evenement inchange.
//
//   O1  agent.spawn   modele de la colonne Modele de plans/P<n>/index.md, seulement si absent
//   O3  tool.call     run_in_background: false quand le parametre manque (outil Agent)
//
// Forme imposee par `plugin validate` : `$` ne passe qu'a des fonctions declarees au sommet.

// Bord droit : `S\d+` suivi directement de `.md` (jamais S1.echec.md ni S1.revue.md).
const RE_SESSION = /plans[\\/](P\d+)[\\/](S\d+)\.md/
const MODELES = ['sonnet', 'opus', 'haiku']

async function racine($: any): Promise<string> {
  return String(await $.session.root()).replace(/[\\/]+$/, '')
}

async function lireTexte($: any, chemin: string): Promise<string | undefined> {
  try {
    const lu = await $.fs.read(chemin)
    return typeof lu === 'string' ? lu : undefined
  } catch {
    return undefined
  }
}

// Modele lu par POSITION (4e cellule de la table), comme le moteur : le lecteur unique de l'index
// (`./lire-index.mjs`, copie generee de `plugin/bin/lire-index.mjs`), plus de repere par en-tete.
async function modeleDeIndex($: any, plan: string, session: string): Promise<string | undefined> {
  const texte = await lireTexte($, `${await racine($)}/plans/${plan}/index.md`)
  if (texte === undefined) return undefined
  const ligne = analyserIndex(texte).sessions.find((s: { session: string }) => s.session === session)
  if (!ligne) return undefined
  const valeur = String(ligne.modele ?? '').replace(/[`*]/g, '').trim().toLowerCase()
  return MODELES.includes(valeur) ? valeur : undefined
}

export const register: Register = (on, options) => {
  const actif = (cle: 'o1' | 'o3') => options?.[cle] !== false

  on('agent.spawn', async ($, e, next) => {
    if (!actif('o1') || e.fork || e.model) return next(e)
    const trouve = RE_SESSION.exec(e.prompt)
    if (!trouve) return next(e)
    const impose = await modeleDeIndex($, trouve[1], trouve[2])
    return next(impose ? { ...e, model: impose } : e)
  })

  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    if (!actif('o3') || (e as any).run_in_background !== undefined) return next(e)
    return next({ ...e, run_in_background: false } as typeof e)
  })
}
