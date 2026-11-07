import { z } from "zod"

export const categoryBody = z.object({
  name: z.string().trim().min(1, "Category name is required").max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex value like #0ea5e9").default("#94a3b8"),
})

export const categoryUpdateBody = categoryBody.partial().refine((v) => Object.keys(v).length > 0, "Nothing to update")
