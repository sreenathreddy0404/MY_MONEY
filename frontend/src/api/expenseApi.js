import { api } from "./client.js"

// list() resolves to { data, pagination, summary? } straight from the server.
export const expenseApi = {
  list: (params, signal) => api.get("/expenses", { query: params, signal }),
  get: (id) => api.get(`/expenses/${id}`).then((r) => r.data),
  create: (v) => api.post("/expenses", v).then((r) => r.data),
  update: (id, v) => api.put(`/expenses/${id}`, v).then((r) => r.data),
  remove: (id) => api.delete(`/expenses/${id}`),
}
