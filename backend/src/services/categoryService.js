import { prisma } from "../config/prisma.js"
import { badRequest, conflict, notFound } from "../utils/errors.js"

export const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#f59e0b" },
  { name: "Travel", color: "#0ea5e9" },
  { name: "Shopping", color: "#a855f7" },
  { name: "Education", color: "#6366f1" },
  { name: "Bills", color: "#64748b" },
  { name: "Entertainment", color: "#ec4899" },
  { name: "Health", color: "#14b8a6" },
  { name: "Other", color: "#94a3b8", isDefault: true },
]

export const seedCategoriesFor = (db, userId) =>
  db.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ userId, type: "expense", isDefault: false, ...c })),
  })

export const listCategories = (userId) =>
  prisma.category.findMany({
    where: { userId },
    orderBy: [{ isDefault: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { expenses: true } } },
  })

async function assertUniqueName(userId, name, exceptId) {
  const dup = await prisma.category.findFirst({
    where: { userId, type: "expense", name: { equals: name, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  })
  if (dup) throw conflict("That category already exists")
}

export async function createCategory(userId, v) {
  await assertUniqueName(userId, v.name)
  return prisma.category.create({ data: { userId, type: "expense", name: v.name, color: v.color } })
}

export async function updateCategory(userId, id, v) {
  const c = await prisma.category.findFirst({ where: { id, userId } })
  if (!c) throw notFound("Category not found")
  if (v.name && c.isDefault && v.name.toLowerCase() !== c.name.toLowerCase()) {
    throw badRequest("The Other category cannot be renamed")
  }
  if (v.name) await assertUniqueName(userId, v.name, id)
  await prisma.category.updateMany({ where: { id, userId }, data: v })
  return prisma.category.findFirst({ where: { id, userId } })
}

// Expenses of the deleted category are moved to the user's default "Other" category, atomically.
export async function deleteCategory(userId, id) {
  return prisma.$transaction(async (tx) => {
    const c = await tx.category.findFirst({ where: { id, userId } })
    if (!c) throw notFound("Category not found")
    if (c.isDefault) throw badRequest("The Other category cannot be deleted")
    const fallback = await tx.category.findFirst({ where: { userId, isDefault: true } })
    if (!fallback) throw badRequest("Fallback category is missing")
    const moved = await tx.expense.updateMany({ where: { userId, categoryId: id }, data: { categoryId: fallback.id } })
    await tx.category.deleteMany({ where: { id, userId } })
    return { moved: moved.count }
  })
}
