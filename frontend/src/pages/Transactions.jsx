import { useState } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useStore } from '../hooks/useStore.jsx'
import { usePagination } from '../hooks/usePagination.js'
import { expenseApi } from '../api/expenseApi.js'
import { accountLabel } from '../utils/calc'
import { formatDate } from '../utils/dates'
import PageHeader from '../components/PageHeader.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ExpenseForm from '../components/ExpenseForm.jsx'
import Pagination from '../components/Pagination.jsx'

const SORTS = {
  'date-desc': 'Newest first',
  'date-asc': 'Oldest first',
  'amount-desc': 'Amount: high to low',
  'amount-asc': 'Amount: low to high',
}

// Translate the UI sort key into the API's sortBy/order.
const fetchExpenses = ({ sort, ...params }, signal) => {
  const [sortBy, order] = sort.split('-')
  return expenseApi.list({ ...params, sortBy, order }, signal)
}

const INITIAL = { search: '', categoryId: 'all', accountId: 'all', from: '', to: '', sort: 'date-desc' }

const COLS = 'md:grid md:grid-cols-[96px_minmax(0,1fr)_130px_170px_110px_72px] md:gap-4'

export default function Transactions() {
  const {
    categories,
    accounts,
    categoryById,
    accountById,
    fmt,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useStore()

  const list = usePagination(fetchExpenses, { initialFilters: INITIAL })
  const { rows, pagination, summary, loading, error, filters, setFilter } = list
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered =
    filters.search || filters.from || filters.to || filters.categoryId !== 'all' || filters.accountId !== 'all'
  const clear = () => {
    const keepSort = filters.sort
    list.resetFilters()
    setFilter('sort', keepSort)
  }
  const closeEditor = () => setEditing(null)

  return (
    <>
      <PageHeader title="Transactions" subtitle="Your expenses">
        <button type="button" className="btn-primary" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add expense
        </button>
      </PageHeader>

      <div className="card mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search reason or notes"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              aria-label="Search"
            />
          </div>
          <select className="input" value={filters.categoryId} onChange={(e) => setFilter('categoryId', e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className="input" value={filters.accountId} onChange={(e) => setFilter('accountId', e.target.value)} aria-label="Account">
            <option value="all">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {accountLabel(a)}
              </option>
            ))}
          </select>
          <input className="input" type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} aria-label="From date" />
          <input className="input" type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} aria-label="To date" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pagination ? pagination.total : '–'} {pagination?.total === 1 ? 'expense' : 'expenses'} ·{' '}
            <span className="font-semibold text-red-600 dark:text-red-400">{fmt(summary?.totalAmount ?? 0)}</span>
          </p>
          <div className="flex items-center gap-2">
            {filtered && (
              <button type="button" className="btn-ghost" onClick={clear}>
                <X className="h-4 w-4" /> Clear filters
              </button>
            )}
            <select className="input w-auto" value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
              {Object.entries(SORTS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className={`hidden border-b border-slate-200 px-4 py-2 dark:border-slate-800 ${COLS}`}>
          <span className="th">Date</span>
          <span className="th">Reason</span>
          <span className="th">Category</span>
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
          <p className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">Loading expenses…</p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            {filtered ? 'No expenses match your filters.' : 'No expenses yet. Add your first one.'}
          </p>
        ) : (
          <ul className={`divide-y divide-slate-100 transition-opacity dark:divide-slate-800 ${loading ? 'opacity-60' : ''}`}>
            {rows.map((e) => {
              const c = categoryById[e.categoryId]
              const a = accountById[e.accountId]
              return (
                <li key={e.id} className={`flex items-center gap-3 px-4 py-3 ${COLS}`}>
                  <span className="hidden text-sm text-slate-500 dark:text-slate-400 md:block">
                    {formatDate(e.date)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.reason}</p>
                    {e.notes && (
                      <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 md:block">
                        {e.notes}
                      </p>
                    )}
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400 md:hidden">
                      {formatDate(e.date)} · {c?.name ?? 'Other'} · {a?.name ?? 'Unknown'}
                    </p>
                  </div>
                  <span className="hidden md:block">
                    <span className="badge">
                      <span className="h-2 w-2 rounded-full" style={{ background: c?.color ?? '#94a3b8' }} />
                      {c?.name ?? 'Other'}
                    </span>
                  </span>
                  <span className="hidden truncate text-sm text-slate-600 dark:text-slate-300 md:block">
                    {a ? accountLabel(a) : 'Unknown account'}
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                    -{fmt(e.amount)}
                  </span>
                  <div className="flex shrink-0 justify-end">
                    <button type="button" className="icon-btn" onClick={() => setEditing(e)} aria-label="Edit expense">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => setDeleting(e)} aria-label="Delete expense">
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
        <Modal title={editing === 'new' ? 'Add expense' : 'Edit expense'} onClose={closeEditor}>
          <ExpenseForm
            initial={editing === 'new' ? undefined : editing}
            onCancel={closeEditor}
            onSubmit={async (v) => {
              const ok = editing === 'new' ? await addExpense(v) : await updateExpense(editing.id, v)
              if (ok) closeEditor()
            }}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete expense"
          message={`Delete "${deleting.reason}" (${fmt(deleting.amount)})? Account balances and analytics will update.`}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteExpense(deleting.id)
            setDeleting(null)
          }}
        />
      )}
    </>
  )
}
