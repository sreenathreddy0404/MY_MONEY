import { z } from "zod"
import { amountPaise, dateString, idSchema, optionalQuery, sortOrder } from "./common.js"
import { paginationSchema } from "../utils/pagination.js"

export const INCOME_SOURCES = ["Salary", "Freelancing", "Family", "Refund", "Other"]

export const incomeBody = z.object({
  amount: amountPaise,
  source: z.enum(INCOME_SOURCES),
  description: z.string().trim().max(300).default(""),
  date: dateString,
  accountId: idSchema,
})

export const incomeListQuery = paginationSchema.extend({
  search: optionalQuery(z.string().trim().max(100)),
  source: optionalQuery(z.enum(INCOME_SOURCES)),
  accountId: optionalQuery(idSchema),
  from: optionalQuery(dateString),
  to: optionalQuery(dateString),
  sortBy: z.enum(["date", "amount"]).default("date"),
  order: sortOrder,
})
