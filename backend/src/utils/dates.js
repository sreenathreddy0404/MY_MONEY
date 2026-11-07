// Dates travel as YYYY-MM-DD strings; the DB stores DATE columns (UTC midnight).
export const toDbDate = (s) => new Date(`${s}T00:00:00.000Z`)
export const fromDbDate = (d) => d.toISOString().slice(0, 10)

const pad = (n) => String(n).padStart(2, "0")
export const todayStr = () => {
  const d = new Date()
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
export const monthStart = (key) => `${key}-01`
export const monthEnd = (key) => {
  const [y, m] = key.split("-").map(Number)
  return `${key}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}`
}
export const addMonths = (key, n) => {
  const [y, m] = key.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}
export const daysBetween = (a, b) => Math.max(1, Math.round((toDbDate(b) - toDbDate(a)) / 864e5) + 1)
