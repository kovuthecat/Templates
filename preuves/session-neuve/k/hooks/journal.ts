import type { Register } from 'claude-code'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      const home = (await $.env.get('USERPROFILE')) ?? ''
      const path = `${home}/.claude/preuves/p15-k.jsonl`
      let prev = ''
      try {
        prev = await $.fs.read(path)
      } catch (err) {
        prev = ''
      }
      const line = JSON.stringify({ evt: 'session.start', cwd: e.cwd, iso: new Date().toISOString() })
      await $.fs.write(path, prev + line + '\n')
    } catch (err) {
      // journal best effort
    }
    return next(e)
  })
}
