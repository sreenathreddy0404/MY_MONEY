# MyMoney — Full-Stack

Personal finance tracker. React 18 + Vite + Tailwind frontend (design unchanged), Express + Prisma + Neon PostgreSQL backend, JWT in an httpOnly cookie, server-side pagination.

```
MyMoney/
├── src/                 React frontend (UI preserved)
│   ├── api/             fetch client + one module per resource
│   ├── context/         Auth, Theme, Toast
│   ├── hooks/           useStore (accounts/categories/prefs), usePagination, useDebounced
│   ├── pages/           Dashboard, Transactions, Income, Accounts, Analytics, Settings, Login, Register
│   └── components/      existing components + Pagination, ProtectedRoute
└── server/
    ├── prisma/          schema.prisma, seed.js, seed-data/
    ├── scripts/         smoke-test.mjs (end-to-end test for a running server)
    └── src/             config, middleware, validators (zod), services, controllers, routes, app.js, server.js
```

## Setup

Requires Node 20+.

1. **Create a Neon project** at https://neon.tech and copy its connection strings (Dashboard → Connect). Use the *pooled* string for `DATABASE_URL` and the *direct* (non-pooled) string for `DIRECT_URL`. If you only have one, use it for both.
2. **Configure the server**
   ```bash
   cp server/.env.example server/.env
   # edit server/.env: DATABASE_URL, DIRECT_URL, JWT_SECRET
   # generate a secret:
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. **Install** (installs the frontend, then the server via `postinstall`, which also runs `prisma generate`)
   ```bash
   npm install
   ```
4. **Create the tables.** The first run creates `server/prisma/migrations/<timestamp>_init` from `schema.prisma` and applies it to Neon:
   ```bash
   npm run db:migrate -- --name init
   ```
   Commit the generated `migrations/` folder. In production use `npm run db:deploy`.
5. **(Optional) demo data** — the original dummy data under a demo login (`demo@mymoney.test` / `Demo@1234`):
   ```bash
   npm run db:seed
   ```
6. **Run**
   ```bash
   npm run dev        # frontend http://localhost:5173  +  API http://localhost:5000
   ```

Open **http://localhost:5173** (not `127.0.0.1`: the API only accepts requests whose Origin is `CLIENT_URL`).

### Scripts (project root)

| Command | What it does |
|---|---|
| `npm run dev` | Frontend + API together (`concurrently`) |
| `npm run server` | API only (watch mode) |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (production) |
| `npm run db:seed` | Seed the demo user |
| `npm run test:smoke` | End-to-end checks against a running server |
| `npm run build` | Production frontend build |

### Environment

`server/.env`: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (32+ chars, enforced at startup), `CLIENT_URL`, `PORT`, `NODE_ENV`. No secrets are committed; `.env` files are git-ignored.

The root `.env` is optional. In dev, Vite proxies `/api` to port 5000, so the cookie is same-origin. If you host the API on a different origin in production, set `VITE_API_URL`; `SameSite=Lax` cookies then require both sites to share a registrable domain (e.g. `app.example.com` + `api.example.com`).

## Design notes

**Money** is integer paise everywhere (`Int` columns, integer JSON). Validation rejects floats, strings, zero/negative amounts and anything over ₹1 crore per entry (Postgres `INT` limit). Totals are computed in SQL.

**Balance** = opening + income − expenses + transfers in − transfers out, via four grouped aggregates (no row loading). Transfers never touch income/expense totals. Refunds (`source = "Refund"`) change the account balance but are excluded from income totals, savings and analytics income, matching the original `calc.js`.

**Auth** — bcrypt (12 rounds), JWT (7 days) in an `httpOnly`, `SameSite=Lax`, `Secure`-in-production cookie; nothing in localStorage. Logout clears the cookie and increments `User.tokenVersion`, so the old token is rejected even if copied. `/auth/me` restores the session on refresh. Login (10 per 15 min) and register (10 per hour) are rate-limited per IP, plus a generic API limit. Unknown email and wrong password give the same message. Mutating requests with a foreign `Origin` header are refused.

**Isolation** — every query is scoped by the `userId` from the verified session, never from the request. Writes use `updateMany/deleteMany` with `userId` in the filter. Referenced accounts/categories are loaded by `{id, userId}`; a foreign id returns 404.

**Integrity**
- Accounts/categories referenced by history use `onDelete: Restrict`. `DELETE /api/accounts/:id` returns **409** if the account has any income, expense or transfer (deactivate it instead); unused accounts are deleted. Inactive accounts keep their history and can't take new entries.
- Deleting a category moves its expenses to the user's "Other" category in one DB transaction. "Other" can't be deleted or renamed.
- Create/update paths that validate several things then write run in `prisma.$transaction`.

**Pagination** (`/api/expenses`, `/api/incomes`, `/api/transfers`) — `?page=&limit=` with `limit ∈ {10, 20, 50}` (default 10), plus `search`, `accountId`, `categoryId` / `source`, `from`, `to`, `sortBy` (`date|amount`), `order`. Uses Prisma `skip/take`; rows, count and totals come back in one `$transaction`; ordering has an `id` tiebreaker so pages never overlap. Response: `{ success, data, pagination: { page, limit, total, totalPages, hasNext, hasPrevious }, summary }`.

Frontend (`usePagination` + `Pagination`): "Showing 1–10 of 125", Previous/Next (disabled at the ends), page numbers, page-size selector, loading/empty/error states, debounced search, filters kept across pages, page resets to 1 on any filter or size change without a duplicate request, superseded requests are aborted, and the page steps back if you delete the last row of the last page.

**Dashboard / analytics** — `GET /api/dashboard/summary?month=YYYY-MM` and `GET /api/analytics/overview?from=&to=&keyword=` use `aggregate`, `groupBy` and a few SQL `GROUP BY` queries; no endpoint loads all transactions. `GET /api/dashboard/months` (a small addition) feeds the month filters.

**Kept in the browser:** theme and display currency only (non-sensitive). Currency changes formatting, not values, as before.

### API

```
POST /api/auth/register | /login | /logout        GET /api/auth/me
GET|POST /api/accounts       GET|PUT|DELETE /api/accounts/:id      PATCH /api/accounts/:id/status
GET|POST /api/expenses       GET|PUT|DELETE /api/expenses/:id
GET|POST /api/incomes        GET|PUT|DELETE /api/incomes/:id
GET|POST /api/transfers      PUT|DELETE /api/transfers/:id
GET|POST /api/categories     PUT|DELETE /api/categories/:id
GET /api/dashboard/summary   GET /api/dashboard/months   GET /api/analytics/overview
```

Errors: `{ success: false, message, errors?: { field: message } }`.

### Schema notes

`Category` has extra `color` and `isDefault`, and `User` has `tokenVersion`, needed by the existing UI and for session revocation. Account fields are translated to the names the frontend already used (`name`, `type`, `lastFour`).

## Verification status — please read

This project was written in a sandbox **without network access**, so dependencies could not be installed and **nothing that needs Prisma, Postgres or a running server was executed**.

What was actually run:

| Check | Result |
|---|---|
| `node --check` on every backend file, seed and smoke test | pass |
| esbuild parse of every frontend `.js/.jsx` + local import/export resolution (packages external) | pass |
| TypeScript `checkJs` scan of the frontend for undefined identifiers | none found |
| Backend Zod validators + pagination maths, run against real `zod` 3.25 | 48 / 48 pass |

**Not run** (please do on your machine): `npm install`, `prisma generate/validate`, `prisma migrate` (so **no migration files are included**; step 4 creates them), `vite build`, starting the server, and every behavioural test from your list (registration/login, logout, protected routes, isolation, CRUD, pagination with more than 10 rows, filters across pages, balances, transfers vs totals). The root `package-lock.json` was removed because it can't match the new dependencies; `npm install` regenerates it. The raw SQL in `analyticsService.js` has not been executed against Postgres.

With the API running, execute:

```bash
npm run test:smoke
```

It makes about 75 assertions against a real database: auth, cookie flags and token revocation; 25-row pagination (pages, limits, overlap, search + page 2, combined filters); refunds and transfers vs totals; exact balance arithmetic through edit/delete; account/category rules; analytics; and a second user trying to read, modify or attach to the first user's data. Use a development database (it leaves throwaway users behind) and restart the API if the rate limiter kicks in after several runs.
