import { prisma } from "../config/prisma.js"
import { toDbDate } from "../utils/dates.js"
import { notFound } from "../utils/errors.js"
import { buildPagination } from "../utils/pagination.js"
import { assertUsable, dateWhere, loadOwnedAccounts } from "./helpers.js"

const buildWhere = (userId, q) => ({
  userId,
  ...(q.accountId ? { accountId: q.accountId } : {}),
  ...(q.source ? { source: q.source } : {}),
  ...dateWhere(q.from, q.to),
  ...(q.search
    ? {
        OR: [
          { description: { contains: q.search, mode: "insensitive" } },
          { source: { contains: q.search, mode: "insensitive" } },
        ],
      }
    : {}),
})

export async function listIncomes(userId, q) {
  const where = buildWhere(userId, q)
  const orderBy = [{ [q.sortBy]: q.order }, ...(q.sortBy === "date" ? [] : [{ date: "desc" }]), { id: "desc" }]
  // Refunds are reported separately and never counted as ordinary income.
  const [rows, total, inc, ref] = await prisma.$transaction([
    prisma.income.findMany({ where, orderBy, skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.income.count({ where }),
    prisma.income.aggregate({ where: { AND: [where, { source: { not: "Refund" } }] }, _sum: { amount: true } }),
    prisma.income.aggregate({ where: { AND: [where, { source: "Refund" }] }, _sum: { amount: true } }),
  ])
  return {
    rows,
    pagination: buildPagination(q, total),
    summary: { income: inc._sum.amount || 0, refunds: ref._sum.amount || 0 },
  }
}

export async function getIncome(userId, id) {
  const i = await prisma.income.findFirst({ where: { id, userId } })
  if (!i) throw notFound("Income not found")
  return i
}

export const createIncome = (userId, v) =>
  prisma.$transaction(async (tx) => {
    assertUsable(await loadOwnedAccounts(tx, userId, [v.accountId]))
    return tx.income.create({
      data: { userId, accountId: v.accountId, amount: v.amount, source: v.source, description: v.description, date: toDbDate(v.date) },
    })
  })

export const updateIncome = (userId, id, v) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.income.findFirst({ where: { id, userId } })
    if (!existing) throw notFound("Income not found")
    assertUsable(await loadOwnedAccounts(tx, userId, [v.accountId]), [existing.accountId])
    await tx.income.updateMany({
      where: { id, userId },
      data: { accountId: v.accountId, amount: v.amount, source: v.source, description: v.description, date: toDbDate(v.date) },
    })
    return tx.income.findFirst({ where: { id, userId } })
  })

export async function deleteIncome(userId, id) {
  const r = await prisma.income.deleteMany({ where: { id, userId } })
  if (!r.count) throw notFound("Income not found")
}
