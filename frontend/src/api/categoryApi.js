import { api } from "./client.js"

export const categoryApi = {
  list: () => api.get("/categories").then((r) => r.data),
  create: (v) => api.post("/categories", v).then((r) => r.data),
  update: (id, v) => api.put(`/categories/${id}`, v).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
}
