import { useState } from 'react'
import { useStore } from '../hooks/useStore.jsx'
import { INCOME_SOURCES } from '../data/incomes'
import { fromPaise, toPaise } from '../utils/money'
import { todayStr } from '../utils/dates'
import { accountLabel } from '../utils/calc'
import Field from './Field.jsx'

export default function IncomeForm({ initial, onSubmit, onCancel }) {
  const { accounts, symbol } = useStore()
  const usable = accounts.filter((a) => a.active || a.id === initial?.accountId)

  const [f, setF] = useState({
    amount: initial ? fromPaise(initial.amount) : '',
    source: initial?.source ?? INCOME_SOURCES[0],
    date: initial?.date ?? todayStr(),
    description: initial?.description ?? '',
    accountId: initial?.accountId ?? usable[0]?.id ?? '',
  })
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const amount = toPaise(f.amount)
    const er = {}
    if (!amount) er.amount = 'Enter an amount greater than 0'
    if (!f.date) er.date = 'Pick a date'
    if (!f.accountId) er.accountId = 'Select an account'
    setErr(er)
    if (Object.keys(er).length) return
    setBusy(true)
    Promise.resolve(
      onSubmit({
        amount,
        source: f.source,
        date: f.date,
        description: f.description.trim(),
        accountId: f.accountId,
      }),
    ).finally(() => setBusy(false))
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <Field label={`Amount (${symbol})`} error={err.amount}>
          <input
            className="input"
            inputMode="decimal"
            placeholder="40000"
            value={f.amount}
            onChange={set('amount')}
            autoFocus
          />
        </Field>
        <Field label="Date" error={err.date}>
          <input className="input" type="date" value={f.date} onChange={set('date')} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Source">
          <select className="input" value={f.source} onChange={set('source')}>
            {INCOME_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Receiving account" error={err.accountId}>
          <select className="input" value={f.accountId} onChange={set('accountId')}>
            {usable.map((a) => (
              <option key={a.id} value={a.id}>
                {accountLabel(a)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {f.source === 'Refund' && (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          Refunds are added to the account balance but tracked separately. They are not counted as
          income in totals or analytics.
        </p>
      )}
      <Field label="Description">
        <input
          className="input"
          placeholder="Monthly salary"
          value={f.description}
          onChange={set('description')}
        />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {initial ? 'Save changes' : 'Add income'}
        </button>
      </div>
    </form>
  )
}
