import { expect, test } from 'claude-code/testing'

import { formatLine } from './register'

const LIMITS = [
  { kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-10T12:30:00Z' },
  { kind: 'seven_day', percentUsed: 85.5 },
]

test('formatLine fasst die Fenster zusammen', () => {
  const now = Date.parse('2026-10-10T10:00:00Z')
  expect(formatLine(LIMITS, now)).toBe('Limit: 5h 42% (Reset in 2h 30m) · 7T 85.5%')
  expect(formatLine([], now)).toBe(undefined)
})

test('session.measure setzt die Statuszeile und warnt ab 80%', async ($, on) => {
  const status: (string | undefined)[] = []
  const toasts: string[] = []
  on('clock.now', () => ({ value: Date.parse('2026-10-10T10:00:00Z') }))
  on('ui.status', ($, e) => (status.push(e.text), { value: undefined }))
  on('ui.toast', ($, e) => (toasts.push(e.text), { value: undefined }))
  on('session.measure', ($, e) => ({ changed: e.changed }))

  await $.session.measure({ context: { contextWindow: 200000 } as never, rateLimits: LIMITS, changed: ['rateLimits'] })

  expect(status.at(-1)).toMatch(/^Limit: 5h 42%.* · 7T 85.5%$/)
  expect(toasts).toHaveLength(1)
})

test('/limit zeigt Balken', async ($, on) => {
  on('clock.now', () => ({ value: Date.parse('2026-10-10T10:00:00Z') }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {} as never, rateLimits: LIMITS } }))
  on('command.run', () => ({ text: 'unbehandelt' }))
  const r = await $.command.run({ command: 'limit', args: '' } as never)
  expect((r as { text: string }).text).toContain('5h')
  expect((r as { text: string }).text).toContain('█')
})
