import { defineConfig } from "vite";

// Content scripts are classic scripts and can't import ES module chunks, so content.js is
// built on its own as a self-contained IIFE.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    copyPublicDir: false,
    lib: {
      entry: "src/content.ts",
      formats: ["iife"],
      name: "moneyshotContent",
      fileName: () => "content.js",
    },
  },
});
