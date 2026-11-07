// Seeds a demo user with the original MyMoney dummy data. Safe to re-run: it replaces the demo user's data only.
import "dotenv/config"
import bcrypt from "bcrypt"
import { PrismaClient } from "@prisma/client"
import { DEFAULT_CATEGORIES } from "../src/services/categoryService.js"
import { transactions } from "./seed-data/transactions.js"
import { incomes } from "./seed-data/incomes.js"
import { transfers } from "./seed-data/transfers.js"

const prisma = new PrismaClient()

const DEMO = { name: "Demo User", email: "demo@mymoney.test", password: "Demo@1234" }
const inr = (n) => Math.round(n * 100)
const d = (s) => new Date(`${s}T00:00:00.000Z`)

const ACCOUNTS = [
  { key: "acc_hdfc", accountName: "HDFC Bank", bankName: "HDFC Bank", accountType: "Savings", lastFourDigits: "4521", openingBalance: inr(15000) },
  { key: "acc_sbi", accountName: "SBI Bank", bankName: "State Bank of India", accountType: "Savings", lastFourDigits: "7823", openingBalance: inr(6000) },
  { key: "acc_cash", accountName: "Cash Wallet", bankName: "", accountType: "Cash", lastFourDigits: "", openingBalance: inr(1500) },
]
const CATEGORY_KEYS = {
  cat_food: "Food", cat_travel: "Travel", cat_shopping: "Shopping", cat_education: "Education",
  cat_bills: "Bills", cat_entertainment: "Entertainment", cat_health: "Health", cat_other: "Other",
}

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO.email } }) // cascades to all of their data
  const passwordHash = await bcrypt.hash(DEMO.password, 12)

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name: DEMO.name, email: DEMO.email, passwordHash } })

    await tx.category.createMany({ data: DEFAULT_CATEGORIES.map((c) => ({ userId: user.id, type: "expense", isDefault: false, ...c })) })
    const cats = await tx.category.findMany({ where: { userId: user.id } })
    const catId = Object.fromEntries(Object.entries(CATEGORY_KEYS).map(([k, name]) => [k, cats.find((c) => c.name === name).id]))

    const accId = {}
    for (const { key, ...a } of ACCOUNTS) {
      accId[key] = (await tx.account.create({ data: { userId: user.id, ...a } })).id
    }

    await tx.expense.createMany({
      data: transactions.map((e) => ({
        userId: user.id, accountId: accId[e.accountId], categoryId: catId[e.categoryId],
        amount: e.amount, reason: e.reason, notes: e.notes || "", date: d(e.date),
      })),
    })
    await tx.income.createMany({
      data: incomes.map((i) => ({
        userId: user.id, accountId: accId[i.accountId], amount: i.amount, source: i.source,
        description: i.description || "", date: d(i.date),
      })),
    })
    await tx.transfer.createMany({
      data: transfers.map((t) => ({
        userId: user.id, fromAccountId: accId[t.fromAccountId], toAccountId: accId[t.toAccountId],
        amount: t.amount, note: t.note || "", date: d(t.date),
      })),
    })
    console.log(`Seeded ${transactions.length} expenses, ${incomes.length} incomes, ${transfers.length} transfers.`)
  })
  console.log(`Demo login -> ${DEMO.email} / ${DEMO.password}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
