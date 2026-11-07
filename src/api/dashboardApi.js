import { api } from "./client.js"

export const dashboardApi = {
  summary: (month, signal) => api.get("/dashboard/summary", { query: { month }, signal }).then((r) => r.data),
  months: (signal) => api.get("/dashboard/months", { signal }).then((r) => r.data),
  analytics: (params, signal) => api.get("/analytics/overview", { query: params, signal }).then((r) => r.data),
}
