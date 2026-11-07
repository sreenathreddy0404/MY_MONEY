import "dotenv/config"

const required = ["DATABASE_URL", "JWT_SECRET"]
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}. Copy backend/.env.example to backend/.env.`)
  process.exit(1)
}
if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters long.")
  process.exit(1)
}

const formatClientUrl = (raw) => {
  if (!raw) return "http://localhost:5173"
  const trimmed = raw.trim().replace(/\/+$/, "")
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true"

export const env = {
  nodeEnv: process.env.NODE_ENV || (process.env.RENDER ? "production" : "development"),
  isProd,
  port: Number(process.env.PORT) || 5000,
  clientUrl: formatClientUrl(process.env.CLIENT_URL),
  jwtSecret: process.env.JWT_SECRET,
}
