import { asyncHandler } from "../utils/errors.js"
import { ok } from "../utils/response.js"
import * as svc from "../services/analyticsService.js"

export const dashboard = asyncHandler(async (req, res) => ok(res, await svc.dashboardSummary(req.user.id, req.valid.query.month)))
export const analytics = asyncHandler(async (req, res) => ok(res, await svc.analyticsOverview(req.user.id, req.valid.query)))
export const months = asyncHandler(async (req, res) => ok(res, await svc.activityMonths(req.user.id)))
