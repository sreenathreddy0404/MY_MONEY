import express from "express"
import helmet from "helmet"
import cors from "cors"
import { env } from "./config/env.js"
import routes from "./routes/index.js"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js"
import { apiLimiter } from "./middleware/rateLimit.js"
import { originCheck } from "./middleware/originCheck.js"

const app = express()

app.disable("x-powered-by")
// Needed so rate limiting sees the real client IP behind a proxy (Render, Fly, Railway, ...).
if (env.isProd) app.set("trust proxy", 1)

app.use(helmet())
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: "50kb" }))
app.use(originCheck)

app.get("/api/health", (_req, res) => res.json({ success: true, status: "ok" }))
app.use("/api", apiLimiter, routes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
