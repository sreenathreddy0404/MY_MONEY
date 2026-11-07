import { asyncHandler } from "../utils/errors.js"
import { created, ok } from "../utils/response.js"
import * as svc from "../services/categoryService.js"
import { category } from "../utils/serializers.js"

export const list = asyncHandler(async (req, res) => ok(res, (await svc.listCategories(req.user.id)).map(category)))
export const create = asyncHandler(async (req, res) => created(res, category(await svc.createCategory(req.user.id, req.valid.body))))
export const update = asyncHandler(async (req, res) =>
  ok(res, category(await svc.updateCategory(req.user.id, req.params.id, req.valid.body))),
)
export const remove = asyncHandler(async (req, res) => {
  const r = await svc.deleteCategory(req.user.id, req.params.id)
  ok(res, { id: req.params.id, ...r })
})
