import { useEffect, useRef, useState } from 'react'
import { LogOut, Moon, Plus, Sun, Trash2 } from 'lucide-react'
import { useStore } from '../hooks/useStore.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { CURRENCIES } from '../utils/money'
import PageHeader from '../components/PageHeader.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

function Section({ title, description, children }) {
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

// One editable category row. Edits are kept locally and saved once (name on blur, colour after a short pause)
// instead of firing an API request per keystroke.
function CategoryRow({ c, onSave, onDelete }) {
  const [name, setName] = useState(c.name)
  const [color, setColor] = useState(c.color)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    setName(c.name)
    setColor(c.color)
  }, [c.name, c.color])

  const saveName = async () => {
    const n = name.trim()
    if (!n) return setName(c.name)
    if (n !== c.name && !(await onSave(c.id, { name: n }))) setName(c.name)
  }
  const changeColor = (value) => {
    setColor(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSave(c.id, { color: value }), 600)
  }

  return (
    <li className="flex items-center gap-3 py-2.5">
      <input
        type="color"
        value={color}
        onChange={(e) => changeColor(e.target.value)}
        className="h-8 w-8 shrink-0 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5 dark:border-slate-700"
        aria-label={`${c.name} colour`}
      />
      <input
        className="input flex-1"
        value={name}
        disabled={c.isDefault}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label="Category name"
      />
      <span className="hidden w-24 text-right text-xs text-slate-500 dark:text-slate-400 sm:block">
        {c.expenseCount ?? 0} expenses
      </span>
      <button
        type="button"
        className="icon-btn"
        disabled={c.isDefault}
        onClick={() => onDelete(c)}
        aria-label={`Delete ${c.name}`}
        title={c.isDefault ? 'The Other category cannot be deleted' : 'Delete category'}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}

export default function Settings() {
  const { theme, setTheme, currency, setCurrency, categories, addCategory, updateCategory, deleteCategory } = useStore()
  const { user, logout } = useAuth()

  const [name, setName] = useState('')
  const [color, setColor] = useState('#0ea5e9')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const submitCategory = async (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return setError('Enter a category name')
    if (categories.some((c) => c.name.toLowerCase() === n.toLowerCase()))
      return setError('That category already exists')
    if (await addCategory({ name: n, color })) {
      setName('')
      setError('')
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Appearance, currency, categories and account" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Appearance" description="Your choice is remembered on this device.">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
            ].map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                aria-pressed={theme === key}
                className={`flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm font-medium transition-colors ${
                  theme === key
                    ? 'border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-slate-800'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title="Currency"
          description="Changes how amounts are displayed. Values are not converted."
        >
          <select
            className="input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            aria-label="Currency"
          >
            {Object.entries(CURRENCIES).map(([code, c]) => (
              <option key={code} value={code}>
                {c.label}
              </option>
            ))}
          </select>
        </Section>

        <div className="lg:col-span-2">
          <Section
            title="Expense categories"
            description="Deleting a category moves its expenses to Other."
          >
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((c) => (
                <CategoryRow key={c.id} c={c} onSave={updateCategory} onDelete={setDeleting} />
              ))}
            </ul>

            <form onSubmit={submitCategory} className="mt-4 flex flex-col gap-2 sm:flex-row" noValidate>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-10 shrink-0 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5 dark:border-slate-700"
                aria-label="New category colour"
              />
              <input
                className="input flex-1"
                placeholder="New category name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                aria-label="New category name"
              />
              <button type="submit" className="btn-primary">
                <Plus className="h-4 w-4" /> Add category
              </button>
            </form>
            {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
          </Section>
        </div>

        <div className="lg:col-span-2">
          <Section title="Account" description="Your data is stored securely in your account and is private to you.">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
              <button type="button" className="btn-outline" onClick={logout}>
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </Section>
        </div>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${deleting.name}"? ${deleting.expenseCount ?? 0} expense(s) will be moved to Other.`}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteCategory(deleting.id)
            setDeleting(null)
          }}
        />
      )}
    </>
  )
}
