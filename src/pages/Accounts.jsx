import { useState } from 'react'
import { ArrowRight, ArrowRightLeft, Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { useStore } from '../hooks/useStore.jsx'
import { usePagination } from '../hooks/usePagination.js'
import { transferApi } from '../api/transferApi.js'
import { accountLabel } from '../utils/calc'
import { formatDate } from '../utils/dates'
import { accountIcon } from '../utils/accountIcon'
import PageHeader from '../components/PageHeader.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import AccountForm from '../components/AccountForm.jsx'
import TransferForm from '../components/TransferForm.jsx'
import Pagination from '../components/Pagination.jsx'

export default function Accounts() {
  const {
    accounts,
    activeAccounts,
    balances,
    accountById,
    fmt,
    addAccount,
    updateAccount,
    toggleAccount,
    deleteAccount,
    addTransfer,
    updateTransfer,
    deleteTransfer,
  } = useStore()

  const [accountModal, setAccountModal] = useState(null)
  const [transferModal, setTransferModal] = useState(null)
  const [deactivating, setDeactivating] = useState(null)
  const [deletingTransfer, setDeletingTransfer] = useState(null)

  const [deletingAccount, setDeletingAccount] = useState(null)
  const list = usePagination(transferApi.list)
  const { rows: transferRows, pagination, loading, error } = list
  const label = (id) => (accountById[id] ? accountLabel(accountById[id]) : 'Unknown account')

  return (
    <>
      <PageHeader title="Accounts" subtitle="Bank accounts, cash and wallets">
        <button
          type="button"
          className="btn-outline"
          onClick={() => setTransferModal('new')}
          disabled={activeAccounts.length < 2}
          title={activeAccounts.length < 2 ? 'You need two active accounts to transfer' : undefined}
        >
          <ArrowRightLeft className="h-4 w-4" /> New transfer
        </button>
        <button type="button" className="btn-primary" onClick={() => setAccountModal('new')}>
          <Plus className="h-4 w-4" /> Add account
        </button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const Icon = accountIcon(a.type)
          const bal = balances[a.id] ?? 0
          return (
            <div key={a.id} className={`card p-4 ${a.active ? '' : 'opacity-70'}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                  <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{accountLabel(a)}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {a.type}
                    {a.bankName ? ` · ${a.bankName}` : ''}
                  </p>
                </div>
                {!a.active && <span className="badge">Inactive</span>}
              </div>
              <p
                className={`mt-4 text-2xl font-semibold tabular-nums ${
                  bal < 0 ? 'text-red-600 dark:text-red-400' : ''
                }`}
              >
                {fmt(bal)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current balance · Opening {fmt(a.openingBalance)}
              </p>
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button type="button" className="btn-outline flex-1" onClick={() => setAccountModal(a)}>
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  className="btn-outline flex-1"
                  onClick={() => (a.active ? setDeactivating(a) : toggleAccount(a.id, true))}
                >
                  <Power className="h-4 w-4" /> {a.active ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" className="icon-btn shrink-0" onClick={() => setDeletingAccount(a)} aria-label={`Delete ${a.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <section className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Transfers</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Between your own accounts. Not counted as income or expenses.
            </p>
          </div>
        </div>
        {error ? (
          <div className="border-t border-slate-100 px-4 py-10 text-center text-sm dark:border-slate-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button type="button" className="btn-outline mt-3" onClick={list.refetch}>
              Try again
            </button>
          </div>
        ) : loading && transferRows.length === 0 ? (
          <p className="border-t border-slate-100 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Loading transfers…
          </p>
        ) : transferRows.length === 0 ? (
          <p className="border-t border-slate-100 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No transfers yet.
          </p>
        ) : (
          <ul className={`divide-y divide-slate-100 border-t border-slate-100 transition-opacity dark:divide-slate-800 dark:border-slate-800 ${loading ? 'opacity-60' : ''}`}>
            {transferRows.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
                    <span className="truncate">{label(t.fromAccountId)}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{label(t.toAccountId)}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(t.date)}
                    {t.note ? ` · ${t.note}` : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{fmt(t.amount)}</span>
                <div className="flex shrink-0">
                  <button type="button" className="icon-btn" onClick={() => setTransferModal(t)} aria-label="Edit transfer">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="icon-btn" onClick={() => setDeletingTransfer(t)} aria-label="Delete transfer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination pagination={pagination} onPage={list.setPage} limit={list.limit} onLimit={list.setLimit} loading={loading} />
      </section>

      {accountModal && (
        <Modal
          title={accountModal === 'new' ? 'Add account' : 'Edit account'}
          onClose={() => setAccountModal(null)}
        >
          <AccountForm
            initial={accountModal === 'new' ? undefined : accountModal}
            onCancel={() => setAccountModal(null)}
            onSubmit={async (v) => {
              const ok = accountModal === 'new' ? await addAccount(v) : await updateAccount(accountModal.id, v)
              if (ok) setAccountModal(null)
            }}
          />
        </Modal>
      )}
      {transferModal && (
        <Modal
          title={transferModal === 'new' ? 'New transfer' : 'Edit transfer'}
          onClose={() => setTransferModal(null)}
        >
          <TransferForm
            initial={transferModal === 'new' ? undefined : transferModal}
            onCancel={() => setTransferModal(null)}
            onSubmit={async (v) => {
              const ok = transferModal === 'new' ? await addTransfer(v) : await updateTransfer(transferModal.id, v)
              if (ok) setTransferModal(null)
            }}
          />
        </Modal>
      )}
      {deactivating && (
        <ConfirmDialog
          title="Deactivate account"
          confirmLabel="Deactivate"
          message={`${accountLabel(deactivating)} will be hidden from new entries and excluded from your available balance. Its history is kept and you can activate it again anytime.`}
          onCancel={() => setDeactivating(null)}
          onConfirm={async () => {
            await toggleAccount(deactivating.id, false)
            setDeactivating(null)
          }}
        />
      )}
      {deletingTransfer && (
        <ConfirmDialog
          title="Delete transfer"
          message={`Delete the ${fmt(deletingTransfer.amount)} transfer from ${label(deletingTransfer.fromAccountId)} to ${label(deletingTransfer.toAccountId)}? Both balances will update.`}
          onCancel={() => setDeletingTransfer(null)}
          onConfirm={async () => {
            await deleteTransfer(deletingTransfer.id)
            setDeletingTransfer(null)
          }}
        />
      )}
      {deletingAccount && (
        <ConfirmDialog
          title="Delete account"
          message={`Delete ${accountLabel(deletingAccount)}? Accounts that have income, expenses or transfers cannot be deleted (deactivate them instead to keep your history).`}
          onCancel={() => setDeletingAccount(null)}
          onConfirm={async () => {
            await deleteAccount(deletingAccount.id)
            setDeletingAccount(null)
          }}
        />
      )}
    </>
  )
}
