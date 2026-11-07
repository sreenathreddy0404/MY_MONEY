import { daysBetween, eachDay, formatShort, monthLabel } from './dates'

export const sum = (list, pick = (x) => x.amount) => list.reduce((t, x) => t + pick(x), 0)

export const accountLabel = (a) => (a.lastFour ? `${a.name} ·· ${a.lastFour}` : a.name)

export const isRefund = (income) => income.source === 'Refund'

export const inRange = (date, from, to) => (!from || date >= from) && (!to || date <= to)

// Balance = opening + income - expenses + transfers received - transfers sent
export function accountBalances({ accounts, expenses, incomes, transfers }) {
  const bal = {}
  accounts.forEach((a) => {
    bal[a.id] = a.openingBalance
  })
  incomes.forEach((i) => {
    if (i.accountId in bal) bal[i.accountId] += i.amount
  })
  expenses.forEach((e) => {
    if (e.accountId in bal) bal[e.accountId] -= e.amount
  })
  transfers.forEach((t) => {
    if (t.toAccountId in bal) bal[t.toAccountId] += t.amount
    if (t.fromAccountId in bal) bal[t.fromAccountId] -= t.amount
  })
  return bal
}

// Ordinary income excludes refunds; transfers never appear here.
export function totals(expenses, incomes) {
  const income = sum(incomes.filter((i) => !isRefund(i)))
  const refunds = sum(incomes.filter(isRefund))
  const spent = sum(expenses)
  return { income, refunds, expenses: spent, savings: income - spent }
}

export function monthlySeries(expenses, incomes, months) {
  return months.map((m) => ({
    month: m,
    label: monthLabel(m),
    ...totals(
      expenses.filter((e) => e.date.startsWith(m)),
      incomes.filter((i) => i.date.startsWith(m)),
    ),
  }))
}

export function categoryTotals(expenses, categories) {
  const byCat = {}
  expenses.forEach((e) => {
    byCat[e.categoryId] = (byCat[e.categoryId] || 0) + e.amount
  })
  return categories
    .map((c) => ({ id: c.id, name: c.name, color: c.color, value: byCat[c.id] || 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function dailySpending(expenses, from, to) {
  const byDay = {}
  expenses.forEach((e) => {
    byDay[e.date] = (byDay[e.date] || 0) + e.amount
  })
  return eachDay(from, to).map((d) => ({ date: d, label: formatShort(d), amount: byDay[d] || 0 }))
}

export function accountExpenseTotals(expenses, accounts) {
  const byAcc = {}
  expenses.forEach((e) => {
    byAcc[e.accountId] = (byAcc[e.accountId] || 0) + e.amount
  })
  return accounts
    .map((a) => ({ id: a.id, name: a.name, value: byAcc[a.id] || 0 }))
    .filter((a) => a.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function topReasons(expenses, limit = 8) {
  const map = new Map()
  expenses.forEach((e) => {
    const key = e.reason.trim().toLowerCase()
    const row = map.get(key) || { reason: e.reason.trim(), count: 0, total: 0 }
    row.count += 1
    row.total += e.amount
    map.set(key, row)
  })
  return [...map.values()].sort((a, b) => b.count - a.count || b.total - a.total).slice(0, limit)
}

export function reasonSpending(expenses, keyword) {
  const k = keyword.trim().toLowerCase()
  if (!k) return { count: 0, total: 0 }
  const hits = expenses.filter((e) => e.reason.toLowerCase().includes(k))
  return { count: hits.length, total: sum(hits) }
}

export function averageDaily(totalPaise, from, to) {
  return Math.round(totalPaise / daysBetween(from, to))
}

// Unified, newest-first list of expenses, income and transfers.
export function activityFeed({ expenses, incomes, transfers }) {
  return [
    ...expenses.map((x) => ({ ...x, kind: 'expense' })),
    ...incomes.map((x) => ({ ...x, kind: 'income' })),
    ...transfers.map((x) => ({ ...x, kind: 'transfer' })),
  ]
    .map((x, i) => ({ ...x, _i: i }))
    .sort((a, b) => b.date.localeCompare(a.date) || b._i - a._i)
}
