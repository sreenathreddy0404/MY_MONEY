import { api } from "./client.js"

// list() resolves to { data, pagination, summary? } straight from the server.
export const transferApi = {
  list: (params, signal) => api.get("/transfers", { query: params, signal }),
  create: (v) => api.post("/transfers", v).then((r) => r.data),
  update: (id, v) => api.put(`/transfers/${id}`, v).then((r) => r.data),
  remove: (id) => api.delete(`/transfers/${id}`),
}
