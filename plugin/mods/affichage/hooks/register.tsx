import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { EtatFichiers, Fenetre, Limites } from '../types'
import {
  CMD_NON_POUSSES,
  CMD_STATUS,
  ETAT_VIDE,
  RACINE_LABEL,
  SEUIL_REPLI,
  analyserNonPousses,
  analyserStatus,
  construireArbre,
  dossierReplie,
  ligneFichier,
} from './fichiers'
import {
  composerLigne,
  decalageLocal,
  lignesLimites,
  lireEtatPlan,
  planDepuisPrompt,
  planEstOuvert,
  plansParNumero,
} from './limites'

// Affichage du workflow : une ligne d'etat (plan, limites 5 h / 7 j, contexte), un panneau « limites »
// et un panneau « fichiers » (etat git). Rien ici n'ecrit dans le projet ni ne refuse un evenement ;
// toute lecture qui echoue laisse l'affichage tel quel.
//
// Forme imposee par `plugin validate` : `$` ne passe qu'a des fonctions declarees au sommet.

const PANE_LIMITES = 'limites'
const PANE_FICHIERS = 'fichiers'
const CACHE_PLAN_MS = 20000
const DELAI_PROCESS_MS = 5000
const OUTILS_FICHIERS = ['Write', 'Edit', 'NotebookEdit', 'Bash', 'PowerShell']

const limitesAtom = atom({ plugin: 'affichage', key: 'limites' } as const, { fenetres: [] } as Limites)
const fichiersAtom = atom({ plugin: 'affichage', key: 'fichiers' } as const, ETAT_VIDE as EtatFichiers)
const repliAtom = atom({ plugin: 'affichage', key: 'repli' } as const, {} as Record<string, boolean>)

type Etat = {
  plan?: string
  session?: string
  script?: string | null
  cachePlan?: { plan: string; at: number; vague?: string; sessions?: string }
  cacheDefaut?: { at: number; plan?: string }
  dernierTexte?: string
  fenetres: Fenetre[]
  contexte?: number
  fichiersJson?: string
  depot: boolean
  fichiersOuvert: boolean
}

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

// prochaine-action.mjs : `plugin/bin/` en source, `.claude/workflow/bin/` en vendore. Aucun des deux :
// hors projet du workflow, la ligne ne porte ni plan, ni vague.
async function trouverScript($: any, s: Etat): Promise<string | null> {
  if (s.script !== undefined) return s.script
  const base = await racine($)
  s.script = null
  for (const c of ['plugin/bin/prochaine-action.mjs', '.claude/workflow/bin/prochaine-action.mjs']) {
    if (await $.fs.exists(`${base}/${c}`)) {
      s.script = `${base}/${c}`
      break
    }
  }
  return s.script
}

// Vague et sessions : `prochaine-action.mjs P<n> --json`, cache 20 s, delai 5 s.
async function etatDuPlan($: any, s: Etat, plan: string, maintenant: number): Promise<{ vague?: string; sessions?: string }> {
  if (s.cachePlan && s.cachePlan.plan === plan && maintenant - s.cachePlan.at < CACHE_PLAN_MS) return s.cachePlan
  const script = await trouverScript($, s)
  let etat: { vague?: string; sessions?: string } = {}
  if (script) {
    try {
      const r = await $.process.run(['node', script, plan, '--json'], { cwd: await racine($), timeoutMs: DELAI_PROCESS_MS })
      etat = lireEtatPlan(String(r.stdout ?? ''))
    } catch {
      etat = {}
    }
  }
  s.cachePlan = { plan, at: maintenant, ...etat }
  return etat
}

// A defaut de repere dans un prompt d'agent : le plus grand P<n> dont l'index n'a pas de ligne `Clos :`.
async function planParDefaut($: any, s: Etat, maintenant: number): Promise<string | undefined> {
  if (s.cacheDefaut && maintenant - s.cacheDefaut.at < CACHE_PLAN_MS) return s.cacheDefaut.plan
  let plan: string | undefined
  try {
    const base = await racine($)
    const entrees = await $.fs.list(`${base}/plans`)
    const noms = (entrees as any[]).filter((x) => x.kind === 'dir').map((x) => String(x.name))
    for (const nom of plansParNumero(noms)) {
      const texte = await lireTexte($, `${base}/plans/${nom}/index.md`)
      if (texte !== undefined && planEstOuvert(texte)) {
        plan = nom
        break
      }
    }
  } catch {
    plan = undefined
  }
  s.cacheDefaut = { at: maintenant, plan }
  return plan
}

// La ligne d'etat, reecrite seulement si son texte change.
async function rafraichirLigne($: any, s: Etat): Promise<void> {
  try {
    const maintenant = Number(await $.clock.now())
    let plan: string | undefined
    let vague: string | undefined
    let sessions: string | undefined
    if (await trouverScript($, s)) {
      plan = s.plan ?? (await planParDefaut($, s, maintenant))
      if (plan) {
        const etat = await etatDuPlan($, s, plan, maintenant)
        vague = etat.vague
        sessions = etat.sessions ?? (plan === s.plan ? s.session : undefined)
      }
    }
    const texte = composerLigne({
      plan,
      vague,
      sessions,
      fenetres: s.fenetres,
      contexte: s.contexte,
      maintenant,
      decalage: decalageLocal,
    })
    if (texte !== (s.dernierTexte ?? '')) {
      s.dernierTexte = texte
      $.ui.status(texte === '' ? undefined : texte)
    }
  } catch {
    // la ligne d'etat n'est jamais bloquante
  }
}

