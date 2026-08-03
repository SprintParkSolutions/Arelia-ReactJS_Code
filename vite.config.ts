import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: mode === "test" ? [react()] : [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
            return "react-vendor";
          }

          if (id.includes("framer-motion")) {
            return "motion-vendor";
          }

          if (id.includes("gsap")) {
            return "animation-vendor";
          }

          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
}));
