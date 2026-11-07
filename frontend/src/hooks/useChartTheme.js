import { useStore } from './useStore.jsx'

export function useChartTheme() {
  const { theme } = useStore()
  const dark = theme === 'dark'
  return {
    income: dark ? '#22c55e' : '#16a34a',
    expense: dark ? '#f87171' : '#dc2626',
    neutral: dark ? '#94a3b8' : '#64748b',
    axis: dark ? '#94a3b8' : '#64748b',
    grid: dark ? '#1e293b' : '#e2e8f0',
    cursor: dark ? '#1e293b' : '#f1f5f9',
    tooltip: {
      contentStyle: {
        background: dark ? '#0f172a' : '#ffffff',
        border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
        borderRadius: 6,
        fontSize: 12,
        boxShadow: 'none',
        color: dark ? '#e2e8f0' : '#0f172a',
      },
      labelStyle: { color: dark ? '#cbd5e1' : '#475569', marginBottom: 2 },
      itemStyle: { color: dark ? '#e2e8f0' : '#0f172a' },
    },
  }
}
