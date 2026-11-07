import { badRequest } from "../utils/errors.js"

// validate({ body, query, params }) parses and replaces req.* with the zod output.
export const validate = (schemas) => (req, _res, next) => {
  try {
    for (const key of ["params", "query", "body"]) {
      if (!schemas[key]) continue
      const result = schemas[key].safeParse(req[key])
      if (!result.success) {
        const fields = {}
        for (const issue of result.error.issues) {
          const path = issue.path.join(".") || key
          if (!fields[path]) fields[path] = issue.message
        }
        throw badRequest(Object.values(fields)[0] || "Invalid request", fields)
      }
      // Express 4: req.query is writable; assign validated values to a separate holder as well.
      req.valid = { ...(req.valid || {}), [key]: result.data }
    }
    next()
  } catch (e) {
    next(e)
  }
}
