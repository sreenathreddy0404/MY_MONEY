import { useState } from 'react'
import { useStore } from '../hooks/useStore.jsx'
import { ACCOUNT_TYPES } from '../data/accounts'
import { fromPaise, toPaise } from '../utils/money'
import Field from './Field.jsx'

export default function AccountForm({ initial, onSubmit, onCancel }) {
  const { symbol } = useStore()
  const [f, setF] = useState({
    name: initial?.name ?? '',
    bankName: initial?.bankName ?? '',
    type: initial?.type ?? 'Savings',
    lastFour: initial?.lastFour ?? '',
    openingBalance: initial ? fromPaise(initial.openingBalance) : '0',
  })
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const hasNumber = f.type === 'Savings' || f.type === 'Current'

  const submit = (e) => {
    e.preventDefault()
    const openingBalance = toPaise(f.openingBalance)
    const er = {}
    if (!f.name.trim()) er.name = 'Account name is required'
    if (openingBalance === null) er.openingBalance = 'Enter a valid amount (0 or more)'
    if (hasNumber && f.lastFour && !/^\d{4}$/.test(f.lastFour)) er.lastFour = 'Enter exactly 4 digits'
    setErr(er)
    if (Object.keys(er).length) return
    setBusy(true)
    Promise.resolve(
      onSubmit({
        name: f.name.trim(),
        bankName: f.bankName.trim(),
        type: f.type,
        lastFour: hasNumber ? f.lastFour : '',
        openingBalance,
      }),
    ).finally(() => setBusy(false))
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Account name" error={err.name}>
        <input
          className="input"
          placeholder="HDFC Bank"
          value={f.name}
          onChange={set('name')}
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Bank name">
          <input
            className="input"
            placeholder="HDFC Bank"
            value={f.bankName}
            onChange={set('bankName')}
          />
        </Field>
        <Field label="Account type">
          <select className="input" value={f.type} onChange={set('type')}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {hasNumber && (
          <Field label="Last four digits (optional)" error={err.lastFour}>
            <input
              className="input"
              inputMode="numeric"
              maxLength={4}
              placeholder="4521"
              value={f.lastFour}
              onChange={set('lastFour')}
            />
          </Field>
        )}
        <Field label={`Opening balance (${symbol})`} error={err.openingBalance}>
          <input
            className="input"
            inputMode="decimal"
            value={f.openingBalance}
            onChange={set('openingBalance')}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {initial ? 'Save changes' : 'Add account'}
        </button>
      </div>
    </form>
  )
}
