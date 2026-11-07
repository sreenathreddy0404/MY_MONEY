import { asyncHandler } from "../utils/errors.js"
import { created, ok } from "../utils/response.js"
import * as svc from "../services/transferService.js"
import { transfer } from "../utils/serializers.js"

export const list = asyncHandler(async (req, res) => {
  const { rows, pagination } = await svc.listTransfers(req.user.id, req.valid.query)
  ok(res, rows.map(transfer), { pagination })
})
export const create = asyncHandler(async (req, res) => created(res, transfer(await svc.createTransfer(req.user.id, req.valid.body))))
export const update = asyncHandler(async (req, res) => ok(res, transfer(await svc.updateTransfer(req.user.id, req.params.id, req.valid.body))))
export const remove = asyncHandler(async (req, res) => {
  await svc.deleteTransfer(req.user.id, req.params.id)
  ok(res, { id: req.params.id })
})
