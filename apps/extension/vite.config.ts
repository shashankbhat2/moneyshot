import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The editor page and the service worker. The content script is built separately as a single
// classic script (vite.content.config.ts).

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    // Cleared by the build script; both builds write to dist/.
    emptyOutDir: false,
    // Extension pages load scripts from the extension origin; no polyfill needed.
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        screenshot: "screenshot.html",
        background: "src/background.ts",
      },
      output: {
        entryFileNames: (chunk) =>
          // The manifest references the service worker by a fixed path.
          chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js",
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
