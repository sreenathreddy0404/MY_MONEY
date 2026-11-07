import { asyncHandler } from "../utils/errors.js"
import { created, ok } from "../utils/response.js"
import * as svc from "../services/expenseService.js"
import { expense } from "../utils/serializers.js"

export const list = asyncHandler(async (req, res) => {
  const { rows, pagination, summary } = await svc.listExpenses(req.user.id, req.valid.query)
  ok(res, rows.map(expense), { pagination, summary })
})
export const get = asyncHandler(async (req, res) => ok(res, expense(await svc.getExpense(req.user.id, req.params.id))))
export const create = asyncHandler(async (req, res) => created(res, expense(await svc.createExpense(req.user.id, req.valid.body))))
export const update = asyncHandler(async (req, res) => ok(res, expense(await svc.updateExpense(req.user.id, req.params.id, req.valid.body))))
export const remove = asyncHandler(async (req, res) => {
  await svc.deleteExpense(req.user.id, req.params.id)
  ok(res, { id: req.params.id })
})
