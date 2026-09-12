# AGENTS.md - Personal CV (ndanhkhoi.github.io)

## Project

Personal CV as **print-first A4 HTML**, statically built with **Eleventy** (SSG).
The browser never typesets the CV: the build paginates it once, prints it to
`cv.pdf`, and the site renders that PDF with pdf.js - so the web view and the
download are the same file.

- Branch `main` = source code.
- GitHub Actions builds → pushes `_site` to the `gh-pages` branch (orphan, build output only).
- GitHub Pages serves from `gh-pages` at the root `/`.

## Build pipeline

```text
src/_data/resume.js + src/_includes/cv-document.njk
  → src/print.njk   → /print.html   paged.js splits it into A4 sheets, stamps page numbers
  → build-pdf.mjs   → /cv.pdf       puppeteer prints that DOM
  → src/index.njk   → /             pdf.js renders cv.pdf (the visible site)
```

## Structure

- `src/_data/resume.js` - **ALL CV data** (edit personal info in this file, don't touch the layout; empty sections self-hide)
- `src/_includes/cv-document.njk` - the CV markup, included by both pages so there is one copy
- `src/print.njk` → `/print.html` - pagination source (paged.js + page numbers), also the no-JS / crawler fallback
- `src/index.njk` → `/` - viewer shell + `<noscript>` copy of the CV
- `src/js/viewer.js` - wires pdf.js's `PDFViewer` (it owns pages, scrolling, zoom, text + annotation layers) and drives the toolbar
- `src/css/resume.css` - all document styles (follows the A4 spec below)
- `src/css/viewer.css` - toolbar + scroll container only; `pdf_viewer.css` from pdfjs-dist styles the pages (screen-only, may use `@media`)
- `scripts/build-pdf.mjs` - generates `_site/cv.pdf` from `/print.html` with headless Chromium (puppeteer)
- `scripts/pdf-facts.mjs` - reads back what `cv.pdf` contains (text, links) as JSON, for the checks
- `scripts/check-pdf.mjs` - asserts `cv.pdf` still carries everything `resume.js` says (labels, awards, page numbers, links); the deploy workflow gates on it and `check_view.py` reuses it
- `scripts/check_view.py` - Playwright check of all three stages (PDF, print source, viewer on Chromium + WebKit); screenshots in `test-artifacts/` (gitignored)
- `docs/A4_PRINT_VIEW_SPEC.md` - the project's **single spec** (source of truth):
  Part A = A4 layout design (tokens `--sp-*/--fs-*/--lh-*`, pagination
  `.section--atomic`/`.section-opening`/`.break-page`, `margin-bottom` only, no
  `position: absolute` for dynamic data, mm/pt units); Part B = the three build
  stages, the viewer, and the traps
- `.github/workflows/deploy.yml` - automated build & deploy

## Key technical conventions

- **Paged.js and pdf.js self-hosted**: npm dependencies `pagedjs` / `pdfjs-dist`,
  build hook in `eleventy.config.js` copies them → `_site/vendor/`. Do NOT use a CDN.
  The hook throws if a pdf.js file is missing, so a moved path fails the build.
- **Inter font self-hosted**: npm `@fontsource/inter`, build hook copies the
  vietnamese + latin subsets (400/700) → `_site/fonts/`. Do NOT use the Google Fonts CDN.
- **No `—` (em dash) characters** in any displayed content (web + PDF) - seen as
  an AI tell, the project owner doesn't want them. Use a plain `-`.
- **Links always open in a new tab**: every `<a>` (template + `autolink` filter in
  `eleventy.config.js`) must have `target="_blank" rel="noopener"`.
- URLs inside content (bullets, summary) auto-link via the `autolink` filter
  (used with `| safe`). They become real PDF link annotations, and the viewer
  rebuilds them as clickable anchors over the canvas.
- **Do NOT put `@media screen/print` in `resume.css`** - the paged.js trap where
  `@media` gets flattened into global rules (spec Part B, trap B4.1). Decoration
  CSS for the print page lives in the boot script in `src/print.njk`, injected
  AFTER pagination finishes. `viewer.css` is exempt: that page never loads paged.js.
- The `.page` padding (12mm) must match `PAGE_PADDING_MM` in the boot script - change both or neither.
- **The boot script's late CSS is decoration only.** It lands after paged.js has
  paginated, so anything affecting the box model (padding, margin, font-size,
  width) invalidates the page fills paged.js measured: the overflow slides into
  the next multicol column and `.pagedjs_sheet` clips it away - gone from the
  sheet and the PDF, still in the DOM (spec Part B, trap B4.9). Layout rules
  belong in `resume.css`, which paged.js reads before it starts.
- **The homepage must never be an empty canvas**: `<noscript>` carries the full CV
  markup and every failure path links `/print.html`. Content is server-rendered;
  pdf.js only renders a file the build already produced.
- **Never reimplement what `PDFViewer` already does** (page layout, zoom, text or
  annotation layers). pdf.js drops APIs between majors; the components move with
  them, hand-rolled layers do not (spec traps B4.10-B4.13). npm ships the viewer
  *components*, not the demo's `web/viewer.html` - that lives only in the GitHub
  release zip. Re-run the checks after every `pdfjs-dist` upgrade.
- Content edits: touch only `src/_data/resume.js`, don't modify the template for each update.

## Useful commands

- Dev: `npm run dev` → http://localhost:8080 (rebuilds `cv.pdf` on every change)
- Build: `npm run build` → `_site/` **and** `_site/cv.pdf` (HTML alone: `npm run build:html`)
- Deploy: commit + push to `main`, Actions builds to `gh-pages` automatically.
- PDF content gate: `node scripts/check-pdf.mjs` (what CI runs after the build; exit 0 = `cv.pdf` still matches `resume.js`)
- Visual check: `npm run build` + serve `_site` (e.g. `python3 -m http.server 4173 --directory _site`) → `npm run check:view` (needs `pip install playwright` + `playwright install chromium webkit`; exit 0 = all green).
