import { asyncHandler } from "../utils/errors.js"
import { created, ok } from "../utils/response.js"
import * as auth from "../services/authService.js"
import { clearAuthCookie, setAuthCookie } from "../middleware/auth.js"

export const register = asyncHandler(async (req, res) => {
  const user = await auth.register(req.valid.body)
  setAuthCookie(res, user)
  created(res, { user: auth.publicUser(user) })
})

export const login = asyncHandler(async (req, res) => {
  const user = await auth.login(req.valid.body)
  setAuthCookie(res, user)
  ok(res, { user: auth.publicUser(user) })
})

export const logout = asyncHandler(async (req, res) => {
  // requireAuth is intentionally not applied to /logout so an expired cookie can still be cleared;
  // if a valid session is present we also invalidate it server-side.
  if (req.user) await auth.invalidateSessions(req.user.id)
  clearAuthCookie(res)
  ok(res, { message: "Logged out" })
})

export const me = asyncHandler(async (req, res) => ok(res, { user: auth.publicUser(req.user) }))
