import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { accountApi } from "../api/accountApi.js"
import { categoryApi } from "../api/categoryApi.js"
import { expenseApi } from "../api/expenseApi.js"
import { incomeApi } from "../api/incomeApi.js"
import { transferApi } from "../api/transferApi.js"
import { useToast } from "../context/ToastContext.jsx"
import { useTheme } from "../context/ThemeContext.jsx"
import { CURRENCIES, formatMoney } from "../utils/money"

// Financial data now lives in the backend. Only non-sensitive preferences (theme, currency
// display) stay in localStorage.
const CURRENCY_KEY = "mymoney:currency"

function loadCurrency() {
  try {
    const c = localStorage.getItem(CURRENCY_KEY)
    if (c && CURRENCIES[c]) return c
  } catch {
    /* ignore */
  }
  return "INR"
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const toast = useToast()
  const { theme, setTheme, toggleTheme } = useTheme()

  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState("loading") // loading | ready | error
  const [loadError, setLoadError] = useState("")
  // Bumped after every successful mutation; paginated lists and dashboards refetch when it changes.
  const [version, setVersion] = useState(0)
  const [currency, setCurrencyState] = useState(loadCurrency)

  const loadCore = useCallback(async () => {
    const [a, c] = await Promise.all([accountApi.list(), categoryApi.list()])
    setAccounts(a)
    setCategories(c)
  }, [])

  useEffect(() => {
    let active = true
    loadCore()
      .then(() => active && setStatus("ready"))
      .catch((e) => {
        if (!active) return
        setLoadError(e.message)
        setStatus("error")
      })
    return () => {
      active = false
    }
  }, [loadCore])

  const setCurrency = useCallback((code) => {
    setCurrencyState(code)
    try {
      localStorage.setItem(CURRENCY_KEY, code)
    } catch {
      /* ignore */
    }
  }, [])

  // Runs an API mutation, shows success/error feedback, then refreshes balances + dependent lists.
  // Resolves true on success so callers can close their modal only when it worked.
  const run = useCallback(
    async (fn, message) => {
      try {
        await fn()
        await loadCore().catch(() => {})
        setVersion((v) => v + 1)
        if (message) toast.success(message)
        return true
      } catch (e) {
        toast.error(e.message || "Something went wrong")
        return false
      }
    },
    [loadCore, toast],
  )

  const actions = useMemo(
    () => ({
      addExpense: (v) => run(() => expenseApi.create(v), "Expense added"),
      updateExpense: (id, v) => run(() => expenseApi.update(id, v), "Expense updated"),
      deleteExpense: (id) => run(() => expenseApi.remove(id), "Expense deleted"),

      addIncome: (v) => run(() => incomeApi.create(v), "Income added"),
      updateIncome: (id, v) => run(() => incomeApi.update(id, v), "Income updated"),
      deleteIncome: (id) => run(() => incomeApi.remove(id), "Income deleted"),

      addTransfer: (v) => run(() => transferApi.create(v), "Transfer added"),
      updateTransfer: (id, v) => run(() => transferApi.update(id, v), "Transfer updated"),
      deleteTransfer: (id) => run(() => transferApi.remove(id), "Transfer deleted"),

      addAccount: (v) => run(() => accountApi.create(v), "Account added"),
      updateAccount: (id, v) => run(() => accountApi.update(id, v), "Account updated"),
      toggleAccount: (id, active) =>
        run(() => accountApi.setStatus(id, active), active ? "Account activated" : "Account deactivated"),
      deleteAccount: (id) => run(() => accountApi.remove(id), "Account deleted"),

      addCategory: (v) => run(() => categoryApi.create(v), "Category added"),
      updateCategory: (id, v) => run(() => categoryApi.update(id, v), "Category saved"),
      deleteCategory: (id) => run(() => categoryApi.remove(id), "Category deleted"),
    }),
    [run],
  )

  const fmt = useCallback((paise) => formatMoney(paise, currency), [currency])

  const value = useMemo(
    () => ({
      accounts,
      categories,
      version,
      ...actions,
      currency,
      setCurrency,
      theme,
      setTheme,
      toggleTheme,
      fmt,
      symbol: (CURRENCIES[currency] || CURRENCIES.INR).symbol,
      // Balances are computed server-side from SQL aggregates and delivered on each account.
      balances: Object.fromEntries(accounts.map((a) => [a.id, a.balance])),
      activeAccounts: accounts.filter((a) => a.active),
      accountById: Object.fromEntries(accounts.map((a) => [a.id, a])),
      categoryById: Object.fromEntries(categories.map((c) => [c.id, c])),
    }),
    [accounts, categories, version, actions, currency, setCurrency, theme, setTheme, toggleTheme, fmt],
  )

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Loading your data…
      </div>
    )
  }
  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError || "Could not load your data."}</p>
        <button type="button" className="btn-outline" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    )
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside StoreProvider")
  return ctx
}
