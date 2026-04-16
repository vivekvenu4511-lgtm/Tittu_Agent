import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api/ollama": {
        target: "http://localhost:11434",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, ""),
      },
      "/api/openrouter": {
        target: "https://openrouter.ai/api/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, ""),
      },
    },
  },
});
