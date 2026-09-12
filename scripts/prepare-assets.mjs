import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* Fill public/ with the third-party files the site self-hosts.
 *
 * Everything here comes from node_modules - never a CDN - and public/ is
 * generated, so this script runs before `astro dev` and before `astro build`
 * (see the npm scripts). Astro copies public/ into _site verbatim.
 *
 *   lib/paged.polyfill.js  paginates /print.html, the page cv.pdf is printed from
 *   fonts/*                Inter, the typeface of both renderings
 *
 * A PDF renderer is deliberately NOT here: the site links cv.pdf and lets the
 * browser open it in a tab of its own. pdfjs-dist stays a devDependency only
 * because scripts/pdf-facts.mjs reads the built PDF back with it.
 */
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC = path.join(ROOT, "public");
const nm = (...p) => path.join(ROOT, "node_modules", ...p);

/* Merge @fontsource/inter @font-face rules: keep only the vietnamese + latin
   subsets (no latin-ext), drop the .woff fallback (woff2 only), rewrite urls
   to absolute paths so the paged.js polisher doesn't rebase them when
   inlining CSS. */
/* 400/700 are what the A4 document needs; 500/600 exist for the web resume's
   UI type (nav, buttons, labels), where jumping straight from regular to bold
   reads as heavy-handed. */
const WEIGHTS = ["400.css", "500.css", "600.css", "700.css"];

function buildInterCss() {
  return WEIGHTS
    .flatMap((f) => fs.readFileSync(nm("@fontsource", "inter", f), "utf8").match(/@font-face\s*{[^}]*}/g) || [])
    .filter((block) => /inter-(vietnamese|latin)-\d+-normal\.woff2/.test(block))
    .map((block) =>
      block
        .replace(/,?\s*url\([^)]*\.woff\)\s*format\('woff'\)/g, "")
        .replace(/url\(\.\/files\//g, "url(/fonts/files/")
    )
    .join("\n");
}

function copyPagedJs() {
  const out = path.join(PUBLIC, "lib");
  fs.mkdirSync(out, { recursive: true });
  const src = nm("pagedjs", "dist", "paged.polyfill.js");
  if (!fs.existsSync(src)) {
    throw new Error("pagedjs is missing dist/paged.polyfill.js - /print.html cannot paginate.");
  }
  fs.copyFileSync(src, path.join(out, "paged.polyfill.js"));
}

function copyFonts() {
  const srcFiles = nm("@fontsource", "inter", "files");
  const destFiles = path.join(PUBLIC, "fonts", "files");
  fs.mkdirSync(destFiles, { recursive: true });
  fs.readdirSync(srcFiles)
    .filter((f) => /^inter-(vietnamese|latin)-(400|500|600|700)-normal\.woff2$/.test(f))
    .forEach((f) => fs.copyFileSync(path.join(srcFiles, f), path.join(destFiles, f)));
  fs.writeFileSync(path.join(PUBLIC, "fonts", "inter.css"), buildInterCss());
}

copyPagedJs();
copyFonts();
console.log("public/: paged.js + fonts ready");
