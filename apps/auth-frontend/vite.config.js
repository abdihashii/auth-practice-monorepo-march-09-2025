import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
});
