// End-to-end smoke test against a RUNNING server (npm run dev) with a real database.
//   npm run test:smoke            (from the server/ folder, or from the project root)
// It registers throwaway users with random emails and leaves their data behind (use a dev database).
const BASE = process.env.API_URL || "http://localhost:5000/api"

let pass = 0
let fail = 0
const check = (name, cond, extra) => {
  if (cond) {
    pass++
    console.log(`  ok   ${name}`)
  } else {
    fail++
    console.log(`  FAIL ${name}${extra !== undefined ? " -> " + JSON.stringify(extra) : ""}`)
  }
}

// Tiny cookie-jar client (the real browser handles this for the app).
function client() {
  let cookie = ""
  const call = async (method, path, body) => {
    const res = await fetch(BASE + path, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const set = res.headers.getSetCookie?.() ?? []
    const tok = set.find((c) => c.startsWith("mymoney_token="))
    if (tok) cookie = tok.split(";")[0] === "mymoney_token=" ? "" : tok.split(";")[0]
    let json = null
    try { json = await res.json() } catch { /* empty */ }
    return { status: res.status, json, setCookie: tok }
  }
  return { call, getCookie: () => cookie, setCookie: (c) => { cookie = c } }
}

const today = new Date().toISOString().slice(0, 10)
const month = today.slice(0, 7)
const rnd = Math.random().toString(36).slice(2, 8)
const pw = "Passw0rd!x"

async function main() {
  const A = client()
  const B = client()

  console.log("\nAuth")
  let r = await A.call("GET", "/accounts")
  check("unauthenticated request is 401", r.status === 401)
  r = await A.call("POST", "/auth/register", { name: "Alice", email: `alice_${rnd}@test.dev`, password: pw, confirmPassword: pw })
  check("register 201", r.status === 201, r.json)
  check("cookie is httpOnly + SameSite=Lax", /HttpOnly/i.test(r.setCookie || "") && /SameSite=Lax/i.test(r.setCookie || ""), r.setCookie)
  check("response never contains a token or hash", !JSON.stringify(r.json).match(/token|hash/i))
  r = await A.call("POST", "/auth/register", { name: "Alice", email: `alice_${rnd}@test.dev`, password: pw, confirmPassword: pw })
  check("duplicate email 409", r.status === 409)
  r = await A.call("POST", "/auth/register", { name: "X", email: `x_${rnd}@test.dev`, password: pw, confirmPassword: "different1" })
  check("password mismatch 400", r.status === 400)
  r = await A.call("GET", "/auth/me")
  check("/auth/me restores session", r.status === 200 && r.json.data.user.name === "Alice", r.json)
  const oldCookie = A.getCookie()
  r = await A.call("POST", "/auth/logout")
  check("logout 200", r.status === 200)
  r = await A.call("GET", "/auth/me")
  check("after logout /me is 401", r.status === 401)
  A.setCookie(oldCookie)
  r = await A.call("GET", "/auth/me")
  check("old token is revoked server-side", r.status === 401)
  r = await A.call("POST", "/auth/login", { email: `alice_${rnd}@test.dev`, password: "wrongpass1" })
  check("wrong password 401", r.status === 401)
  r = await A.call("POST", "/auth/login", { email: `alice_${rnd}@test.dev`, password: pw })
  check("login 200", r.status === 200, r.json)

  console.log("\nSetup")
  r = await A.call("GET", "/categories")
  const cats = r.json.data
  check("8 default categories", cats.length === 8, cats.length)
  const food = cats.find((c) => c.name === "Food")
  const other = cats.find((c) => c.isDefault)
  r = await A.call("POST", "/accounts", { name: "Main", type: "Savings", lastFour: "1234", openingBalance: 100000 })
  check("create account 201", r.status === 201, r.json)
  const a1 = r.json.data
  r = await A.call("POST", "/accounts", { name: "Cash", type: "Cash", openingBalance: 0 })
  const a2 = r.json.data
  check("opening balance is the balance", a1.balance === 100000 && a2.balance === 0)

  console.log("\nExpenses + pagination (25 rows)")
  const created = []
  for (let i = 1; i <= 25; i++) {
    r = await A.call("POST", "/expenses", { amount: 1000, reason: i <= 12 ? `Auto ride ${i}` : `Lunch ${i}`, date: today, accountId: a1.id, categoryId: food.id })
    if (r.status !== 201) console.log(r.json)
    created.push(r.json?.data)
  }
  check("25 expenses created", created.every(Boolean))
  r = await A.call("GET", "/expenses")
  check("default page: 10 rows, total 25, 3 pages", r.json.data.length === 10 && r.json.pagination.total === 25 && r.json.pagination.totalPages === 3, r.json.pagination)
  check("page 1: hasNext, no previous", r.json.pagination.hasNext && !r.json.pagination.hasPrevious)
  check("summary total covers ALL filtered rows", r.json.summary.totalAmount === 25000, r.json.summary)
  r = await A.call("GET", "/expenses?page=3&limit=10")
  check("last page has 5 rows, no next", r.json.data.length === 5 && !r.json.pagination.hasNext && r.json.pagination.hasPrevious)
  const ids = new Set()
  for (const p of [1, 2, 3]) (await A.call("GET", `/expenses?page=${p}&limit=10`)).json.data.forEach((x) => ids.add(x.id))
  check("pages never overlap or skip rows", ids.size === 25, ids.size)
  r = await A.call("GET", "/expenses?limit=20")
  check("limit=20 ok", r.json.data.length === 20 && r.json.pagination.totalPages === 2)
  r = await A.call("GET", "/expenses?limit=50")
  check("limit=50 ok", r.json.data.length === 25 && r.json.pagination.totalPages === 1)
  check("limit=15 rejected", (await A.call("GET", "/expenses?limit=15")).status === 400)
  check("page=0 rejected", (await A.call("GET", "/expenses?page=0")).status === 400)
  r = await A.call("GET", "/expenses?search=auto&page=2&limit=10")
  check("search + page 2: total 12, 2 rows", r.json.pagination.total === 12 && r.json.data.length === 2, r.json.pagination)
  r = await A.call("GET", `/expenses?accountId=${a2.id}`)
  check("account filter (empty account) -> total 0", r.json.pagination.total === 0)
  r = await A.call("GET", `/expenses?categoryId=${food.id}&from=${today}&to=${today}&search=lunch&limit=10`)
  check("combined filters: 13 lunches", r.json.pagination.total === 13, r.json.pagination)
  r = await A.call("GET", "/expenses?from=2000-01-01&to=2000-01-31")
  check("date range with no data -> 0", r.json.pagination.total === 0)
  r = await A.call("GET", "/expenses?sortBy=amount&order=asc&limit=10")
  check("sorting accepted", r.status === 200)

  console.log("\nIncome, refunds, transfers, balances")
  r = await A.call("POST", "/incomes", { amount: 50000, source: "Salary", description: "Pay", date: today, accountId: a1.id })
  const salary = r.json.data
  r = await A.call("POST", "/incomes", { amount: 2000, source: "Refund", description: "Return", date: today, accountId: a1.id })
  r = await A.call("GET", "/incomes")
  check("income summary excludes refunds from income", r.json.summary.income === 50000 && r.json.summary.refunds === 2000, r.json.summary)
  r = await A.call("POST", "/transfers", { amount: 10000, fromAccountId: a1.id, toAccountId: a1.id, date: today })
  check("transfer to same account 400", r.status === 400)
  r = await A.call("POST", "/transfers", { amount: 10000, fromAccountId: a1.id, toAccountId: a2.id, date: today, note: "ATM" })
  check("transfer 201", r.status === 201, r.json)
  const trf = r.json.data
  r = await A.call("GET", "/accounts")
  const bal = Object.fromEntries(r.json.data.map((a) => [a.name, a.balance]))
  // 100000 opening + 50000 salary + 2000 refund - 25000 expenses - 10000 transfer out
  check("Main balance = 117000", bal.Main === 117000, bal)
  check("Cash balance = 10000 (transfer received)", bal.Cash === 10000, bal)
  r = await A.call("GET", `/dashboard/summary?month=${month}`)
  const d = r.json.data
  check("dashboard income excludes refunds + transfers = 50000", d.totals.income === 50000, d.totals)
  check("dashboard expenses unaffected by transfer = 25000", d.totals.expenses === 25000, d.totals)
  check("dashboard refunds tracked separately = 2000", d.totals.refunds === 2000)
  check("dashboard savings = 25000", d.totals.savings === 25000)
  check("available balance = 127000", d.availableBalance === 127000, d.availableBalance)
  check("recent has <= 7 items incl. all kinds", d.recent.length === 7 && d.recent.some((x) => x.kind === "transfer"), d.recent.map((x) => x.kind))

  console.log("\nEdit / delete update balances")
  r = await A.call("PUT", `/expenses/${created[0].id}`, { amount: 2000, reason: "Auto ride 1", date: today, accountId: a1.id, categoryId: food.id })
  check("edit expense 200", r.status === 200, r.json)
  bal.Main = (await A.call("GET", "/accounts")).json.data.find((a) => a.name === "Main").balance
  check("Main = 116000 after edit", bal.Main === 116000, bal.Main)
  r = await A.call("DELETE", `/expenses/${created[0].id}`)
  check("delete expense 200", r.status === 200)
  bal.Main = (await A.call("GET", "/accounts")).json.data.find((a) => a.name === "Main").balance
  check("Main = 118000 after delete", bal.Main === 118000, bal.Main)
  r = await A.call("DELETE", `/transfers/${trf.id}`)
  const after = (await A.call("GET", "/accounts")).json.data
  check("deleting transfer restores both accounts", after.find((a) => a.name === "Main").balance === 128000 && after.find((a) => a.name === "Cash").balance === 0, after.map((a) => a.balance))

  console.log("\nAccount / category rules")
  r = await A.call("DELETE", `/accounts/${a1.id}`)
  check("account with history cannot be deleted (409)", r.status === 409, r.json)
  r = await A.call("PATCH", `/accounts/${a2.id}/status`, { active: false })
  check("deactivate account", r.status === 200 && r.json.data.active === false)
  r = await A.call("POST", "/expenses", { amount: 100, reason: "x", date: today, accountId: a2.id, categoryId: food.id })
  check("cannot add expense to inactive account (400)", r.status === 400, r.json)
  r = await A.call("DELETE", `/accounts/${a2.id}`)
  check("unused account can be deleted", r.status === 200, r.json)
  r = await A.call("POST", "/categories", { name: "Pets", color: "#112233" })
  const pets = r.json.data
  await A.call("POST", "/expenses", { amount: 500, reason: "Kibble", date: today, accountId: a1.id, categoryId: pets.id })
  r = await A.call("DELETE", `/categories/${pets.id}`)
  check("delete category moves expenses (moved=1)", r.status === 200 && r.json.data.moved === 1, r.json)
  r = await A.call("GET", "/expenses?search=kibble")
  check("moved expense now in Other", r.json.data[0]?.categoryId === other.id)
  check("default category cannot be deleted", (await A.call("DELETE", `/categories/${other.id}`)).status === 400)

  console.log("\nAnalytics")
  r = await A.call("GET", `/analytics/overview?from=${month}-01&to=${today}&keyword=auto`)
  const an = r.json.data
  check("analytics 200", r.status === 200, r.json)
  // 24 remaining 1000-paise expenses (first one deleted) + the 500 Kibble expense = 24500
  check("analytics totals: income 50000, expenses 24500", an.totals.income === 50000 && an.totals.expenses === 24500, an.totals)
  check("keyword stats counts auto rides", an.keywordStats.count === 11, an.keywordStats)
  check("category + account + reasons populated", an.byCategory.length > 0 && an.byAccount.length > 0 && an.reasons.length > 0)
  check("invalid range rejected", (await A.call("GET", "/analytics/overview?from=2026-02-01&to=2026-01-01")).status === 400)

  console.log("\nUser isolation (Bob tries to touch Alice's data)")
  r = await B.call("POST", "/auth/register", { name: "Bob", email: `bob_${rnd}@test.dev`, password: pw, confirmPassword: pw })
  check("bob registered", r.status === 201)
  const bobExpenses = await B.call("GET", "/expenses")
  check("bob sees 0 expenses", bobExpenses.json.pagination.total === 0)
  check("bob sees 0 accounts", (await B.call("GET", "/accounts")).json.data.length === 0)
  check("GET alice account -> 404", (await B.call("GET", `/accounts/${a1.id}`)).status === 404)
  check("GET alice expense -> 404", (await B.call("GET", `/expenses/${created[1].id}`)).status === 404)
  check("PUT alice expense -> 404", (await B.call("PUT", `/expenses/${created[1].id}`, { amount: 1, reason: "hax", date: today, accountId: a1.id, categoryId: food.id })).status === 404)
  check("DELETE alice expense -> 404", (await B.call("DELETE", `/expenses/${created[1].id}`)).status === 404)
  check("DELETE alice income -> 404", (await B.call("DELETE", `/incomes/${salary.id}`)).status === 404)
  check("PATCH alice account -> 404", (await B.call("PATCH", `/accounts/${a1.id}/status`, { active: false })).status === 404)
  const bobAcc = (await B.call("POST", "/accounts", { name: "Bob Main", type: "Savings", openingBalance: 0 })).json.data
  const bobCats = (await B.call("GET", "/categories")).json.data
  check("expense on alice account -> 404", (await B.call("POST", "/expenses", { amount: 1, reason: "x", date: today, accountId: a1.id, categoryId: bobCats[0].id })).status === 404)
  check("expense with alice category -> 404", (await B.call("POST", "/expenses", { amount: 1, reason: "x", date: today, accountId: bobAcc.id, categoryId: food.id })).status === 404)
  check("transfer from alice account -> 404", (await B.call("POST", "/transfers", { amount: 1, fromAccountId: a1.id, toAccountId: bobAcc.id, date: today })).status === 404)
  check("bob dashboard is empty", (await B.call("GET", "/dashboard/summary")).json.data.totals.expenses === 0)
  check("alice data intact", (await A.call("GET", "/expenses")).json.pagination.total === 25)

  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error("Smoke test crashed:", e.message, "\nIs the server running at", BASE, "?")
  process.exit(1)
})
