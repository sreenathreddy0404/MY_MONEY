import { prisma } from "../config/prisma.js"
import { toDbDate } from "../utils/dates.js"
import { badRequest, notFound } from "../utils/errors.js"
import { buildPagination } from "../utils/pagination.js"
import { assertUsable, dateWhere, loadOwnedAccounts } from "./helpers.js"

const buildWhere = (userId, q) => ({
  userId,
  ...(q.accountId ? { OR: [{ fromAccountId: q.accountId }, { toAccountId: q.accountId }] } : {}),
  ...dateWhere(q.from, q.to),
  ...(q.search ? { note: { contains: q.search, mode: "insensitive" } } : {}),
})

export async function listTransfers(userId, q) {
  const where = buildWhere(userId, q)
  const orderBy = [{ [q.sortBy]: q.order }, ...(q.sortBy === "date" ? [] : [{ date: "desc" }]), { id: "desc" }]
  const [rows, total] = await prisma.$transaction([
    prisma.transfer.findMany({ where, orderBy, skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.transfer.count({ where }),
  ])
  return { rows, pagination: buildPagination(q, total) }
}

export const createTransfer = (userId, v) =>
  prisma.$transaction(async (tx) => {
    if (v.fromAccountId === v.toAccountId) throw badRequest("Cannot transfer to the same account")
    assertUsable(await loadOwnedAccounts(tx, userId, [v.fromAccountId, v.toAccountId]))
    return tx.transfer.create({
      data: { userId, fromAccountId: v.fromAccountId, toAccountId: v.toAccountId, amount: v.amount, note: v.note, date: toDbDate(v.date) },
    })
  })

export const updateTransfer = (userId, id, v) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.transfer.findFirst({ where: { id, userId } })
    if (!existing) throw notFound("Transfer not found")
    if (v.fromAccountId === v.toAccountId) throw badRequest("Cannot transfer to the same account")
    assertUsable(await loadOwnedAccounts(tx, userId, [v.fromAccountId, v.toAccountId]), [existing.fromAccountId, existing.toAccountId])
    await tx.transfer.updateMany({
      where: { id, userId },
      data: { fromAccountId: v.fromAccountId, toAccountId: v.toAccountId, amount: v.amount, note: v.note, date: toDbDate(v.date) },
    })
    return tx.transfer.findFirst({ where: { id, userId } })
  })

export async function deleteTransfer(userId, id) {
  const r = await prisma.transfer.deleteMany({ where: { id, userId } })
  if (!r.count) throw notFound("Transfer not found")
}
