import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ fastRefresh: false })],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    dedupe: ['react', 'react-dom'],
  },
  esbuild: {
    logOverride: {
      "this-is-undefined-in-esm": "silent",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("@lexical") || id.includes("lexical")) {
            return "vendor-lexical";
          }
          if (
            id.includes("react-router") ||
            id.includes("react-dom") ||
            id.includes("/react/")
          ) {
            return "vendor-react";
          }
          if (id.includes("@supabase") || id.includes("@tanstack")) {
            return "vendor-data";
          }
          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }

          return "vendor-misc";
        },
      },
    },
  },
});
