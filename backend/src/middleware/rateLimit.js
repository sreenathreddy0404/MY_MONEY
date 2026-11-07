import rateLimit from "express-rate-limit"

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  })

// Brute-force protection for credential endpoints.
export const loginLimiter = make(15 * 60 * 1000, 10, "Too many login attempts. Try again in 15 minutes.")
export const registerLimiter = make(60 * 60 * 1000, 10, "Too many sign-up attempts. Try again later.")
// Generic ceiling for the rest of the API.
export const apiLimiter = make(60 * 1000, 300, "Too many requests. Slow down a little.")
