import { Prisma } from "@prisma/client"
import { env } from "../config/env.js"
import { AppError } from "../utils/errors.js"

export const notFoundHandler = (req, _res, next) => next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`))

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, message: err.message, ...(err.details ? { errors: err.details } : {}) })
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Malformed JSON body" })
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body too large" })
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ success: false, message: "A record with these details already exists" })
    if (err.code === "P2025") return res.status(404).json({ success: false, message: "Record not found" })
    if (err.code === "P2003") return res.status(409).json({ success: false, message: "This record is referenced by other data" })
  }
  console.error(err)
  res.status(500).json({ success: false, message: env.isProd ? "Something went wrong" : err.message || "Something went wrong" })
}
