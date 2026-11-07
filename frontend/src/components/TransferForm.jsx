import { useState } from 'react'
import { useStore } from '../hooks/useStore.jsx'
import { fromPaise, toPaise } from '../utils/money'
import { todayStr } from '../utils/dates'
import { accountLabel } from '../utils/calc'
import Field from './Field.jsx'

export default function TransferForm({ initial, onSubmit, onCancel }) {
  const { accounts, symbol } = useStore()
  const usable = accounts.filter(
    (a) => a.active || a.id === initial?.fromAccountId || a.id === initial?.toAccountId,
  )

  const [f, setF] = useState({
    amount: initial ? fromPaise(initial.amount) : '',
    fromAccountId: initial?.fromAccountId ?? usable[0]?.id ?? '',
    toAccountId: initial?.toAccountId ?? usable[1]?.id ?? '',
    date: initial?.date ?? todayStr(),
    note: initial?.note ?? '',
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
    if (!f.fromAccountId) er.fromAccountId = 'Select an account'
    if (!f.toAccountId) er.toAccountId = 'Select an account'
    if (f.fromAccountId && f.fromAccountId === f.toAccountId)
      er.toAccountId = 'Choose a different account'
    setErr(er)
    if (Object.keys(er).length) return
    setBusy(true)
    Promise.resolve(
      onSubmit({
        amount,
        fromAccountId: f.fromAccountId,
        toAccountId: f.toAccountId,
        date: f.date,
        note: f.note.trim(),
      }),
    ).finally(() => setBusy(false))
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <Field label="From account" error={err.fromAccountId}>
          <select className="input" value={f.fromAccountId} onChange={set('fromAccountId')}>
            {usable.map((a) => (
              <option key={a.id} value={a.id}>
                {accountLabel(a)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="To account" error={err.toAccountId}>
          <select className="input" value={f.toAccountId} onChange={set('toAccountId')}>
            {usable.map((a) => (
              <option key={a.id} value={a.id}>
                {accountLabel(a)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label={`Amount (${symbol})`} error={err.amount}>
          <input
            className="input"
            inputMode="decimal"
            placeholder="1000"
            value={f.amount}
            onChange={set('amount')}
            autoFocus
          />
        </Field>
        <Field label="Date" error={err.date}>
          <input className="input" type="date" value={f.date} onChange={set('date')} />
        </Field>
      </div>
      <Field label="Note (optional)">
        <input
          className="input"
          placeholder="ATM cash withdrawal"
          value={f.note}
          onChange={set('note')}
        />
      </Field>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Transfers move money between your own accounts. They do not count as income or expenses.
      </p>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {initial ? 'Save changes' : 'Transfer'}
        </button>
      </div>
    </form>
  )
}