async function mesurer($: any, s: Etat, fenetres: Fenetre[], contexte: number | undefined): Promise<void> {
  s.fenetres = fenetres
  s.contexte = contexte
  await update($, limitesAtom, () => ({ fenetres, ...(contexte !== undefined ? { contexte } : {}) }))
  await rafraichirLigne($, s)
}

// L'etat git : `git status` (modifie, nouveau) et les commits sans amont atteint (`↑`).
async function rafraichirFichiers($: any, s: Etat): Promise<void> {
  try {
    const base = await racine($)
    const init = { cwd: base, timeoutMs: DELAI_PROCESS_MS }
    const st = await $.process.run([...CMD_STATUS], init)
    let etat: EtatFichiers = ETAT_VIDE
    if (st.exitCode === 0) {
      let amont = false
      let nonPousses: string[] = []
      try {
        const r = await $.process.run([...CMD_NON_POUSSES], init)
        if (r.exitCode === 0) {
          amont = true
          nonPousses = analyserNonPousses(String(r.stdout ?? ''))
        }
      } catch {
        amont = false
      }
      etat = construireArbre(analyserStatus(String(st.stdout ?? '')), nonPousses, amont)
    }
    s.depot = etat.depot
    const json = JSON.stringify(etat)
    if (json !== s.fichiersJson) {
      s.fichiersJson = json
      await update($, fichiersAtom, () => etat)
    }
    if (!etat.depot && s.fichiersOuvert) {
      s.fichiersOuvert = false
      await $.ui.close({ id: PANE_FICHIERS })
    }
  } catch {
    // le panneau garde son dernier etat
  }
}

// Ouvre les panneaux utiles ; « fichiers » seulement dans un depot git.
async function ouvrirPanneaux($: any, s: Etat): Promise<string> {
  const ouverts: string[] = []
  const limites = await $.ui.open({ id: PANE_LIMITES, title: 'Limites' })
  if (limites?.isPlaced !== false) ouverts.push('limites')
  if (s.depot) {
    const fichiers = await $.ui.open({ id: PANE_FICHIERS, title: 'Fichiers' })
    s.fichiersOuvert = true
    if (fichiers?.isPlaced !== false) ouverts.push('fichiers')
  }
  return ouverts.length > 0 ? `Panneaux ouverts : ${ouverts.join(', ')}.` : 'Aucun panneau placé : élargir le terminal.'
}

export const register: Register = (on) => {
  const s: Etat = { fenetres: [], depot: false, fichiersOuvert: false }

  on('session.start', async ($, e, next) => {
    try {
      const usage = await $.session.usage()
      await mesurer($, s, usage?.rateLimits ?? [], usage?.context?.percent)
    } catch {
      // limites connues a la premiere mesure
    }
    await rafraichirFichiers($, s)
    try {
      await $.command.register({ name: 'panneau', description: 'Rouvre les panneaux limites et fichiers' })
      void ouvrirPanneaux($, s).catch(() => {})
    } catch {
      // les panneaux ne sont jamais bloquants
    }
    return next(e)
  })

  on('command.run', { command: 'panneau' }, async ($) => {
    await rafraichirFichiers($, s)
    return { text: await ouvrirPanneaux($, s) }
  })

  on('session.measure', async ($, e, next) => {
    await mesurer($, s, e.rateLimits, e.context?.percent)
    return next(e)
  })

  // Repere du plan : le dernier plans/P<n>/S<k>.md vu dans un prompt d'agent. `next(e)` inchange.
  on('agent.spawn', async ($, e, next) => {
    const lien = planDepuisPrompt(e.prompt)
    if (lien) {
      s.plan = lien.plan
      s.session = lien.session
      await rafraichirLigne($, s)
    }
    return next(e)
  })

  on('tool.call', { tool: OUTILS_FICHIERS }, async ($, e, next) => {
    const r = await next(e)
    await rafraichirFichiers($, s)
    return r
  })

  on('ui.render', { component: 'Pane', requestId: PANE_LIMITES }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const { fenetres } = await read($, limitesAtom)
    const maintenant = Number(await $.clock.now())
    return (
      <Box flexDirection="column">
        {lignesLimites(fenetres, maintenant, decalageLocal).map((l) => (
          <Text>{l}</Text>
        ))}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE_FICHIERS }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const etat = await read($, fichiersAtom)
    const repli = await read($, repliAtom)
    if (!etat.depot) return <Text dimColor>Pas de dépôt git.</Text>
    const entete = `${etat.total} fichier${etat.total > 1 ? 's' : ''} · ● modifié  + nouveau  ↑ non poussé`
    return (
      <Box flexDirection="column">
        {!etat.amont && <Text dimColor>pas d'amont</Text>}
        {etat.total === 0 ? <Text dimColor>Rien à committer ni à pousser.</Text> : <Text dimColor>{entete}</Text>}
        {etat.dossiers.map((d) => {
          const replie = dossierReplie(d, repli)
          const nom = d.chemin === RACINE_LABEL ? d.chemin : `${d.chemin}/`
          return (
            <Box flexDirection="column">
              <Button
                key={`dossier:${d.chemin}`}
                plain
                label={`${replie ? '▸' : '▾'} ${nom} (${d.fichiers.length})`}
                onPress={() =>
                  update($, repliAtom, (r) => ({ ...r, [d.chemin]: !(r[d.chemin] ?? d.fichiers.length > SEUIL_REPLI) }))
                }
              />
              {!replie && d.fichiers.map((f) => <Text>{`  ${ligneFichier(f)}`}</Text>)}
            </Box>
          )
        })}
        {etat.tronque > 0 && <Text dimColor>{`… et ${etat.tronque} autres fichiers`}</Text>}
      </Box>
    )
  })
}
