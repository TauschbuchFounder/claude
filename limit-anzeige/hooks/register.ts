import type { Hook, Register, SessionRateLimit } from 'claude-code'

type Api = Parameters<Hook<'session.start'>>[0]

const LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7T',
  spend_limit: 'Budget',
}

const WARN_AT = [80, 95]

export const formatIn = (resetsAt: string | undefined, now: number): string => {
  if (resetsAt === undefined) return ''
  const ms = Date.parse(resetsAt) - now
  if (!(ms > 0)) return ''
  const minutes = Math.round(ms / 60000)
  const d = Math.floor(minutes / 1440)
  const h = Math.floor((minutes % 1440) / 60)
  const m = minutes % 60
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const formatLine = (limits: readonly SessionRateLimit[], now: number): string | undefined => {
  if (limits.length === 0) return undefined
  const parts = limits.map(l => {
    const reset = formatIn(l.resetsAt, now)
    return `${LABELS[l.kind] ?? l.kind} ${l.percentUsed}%${reset ? ` (Reset in ${reset})` : ''}`
  })
  return `Limit: ${parts.join(' · ')}`
}

const warned = new Map<string, number>()

async function show($: Api, limits: readonly SessionRateLimit[]) {
  const now = await $.clock.now()
  $.ui.status(formatLine(limits, now) ?? 'Limit: noch keine Daten (erscheint nach der ersten Antwort)')

  for (const l of limits) {
    const level = WARN_AT.filter(t => l.percentUsed >= t).pop() ?? 0
    if (level > (warned.get(l.kind) ?? 0)) {
      $.ui.toast(`Achtung: ${LABELS[l.kind] ?? l.kind}-Limit zu ${l.percentUsed}% verbraucht`)
    }
    warned.set(l.kind, level)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({ name: 'limit', description: 'Zeigt dein aktuelles Nutzungslimit an' })
    await show($, (await $.session.usage()).rateLimits)
    return result
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) await show($, e.rateLimits)
    return next(e)
  })

  on('command.run', { command: 'limit' }, async ($, e, next) => {
    const { rateLimits } = await $.session.usage()
    const now = await $.clock.now()
    if (rateLimits.length === 0) {
      return { text: 'Noch keine Limit-Daten – sie kommen mit der ersten Modell-Antwort (nur bei Abo-Konten).' }
    }
    const rows = rateLimits.map(l => {
      const reset = formatIn(l.resetsAt, now)
      const filled = Math.min(20, Math.round(l.percentUsed / 5))
      const bar = '█'.repeat(filled) + '░'.repeat(20 - filled)
      return `${(LABELS[l.kind] ?? l.kind).padEnd(7)} ${bar} ${l.percentUsed}%${reset ? `  · Reset in ${reset}` : ''}`
    })
    return { text: rows.join('\n') }
  })
}
