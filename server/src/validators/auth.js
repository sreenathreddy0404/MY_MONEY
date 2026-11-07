import { z } from "zod"

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254)
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number")

export const registerBody = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" })

export const loginBody = z.object({
  email,
  password: z.string().min(1, "Password is required").max(72),
})
