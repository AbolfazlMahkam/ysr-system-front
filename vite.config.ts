import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Public base path the app is served from.
//
// GitHub Pages project sites are served from a SUB-PATH (`/<repo>/`), so every
// emitted asset URL must be prefixed with it. When a custom domain is attached
// the app moves to the domain ROOT, so this becomes "/" instead.
//
//   project site : /ysr-system-front/
//   custom domain: /                (panel.rohanian-ysr.ir)
//
// Always keep the trailing slash: react-router's `basename` and every relative
// asset reference assume a directory-style base. Relative bases ("./") are NOT
// usable here — this app uses deep routes such as /admin/form-submissions, and
// a relative base would resolve assets against the current route segment.
const DEFAULT_BASE = "/ysr-system-front/";

/**
 * GitHub Pages has no server-side rewrite rules, so a hard refresh on a deep
 * route (e.g. /ysr-system-front/admin/form-submissions) 404s instead of
 * serving index.html.
 *
 * Pages' only fallback is /404.html: it is served *at the requested URL*, so the
 * browser's location is already correct and react-router picks the route up as
 * normal. The only thing missing is index.html itself. Emitting a copy under
 * that name restores the SPA. It cannot redirect, only serve, which is why
 * duplicating the entry document is the right move.
 */
function githubPagesSpaFallback(): Plugin {
  let outDir = "dist";
  return {
    name: "github-pages-spa-fallback",
    apply: "build",
    // Read the resolved outDir rather than assuming "dist", so `vite build
    // --outDir ...` and any future build.outDir override still get the fallback.
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const distDir = path.resolve(__dirname, outDir);
      const indexHtml = path.join(distDir, "index.html");
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, path.join(distDir, "404.html"));
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv merges .env / .env.local / .env.<mode> / .env.<mode>.local, and
  // process.env wins over all of them. That ordering is what lets CI override
  // the committed .env.production without a second copy of the config.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const base = env.VITE_BASE_PATH || DEFAULT_BASE;

  return {
    base,
    plugins: [react(), githubPagesSpaFallback()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "127.0.0.1",
      port: 4000,
      proxy: {
        "/uploads": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
