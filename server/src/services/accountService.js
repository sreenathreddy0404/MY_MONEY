import { prisma } from "../config/prisma.js"
import { conflict, notFound } from "../utils/errors.js"

// Balance = opening + income - expenses + transfers received - transfers sent (all integer paise).
// Computed with 4 grouped aggregates, never by loading every row.
export async function balancesFor(userId, db = prisma) {
  const [inc, exp, out, inn] = await Promise.all([
    db.income.groupBy({ by: ["accountId"], where: { userId }, _sum: { amount: true } }),
    db.expense.groupBy({ by: ["accountId"], where: { userId }, _sum: { amount: true } }),
    db.transfer.groupBy({ by: ["fromAccountId"], where: { userId }, _sum: { amount: true } }),
    db.transfer.groupBy({ by: ["toAccountId"], where: { userId }, _sum: { amount: true } }),
  ])
  const delta = new Map()
  const bump = (id, n) => delta.set(id, (delta.get(id) || 0) + n)
  inc.forEach((r) => bump(r.accountId, r._sum.amount || 0))
  exp.forEach((r) => bump(r.accountId, -(r._sum.amount || 0)))
  out.forEach((r) => bump(r.fromAccountId, -(r._sum.amount || 0)))
  inn.forEach((r) => bump(r.toAccountId, r._sum.amount || 0))
  return delta
}

export const listAccounts = async (userId) => {
  const [accounts, delta] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    balancesFor(userId),
  ])
  return accounts.map((a) => ({ account: a, balance: a.openingBalance + (delta.get(a.id) || 0) }))
}

export async function getAccount(userId, id) {
  const a = await prisma.account.findFirst({ where: { id, userId } })
  if (!a) throw notFound("Account not found")
  const delta = await balancesFor(userId)
  return { account: a, balance: a.openingBalance + (delta.get(a.id) || 0) }
}

async function assertUniqueName(userId, accountName, exceptId) {
  const dup = await prisma.account.findFirst({
    where: { userId, accountName: { equals: accountName, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  })
  if (dup) throw conflict("You already have an account with that name")
}

const toColumns = (v) => ({
  accountName: v.name,
  bankName: v.bankName,
  accountType: v.type,
  lastFourDigits: v.type === "Savings" || v.type === "Current" ? v.lastFour : "",
  openingBalance: v.openingBalance,
})

export async function createAccount(userId, v) {
  await assertUniqueName(userId, v.name)
  const a = await prisma.account.create({ data: { userId, ...toColumns(v) } })
  return { account: a, balance: a.openingBalance }
}

export async function updateAccount(userId, id, v) {
  await getAccount(userId, id)
  await assertUniqueName(userId, v.name, id)
  // updateMany with userId in the filter makes cross-user writes impossible even if the check above is bypassed.
  await prisma.account.updateMany({ where: { id, userId }, data: toColumns(v) })
  return getAccount(userId, id)
}

export async function setAccountStatus(userId, id, active) {
  await getAccount(userId, id)
  await prisma.account.updateMany({ where: { id, userId }, data: { active } })
  return getAccount(userId, id)
}

// History is protected: an account that has any income, expense or transfer cannot be deleted
// (deactivate it instead). Unused accounts are removed outright.
export async function deleteAccount(userId, id) {
  await getAccount(userId, id)
  const [e, i, t] = await Promise.all([
    prisma.expense.count({ where: { userId, accountId: id } }),
    prisma.income.count({ where: { userId, accountId: id } }),
    prisma.transfer.count({ where: { userId, OR: [{ fromAccountId: id }, { toAccountId: id }] } }),
  ])
  if (e + i + t > 0) {
    throw conflict("This account has transaction history and cannot be deleted. Deactivate it instead to keep your history intact.", {
      expenses: e,
      incomes: i,
      transfers: t,
    })
  }
  await prisma.account.deleteMany({ where: { id, userId } })
}
