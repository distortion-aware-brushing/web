import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        react: "src/react.tsx"
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "js" : "cjs"}`
    },
    rollupOptions: {
      external: ["@dabrush/engine", "@dabrush/schema", "react", "react/jsx-runtime"]
    }
  },
  test: {
    environment: "node"
  }
});
