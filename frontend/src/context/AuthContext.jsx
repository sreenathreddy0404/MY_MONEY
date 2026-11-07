import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { authApi } from "../api/authApi.js"
import { setUnauthorizedHandler } from "../api/client.js"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true until the first /auth/me answers

  // Restore the session on page load/refresh from the httpOnly cookie via the backend.
  useEffect(() => {
    let active = true
    authApi
      .me()
      .then((u) => active && setUser(u))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  // Any 401 from a data endpoint (expired / revoked session) sends the user back to login.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (v) => setUser(await authApi.login(v)), [])
  const register = useCallback(async (v) => setUser(await authApi.register(v)), [])
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
