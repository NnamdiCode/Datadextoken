import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, "client/index.html"),
    },
  },
  define: {
    // Replace server API calls with external API in production
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://your-backend-api.com'),
  },
});