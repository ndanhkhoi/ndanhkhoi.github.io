# CV - ndanhkhoi.github.io

One CV, two renderings, one source of truth.

- **`/`** - the web resume: responsive, themed and animated, but set like a
  document rather than a dashboard - hairline rules, no cards, a display serif
  for the name and the section titles. Server-rendered HTML with one small
  progressive-enhancement script; no client framework.
- **`/cv.pdf`** - the A4 document, paginated and printed at build time. Every
  "Download CV" button just opens it in a new tab.

Both come from `src/data/resume.js`, which holds the CV and nothing else -
there is no copy written for the web. Edit that file and both change.

- **SSG**: [Astro](https://astro.build/) - static output, zero JS by default
- **Type**: Instrument Serif (display) + Inter, both self-hosted from npm
- **Pagination**: [Paged.js](https://pagedjs.org/) - at build time only, on `/print.html`
- **PDF**: headless Chromium (puppeteer) prints `/print.html` to `cv.pdf`
- **Deploy**: GitHub Actions build → `gh-pages` branch → GitHub Pages

## Pipeline

```text
src/data/resume.js
   ├→ /             the web resume (Astro components + src/styles/site.css)
   └→ /print.html   paged.js splits the A4 document into sheets, stamps page numbers
        → /cv.pdf   puppeteer prints that DOM; check-pdf.mjs gates the deploy on it
```

## Structure

| File | Role |
|---|---|
| `src/data/resume.js` | **All CV data** - edit your info here |
| `src/data/resume-types.d.ts` | Its shape, so `astro check` catches a bad edit |
| `src/pages/index.astro` | `/`: the web resume |
| `src/pages/print.astro` | `/print.html`: pagination source + page numbers, also the plain-HTML copy |
| `src/components/web/*` | Web resume components |
| `src/components/print/*` | The A4 document |
| `src/styles/site.css` | Web resume styles - the design brief, themes, motion. Loaded only by `/` |
| `src/styles/resume.css` | A4 document styles, following the print spec |
| `src/scripts/site.ts` | Theme, scrollspy, reading progress, reveal-on-scroll |
| `docs/A4_PRINT_VIEW_SPEC.md` | The single spec: A4 design + build pipeline + traps |

`public/` is generated (`scripts/prepare-assets.mjs`) and gitignored.

## Updating the CV

1. Edit `src/data/resume.js` (a section left empty self-hides from both renderings).
2. Commit + push to `main` → Actions builds and deploys automatically.

## Run locally

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # _site/ + _site/cv.pdf
npm run check   # astro check (types)
```

`npm run dev` serves the last built `cv.pdf`; run `npm run build` once so the
download link has a file to open.

## Checks

```bash
node scripts/check-pdf.mjs                       # does cv.pdf still say everything resume.js says?
python3 -m http.server 4173 --directory _site    # then, in another terminal:
npm run check:view                               # web resume + pagination, Chromium & WebKit
```

`check-pdf.mjs` is the gate the deploy workflow runs: a build that paginated a
section away still produces a valid PDF, and page count alone would not notice.
`check:view` needs `pip install playwright && playwright install chromium webkit`;
it checks the web resume across six viewports on two engines (content complete,
no horizontal overflow, links open in a new tab, nav and theme behave), the
pagination traps on `/print.html`, and the page with reduced motion and with
JavaScript switched off entirely.

## Accessibility and no-JS

The web resume is complete HTML before any script runs: the reveal animation's
start state is opt-in from the document, so a blocked or broken script leaves
every word on screen rather than hiding the CV. `prefers-reduced-motion` turns
the page static, and `/print.html` remains a plain, fully selectable copy of the
A4 document.
