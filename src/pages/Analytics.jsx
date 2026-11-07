import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CalendarDays, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { useStore } from '../hooks/useStore.jsx'
import { useChartTheme } from '../hooks/useChartTheme.js'
import { useDebounced } from '../hooks/useDebounced.js'
import { dashboardApi } from '../api/dashboardApi.js'
import {
  addDays,
  addMonths,
  formatDate,
  formatShort,
  monthEnd,
  monthKey,
  monthLabel,
  monthStart,
  todayStr,
} from '../utils/dates'
import { formatCompact } from '../utils/money'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import ChartCard, { EmptyState } from '../components/ChartCard.jsx'
import CategoryChart from '../components/CategoryChart.jsx'

const PRESETS = [
  ['month', 'This month'],
  ['30d', 'Last 30 days'],
  ['3m', 'Last 3 months'],
  ['all', 'All time'],
]

const EMPTY = {
  range: null,
  totals: { income: 0, refunds: 0, expenses: 0, savings: 0, expenseCount: 0 },
  averageDaily: 0,
  monthly: [],
  byCategory: [],
  byAccount: [],
  daily: [],
  reasons: [],
  keywordStats: { count: 0, total: 0 },
}

export default function Analytics() {
  const { fmt, currency, version } = useStore()
  const t = useChartTheme()
  const today = todayStr()

  const [preset, setPreset] = useState('3m')
  const [custom, setCustom] = useState({ from: '', to: '' })
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounced(keyword.trim(), 400)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  // "All time" sends no dates; the server picks the span of the user's own data.
  const presetRange = (p) => {
    const mk = monthKey(today)
    if (p === 'month') return [monthStart(mk), monthEnd(mk)]
    if (p === '30d') return [addDays(today, -29), today]
    if (p === '3m') return [monthStart(addMonths(mk, -2)), monthEnd(mk)]
    return [undefined, undefined]
  }
  const [reqFrom, reqTo] =
    preset === 'custom' ? [custom.from || undefined, custom.to || undefined] : presetRange(preset)
  const invalid = Boolean(reqFrom && reqTo && reqFrom > reqTo)

  useEffect(() => {
    if (invalid) return undefined
    const ctrl = new AbortController()
    setLoading(true)
    setError('')
    dashboardApi
      .analytics({ from: reqFrom, to: reqTo, keyword: debouncedKeyword || undefined }, ctrl.signal)
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
  }, [reqFrom, reqTo, debouncedKeyword, invalid, version, tick])

  const view = invalid || !data ? EMPTY : data
  const from = view.range?.from ?? reqFrom ?? ''
  const to = view.range?.to ?? reqTo ?? ''
  const lastDay = view.range?.lastDay ?? to
  const stats = view.totals
  const avgDaily = view.averageDaily
  const byCategory = view.byCategory
  const byAccount = view.byAccount
  const reasons = view.reasons
  const reasonStats = view.keywordStats
  const monthly = view.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }))
  const daily = view.daily.map((d) => ({ ...d, label: formatShort(d.date) }))

  const setRange = (k, v) => {
    setCustom({ from, to, [k]: v })
    setPreset('custom')
  }

  const axis = { fill: t.axis, fontSize: 12 }
  const yAxis = (
    <YAxis
      tickLine={false}
      axisLine={false}
      width={56}
      tick={axis}
      tickFormatter={(v) => formatCompact(v, currency)}
    />
  )

  return (
    <>
      <PageHeader title="Analytics" subtitle={invalid ? 'Invalid date range' : data ? `${formatDate(from)} – ${formatDate(lastDay)}` : 'Loading…'}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-700">
            {PRESETS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  preset === key
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input className="input w-auto" type="date" value={from} onChange={(e) => setRange('from', e.target.value)} aria-label="From date" />
          <input className="input w-auto" type="date" value={to} onChange={(e) => setRange('to', e.target.value)} aria-label="To date" />
        </div>
      </PageHeader>

      {invalid && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          The start date must be on or before the end date.
        </p>
      )}

      {error && (
        <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span>{error}</span>
          <button type="button" className="btn-outline py-1" onClick={() => setTick((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total spent" value={fmt(stats.expenses)} icon={TrendingDown} tone="expense" hint={`${stats.expenseCount} expenses`} />
        <StatCard label="Average daily spending" value={fmt(avgDaily)} icon={CalendarDays} hint="Over days elapsed in range" />
        <StatCard label="Total income" value={fmt(stats.income)} icon={TrendingUp} tone="income" hint="Excludes refunds" />
        <StatCard
          label="Net savings"
          value={fmt(stats.savings)}
          icon={PiggyBank}
          tone={stats.savings >= 0 ? 'income' : 'expense'}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Income vs expenses" subtitle="By month">
          {monthly.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={t.grid} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axis} />
                  {yAxis}
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

        <ChartCard title="Monthly savings" subtitle="Income minus expenses, refunds excluded">
          {monthly.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={t.grid} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axis} />
                  {yAxis}
                  <Tooltip cursor={{ fill: t.cursor }} formatter={(v) => [fmt(v), 'Savings']} {...t.tooltip} />
                  <Bar dataKey="savings" radius={[3, 3, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                    {monthly.map((m) => (
                      <Cell key={m.month} fill={m.savings >= 0 ? t.income : t.expense} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Category-wise spending">
          <CategoryChart data={byCategory} />
        </ChartCard>

        <ChartCard title="Account-wise expenses">
          {byAccount.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byAccount} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke={t.grid} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={axis} tickFormatter={(v) => formatCompact(v, currency)} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={90} tick={axis} />
                  <Tooltip cursor={{ fill: t.cursor }} formatter={(v) => [fmt(v), 'Spent']} {...t.tooltip} />
                  <Bar dataKey="value" fill={t.neutral} radius={[0, 3, 3, 0]} maxBarSize={24} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Daily spending" subtitle="Expenses per day" className="lg:col-span-2">
          {daily.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={t.grid} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axis} interval="preserveStartEnd" minTickGap={24} />
                  {yAxis}
                  <Tooltip cursor={{ fill: t.cursor }} formatter={(v) => [fmt(v), 'Spent']} {...t.tooltip} />
                  <Bar dataKey="amount" fill={t.expense} radius={[2, 2, 0, 0]} maxBarSize={18} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Most frequent spending reasons" subtitle="Ranked by how often they occur">
          {reasons.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="th pb-2 font-medium">Reason</th>
                  <th className="th pb-2 text-right font-medium">Times</th>
                  <th className="th pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reasons.map((r) => (
                  <tr key={r.reason}>
                    <td className="max-w-0 truncate py-2 pr-3">
                      <button
                        type="button"
                        className="max-w-full truncate text-left hover:underline"
                        onClick={() => setKeyword(r.reason)}
                        title="Track this reason"
                      >
                        {r.reason}
                      </button>
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500 dark:text-slate-400">{r.count}</td>
                    <td className="py-2 text-right font-medium tabular-nums">{fmt(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Spending on a specific reason" subtitle="Matches any expense whose reason contains your text">
          <input
            className="input"
            placeholder="e.g. auto ride"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            aria-label="Reason keyword"
          />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
              <p className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">{fmt(reasonStats.total)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Times</p>
              <p className="text-lg font-semibold tabular-nums">{reasonStats.count}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Share of spending</p>
              <p className="text-lg font-semibold tabular-nums">
                {stats.expenses ? ((reasonStats.total / stats.expenses) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Tip: click a reason in the list to track it here.
          </p>
        </ChartCard>
      </div>
      </div>
    </>
  )
}
