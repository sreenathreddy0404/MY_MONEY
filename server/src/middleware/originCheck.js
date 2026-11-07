import { env } from "../config/env.js"
import { AppError } from "../utils/errors.js"

// Defence in depth on top of SameSite=Lax: state-changing requests that carry an Origin header
// must come from the configured frontend.
export const originCheck = (req, _res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next()
  const origin = req.get("origin")
  if (origin && origin !== new URL(env.clientUrl).origin) return next(new AppError(403, "Origin not allowed"))
  next()
}
