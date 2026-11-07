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
├── frontend/             # React frontend
│   ├── public/           # Static assets
│   ├── src/              # React components, pages, api, context, hooks
│   ├── index.html        # Entry HTML
│   ├── package.json      # Frontend dependencies & scripts
│   ├── vite.config.js    # Vite configuration & API proxy
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── backend/              # Node.js + Express backend
│   ├── prisma/           # Prisma schema, migrations, and seed data
│   ├── scripts/          # Admin/test scripts
│   ├── src/              # Express app, routes, services, controllers
│   ├── package.json      # Backend dependencies & scripts
│   └── .env.example
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 20+
- PostgreSQL database (or Neon PostgreSQL)

## Setup & Running

Frontend and backend run independently from their respective directories.

### 1. Backend Setup

In your terminal:

```bash
cd backend
npm install
cp .env.example .env
```

Update `backend/.env` with your values:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET="your-secret-key-at-least-32-chars-long"
CLIENT_URL="http://localhost:5173"
PORT=5000
NODE_ENV="development"
```

Generate Prisma client and migrate the database:

```bash
npm run db:generate
npm run db:migrate -- --name init
```

Optional demo seed:

```bash
npm run db:seed
```

Start the backend API server:

```bash
npm run dev
```

The API will listen on `http://localhost:5000`.

---

### 2. Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server will run on `http://localhost:5173` and proxy `/api` requests to `http://localhost:5000`.

## Default Access

If seeded, the app includes a demo account such as:

- Email: `demo@mymoney.test`
- Password: `Demo@1234`

## Scripts

### Frontend Scripts (`cd frontend`)

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
```

### Backend Scripts (`cd backend`)

```bash
npm run dev          # Start Express API server with file watch
npm run start        # Start Express API server in production mode
npm run check        # Syntax check server.js
npm run db:generate  # Prisma generate
npm run db:migrate   # Prisma migrate dev
npm run db:deploy    # Prisma migrate deploy
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio GUI
npm run test:smoke   # Smoke tests against running API
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
