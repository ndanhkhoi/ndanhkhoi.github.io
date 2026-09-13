// @ts-check
import { defineConfig } from "astro/config";

/* Two pages out of one data file (src/data/resume.js):
 *   /            the web resume - modern, responsive, animated
 *   /print.html  the A4 document paged.js splits into sheets and
 *                scripts/build-pdf.mjs prints to _site/cv.pdf
 *
 * `format: "file"` keeps /print.html at that exact URL: build-pdf.mjs,
 * the viewer's fallback link and the canonical tag all point at it.
 *
 * outDir stays _site so the PDF build, the checks and the deploy workflow
 * keep addressing the same directory.
 *
 * public/ is generated, never committed: scripts/prepare-assets.mjs fills it
 * with the self-hosted paged.js and Inter files before every build and dev run
 * (see .gitignore).
 */
export default defineConfig({
  site: "https://ndanhkhoi.github.io",
  outDir: "_site",
  build: {
    format: "file",
    /* Always a <link>, never an inlined <style>: /print.html is read by
       paged.js, and the document stylesheet it measures against should reach it
       the same way on every build regardless of file size. */
    inlineStylesheets: "never",
  },
  devToolbar: { enabled: false },
});
