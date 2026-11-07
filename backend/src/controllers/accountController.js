import { asyncHandler } from "../utils/errors.js"
import { created, ok } from "../utils/response.js"
import * as svc from "../services/accountService.js"
import { account } from "../utils/serializers.js"

const out = ({ account: a, balance }) => account(a, balance)

export const list = asyncHandler(async (req, res) => ok(res, (await svc.listAccounts(req.user.id)).map(out)))
export const get = asyncHandler(async (req, res) => ok(res, out(await svc.getAccount(req.user.id, req.params.id))))
export const create = asyncHandler(async (req, res) => created(res, out(await svc.createAccount(req.user.id, req.valid.body))))
export const update = asyncHandler(async (req, res) => ok(res, out(await svc.updateAccount(req.user.id, req.params.id, req.valid.body))))
export const setStatus = asyncHandler(async (req, res) =>
  ok(res, out(await svc.setAccountStatus(req.user.id, req.params.id, req.valid.body.active))),
)
export const remove = asyncHandler(async (req, res) => {
  await svc.deleteAccount(req.user.id, req.params.id)
  ok(res, { id: req.params.id })
})
