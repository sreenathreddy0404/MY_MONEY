import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Same-origin in development: the browser talks to :5173 and Vite forwards /api to the Express server,
    // so the httpOnly auth cookie works without any cross-site cookie settings.
    proxy: { "/api": { target: "http://localhost:5000", changeOrigin: false } },
  },
})
