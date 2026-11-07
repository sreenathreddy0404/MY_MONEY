import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import Field from "../components/Field.jsx"
import { AuthShell, FormError } from "./Login.jsx"

export default function Register() {
  const { user, register } = useAuth()
  const [f, setF] = useState({ name: "", email: "", password: "", confirmPassword: "" })
  const [err, setErr] = useState({})
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  if (user) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!f.name.trim()) er.name = "Name is required"
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = "Enter a valid email address"
    if (f.password.length < 8) er.password = "Use at least 8 characters"
    else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) er.password = "Include at least one letter and one number"
    if (f.confirmPassword !== f.password) er.confirmPassword = "Passwords do not match"
    setErr(er)
    setFormError("")
    if (Object.keys(er).length) return
    setBusy(true)
    try {
      await register({ name: f.name.trim(), email: f.email.trim(), password: f.password, confirmPassword: f.confirmPassword })
    } catch (ex) {
      // Surface server-side field errors (e.g. email already registered) next to the field.
      if (ex.fields) setErr(ex.fields)
      setFormError(ex.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start tracking your money in minutes">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <FormError>{formError}</FormError>}
        <Field label="Name" error={err.name}>
          <input className="input" autoComplete="name" autoFocus value={f.name} onChange={set("name")} />
        </Field>
        <Field label="Email" error={err.email}>
          <input className="input" type="email" autoComplete="email" value={f.email} onChange={set("email")} />
        </Field>
        <Field label="Password" error={err.password}>
          <input className="input" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} />
        </Field>
        <Field label="Confirm password" error={err.confirmPassword}>
          <input className="input" type="password" autoComplete="new-password" value={f.confirmPassword} onChange={set("confirmPassword")} />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
