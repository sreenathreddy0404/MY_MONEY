import { api } from "./client.js"

export const authApi = {
  register: (v) => api.post("/auth/register", v).then((r) => r.data.user),
  login: (v) => api.post("/auth/login", v).then((r) => r.data.user),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me").then((r) => r.data.user),
}
