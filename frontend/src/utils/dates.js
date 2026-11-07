const pad = (n) => String(n).padStart(2, '0')
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (s) => new Date(`${s}T00:00:00`)

export const todayStr = () => toStr(new Date())
export const monthKey = (s) => s.slice(0, 7)

export const monthLabel = (key) =>
  parse(`${key}-01`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })

export const formatDate = (s) =>
  parse(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatShort = (s) =>
  parse(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export function addDays(s, n) {
  const d = parse(s)
  d.setDate(d.getDate() + n)
  return toStr(d)
}

// Inclusive number of days between two ISO dates (minimum 1).
export const daysBetween = (a, b) => Math.max(1, Math.round((parse(b) - parse(a)) / 864e5) + 1)

export function eachDay(from, to) {
  const out = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export const monthStart = (key) => `${key}-01`
export const monthEnd = (key) => toStr(new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0))

export function monthsBetween(from, to) {
  const out = []
  for (let k = monthKey(from); k <= monthKey(to); k = addMonths(k, 1)) out.push(k)
  return out
}
