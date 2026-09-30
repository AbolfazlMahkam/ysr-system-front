// Guards against the failure mode where a build's baked-in `base` does not match
// the host the artifact is uploaded to.
//
// The symptom is silent at build time and only shows up in the browser as a wall
// of 404s: `base` is baked into index.html and the JS bundle, so uploading a
// project-site build (base "/ysr-system-front/") to a host that serves from the
// root makes the browser request /ysr-system-front/assets/... while the files
// actually live in /assets/. index.html is served fine, so nothing looks broken
// until the network tab is opened.
//
// This script re-derives what the browser will ask for and compares it against
// what is physically in the output directory, so a mismatch fails the build
// (and therefore CI and the Docker build) instead of shipping.
//
// Usage:
//   node scripts/verify-base.mjs <outDir> [expectedBase]
//
//   expectedBase defaults to the VITE_BASE_PATH the artifact was built with, so
//   "did the build do what I asked" can be checked without restating the value.
//   Pass it explicitly to additionally assert the artifact is meant for a
//   particular host.
//
// Note on paths: the output directory is the *document root* of wherever it is
// published, not necessarily the server root. A project-site artifact is
// published AT /ysr-system-front/, so a reference to /ysr-system-front/assets/x.js
// maps to assets/x.js inside the output directory. Existence checks therefore
// resolve against the base, not against the filesystem root.

import fs from "node:fs";
import path from "node:path";

const outDirArg = process.argv[2];
const expectedBaseArg = process.argv[3];

if (!outDirArg) {
  console.error("usage: node scripts/verify-base.mjs <outDir> [expectedBase]");
  process.exit(2);
}

const outDir = path.resolve(process.cwd(), outDirArg);
const indexHtmlPath = path.join(outDir, "index.html");

if (!fs.existsSync(indexHtmlPath)) {
  console.error(`verify-base: no index.html in ${outDir} — did the build run?`);
  process.exit(2);
}

const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");

// A base is always a directory-style path with a trailing slash: "/", or
// "/ysr-system-front/". Normalising here means "./" or a missing trailing slash
// get reported rather than quietly accepted — both break the router basename
// (src/App.tsx) and the post-refresh redirect (src/utiles/axios.js).
function normaliseBase(base) {
  if (typeof base !== "string") return null;
  const trimmed = base.trim();
  if (!trimmed) return null;
  let b = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (!b.endsWith("/")) b = `${b}/`;
  return b;
}

// Which host is this artifact meant for? An explicit argument (a CI job or a
// Dockerfile ARG stating the target) wins; otherwise fall back to the env var the
// build used.
const expectedBase =
  normaliseBase(expectedBaseArg) ?? normaliseBase(process.env.VITE_BASE_PATH);

const isExternal = (url) =>
  /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//") || url.startsWith("#");

// Same-origin, base-relative references are the ones the browser resolves against
// the document, and therefore the ones that must line up.
const localUrls = [
  ...new Set(
    [...indexHtml.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)]
      .map((m) => m[1])
      .filter((u) => !isExternal(u)),
  ),
];

const rootRelative = localUrls.filter((u) => u.startsWith("/"));

// Map a browser URL onto a path inside the output directory. With a known base the
// mapping is exact. Without one, fall back to trying the URL as-is and then with
// its first segment removed, so the existence check still means something.
function candidatesFor(url) {
  const bare = url.replace(/^\/+/, "");
  if (!expectedBase) return [bare, bare.split("/").slice(1).join("/")];
  if (!url.startsWith(expectedBase)) return [];
  return [url.slice(expectedBase.length)];
}

const errors = [];
let baseArgUsable = true;

// A relative or malformed base silently breaks deep routes, so reject it outright
// rather than trying to verify it. A missing trailing slash is fine — Vite adds
// one, and normaliseBase mirrors that.
if (expectedBaseArg !== undefined) {
  if (!expectedBaseArg.trim()) {
    errors.push("expected base is empty. Use \"/\" or \"/some-sub-path/\".");
    baseArgUsable = false;
  } else if (!expectedBaseArg.startsWith("/")) {
    errors.push(
      `base ${JSON.stringify(expectedBaseArg)} is relative. This app has deep routes such as ` +
        `/admin/form-submissions, which would resolve assets against the current path ` +
        `segment. Use an absolute directory-style base ("/" or "/some-sub-path/").`,
    );
    baseArgUsable = false;
  }
}

// The check that catches the uploaded-the-wrong-artifact bug: if the bundle points
// at a sub-path the host does not serve, this fires. Skipped when the expected base
// itself was rejected, since normalising a bad value would only bury the real
// message under a page of follow-on mismatches.
if (expectedBase && baseArgUsable) {
  for (const url of rootRelative) {
    if (!url.startsWith(expectedBase)) {
      errors.push(
        `index.html references ${JSON.stringify(url)}, which is outside the expected base ` +
          `${JSON.stringify(expectedBase)}. This artifact is built for a different host — ` +
          `do not upload it to this one.`,
      );
    }
  }
}

// Do the referenced files actually exist? Catches a partial upload (index.html
// without assets/) and a truncated deploy.
//
// Skipped when the expected base was rejected: normalising a bad value yields a
// meaningless path, so every file would "be missing" and bury the real error.
const missing = [];

if (baseArgUsable) {
  for (const url of localUrls) {
    // Already reported as a base mismatch above; the file check would only restate it.
    if (url.startsWith("/") && expectedBase && !url.startsWith(expectedBase)) continue;
    if (candidatesFor(url).some((rel) => rel && fs.existsSync(path.join(outDir, rel)))) continue;
    missing.push(url);
  }
}

if (missing.length > 0) {
  const first = missing[0];
  // A reference that is missing *and* carries a sub-path is the signature of a
  // build made for a sub-path host, which is the mistake this script exists for.
  // Naming it up front beats making the reader infer it from a filesystem path.
  const looksLikeSubPathBuild = expectedBase === "/" && /^\/[^/]+\//.test(first);

  errors.push(
    ...missing.map(
      (url) =>
        `index.html references ${JSON.stringify(url)} but that path does not exist under ` +
        `${outDirArg}/.`,
    ),
  );
  errors.push(
    looksLikeSubPathBuild
      ? `Likely cause: this artifact was built for a SUB-PATH host (its asset URLs start with ` +
        `${JSON.stringify(first.split("/").slice(0, 2).join("/") + "/")}) but is being checked ` +
        `against a root host. Rebuild for this host — for the custom domain that is ` +
        `"npm run build" (VITE_BASE_PATH=/), not "npm run build:pages".`
      : `The output directory is incomplete — publish the whole directory, not just index.html.`,
  );
}

const label = `verify-base: ${outDirArg}${
  expectedBase ? ` (expected base ${expectedBase})` : " (no expected base; existence check only)"
}`;

if (errors.length > 0) {
  console.error(`${label} FAILED`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `${label} OK — ${localUrls.length} local reference(s), ${rootRelative.length} root-relative`,
);
