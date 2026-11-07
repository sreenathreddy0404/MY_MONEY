import { asyncHandler } from "../utils/errors.js"
import { created, ok } from "../utils/response.js"
import * as svc from "../services/incomeService.js"
import { income } from "../utils/serializers.js"

export const list = asyncHandler(async (req, res) => {
  const { rows, pagination, summary } = await svc.listIncomes(req.user.id, req.valid.query)
  ok(res, rows.map(income), { pagination, summary })
})
export const get = asyncHandler(async (req, res) => ok(res, income(await svc.getIncome(req.user.id, req.params.id))))
export const create = asyncHandler(async (req, res) => created(res, income(await svc.createIncome(req.user.id, req.valid.body))))
export const update = asyncHandler(async (req, res) => ok(res, income(await svc.updateIncome(req.user.id, req.params.id, req.valid.body))))
export const remove = asyncHandler(async (req, res) => {
  await svc.deleteIncome(req.user.id, req.params.id)
  ok(res, { id: req.params.id })
})
