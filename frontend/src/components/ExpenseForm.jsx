import { useState } from 'react'
import { useStore } from '../hooks/useStore.jsx'
import { fromPaise, toPaise } from '../utils/money'
import { todayStr } from '../utils/dates'
import { accountLabel } from '../utils/calc'
import Field from './Field.jsx'

export default function ExpenseForm({ initial, onSubmit, onCancel }) {
  const { categories, accounts, symbol } = useStore()
  const usable = accounts.filter((a) => a.active || a.id === initial?.accountId)

  const [f, setF] = useState({
    amount: initial ? fromPaise(initial.amount) : '',
    reason: initial?.reason ?? '',
    date: initial?.date ?? todayStr(),
    categoryId: initial?.categoryId ?? categories[0]?.id ?? '',
    accountId: initial?.accountId ?? usable[0]?.id ?? '',
    notes: initial?.notes ?? '',
  })
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const amount = toPaise(f.amount)
    const er = {}
    if (!amount) er.amount = 'Enter an amount greater than 0'
    if (!f.reason.trim()) er.reason = 'Reason is required'
    if (!f.date) er.date = 'Pick a date'
    if (!f.categoryId) er.categoryId = 'Select a category'
    if (!f.accountId) er.accountId = 'Select an account'
    setErr(er)
    if (Object.keys(er).length) return
    setBusy(true)
    Promise.resolve(
      onSubmit({
        amount,
        reason: f.reason.trim(),
        date: f.date,
        categoryId: f.categoryId,
        accountId: f.accountId,
        notes: f.notes.trim(),
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
            placeholder="120"
            value={f.amount}
            onChange={set('amount')}
            autoFocus
          />
        </Field>
        <Field label="Date" error={err.date}>
          <input className="input" type="date" value={f.date} onChange={set('date')} />
        </Field>
      </div>
      <Field label="Reason / description" error={err.reason}>
        <input
          className="input"
          placeholder="Auto ride from hostel to metro"
          value={f.reason}
          onChange={set('reason')}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" error={err.categoryId}>
          <select className="input" value={f.categoryId} onChange={set('categoryId')}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Account" error={err.accountId}>
          <select className="input" value={f.accountId} onChange={set('accountId')}>
            {usable.map((a) => (
              <option key={a.id} value={a.id}>
                {accountLabel(a)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes (optional)">
        <textarea className="input" rows={2} value={f.notes} onChange={set('notes')} />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {initial ? 'Save changes' : 'Add expense'}
        </button>
      </div>
    </form>
  )
}
