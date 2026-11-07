import { z } from "zod"

export const ALLOWED_LIMITS = [10, 20, 50]

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .refine((n) => ALLOWED_LIMITS.includes(n), { message: `limit must be one of ${ALLOWED_LIMITS.join(", ")}` })
    .default(10),
})

export const buildPagination = ({ page, limit }, total) => {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 }
}
