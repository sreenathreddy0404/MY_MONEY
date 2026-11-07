import { useEffect, useState } from 'react'
import { Pencil, Plus, Receipt, Search, Trash2, TrendingUp, Undo2 } from 'lucide-react'
import { useStore } from '../hooks/useStore.jsx'
import { usePagination } from '../hooks/usePagination.js'
import { incomeApi } from '../api/incomeApi.js'
import { dashboardApi } from '../api/dashboardApi.js'
import { INCOME_SOURCES } from '../data/incomes'
import { accountLabel } from '../utils/calc'
import { formatDate, monthEnd, monthStart } from '../utils/dates'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import MonthSelect from '../components/MonthSelect.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import IncomeForm from '../components/IncomeForm.jsx'
import Pagination from '../components/Pagination.jsx'

const COLS = 'md:grid md:grid-cols-[96px_minmax(0,1fr)_120px_170px_110px_72px] md:gap-4'

// The month dropdown is a UI convenience: it becomes a from/to date range for the API.
const fetchIncomes = ({ month, ...params }, signal) =>
  incomeApi.list(
    { ...params, ...(month !== 'all' ? { from: monthStart(month), to: monthEnd(month) } : {}) },
    signal,
  )

const INITIAL = { search: '', month: 'all', source: 'all' }

export default function Income() {
  const { accountById, fmt, addIncome, updateIncome, deleteIncome, version } = useStore()

  const list = usePagination(fetchIncomes, { initialFilters: INITIAL })
  const { rows, pagination, summary, loading, error, filters, setFilter } = list
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Months that have activity (one small query; refreshed after any change).
  const [months, setMonths] = useState([])
  useEffect(() => {
    let active = true
    dashboardApi.months().then((m) => active && setMonths(m)).catch(() => {})
    return () => {
      active = false
    }
  }, [version])

  const stats = { income: summary?.income ?? 0, refunds: summary?.refunds ?? 0 }
  const closeEditor = () => setEditing(null)

  return (
    <>
      <PageHeader title="Income" subtitle="Money coming in">
        <button type="button" className="btn-primary" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add income
        </button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total income"
          value={fmt(stats.income)}
          icon={TrendingUp}
          tone="income"
          hint="Salary, freelancing, family and other"
        />
        <StatCard
          label="Refunds"
          value={fmt(stats.refunds)}
          icon={Undo2}
          hint="Tracked separately, not counted as income"
        />
        <StatCard label="Entries" value={String(pagination?.total ?? 0)} icon={Receipt} />
      </div>

      <div className="card mb-4 mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search description"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              aria-label="Search"
            />
          </div>
          <MonthSelect months={months} value={filters.month} onChange={(v) => setFilter('month', v)} allLabel="All months" />
          <select className="input" value={filters.source} onChange={(e) => setFilter('source', e.target.value)} aria-label="Source">
            <option value="all">All sources</option>
            {INCOME_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className={`hidden border-b border-slate-200 px-4 py-2 dark:border-slate-800 ${COLS}`}>
          <span className="th">Date</span>
          <span className="th">Description</span>
          <span className="th">Source</span>
          <span className="th">Account</span>
          <span className="th text-right">Amount</span>
          <span />
        </div>
        {error ? (
          <div className="px-4 py-12 text-center text-sm">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button type="button" className="btn-outline mt-3" onClick={list.refetch}>
              Try again
            </button>
          </div>
        ) : loading && rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">Loading income…</p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">No income found.</p>
        ) : (
          <ul className={`divide-y divide-slate-100 transition-opacity dark:divide-slate-800 ${loading ? 'opacity-60' : ''}`}>
            {rows.map((i) => {
              const a = accountById[i.accountId]
              const refund = i.source === 'Refund'
              return (
                <li key={i.id} className={`flex items-center gap-3 px-4 py-3 ${COLS}`}>
                  <span className="hidden text-sm text-slate-500 dark:text-slate-400 md:block">
                    {formatDate(i.date)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.description || i.source}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400 md:hidden">
                      {formatDate(i.date)} · {i.source} · {a?.name ?? 'Unknown'}
                    </p>
                  </div>
                  <span className="hidden md:block">
                    <span className="badge">{i.source}</span>
                  </span>
                  <span className="hidden truncate text-sm text-slate-600 dark:text-slate-300 md:block">
                    {a ? accountLabel(a) : 'Unknown account'}
                  </span>
                  <span
                    className={`text-right text-sm font-semibold tabular-nums ${
                      refund ? 'text-slate-600 dark:text-slate-300' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    +{fmt(i.amount)}
                  </span>
                  <div className="flex shrink-0 justify-end">
                    <button type="button" className="icon-btn" onClick={() => setEditing(i)} aria-label="Edit income">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => setDeleting(i)} aria-label="Delete income">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <Pagination pagination={pagination} onPage={list.setPage} limit={list.limit} onLimit={list.setLimit} loading={loading} />
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add income' : 'Edit income'} onClose={closeEditor}>
          <IncomeForm
            initial={editing === 'new' ? undefined : editing}
            onCancel={closeEditor}
            onSubmit={async (v) => {
              const ok = editing === 'new' ? await addIncome(v) : await updateIncome(editing.id, v)
              if (ok) closeEditor()
            }}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete income"
          message={`Delete "${deleting.description || deleting.source}" (${fmt(deleting.amount)})? Account balances and analytics will update.`}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteIncome(deleting.id)
            setDeleting(null)
          }}
        />
      )}
    </>
  )
}
