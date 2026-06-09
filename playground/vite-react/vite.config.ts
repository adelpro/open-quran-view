import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "open-quran-view": path.resolve(__dirname, "../.."),
    },
  },
});
