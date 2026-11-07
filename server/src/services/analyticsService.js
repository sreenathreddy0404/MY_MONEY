import { Prisma } from "@prisma/client"
import { prisma } from "../config/prisma.js"
import { addMonths, daysBetween, fromDbDate, monthEnd, monthStart, todayStr, toDbDate } from "../utils/dates.js"
import { balancesFor } from "./accountService.js"
import { dateWhere } from "./helpers.js"

const num = (v) => Number(v ?? 0)

// Distinct YYYY-MM keys that have any activity, newest first.
export async function activityMonths(userId) {
  const rows = await prisma.$queryRaw`
    SELECT DISTINCT to_char(d, YYYY-MM) AS m FROM (
      SELECT date AS d FROM "Expense"  WHERE "userId" = ${userId}
      UNION ALL SELECT date FROM "Income"   WHERE "userId" = ${userId}
      UNION ALL SELECT date FROM "Transfer" WHERE "userId" = ${userId}
    ) t ORDER BY m DESC`
  return rows.map((r) => r.m)
}

// Income / refunds / expenses per month between two dates (inclusive), straight from SQL.
async function monthlyRows(userId, from, to) {
  const rows = await prisma.$queryRaw`
    SELECT m,
      COALESCE(SUM(CASE WHEN k = income THEN amt END), 0)  AS income,
      COALESCE(SUM(CASE WHEN k = refund THEN amt END), 0)  AS refunds,
      COALESCE(SUM(CASE WHEN k = expense THEN amt END), 0) AS expenses
    FROM (
      SELECT to_char(date, YYYY-MM) AS m, amount AS amt, expense AS k
        FROM "Expense" WHERE "userId" = ${userId} AND date >= ${from}::date AND date <= ${to}::date
      UNION ALL
      SELECT to_char(date, YYYY-MM), amount, CASE WHEN source = Refund THEN refund ELSE income END
        FROM "Income" WHERE "userId" = ${userId} AND date >= ${from}::date AND date <= ${to}::date
    ) t GROUP BY m ORDER BY m`
  return new Map(rows.map((r) => [r.m, { income: num(r.income), refunds: num(r.refunds), expenses: num(r.expenses) }]))
}

const withSavings = (r) => ({ ...r, savings: r.income - r.expenses })

async function totalsBetween(userId, from, to) {
  const range = dateWhere(from, to)
  const [inc, ref, exp] = await Promise.all([
    prisma.income.aggregate({ where: { userId, ...range, source: { not: "Refund" } }, _sum: { amount: true } }),
    prisma.income.aggregate({ where: { userId, ...range, source: "Refund" }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { userId, ...range }, _sum: { amount: true }, _count: true }),
  ])
  return withSavings({ income: inc._sum.amount || 0, refunds: ref._sum.amount || 0, expenses: exp._sum.amount || 0, expenseCount: exp._count })
}

