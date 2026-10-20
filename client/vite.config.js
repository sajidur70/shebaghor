import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "@/..." → "src/..."  (used when Vite builds your code)
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
