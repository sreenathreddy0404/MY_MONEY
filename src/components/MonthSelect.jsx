import { monthLabel } from '../utils/dates'

export default function MonthSelect({ months, value, onChange, allLabel }) {
  return (
    <select
      className="input w-auto"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Month"
    >
      {allLabel && <option value="all">{allLabel}</option>}
      {months.map((m) => (
        <option key={m} value={m}>
          {monthLabel(m)}
        </option>
      ))}
    </select>
  )
}
