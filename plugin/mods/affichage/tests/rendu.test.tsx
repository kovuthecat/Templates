import { describe, expect, mock, test } from 'claude-code/testing'

import { SEUIL_REPLI } from '../hooks/fichiers'

const norm = (p: string) => p.split(String.fromCharCode(92)).join('/')
const NUL = String.fromCharCode(0)
const RACINE = '/proj'
const SURFACES = ['desktop', 'mobile'] as const

const PROPS_PANE = {
  title: 'Panneau',
  isFocused: false,
  bodyColumns: 60,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 30 },
  view: {},
}

type Sorties = { status: (string | undefined)[]; commandes: string[][]; panneaux: string[]; fermes: string[] }

// Le monde sous le mod : un depot git simule, a la sortie EXACTE de chaque commande lancee.
function monde(
  on: any,
  opts: {
    status?: string
    nonPousses?: string
    amont?: boolean
    depot?: boolean
    rateLimits?: any[]
    contexte?: number
    fichiers?: string[]
    scripts?: Record<string, string>
  } = {},
): Sorties {
  const s: Sorties = { status: [], commandes: [], panneaux: [], fermes: [] }
  const depot = opts.depot !== false
  mock.clock(on, { now: Date.parse('2026-10-07T12:00:00Z') })
  on('session.start', (_$: any, e: any) => ({ cwd: e.cwd }))
  on('session.measure', (_$: any, e: any) => ({ changed: e.changed }))
  on('tool.call', () => ({ result: {}, text: 'ok' }))
  on('session.root', () => ({ value: RACINE }))
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 200000, percent: opts.contexte }, rateLimits: opts.rateLimits ?? [] },
  }))
  on('fs.exists', (_$: any, e: any) => ({ value: (opts.fichiers ?? []).some((f) => norm(e.path).endsWith(f)) }))
  on('fs.list', () => ({ value: [{ name: 'P1', kind: 'dir', size: 0, mtimeMs: 0 }] }))
  on('fs.read', (_$: any, e: any) => (norm(e.path).endsWith('plans/P1/index.md') ? { value: '# P1\n' } : { deny: 'ENOENT' }))
  on('command.register', () => ({ value: { isRegistered: true } }))
  on('ui.status', (_$: any, e: any) => {
    s.status.push(e.text)
    return { value: undefined }
  })
  on('ui.open', (_$: any, e: any) => {
    s.panneaux.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.close', (_$: any, e: any) => {
    s.fermes.push(e.id)
    return { value: undefined }
  })
  on('process.run', (_$: any, e: any) => {
    const argv = [...e.argv]
    s.commandes.push(argv)
    if (argv[0] === 'git' && argv[1] === 'status') {
      return depot
        ? { value: { exitCode: 0, stdout: opts.status ?? '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
        : { value: { exitCode: 128, stdout: '', stderr: 'fatal: not a git repository', isStdoutTruncated: false, isStderrTruncated: false } }
    }
    if (argv[0] === 'git' && argv[1] === 'diff') {
      return opts.amont === false
        ? { value: { exitCode: 128, stdout: '', stderr: 'fatal: no upstream configured', isStdoutTruncated: false, isStderrTruncated: false } }
        : { value: { exitCode: 0, stdout: opts.nonPousses ?? '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    }
    if (argv[0] === 'node') {
      return { value: { exitCode: 0, stdout: opts.scripts?.[argv[2]] ?? '{}', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    }
    return { value: { exitCode: 1, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  return s
}

const demarrer = ($: any) => $.session.start({ cwd: RACINE, surface: 'terminal', isInteractive: true })

const monter = ($: any, surface: (typeof SURFACES)[number], id: string) =>
  $.ui.mount({ plugin: 'affichage', surface, component: 'Pane', requestId: id, props: { ...PROPS_PANE, title: id }, viewport: { columns: 60, rows: 30 } })

const textes = async (ui: any) => (await ui.findAll({ type: 'Text' })).map((t: any) => String(t.text))

describe('panneau limites', () => {
  for (const surface of SURFACES) {
    test(`${surface} : sans limites, message d'attente`, async ($, on) => {
      monde(on)
      await demarrer($)
      const ui = await monter($, surface, 'limites')
      expect(await textes(ui)).toEqual(['limites connues après la première réponse'])
    })

    test(`${surface} : avec limites, barre, pourcentage et reset`, async ($, on) => {
      monde(on)
      await demarrer($)
      await $.session.measure({
        context: { window: 200000, percent: 10 },
        rateLimits: [
          { kind: 'seven_day', percentUsed: 40, resetsAt: '2099-01-01T00:00:00Z' },
          { kind: 'five_hour', percentUsed: 20.6 },
        ],
        changed: ['rateLimits', 'context'],
      })
      const ui = await monter($, surface, 'limites')
      const lignes = await textes(ui)
      expect(lignes).toHaveLength(2)
      expect(lignes[0]).toBe('5 h  ██░░░░░░░░  21 %')
      expect(lignes[1]).toMatch(/^7 j {2}████░░░░░░ {2}40 % {2}↺ /)
    })
  }
})

describe('ligne d\'etat', () => {
  test('au demarrage : limites et contexte lus par session.usage ; hors projet du workflow, pas de plan', async ($, on) => {
    const s = monde(on, { rateLimits: [{ kind: 'five_hour', percentUsed: 21 }], contexte: 10 })
    await demarrer($)
    expect(s.status.at(-1)).toBe('5 h 21 % · contexte 10 %')
    expect(s.commandes.some((c) => c[0] === 'node')).toBe(false)
  })

  test('reecrite seulement si le texte change', async ($, on) => {
    const s = monde(on)
    await demarrer($)
    const mesure = (pourcent: number) =>
      $.session.measure({ context: { window: 200000, percent: pourcent }, rateLimits: [], changed: ['context'] })
    await mesure(10)
    await mesure(10.2)
    await mesure(11)
    expect(s.status).toEqual(['contexte 10 %', 'contexte 11 %'])
  })

  test('dans un projet du workflow : plan, vague et session par prochaine-action ; repere par agent.spawn', async ($, on) => {
    const s = monde(on, {
      fichiers: ['plugin/bin/prochaine-action.mjs'],
      scripts: {
        P1: JSON.stringify({ action: 'lancer', vague: 2, sessions: [{ session: 'S3' }] }),
        P7: JSON.stringify({ action: 'lancer', vague: 4, sessions: [{ session: 'S2' }] }),
      },
      contexte: 5,
    })
    on('agent.spawn', () => ({ model: 'inherit', agentId: 'a1' }))
    await demarrer($)
    // plan par defaut : P1 (index sans « Clos : »)
    expect(s.status.at(-1)).toBe('P1 · vague 2 · S3 · contexte 5 %')
    await $.agent.spawn({
      tool_use_id: 't1',
      prompt: 'Ouvre plans/P7/S2.md',
      description: 'session',
      subagentType: 'workflow:session-high',
      provider: { plugin: 'workflow', tier: 'user' },
      parentModel: 'claude-opus',
      background: false,
      fork: false,
    } as any)
    expect(s.status.at(-1)).toBe('P7 · vague 4 · S2 · contexte 5 %')
  })

  test('script en echec : la ligne garde limites et contexte', async ($, on) => {
    const s = monde(on, { fichiers: ['plugin/bin/prochaine-action.mjs'], scripts: { P1: 'pas du json' }, contexte: 5 })
    await demarrer($)
    expect(s.status.at(-1)).toBe('P1 · contexte 5 %')
  })
})

describe('panneau fichiers', () => {
  const STATUS = [' M src/a.ts', '?? src/b.ts', 'R  nouveau.ts', 'ancien.ts'].map((x) => x + NUL).join('')

  for (const surface of SURFACES) {
    test(`${surface} : etat git groupe par dossier, ● + ↑`, async ($, on) => {
      monde(on, { status: STATUS, nonPousses: ['src/a.ts', 'docs/c.md'].map((x) => x + NUL).join('') })
      await demarrer($)
      const ui = await monter($, surface, 'fichiers')
      const lignes = await textes(ui)
      expect(lignes).toContain('3 fichiers · ● modifié  + nouveau  ↑ non poussé'.replace('3', '4'))
      expect(lignes).toContain('  ● a.ts')
      expect(lignes).toContain('  + b.ts')
      expect(lignes).toContain('  ↑ c.md')
      expect(lignes).toContain('  ● nouveau.ts  ← ancien.ts')
      expect(lignes).not.toContain("pas d'amont")
    })

    test(`${surface} : sans amont, une ligne « pas d'amont » en tete et aucun ↑`, async ($, on) => {
      monde(on, { status: STATUS, amont: false })
      await demarrer($)
      const lignes = await textes(await monter($, surface, 'fichiers'))
      expect(lignes[0]).toBe("pas d'amont")
      expect(lignes.some((l) => l.trim().startsWith('↑'))).toBe(false)
    })

    test(`${surface} : au-dela de ${SEUIL_REPLI} fichiers le dossier est replie, un appui le deplie`, async ($, on) => {
      const beaucoup = Array.from({ length: SEUIL_REPLI + 1 }, (_, i) => `?? gros/f${i}.ts${NUL}`).join('')
      monde(on, { status: beaucoup + ` M petit/p.ts${NUL}` })
      await demarrer($)
      const ui = await monter($, surface, 'fichiers')
      let lignes = await textes(ui)
      expect(lignes).toContain('  ● p.ts')
      expect(lignes.some((l) => l.trim().startsWith('+ f'))).toBe(false)
      const bouton = await ui.find({ type: 'Button', key: 'dossier:gros' })
      expect(bouton?.text).toBe(`▸ gros/ (${SEUIL_REPLI + 1})`)
      await ui.press({ key: 'dossier:gros' })
      lignes = await textes(ui)
      expect(lignes.filter((l) => l.trim().startsWith('+ f'))).toHaveLength(SEUIL_REPLI + 1)
      expect((await ui.find({ type: 'Button', key: 'dossier:gros' }))?.text).toBe(`▾ gros/ (${SEUIL_REPLI + 1})`)
    })

    test(`${surface} : rien a committer`, async ($, on) => {
      monde(on)
      await demarrer($)
      expect(await textes(await monter($, surface, 'fichiers'))).toContain('Rien à committer ni à pousser.')
    })
  }

  test('hors depot git : panneau jamais ouvert', async ($, on) => {
    const s = monde(on, { depot: false })
    await demarrer($)
    await $.clock?.settle?.()
    expect(s.panneaux).not.toContain('fichiers')
  })

  test('rafraichi apres un outil qui ecrit (Edit, Bash...), pas apres une lecture', async ($, on) => {
    const s = monde(on, { status: ` M a.ts${NUL}` })
    await demarrer($)
    const avant = s.commandes.filter((c) => c[1] === 'status').length
    await $.tool.call({ tool: 'Read', file_path: '/proj/a.ts' } as any)
    expect(s.commandes.filter((c) => c[1] === 'status').length).toBe(avant)
    await $.tool.call({ tool: 'Edit', file_path: '/proj/a.ts', old_string: 'a', new_string: 'b' } as any)
    await $.tool.call({ tool: 'Bash', command: 'git commit -m x' } as any)
    expect(s.commandes.filter((c) => c[1] === 'status').length).toBe(avant + 2)
  })

  test('commande /panneau : rouvre les deux panneaux', async ($, on) => {
    const s = monde(on)
    await demarrer($)
    s.panneaux.length = 0
    const r: any = await $.command.run({ command: 'panneau', args: '' } as any)
    expect(s.panneaux).toEqual(['limites', 'fichiers'])
    expect(String(r.text)).toContain('limites, fichiers')
  })
})
