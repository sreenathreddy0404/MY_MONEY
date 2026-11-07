import { fromDbDate } from "./dates.js"

// Backend column names -> the field names the existing frontend already uses.
export const account = (a, balance) => ({
  id: a.id,
  name: a.accountName,
  bankName: a.bankName,
  type: a.accountType,
  lastFour: a.lastFourDigits,
  openingBalance: a.openingBalance,
  active: a.active,
  ...(balance === undefined ? {} : { balance }),
})

export const category = (c) => ({
  id: c.id,
  name: c.name,
  type: c.type,
  color: c.color,
  isDefault: c.isDefault,
  ...(c._count ? { expenseCount: c._count.expenses } : {}),
})

export const expense = (e) => ({
  id: e.id,
  accountId: e.accountId,
  categoryId: e.categoryId,
  amount: e.amount,
  reason: e.reason,
  notes: e.notes,
  date: fromDbDate(e.date),
})

export const income = (i) => ({
  id: i.id,
  accountId: i.accountId,
  amount: i.amount,
  source: i.source,
  description: i.description,
  date: fromDbDate(i.date),
})

export const transfer = (t) => ({
  id: t.id,
  fromAccountId: t.fromAccountId,
  toAccountId: t.toAccountId,
  amount: t.amount,
  note: t.note,
  date: fromDbDate(t.date),
})
