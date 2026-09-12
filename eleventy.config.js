const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

/* Merge @fontsource/inter @font-face rules: keep only the vietnamese + latin
   subsets (no latin-ext), drop the .woff fallback (woff2 only), rewrite urls
   to absolute paths so the paged.js polisher doesn't rebase them when
   inlining CSS. */
function buildInterCss() {
  const pkg = path.join("node_modules", "@fontsource", "inter");
  return ["400.css", "700.css"]
    .flatMap((f) => fs.readFileSync(path.join(pkg, f), "utf8").match(/@font-face\s*{[^}]*}/g) || [])
    .filter((block) => /inter-(vietnamese|latin)-\d+-normal\.woff2/.test(block))
    .map((block) =>
      block
        .replace(/,?\s*url\([^)]*\.woff\)\s*format\('woff'\)/g, "")
        .replace(/url\(\.\/files\//g, "url(/fonts/files/")
    )
    .join("\n");
}

/* Autolink: escape HTML then wrap URLs (http/https) in <a> - use with
   | autolink | safe in the template. Keeps content links clickable in both
   the HTML view and the PDF. */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Self-host the vendored libraries (npm dependencies, never a CDN):
   - paged.js  paginates /print.html, the page the PDF is printed from
   - pdf.js    renders that PDF on the homepage
   pdf.js's standard_fonts are deliberately NOT copied: cv.pdf comes out of
   Chrome's own printer, which embeds (and subsets) every font it draws with,
   so the viewer never requests them. If a future PDF ever does, copy the
   directory here and point getDocument at it with standardFontDataUrl. */
function copyVendor() {
  const out = path.join("_site", "vendor");
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(
    path.join("node_modules", "pagedjs", "dist", "paged.polyfill.js"),
    path.join(out, "paged.polyfill.js")
  );

  const pdfjs = path.join("node_modules", "pdfjs-dist");
  const pdfjsOut = path.join(out, "pdfjs");
  fs.mkdirSync(pdfjsOut, { recursive: true });
  for (const [from, to] of [
    [path.join("build", "pdf.min.mjs"), "pdf.min.mjs"],
    [path.join("build", "pdf.worker.min.mjs"), "pdf.worker.min.mjs"],
    [path.join("web", "pdf_viewer.mjs"), "pdf_viewer.mjs"],
    [path.join("web", "pdf_viewer.css"), "pdf_viewer.css"]
  ]) {
    const src = path.join(pdfjs, from);
    if (!fs.existsSync(src)) {
      throw new Error(`pdfjs-dist is missing ${from} - the viewer cannot be built.`);
    }
    fs.copyFileSync(src, path.join(pdfjsOut, to));
  }
  /* pdf_viewer.css resolves icons as images/*.svg relative to itself */
  fs.cpSync(path.join(pdfjs, "web", "images"), path.join(pdfjsOut, "images"), {
    recursive: true
  });
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });

  eleventyConfig.addFilter("autolink", (value) => {
    if (!value) return value;
    return escapeHtml(value).replace(
      /(https?:\/\/[^\s"'<>]+)/g,
      (url) => '<a href="' + url + '" target="_blank" rel="noopener">' + url + "</a>"
    );
  });

  /* cv.pdf is not an Eleventy input: scripts/build-pdf.mjs writes it straight
     into _site, and Eleventy leaves output files it does not own alone. */

  eleventyConfig.on("eleventy.after", () => {
    copyVendor();

    /* Self-host Inter (npm @fontsource) → _site/fonts, vietnamese + latin subsets only, weights 400/700 */
    const srcFiles = path.join("node_modules", "@fontsource", "inter", "files");
    const destFiles = path.join("_site", "fonts", "files");
    fs.mkdirSync(destFiles, { recursive: true });
    fs.readdirSync(srcFiles)
      .filter((f) => /^inter-(vietnamese|latin)-(400|700)-normal\.woff2$/.test(f))
      .forEach((f) => fs.copyFileSync(path.join(srcFiles, f), path.join(destFiles, f)));
    fs.writeFileSync(path.join("_site", "fonts", "inter.css"), buildInterCss());

    /* The homepage renders cv.pdf, so during `npm run dev` a content edit that
       only rebuilt the HTML would leave the visible page stale. Reprint it.
       Kept out of one-off builds: there `npm run build:pdf` is the explicit step. */
    if (["serve", "watch"].includes(process.env.ELEVENTY_RUN_MODE)) {
      const r = spawnSync(process.execPath, [path.join("scripts", "build-pdf.mjs")], {
        stdio: "inherit"
      });
      if (r.status !== 0) console.warn("[11ty] cv.pdf rebuild failed - the viewer will show the previous file.");
    }
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
