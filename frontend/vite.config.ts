import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const rootDirectory = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@admin": fileURLToPath(new URL("../app/admin", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    fs: { allow: [rootDirectory] },
  },
});
