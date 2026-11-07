import { z } from "zod"
import { MAX_AMOUNT } from "./common.js"

export const ACCOUNT_TYPES = ["Savings", "Current", "Cash", "Wallet"]

const base = {
  name: z.string().trim().min(1, "Account name is required").max(60),
  bankName: z.string().trim().max(80).default(""),
  type: z.enum(ACCOUNT_TYPES),
  lastFour: z.string().trim().regex(/^(\d{4})?$/, "Enter exactly 4 digits").default(""),
  openingBalance: z
    .number()
    .int("Opening balance must be a whole number of paise")
    .min(0, "Opening balance cannot be negative")
    .max(MAX_AMOUNT)
    .default(0),
}

export const accountBody = z.object(base)
export const accountStatusBody = z.object({ active: z.boolean() })
