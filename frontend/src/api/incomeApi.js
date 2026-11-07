import { api } from "./client.js"

// list() resolves to { data, pagination, summary? } straight from the server.
export const incomeApi = {
  list: (params, signal) => api.get("/incomes", { query: params, signal }),
  get: (id) => api.get(`/incomes/${id}`).then((r) => r.data),
  create: (v) => api.post("/incomes", v).then((r) => r.data),
  update: (id, v) => api.put(`/incomes/${id}`, v).then((r) => r.data),
  remove: (id) => api.delete(`/incomes/${id}`),
}
