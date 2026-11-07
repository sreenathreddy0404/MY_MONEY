import "dotenv/config"

const required = ["DATABASE_URL", "JWT_SECRET"]
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}. Copy server/.env.example to server/.env.`)
  process.exit(1)
}
if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters long.")
  process.exit(1)
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET,
}
