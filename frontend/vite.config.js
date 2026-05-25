import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    reporters: process.env.GITHUB_ACTIONS
      ? ["default", "github-actions"]
      : ["default"],
  },
});

