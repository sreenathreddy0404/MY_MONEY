import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { prisma } from "../config/prisma.js"
import { asyncHandler, unauthorized } from "../utils/errors.js"

export const COOKIE_NAME = "mymoney_token"
export const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.isProd,
  path: "/",
})

export const signToken = (user) =>
  jwt.sign({ sub: user.id, tv: user.tokenVersion }, env.jwtSecret, { expiresIn: "7d" })

export const setAuthCookie = (res, user) =>
  res.cookie(COOKIE_NAME, signToken(user), { ...cookieOptions(), maxAge: COOKIE_MAX_AGE_MS })

export const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions())

// Verifies the JWT cookie AND that the user still exists with a matching tokenVersion
// (logout bumps tokenVersion, which invalidates every previously issued token).
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) throw unauthorized()
  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw unauthorized("Session expired. Please sign in again.")
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, tokenVersion: true, createdAt: true },
  })
  if (!user || user.tokenVersion !== payload.tv) throw unauthorized("Session expired. Please sign in again.")
  req.user = user
  next()
})
