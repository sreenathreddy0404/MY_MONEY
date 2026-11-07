import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight } from 'lucide-react'
import { useStore } from '../hooks/useStore.jsx'
import { formatDate } from '../utils/dates'
import { accountLabel } from '../utils/calc'

const styles = {
  expense: { icon: ArrowUpRight, tone: 'text-red-600 dark:text-red-400', sign: '-' },
  income: { icon: ArrowDownLeft, tone: 'text-emerald-600 dark:text-emerald-400', sign: '+' },
  transfer: { icon: ArrowRightLeft, tone: 'text-slate-500 dark:text-slate-400', sign: '' },
}

export default function ActivityList({ items }) {
  const { fmt, accountById, categoryById } = useStore()
  const name = (id) => (accountById[id] ? accountLabel(accountById[id]) : 'Unknown account')

  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        No transactions in this month.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((x) => {
        const s = styles[x.kind]
        const Icon = s.icon
        let title
        let sub
        if (x.kind === 'expense') {
          title = x.reason
          sub = `${categoryById[x.categoryId]?.name ?? 'Other'} · ${name(x.accountId)}`
        } else if (x.kind === 'income') {
          title = x.description || x.source
          sub = `${x.source} · ${name(x.accountId)}`
        } else {
          title = x.note || 'Transfer between accounts'
          sub = `${name(x.fromAccountId)} → ${name(x.toAccountId)}`
        }
        return (
          <li key={`${x.kind}-${x.id}`} className="flex items-center gap-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Icon className={`h-4 w-4 ${s.tone}`} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {formatDate(x.date)} · {sub}
              </p>
            </div>
            <span className={`text-sm font-semibold tabular-nums ${s.tone}`}>
              {s.sign}
              {fmt(x.amount)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
