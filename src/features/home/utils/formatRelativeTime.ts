const rtf = new Intl.RelativeTimeFormat('ja', { numeric: 'auto' })

const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
]

export function formatRelativeTime(iso: string | undefined): string {
  const timestamp = iso ? new Date(iso).getTime() : NaN
  if (Number.isNaN(timestamp)) return ''

  const diffMs = timestamp - Date.now()
  const absMs = Math.abs(diffMs)

  if (absMs < 60 * 1000) return 'たった今'

  for (const { unit, ms } of UNITS) {
    if (absMs >= ms) return rtf.format(Math.round(diffMs / ms), unit)
  }
  return rtf.format(Math.round(diffMs / (60 * 1000)), 'minute')
}
