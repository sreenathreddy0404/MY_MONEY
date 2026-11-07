import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { Wallet } from "lucide-react"
import { useAuth } from "../context/AuthContext.jsx"
import Field from "../components/Field.jsx"

export default function Login() {
  const { user, login } = useAuth()
  const [f, setF] = useState({ email: "", password: "" })
  const [err, setErr] = useState({})
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  if (user) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = "Enter a valid email address"
    if (!f.password) er.password = "Password is required"
    setErr(er)
    setFormError("")
    if (Object.keys(er).length) return
    setBusy(true)
    try {
      await login({ email: f.email.trim(), password: f.password })
    } catch (ex) {
      setFormError(ex.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to MyMoney">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <FormError>{formError}</FormError>}
        <Field label="Email" error={err.email}>
          <input className="input" type="email" autoComplete="email" autoFocus value={f.email} onChange={set("email")} />
        </Field>
        <Field label="Password" error={err.password}>
          <input className="input" type="password" autoComplete="current-password" value={f.password} onChange={set("password")} />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        New here?{" "}
        <Link to="/register" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}

export function FormError({ children }) {
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      {children}
    </p>
  )
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            <Wallet className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">MyMoney</span>
        </div>
        <div className="card p-6">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="mb-5 mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
