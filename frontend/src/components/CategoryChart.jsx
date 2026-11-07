import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useStore } from '../hooks/useStore.jsx'
import { useChartTheme } from '../hooks/useChartTheme.js'
import { sum } from '../utils/calc'
import { EmptyState } from './ChartCard.jsx'

export default function CategoryChart({ data }) {
  const { fmt } = useStore()
  const t = useChartTheme()
  const total = sum(data, (d) => d.value)

  if (!data.length) return <EmptyState>No expenses in this period.</EmptyState>

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={1}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.id} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => fmt(v)} {...t.tooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.id} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">
              {Math.round((d.value / total) * 100)}%
            </span>
            <span className="w-24 text-right font-medium tabular-nums">{fmt(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
