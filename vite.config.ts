import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
//
// The fallback is "/" and MUST stay "/". `base` is baked into the bundle at
// build time, so a build that loses its VITE_BASE_PATH (excluded by a
// .dockerignore, missing from a CI secret, forgotten in a PaaS build setting)
// would otherwise silently fall back to the project-site sub-path. That artifact
// is *internally consistent*, so nothing fails — but uploading it to the custom
// domain yields an index.html that 404s on every asset. Defaulting to the
// production host means a lost config produces a build that works, and the
// sub-path stays an explicit opt-in via `npm run build:pages`.
const DEFAULT_BASE = "/";

/**
 * Where each base is published. Read by writeDeployTargetMarker to label the
 * build, and kept next to DEFAULT_BASE so the base and its destination are
 * declared together.
 *
 * A base added here without a matching entry prints "UNKNOWN" rather than
 * guessing, which is the point: a wrong guess is what caused the outage.
 */
const DEPLOY_TARGETS: Record<
  string,
  { host: string; where: string; notFor: string; note?: string }
> = {
  "/": {
    host: "https://panel.rohanian-ysr.ir",
    where: "the document root of the Arvancdn host, as the site root",
    notFor: "GitHub Pages (that needs the sub-path build)",
    note:
      "Self-check after uploading:\n" +
      "  curl -s https://panel.rohanian-ysr.ir/ | grep -o 'src=\"[^\"]*index-[^\"]*\\.js\"'\n" +
      "  -> must print src=\"/assets/index-....js\"  (no /ysr-system-front/ prefix)",
  },
  "/ysr-system-front/": {
    host: "https://abolfazlmahkam.github.io/ysr-system-front",
    where: "the GitHub Pages project site (automatic, via the Pages workflow)",
    notFor:
      "panel.rohanian-ysr.ir — uploading this there is what causes 404s on every asset",
  },
};

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

/**
 * Fails the build when the emitted output does not match the configured `base`,
 * or when the output directory is incomplete.
 *
 * Two failure modes are caught here:
 *   - a partial publish (index.html uploaded without assets/)
 *   - a relative base ("./"), which silently breaks deep routes
 *
 * What this CANNOT catch is a correct build aimed at the wrong host: a
 * project-site build is internally consistent, so it verifies against its own
 * base and passes. Only the job that owns a destination can assert the base that
 * host requires, which is why CI runs `verify:dist` / `verify:dist-pages` with
 * the expected base stated explicitly. Together with DEFAULT_BASE pointing at
 * the production host, there is no longer a path where the wrong artifact is
 * produced and published without a check seeing it.
 */
function verifyBuiltBase(): Plugin {
  let outDir = "dist";
  let base = "/";
  return {
    name: "verify-built-base",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
      base = config.base;
    },
    // Runs after githubPagesSpaFallback so the directory is fully written.
    closeBundle() {
      const script = path.resolve(__dirname, "scripts/verify-base.mjs");
      const result = spawnSync(process.execPath, [script, outDir, base], {
        stdio: "inherit",
      });
      if (result.status !== 0) {
        throw new Error(
          `Build output does not match the configured base "${base}". Refusing to emit an ` +
            `artifact that would 404 on the target host — see the errors above.`,
        );
      }
    },
  };
}

/**
 * Writes `_DEPLOY_TARGET.txt` into the output directory naming the host this
 * artifact belongs on.
 *
 * This exists because the two builds look identical until you open index.html,
 * and picking the wrong one produces a site that loads and then 404s on every
 * asset. Both the file and the build log now state the destination, so the
 * decision is made from the artifact itself rather than from memory:
 *
 *     npm run build        -> _DEPLOY_TARGET.txt says panel.rohanian-ysr.ir
 *     npm run build:pages  -> _DEPLOY_TARGET.txt says the GitHub Pages sub-path
 *
 * It is a plain static file, so it is served like any other asset and is
 * harmless if it is published.
 */
function writeDeployTargetMarker(): Plugin {
  let outDir = "dist";
  let base = "/";
  return {
    name: "write-deploy-target-marker",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
      base = config.base;
    },
    closeBundle() {
      const known = DEPLOY_TARGETS[base];
      const body = [
        "This build is published to EXACTLY ONE host. Do not upload it anywhere else.",
        "",
        `base:                ${base}`,
        `publish to:          ${known?.host ?? "UNKNOWN — set this base in DEPLOY_TARGETS"}`,
        `upload location:     ${known?.where ?? "see the host above"}`,
        `NOT for:             ${known?.notFor ?? "any other host"}`,
        `built:               ${new Date().toISOString()}`,
        "",
        known?.note ?? "",
      ]
        .filter((line) => line !== undefined)
        .join("\n");

      fs.writeFileSync(path.resolve(__dirname, outDir, "_DEPLOY_TARGET.txt"), `${body}\n`);
      // Printed too, so the destination is visible without opening the archive.
      console.log(`\n  [deploy target] ${known?.host ?? "UNKNOWN"} (base ${base})\n`);
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
    plugins: [
      react(),
      githubPagesSpaFallback(),
      writeDeployTargetMarker(),
      verifyBuiltBase(),
    ],
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
