// Single fetch wrapper for the whole app. Always use "/api" so requests are same-origin:
// - In dev: Vite proxies /api to http://localhost:5000
// - In prod: Vercel proxies /api to https://my-money-gdbw.onrender.com
// This prevents browsers from blocking the httpOnly authentication cookie as a third-party cookie.
const BASE = "/api"

export class ApiError extends Error {
  constructor(message, status = 0, fields) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fields = fields
  }
}

let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

const qs = (query = {}) => {
  const p = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === "all") return
    p.set(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ""
}

async function request(method, path, { body, query, signal } = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}${qs(query)}`, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (e) {
    if (e?.name === "AbortError") throw e
    throw new ApiError("Cannot reach the server. Check your connection and try again.")
  }
  let json = null
  try {
    json = await res.json()
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    // A 401 from a data endpoint means the session ended; auth endpoints handle their own 401s.
    if (res.status === 401 && !path.startsWith("/auth/")) onUnauthorized?.()
    throw new ApiError(json?.message || `Request failed (${res.status})`, res.status, json?.errors)
  }
  return json
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  put: (path, body, opts) => request("PUT", path, { ...opts, body }),
  patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),
}
