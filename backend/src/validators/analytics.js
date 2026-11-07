import { z } from "zod"
import { dateString, optionalQuery } from "./common.js"

export const dashboardQuery = z.object({
  month: optionalQuery(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use the format YYYY-MM")),
})

export const analyticsQuery = z
  .object({
    from: optionalQuery(dateString),
    to: optionalQuery(dateString),
    keyword: optionalQuery(z.string().trim().max(100)),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, { path: ["to"], message: "Start date must be on or before end date" })
