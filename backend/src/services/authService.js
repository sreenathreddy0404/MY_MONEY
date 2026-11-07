import bcrypt from "bcrypt"
import { prisma } from "../config/prisma.js"
import { conflict, unauthorized } from "../utils/errors.js"
import { seedCategoriesFor } from "./categoryService.js"

const ROUNDS = 12
// Compared against when the email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", ROUNDS)

export const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email })

export async function register({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) throw conflict("An account with this email already exists", { email: "Email already registered" })
  const passwordHash = await bcrypt.hash(password, ROUNDS)
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name, email, passwordHash } })
      await seedCategoriesFor(tx, user.id)
      return user
    })
  } catch (e) {
    if (e?.code === "P2002") throw conflict("An account with this email already exists", { email: "Email already registered" })
    throw e
  }
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } })
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !ok) throw unauthorized("Incorrect email or password")
  return user
}

// Bumping tokenVersion invalidates every JWT issued so far for this user.
export const invalidateSessions = (userId) =>
  prisma.user.updateMany({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } })
