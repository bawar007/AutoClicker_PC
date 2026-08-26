import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" jest wymagane, żeby zbudowana appka działała po otwarciu przez file:// w Electronie
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
  },
});
