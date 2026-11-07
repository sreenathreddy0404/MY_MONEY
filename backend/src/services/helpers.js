import { toDbDate } from "../utils/dates.js"
import { notFound, badRequest } from "../utils/errors.js"

export const dateWhere = (from, to) =>
  from || to
    ? { date: { ...(from ? { gte: toDbDate(from) } : {}), ...(to ? { lte: toDbDate(to) } : {}) } }
    : {}

// Loads accounts by id for this user only. Throws if any is missing (i.e. not owned / nonexistent).
export async function loadOwnedAccounts(db, userId, ids) {
  const unique = [...new Set(ids)]
  const found = await db.account.findMany({ where: { userId, id: { in: unique } } })
  if (found.length !== unique.length) throw notFound("Account not found")
  return new Map(found.map((a) => [a.id, a]))
}

// New entries can only use active accounts. When editing, the record's existing account stays allowed.
export function assertUsable(accounts, allowedInactiveIds = []) {
  for (const a of accounts.values()) {
    if (!a.active && !allowedInactiveIds.includes(a.id)) {
      throw badRequest(`Account "${a.accountName}" is inactive. Activate it first.`)
    }
  }
}

export async function loadOwnedCategory(db, userId, id) {
  const c = await db.category.findFirst({ where: { id, userId } })
  if (!c) throw notFound("Category not found")
  return c
}
