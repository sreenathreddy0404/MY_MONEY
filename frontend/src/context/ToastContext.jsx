import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { CheckCircle2, X, XCircle } from "lucide-react"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (type, message) => {
      const id = ++idRef.current
      setToasts((t) => [...t.slice(-3), { id, type, message }])
      setTimeout(() => dismiss(id), type === "error" ? 6000 : 3500)
    },
    [dismiss],
  )
  const value = useMemo(
    () => ({ success: (m) => push("success", m), error: (m) => push("error", m) }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => {
          const Icon = t.type === "error" ? XCircle : CheckCircle2
          return (
            <div
              key={t.id}
              role={t.type === "error" ? "alert" : "status"}
              className="card pointer-events-auto flex w-full max-w-sm items-start gap-2 px-3 py-2.5 text-sm shadow-lg"
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  t.type === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              />
              <span className="flex-1">{t.message}</span>
              <button type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx
}
