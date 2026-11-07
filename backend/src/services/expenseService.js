import { prisma } from "../config/prisma.js"
import { toDbDate } from "../utils/dates.js"
import { notFound } from "../utils/errors.js"
import { buildPagination } from "../utils/pagination.js"
import { assertUsable, dateWhere, loadOwnedAccounts, loadOwnedCategory } from "./helpers.js"

const buildWhere = (userId, q) => ({
  userId,
  ...(q.accountId ? { accountId: q.accountId } : {}),
  ...(q.categoryId ? { categoryId: q.categoryId } : {}),
  ...dateWhere(q.from, q.to),
  ...(q.search
    ? {
        OR: [
          { reason: { contains: q.search, mode: "insensitive" } },
          { notes: { contains: q.search, mode: "insensitive" } },
        ],
      }
    : {}),
})

export async function listExpenses(userId, q) {
  const where = buildWhere(userId, q)
  // Stable order: the requested key, then date, then id so pages never overlap or skip rows.
  const orderBy = [{ [q.sortBy]: q.order }, ...(q.sortBy === "date" ? [] : [{ date: "desc" }]), { id: "desc" }]
  // One round trip: page of rows + total count + sum for the whole filtered set.
  const [rows, total, agg] = await prisma.$transaction([
    prisma.expense.findMany({ where, orderBy, skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ])
  return { rows, pagination: buildPagination(q, total), summary: { totalAmount: agg._sum.amount || 0 } }
}

export async function getExpense(userId, id) {
  const e = await prisma.expense.findFirst({ where: { id, userId } })
  if (!e) throw notFound("Expense not found")
  return e
}

export const createExpense = (userId, v) =>
  prisma.$transaction(async (tx) => {
    assertUsable(await loadOwnedAccounts(tx, userId, [v.accountId]))
    await loadOwnedCategory(tx, userId, v.categoryId)
    return tx.expense.create({
      data: { userId, accountId: v.accountId, categoryId: v.categoryId, amount: v.amount, reason: v.reason, notes: v.notes, date: toDbDate(v.date) },
    })
  })

export const updateExpense = (userId, id, v) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findFirst({ where: { id, userId } })
    if (!existing) throw notFound("Expense not found")
    assertUsable(await loadOwnedAccounts(tx, userId, [v.accountId]), [existing.accountId])
    await loadOwnedCategory(tx, userId, v.categoryId)
    await tx.expense.updateMany({
      where: { id, userId },
      data: { accountId: v.accountId, categoryId: v.categoryId, amount: v.amount, reason: v.reason, notes: v.notes, date: toDbDate(v.date) },
    })
    return tx.expense.findFirst({ where: { id, userId } })
  })

export async function deleteExpense(userId, id) {
  const r = await prisma.expense.deleteMany({ where: { id, userId } })
  if (!r.count) throw notFound("Expense not found")
}
