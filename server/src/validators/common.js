import { z } from "zod"
import { toDbDate } from "../utils/dates.js"

export const MAX_AMOUNT = 1_000_000_000 // 1 crore rupees, in paise (fits Postgres INT)

export const idSchema = z.string().min(1).max(40)
export const idParams = z.object({ id: idSchema })

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((s) => !Number.isNaN(toDbDate(s).getTime()) && toDbDate(s).toISOString().startsWith(s), "Invalid date")

export const amountPaise = z
  .number({ invalid_type_error: "Amount must be a number", required_error: "Amount is required" })
  .int("Amount must be a whole number of paise")
  .positive("Amount must be greater than 0")
  .max(MAX_AMOUNT, "Amount is too large")

export const emptyToUndef = (v) => (v === "" || v === "all" ? undefined : v)
export const optionalQuery = (schema) => z.preprocess(emptyToUndef, schema.optional())

export const sortOrder = z.enum(["asc", "desc"]).default("desc")
