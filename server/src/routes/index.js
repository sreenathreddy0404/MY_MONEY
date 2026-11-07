import { Router } from "express"
import cookieParser from "cookie-parser"
import { requireAuth } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { loginLimiter, registerLimiter } from "../middleware/rateLimit.js"
import { idParams } from "../validators/common.js"
import { loginBody, registerBody } from "../validators/auth.js"
import { accountBody, accountStatusBody } from "../validators/account.js"
import { categoryBody, categoryUpdateBody } from "../validators/category.js"
import { expenseBody, expenseListQuery } from "../validators/expense.js"
import { incomeBody, incomeListQuery } from "../validators/income.js"
import { transferBody, transferListQuery } from "../validators/transfer.js"
import { analyticsQuery, dashboardQuery } from "../validators/analytics.js"
import * as authC from "../controllers/authController.js"
import * as accountC from "../controllers/accountController.js"
import * as categoryC from "../controllers/categoryController.js"
import * as expenseC from "../controllers/expenseController.js"
import * as incomeC from "../controllers/incomeController.js"
import * as transferC from "../controllers/transferController.js"
import * as analyticsC from "../controllers/analyticsController.js"
import jwt from "jsonwebtoken"
import { COOKIE_NAME } from "../middleware/auth.js"
import { env } from "../config/env.js"

const router = Router()
router.use(cookieParser())

// ---- Auth ----
router.post("/auth/register", registerLimiter, validate({ body: registerBody }), authC.register)
router.post("/auth/login", loginLimiter, validate({ body: loginBody }), authC.login)
// Logout always clears the cookie; if the token is still valid it also revokes the session.
router.post(
  "/auth/logout",
  (req, _res, next) => {
    try {
      const p = jwt.verify(req.cookies?.[COOKIE_NAME] || "", env.jwtSecret)
      req.user = { id: p.sub }
    } catch {
      /* no / expired token: just clear the cookie */
    }
    next()
  },
  authC.logout,
)
router.get("/auth/me", requireAuth, authC.me)

// ---- Everything below requires authentication ----
router.use(requireAuth)

router.get("/accounts", accountC.list)
router.post("/accounts", validate({ body: accountBody }), accountC.create)
router.get("/accounts/:id", validate({ params: idParams }), accountC.get)
router.put("/accounts/:id", validate({ params: idParams, body: accountBody }), accountC.update)
router.patch("/accounts/:id/status", validate({ params: idParams, body: accountStatusBody }), accountC.setStatus)
router.delete("/accounts/:id", validate({ params: idParams }), accountC.remove)

router.get("/expenses", validate({ query: expenseListQuery }), expenseC.list)
router.post("/expenses", validate({ body: expenseBody }), expenseC.create)
router.get("/expenses/:id", validate({ params: idParams }), expenseC.get)
router.put("/expenses/:id", validate({ params: idParams, body: expenseBody }), expenseC.update)
router.delete("/expenses/:id", validate({ params: idParams }), expenseC.remove)

router.get("/incomes", validate({ query: incomeListQuery }), incomeC.list)
router.post("/incomes", validate({ body: incomeBody }), incomeC.create)
router.get("/incomes/:id", validate({ params: idParams }), incomeC.get)
router.put("/incomes/:id", validate({ params: idParams, body: incomeBody }), incomeC.update)
router.delete("/incomes/:id", validate({ params: idParams }), incomeC.remove)

router.get("/transfers", validate({ query: transferListQuery }), transferC.list)
router.post("/transfers", validate({ body: transferBody }), transferC.create)
router.put("/transfers/:id", validate({ params: idParams, body: transferBody }), transferC.update)
router.delete("/transfers/:id", validate({ params: idParams }), transferC.remove)

router.get("/categories", categoryC.list)
router.post("/categories", validate({ body: categoryBody }), categoryC.create)
router.put("/categories/:id", validate({ params: idParams, body: categoryUpdateBody }), categoryC.update)
router.delete("/categories/:id", validate({ params: idParams }), categoryC.remove)

router.get("/dashboard/months", analyticsC.months)
router.get("/dashboard/summary", validate({ query: dashboardQuery }), analyticsC.dashboard)
router.get("/analytics/overview", validate({ query: analyticsQuery }), analyticsC.analytics)

export default router
