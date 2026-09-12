# AGENTS.md - Personal CV (ndanhkhoi.github.io)

## Project

Personal CV as **print-first A4 HTML**, statically built with **Eleventy** (SSG).

- Branch `main` = source code.
- GitHub Actions builds → pushes `_site` to the `gh-pages` branch (orphan, build output only).
- GitHub Pages serves from `gh-pages` at the root `/`.

## Structure

- `src/_data/resume.js` - **ALL CV data** (edit personal info in this file, don't touch the layout; empty sections self-hide)
- `src/index.njk` - CV template + Paged.js boot script (A4 preview + right-aligned page numbers + PDF dropdown button Download/Print + mobile fit-width)
- `src/css/resume.css` - all document styles (follows the A4 spec below)
- `scripts/build-pdf.mjs` - generates `_site/cv.pdf` with headless Chromium (puppeteer); the Download PDF button downloads this file
- `scripts/check_view.py` - Playwright layout check (mobile fit-width = PDF-viewer look, desktop, landscape, print emulation); screenshots in `test-artifacts/` (gitignored)
- `docs/A4_PRINT_VIEW_SPEC.md` - the project's **single spec** (source of truth):
  Part A = A4 layout design (tokens `--sp-*/--fs-*/--lh-*`, pagination
  `.section--atomic`/`.section-opening`/`.break-page`, `margin-bottom` only, no
  `position: absolute` for dynamic data, mm/pt units); Part B = the A4 preview +
  page numbers mechanism + paged.js traps
- `.github/workflows/deploy.yml` - automated build & deploy

## Key technical conventions

- **Paged.js self-hosted**: npm dependency `pagedjs`, build hook in `eleventy.config.js`
  copies `paged.polyfill.js` → `_site/vendor/`. Do NOT use a CDN.
- **Inter font self-hosted**: npm `@fontsource/inter`, build hook copies the
  vietnamese + latin subsets (400/700) → `_site/fonts/`. Do NOT use the Google Fonts CDN.
- **No `—` (em dash) characters** in any displayed content (web + PDF) - seen as
  an AI tell, the project owner doesn't want them. Use a plain `-`.
- **Links always open in a new tab**: every `<a>` (template + `autolink` filter in
  `eleventy.config.js`) must have `target="_blank" rel="noopener"`.
- URLs inside content (bullets, summary) auto-link via the `autolink` filter
  (used with `| safe`), clickable in both the HTML view and the PDF.
- **Do NOT put `@media screen/print` in `resume.css`** - the paged.js trap where
  `@media` gets flattened into global rules (spec Part B, trap B4.1). All preview
  decoration CSS lives in the boot script in `src/index.njk`, injected AFTER
  pagination finishes.
- The `.page` padding (12mm) must match `PAGE_PADDING_MM` in the boot script - change both or neither.
- Output must be pure static HTML - no client-side JS rendering content (print-pure).
- Content edits: touch only `src/_data/resume.js`, don't modify the template for each update.

## Useful commands

- Dev: `npm run dev` → http://localhost:8080
- Build: `npm run build` → `_site/`
- Deploy: commit + push to `main`, Actions builds to `gh-pages` automatically.
- Print PDF: open the site → Ctrl/Cmd+P → A4, 100% scale, browser header/footer off.
- Visual check: `npm run build` + serve `_site` (e.g. `python3 -m http.server 4173 --directory _site`) → `npm run check:view` (needs `pip install playwright`; exit 0 = all green).
