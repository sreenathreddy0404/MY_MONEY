import { api } from "./client.js"

export const accountApi = {
  list: () => api.get("/accounts").then((r) => r.data),
  get: (id) => api.get(`/accounts/${id}`).then((r) => r.data),
  create: (v) => api.post("/accounts", v).then((r) => r.data),
  update: (id, v) => api.put(`/accounts/${id}`, v).then((r) => r.data),
  setStatus: (id, active) => api.patch(`/accounts/${id}/status`, { active }).then((r) => r.data),
  remove: (id) => api.delete(`/accounts/${id}`),
}
