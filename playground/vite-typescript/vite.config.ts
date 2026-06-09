import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: ".",
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "open-quran-view": path.resolve(__dirname, "../.."),
    },
  },
});
