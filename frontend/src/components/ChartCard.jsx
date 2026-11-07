export default function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`card p-4 ${className}`}>
      <div className="mb-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

export function EmptyState({ children = 'No data to show yet.' }) {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
      {children}
    </div>
  )
}
