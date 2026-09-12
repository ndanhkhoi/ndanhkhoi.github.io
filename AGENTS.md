# AGENTS.md - Personal CV (ndanhkhoi.github.io)

## Project

Personal CV rendered two ways from one data file, statically built with **Astro**:

- `/` - a modern, responsive, animated **web resume** (server-rendered HTML, one
  small enhancement script, no client framework)
- `/cv.pdf` - the **A4 document**, paginated by paged.js and printed by headless
  Chromium at build time. Every download button opens this file in a new tab;
  the browser's own PDF viewer takes it from there.

`src/data/resume.js` is the single source for both. There is no PDF viewer in
the page - the site links the file, it does not render it.

- Branch `main` = source code.
- GitHub Actions builds → pushes `_site` to the `gh-pages` branch (orphan, build output only).
- GitHub Pages serves from `gh-pages` at the root `/`.

## Build pipeline

```text
src/data/resume.js
  ├→ src/pages/index.astro → /            the web resume
  └→ src/pages/print.astro → /print.html  paged.js splits it into A4 sheets, stamps page numbers
        → scripts/build-pdf.mjs → /cv.pdf puppeteer prints that DOM
```

## Structure

- `src/data/resume.js` - **ALL CV data** (edit personal info here, don't touch the layout; empty sections self-hide). Plain ESM so `scripts/check-pdf.mjs` can import the same file the site renders.
- `src/data/resume-types.d.ts` - the shape of that data; `npm run check` (`astro check`) fails on a bad edit instead of rendering nothing.
- `src/pages/index.astro` → `/` - the web resume
- `src/pages/print.astro` → `/print.html` - pagination source (paged.js + page numbers), also the plain-HTML copy of the CV
- `src/components/print/` - `CvDocument.astro` + `CvEntry.astro`, the A4 document
- `src/components/web/` - the web resume's sections; `src/components/ContactIcon.astro` is shared by both
- `src/lib/` - `autolink.ts` (bare URLs → links, used by both renderings), `sections.ts` (which sections exist, in page order), `text.ts`
- `src/styles/resume.css` - A4 document styles (follows the A4 spec below)
- `src/styles/site.css` - web resume styles: tokens, themes, motion. Loaded ONLY by `/`
- `src/scripts/site.ts` - theme toggle, scrollspy, reading progress, reveal-on-scroll. Every line of it optional
- `scripts/prepare-assets.mjs` - fills the generated `public/` with the self-hosted paged.js + Inter files; runs before dev and build
- `scripts/build-pdf.mjs` - generates `_site/cv.pdf` from `/print.html` with headless Chromium (puppeteer)
- `scripts/pdf-facts.mjs` - reads back what `cv.pdf` contains (text, links) as JSON, for the checks
- `scripts/check-pdf.mjs` - asserts `cv.pdf` still carries everything `resume.js` says (labels, awards, page numbers, links); the deploy workflow gates on it and `check_view.py` reuses its `--expect` output
- `scripts/check_view.py` - Playwright check of all three: cv.pdf, the print source, and the web resume across six viewports on Chromium + WebKit, plus reduced-motion and JS-disabled runs; screenshots in `test-artifacts/` (gitignored)
- `docs/A4_PRINT_VIEW_SPEC.md` - the project's **single spec** (source of truth):
  Part A = A4 layout design (tokens `--sp-*/--fs-*/--lh-*`, pagination
  `.section--atomic`/`.section-opening`/`.break-page`, `margin-bottom` only, no
  `position: absolute` for dynamic data, mm/pt units); Part B = the build stages
  and the traps
- `.github/workflows/deploy.yml` - automated build & deploy

## Key technical conventions

- **Keep the two renderings apart.** `resume.css` styles the A4 document and
  nothing else; `site.css` styles `/` and nothing else. Never load one from the
  other's page - the A4 document is measured by paged.js in millimetres and
  plays by different rules.
- **Do NOT put `@media screen/print` in `resume.css`** - the paged.js trap where
  `@media` gets flattened into global rules (spec Part B, trap B4.1). Decoration
  CSS for the print page lives in the boot script in `src/pages/print.astro`,
  injected AFTER pagination finishes. `site.css` is exempt: `/` never loads paged.js.
- **The boot script's late CSS is decoration only.** It lands after paged.js has
  paginated, so anything affecting the box model (padding, margin, font-size,
  width) invalidates the page fills paged.js measured: the overflow slides into
  the next multicol column and `.pagedjs_sheet` clips it away - gone from the
  sheet and the PDF, still in the DOM (spec Part B, trap B4.9). Layout rules
  belong in `resume.css`, which paged.js reads before it starts.
- The `.page` padding (12mm) must match `PAGE_PADDING_MM` in the boot script - change both or neither.
- **Paged.js and Inter self-hosted**: npm `pagedjs` / `@fontsource/inter`,
  copied into the generated `public/` by `scripts/prepare-assets.mjs`. Do NOT use
  a CDN. `public/` is gitignored - never commit anything into it by hand.
  `pdfjs-dist` stays a devDependency: `pdf-facts.mjs` reads the built PDF back
  with it, and nothing ships it to a visitor.
- **No `—` (em dash) characters** in any displayed content (web + PDF) - seen as
  an AI tell, the project owner doesn't want them. Use a plain `-`.
- **Links always open in a new tab**: every off-site `<a>`, in both renderings
  and in the `autolink` helper, must have `target="_blank" rel="noopener"`.
  `check_view.py` asserts it.
- URLs inside content (bullets, summary) auto-link via `src/lib/autolink.ts`
  (used with `set:html`). In the PDF they become real link annotations, which
  `check-pdf.mjs` asserts.
- **`resume.web` is web-only** (tagline, stats, profile links). It never reaches
  the A4 document, and `check-pdf.mjs` skips it when collecting the URLs cv.pdf
  must carry. Everything else in `resume.js` feeds both renderings.
- **The web resume must be complete before any script runs.** The reveal
  animation's start state applies only under `html[data-anim="on"]`, which the
  inline script in `index.astro` sets and `site.ts` claims; if the script never
  arrives, a 2.5s timer removes the flag. Never move that start state into a
  plain CSS rule - that is how an animation ends up hiding the CV.
- Content edits: touch only `src/data/resume.js`, don't modify the components for each update.

## Useful commands

- Dev: `npm run dev` → http://localhost:4321 (serves the last built `cv.pdf`)
- Build: `npm run build` → `_site/` **and** `_site/cv.pdf` (HTML alone: `npm run build:html`)
- Types: `npm run check` (`astro check`)
- Deploy: commit + push to `main`, Actions builds to `gh-pages` automatically.
- PDF content gate: `node scripts/check-pdf.mjs` (what CI runs after the build; exit 0 = `cv.pdf` still matches `resume.js`)
- Full check: `npm run build` + serve `_site` (e.g. `python3 -m http.server 4173 --directory _site`) → `npm run check:view` (needs `pip install playwright` + `playwright install chromium webkit`; exit 0 = all green).
