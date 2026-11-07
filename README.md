# MyMoney

MyMoney is a full-stack personal finance tracker built with React, Vite, Express, Prisma, and PostgreSQL. It helps users manage accounts, categories, income, expenses, transfers, and analytics in a single app.

## Features

- Personal accounts and balances
- Income, expense, and transfer tracking
- Categories with custom colors and defaults
- Secure authentication with JWT in an httpOnly cookie
- Dashboard and analytics summaries by month and date range
- Pagination and filters for transaction lists
- Protected routes and user-scoped data isolation
- PostgreSQL-backed calculations and data integrity rules

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL via Prisma ORM
- Auth: bcrypt + JWT
- Validation: Zod

## Project Structure

```text
MyMoney/
├── src/                  # React frontend
│   ├── api/              # API client modules
│   ├── components/       # Reusable UI components
│   ├── context/          # Auth, theme, toast contexts
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Screens: dashboard, accounts, analytics, login, etc.
│   ├── utils/            # Helper functions
│   └── ...
├── server/
│   ├── prisma/           # Prisma schema and seed data
│   ├── scripts/          # Admin/test scripts
│   └── src/              # Express app, routes, services, controllers
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── README.md
└── .env.example
```

## Prerequisites

- Node.js 20+
- PostgreSQL database (or Neon PostgreSQL)

## Setup

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create the server environment file:

```bash
cp server/.env.example server/.env
```

4. Update `server/.env` with your values, including:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `CLIENT_URL`
- `PORT`
- `NODE_ENV`

Example:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET="your-secret-key"
CLIENT_URL="http://localhost:5173"
PORT=5000
NODE_ENV="development"
```

5. Generate Prisma client and migrate the database:

```bash
npm run db:generate
npm run db:migrate -- --name init
```

6. Optional: seed demo data:

```bash
npm run db:seed
```

7. Start the app:

```bash
npm run dev
```

This runs the frontend and backend together.

## Default Access

If seeded, the app includes a demo account such as:

- Email: `demo@mymoney.test`
- Password: `Demo@1234`

## Scripts

From the project root:

```bash
npm run dev          # frontend + API together
npm run server       # API only
npm run build        # production frontend build
npm run db:generate  # Prisma generate
npm run db:migrate   # Prisma migrate dev
npm run db:deploy    # Prisma migrate deploy
npm run db:seed      # seed demo data
npm run test:smoke   # smoke tests against a running API
```

## API Overview

Core endpoints include:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

GET|POST /api/accounts
GET|PUT|DELETE /api/accounts/:id
PATCH /api/accounts/:id/status

GET|POST /api/expenses
GET|PUT|DELETE /api/expenses/:id

GET|POST /api/incomes
GET|PUT|DELETE /api/incomes/:id

GET|POST /api/transfers
PUT|DELETE /api/transfers/:id

GET|POST /api/categories
PUT|DELETE /api/categories/:id

GET /api/dashboard/summary
GET /api/dashboard/months
GET /api/analytics/overview
```

## Security and Data Rules

- All data access is scoped by the authenticated `userId`
- Writes use user-bound filters to prevent cross-user edits
- JWT tokens are stored in an httpOnly cookie
- Rate limiting is enforced on auth and API actions
- Foreign account or category references are rejected
- Deletions respect DB-level restrictions for linked data

## Notes

- Money values are stored as integer units for precision.
- Analytics and dashboard queries are optimized to avoid loading all transactions at once.
- The app is designed to keep sensitive data on the server and minimal state in the browser.

## License

This project is for personal or internal use unless otherwise specified by the repository owner.
