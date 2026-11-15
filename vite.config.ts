import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const pages = mode === "pages";
  const pagesBase = process.env.LEAFSTER_PAGES_BASE || "/Leafster/";
  if (pages && !/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(pagesBase)) {
    throw new Error(
      "LEAFSTER_PAGES_BASE must be an absolute pathname with a trailing slash, for example /Leafster/. Only letters, digits, underscores and hyphens are allowed in path segments.",
    );
  }
  return {
    base: pages ? pagesBase : "/",
    define: {
      "import.meta.env.VITE_HOSTING_TARGET": JSON.stringify(
        pages ? "github-pages" : "full-stack",
      ),
    },
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": "http://127.0.0.1:3001",
        "/media": "http://127.0.0.1:3001",
        "/auth": "http://127.0.0.1:3001",
      },
    },
    build: { outDir: pages ? "dist-pages" : "dist", sourcemap: false },
  };
});
