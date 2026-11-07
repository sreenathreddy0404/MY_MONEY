export const CURRENCIES = {
  INR: { symbol: '₹', locale: 'en-IN', label: 'Indian Rupee (₹)' },
  USD: { symbol: '$', locale: 'en-US', label: 'US Dollar ($)' },
  EUR: { symbol: '€', locale: 'en-IE', label: 'Euro (€)' },
  GBP: { symbol: '£', locale: 'en-GB', label: 'British Pound (£)' },
}

const cfg = (code) => CURRENCIES[code] || CURRENCIES.INR

// Convert a whole/decimal rupee number to integer paise (used for seed data).
export const inr = (n) => Math.round(n * 100)

// Parse user input like "1,250.50" into integer paise. Returns null if invalid.
export function toPaise(input) {
  const s = String(input ?? '').trim().replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const [whole, frac = ''] = s.split('.')
  return parseInt(whole, 10) * 100 + parseInt((frac + '00').slice(0, 2), 10)
}

// Integer paise -> editable string ("120" or "120.50").
export function fromPaise(paise) {
  const abs = Math.abs(paise)
  const whole = Math.floor(abs / 100)
  const frac = abs % 100
  return frac ? `${whole}.${String(frac).padStart(2, '0')}` : String(whole)
}

export function formatMoney(paise, currency = 'INR') {
  const c = cfg(currency)
  const abs = Math.abs(paise)
  const whole = Math.floor(abs / 100)
  const frac = abs % 100
  const w = new Intl.NumberFormat(c.locale).format(whole)
  const f = frac ? `.${String(frac).padStart(2, '0')}` : ''
  return `${paise < 0 ? '-' : ''}${c.symbol}${w}${f}`
}

export function formatCompact(paise, currency = 'INR') {
  const c = cfg(currency)
  const n = paise / 100
  const abs = Math.abs(n)
  let out
  if (abs >= 1e6) out = `${+(abs / 1e6).toFixed(1)}M`
  else if (abs >= 1e3) out = `${+(abs / 1e3).toFixed(1)}K`
  else out = String(Math.round(abs))
  return `${n < 0 ? '-' : ''}${c.symbol}${out}`
}
