import { z } from "zod"
import { amountPaise, dateString, idSchema, optionalQuery, sortOrder } from "./common.js"
import { paginationSchema } from "../utils/pagination.js"

export const transferBody = z
  .object({
    amount: amountPaise,
    fromAccountId: idSchema,
    toAccountId: idSchema,
    note: z.string().trim().max(300).default(""),
    date: dateString,
  })
  .refine((v) => v.fromAccountId !== v.toAccountId, {
    path: ["toAccountId"],
    message: "Cannot transfer to the same account",
  })

export const transferListQuery = paginationSchema.extend({
  search: optionalQuery(z.string().trim().max(100)),
  accountId: optionalQuery(idSchema),
  from: optionalQuery(dateString),
  to: optionalQuery(dateString),
  sortBy: z.enum(["date", "amount"]).default("date"),
  order: sortOrder,
})
