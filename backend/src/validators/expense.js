import { z } from "zod"
import { amountPaise, dateString, idSchema, optionalQuery, sortOrder } from "./common.js"
import { paginationSchema } from "../utils/pagination.js"

export const expenseBody = z.object({
  amount: amountPaise,
  reason: z.string().trim().min(1, "Reason is required").max(200),
  notes: z.string().trim().max(1000).default(""),
  date: dateString,
  accountId: idSchema,
  categoryId: idSchema,
})

export const expenseListQuery = paginationSchema.extend({
  search: optionalQuery(z.string().trim().max(100)),
  categoryId: optionalQuery(idSchema),
  accountId: optionalQuery(idSchema),
  from: optionalQuery(dateString),
  to: optionalQuery(dateString),
  sortBy: z.enum(["date", "amount"]).default("date"),
  order: sortOrder,
})
