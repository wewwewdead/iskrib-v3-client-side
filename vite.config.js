import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // plugins: [react()],
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
});