async function categoryTotals(userId, from, to) {
  const [groups, cats] = await Promise.all([
    prisma.expense.groupBy({ by: ["categoryId"], where: { userId, ...dateWhere(from, to) }, _sum: { amount: true } }),
    prisma.category.findMany({ where: { userId } }),
  ])
  const byId = new Map(cats.map((c) => [c.id, c]))
  return groups
    .map((g) => ({ id: g.categoryId, name: byId.get(g.categoryId)?.name ?? "Other", color: byId.get(g.categoryId)?.color ?? "#94a3b8", value: g._sum.amount || 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
}

export async function dashboardSummary(userId, monthParam) {
  const [months, accounts, delta] = await Promise.all([
    activityMonths(userId),
    prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    balancesFor(userId),
  ])
  const month = monthParam || months[0] || todayStr().slice(0, 7)
  const from = monthStart(month)
  const to = monthEnd(month)

  const accountList = accounts.map((a) => ({ id: a.id, name: a.accountName, bankName: a.bankName, type: a.accountType, lastFour: a.lastFourDigits, openingBalance: a.openingBalance, active: a.active, balance: a.openingBalance + (delta.get(a.id) || 0) }))
  const availableBalance = accountList.filter((a) => a.active).reduce((t, a) => t + a.balance, 0)

  // Last 6 months that have activity, ending at the selected month.
  const seriesMonths = months.filter((m) => m <= month).slice(0, 6).reverse()
  const seriesMap = seriesMonths.length ? await monthlyRows(userId, monthStart(seriesMonths[0]), to) : new Map()
  const series = seriesMonths.map((m) => ({ month: m, ...withSavings(seriesMap.get(m) || { income: 0, refunds: 0, expenses: 0 }) }))

  const range = dateWhere(from, to)
  const order = [{ date: "desc" }, { createdAt: "desc" }]
  const [totals, byCategory, ex, inc, tr] = await Promise.all([
    totalsBetween(userId, from, to),
    categoryTotals(userId, from, to),
    prisma.expense.findMany({ where: { userId, ...range }, orderBy: order, take: 7 }),
    prisma.income.findMany({ where: { userId, ...range }, orderBy: order, take: 7 }),
    prisma.transfer.findMany({ where: { userId, ...range }, orderBy: order, take: 7 }),
  ])
  const ser = (kind, r) => ({ ...r, kind, date: fromDbDate(r.date), _t: r.createdAt.getTime() })
  const recent = [...ex.map((r) => ser("expense", r)), ...inc.map((r) => ser("income", r)), ...tr.map((r) => ser("transfer", r))]
    .sort((a, b) => b.date.localeCompare(a.date) || b._t - a._t)
    .slice(0, 7)
    .map(({ _t, userId: _u, createdAt, updatedAt, ...r }) => r)

  return { month, months, totals, availableBalance, accounts: accountList, series, byCategory, recent }
}

export async function analyticsOverview(userId, { from: qFrom, to: qTo, keyword }) {
  // Default range = all time.
  let from = qFrom
  let to = qTo
  if (!from || !to) {
    const [e, i] = await Promise.all([
      prisma.expense.aggregate({ where: { userId }, _min: { date: true }, _max: { date: true } }),
      prisma.income.aggregate({ where: { userId }, _min: { date: true }, _max: { date: true } }),
    ])
    const mins = [e._min.date, i._min.date].filter(Boolean).map(fromDbDate).sort()
    const maxs = [e._max.date, i._max.date].filter(Boolean).map(fromDbDate).sort()
    from = from || mins[0] || todayStr()
    to = to || maxs[maxs.length - 1] || todayStr()
  }
  // Days elapsed: a range extending into the future only counts up to today.
  const today = todayStr()
  const lastDay = to > today ? (today < from ? from : today) : to

  const range = dateWhere(from, to)
  const [totals, monthMap, byCategory, accGroups, accounts, dailyRows, reasonRows, kw] = await Promise.all([
    totalsBetween(userId, from, to),
    monthlyRows(userId, from, to),
    categoryTotals(userId, from, to),
    prisma.expense.groupBy({ by: ["accountId"], where: { userId, ...range }, _sum: { amount: true } }),
    prisma.account.findMany({ where: { userId }, select: { id: true, accountName: true } }),
    prisma.$queryRaw`
      SELECT to_char(date, YYYY-MM-DD) AS d, SUM(amount) AS amount FROM "Expense"
      WHERE "userId" = ${userId} AND date >= ${from}::date AND date <= ${to}::date
      GROUP BY d ORDER BY d`,
    prisma.$queryRaw`
      SELECT MIN(trim(reason)) AS reason, COUNT(*) AS count, SUM(amount) AS total FROM "Expense"
      WHERE "userId" = ${userId} AND date >= ${from}::date AND date <= ${to}::date
      GROUP BY lower(trim(reason)) ORDER BY count DESC, total DESC LIMIT 8`,
    keyword
      ? prisma.expense.aggregate({ where: { userId, ...range, reason: { contains: keyword, mode: "insensitive" } }, _sum: { amount: true }, _count: true })
      : Promise.resolve(null),
  ])

  const monthly = []
  for (let m = from.slice(0, 7); m <= lastDay.slice(0, 7); m = addMonths(m, 1)) {
    monthly.push({ month: m, ...withSavings(monthMap.get(m) || { income: 0, refunds: 0, expenses: 0 }) })
  }

  const dayMap = new Map(dailyRows.map((r) => [r.d, num(r.amount)]))
  const daily = []
  for (let d = from; d <= lastDay; ) {
    daily.push({ date: d, amount: dayMap.get(d) || 0 })
    const next = new Date(toDbDate(d).getTime() + 864e5)
    d = fromDbDate(next)
  }

  const nameById = new Map(accounts.map((a) => [a.id, a.accountName]))
  const byAccount = accGroups
    .map((g) => ({ id: g.accountId, name: nameById.get(g.accountId) ?? "Unknown", value: g._sum.amount || 0 }))
    .filter((a) => a.value > 0)
    .sort((a, b) => b.value - a.value)

  return {
    range: { from, to, lastDay },
    totals,
    averageDaily: Math.round(totals.expenses / daysBetween(from, lastDay)),
    monthly,
    byCategory,
    byAccount,
    daily,
    reasons: reasonRows.map((r) => ({ reason: r.reason, count: num(r.count), total: num(r.total) })),
    keywordStats: kw ? { count: kw._count, total: kw._sum.amount || 0 } : { count: 0, total: 0 },
  }
}
