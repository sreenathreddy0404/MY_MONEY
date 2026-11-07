import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRightLeft,
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useStore } from '../hooks/useStore.jsx'
import { useChartTheme } from '../hooks/useChartTheme.js'
import { dashboardApi } from '../api/dashboardApi.js'
import { accountLabel } from '../utils/calc'
import { monthLabel } from '../utils/dates'
import { formatCompact } from '../utils/money'
import { accountIcon } from '../utils/accountIcon'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import ChartCard, { EmptyState } from '../components/ChartCard.jsx'
import CategoryChart from '../components/CategoryChart.jsx'
import ActivityList from '../components/ActivityList.jsx'
import MonthSelect from '../components/MonthSelect.jsx'
import Modal from '../components/Modal.jsx'
import ExpenseForm from '../components/ExpenseForm.jsx'
import IncomeForm from '../components/IncomeForm.jsx'
import TransferForm from '../components/TransferForm.jsx'

export default function Dashboard() {
  const { activeAccounts, fmt, currency, version, addExpense, addIncome, addTransfer } = useStore()
  const t = useChartTheme()

  // All totals, balances, series and the recent list are aggregated by the database in one call.
  const [picked, setPicked] = useState(null)
  const [modal, setModal] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    setError('')
    dashboardApi
      .summary(picked || undefined, ctrl.signal)
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch((e) => {
        if (e?.name === 'AbortError') return
        setError(e.message)
        setLoading(false)
      })
    return () => ctrl.abort()
  }, [picked, version, tick])

  if (!data) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle={error ? 'Could not load your overview' : 'Loading your overview…'} />
        {error && (
          <div className="card px-4 py-12 text-center text-sm">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button type="button" className="btn-outline mt-3" onClick={() => setTick((n) => n + 1)}>
              Try again
            </button>
          </div>
        )}
      </>
    )
  }

  const { month, months, totals: stats, availableBalance: available, accounts, series: rawSeries, byCategory, recent } = data
  const savingsRate = stats.income > 0 ? Math.round((stats.savings / stats.income) * 100) : null
  const series = rawSeries.map((m) => ({ ...m, label: monthLabel(m.month) }))

  const close = () => setModal(null)

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Overview for ${monthLabel(month)}`}>
        <MonthSelect months={months.length ? months : [month]} value={month} onChange={setPicked} />
        <button type="button" className="btn-primary" onClick={() => setModal('expense')}>
          <Plus className="h-4 w-4" /> Expense
        </button>
        <button type="button" className="btn-outline" onClick={() => setModal('income')}>
          <Plus className="h-4 w-4" /> Income
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => setModal('transfer')}
          disabled={activeAccounts.length < 2}
          title={activeAccounts.length < 2 ? 'You need two active accounts to transfer' : undefined}
        >
          <ArrowRightLeft className="h-4 w-4" /> Transfer
        </button>
      </PageHeader>

      <div className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${loading ? 'opacity-60' : ''}`}>
        <StatCard
          label="Total income"
          value={fmt(stats.income)}
          icon={TrendingUp}
          tone="income"
          hint={stats.refunds ? `Excludes ${fmt(stats.refunds)} in refunds` : 'Excludes refunds'}
        />
        <StatCard label="Total expenses" value={fmt(stats.expenses)} icon={TrendingDown} tone="expense" />
        <StatCard
          label="Available balance"
          value={fmt(available)}
          icon={Wallet}
          hint="Across all active accounts, today"
        />
        <StatCard
          label="Savings"
          value={fmt(stats.savings)}
          icon={PiggyBank}
          tone={stats.savings >= 0 ? 'income' : 'expense'}
          hint={savingsRate === null ? 'Income minus expenses' : `${savingsRate}% of income`}
        />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">Accounts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => {
            const Icon = accountIcon(a.type)
            const bal = a.balance ?? 0
            return (
              <Link
                key={a.id}
                to="/accounts"
                className={`card flex items-center gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                  a.active ? '' : 'opacity-60'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                  <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{accountLabel(a)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {a.type}
                    {a.active ? '' : ' · Inactive'}
                  </p>
                </div>
                <span
                  className={`text-base font-semibold tabular-nums ${
                    bal < 0 ? 'text-red-600 dark:text-red-400' : ''
                  }`}
                >
                  {fmt(bal)}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Income vs expenses" subtitle="Monthly, last 6 months with activity">
          {series.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={t.grid} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: t.axis, fontSize: 12 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tick={{ fill: t.axis, fontSize: 12 }}
                    tickFormatter={(v) => formatCompact(v, currency)}
                  />
                  <Tooltip cursor={{ fill: t.cursor }} formatter={(v) => fmt(v)} {...t.tooltip} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="Income" fill={t.income} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                  <Bar dataKey="expenses" name="Expenses" fill={t.expense} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Spending by category" subtitle={monthLabel(month)}>
          <CategoryChart data={byCategory} />
        </ChartCard>
      </div>

      <section className="card mt-6 p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent transactions</h2>
          <Link to="/transactions" className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            View all expenses
          </Link>
        </div>
        <ActivityList items={recent} />
      </section>

      {modal === 'expense' && (
        <Modal title="Add expense" onClose={close}>
          <ExpenseForm
            onCancel={close}
            onSubmit={async (v) => {
              if (await addExpense(v)) close()
            }}
          />
        </Modal>
      )}
      {modal === 'income' && (
        <Modal title="Add income" onClose={close}>
          <IncomeForm
            onCancel={close}
            onSubmit={async (v) => {
              if (await addIncome(v)) close()
            }}
          />
        </Modal>
      )}
      {modal === 'transfer' && (
        <Modal title="Transfer between accounts" onClose={close}>
          <TransferForm
            onCancel={close}
            onSubmit={async (v) => {
              if (await addTransfer(v)) close()
            }}
          />
        </Modal>
      )}
    </>
  )
}
