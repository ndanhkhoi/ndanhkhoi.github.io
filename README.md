# CV - ndanhkhoi.github.io

Personal CV as **print-first A4 HTML**. The browser never re-typesets it: the
build paginates the CV once, prints it to `cv.pdf`, and the site renders that PDF.
What you see on the page is the file you download - the same bytes.

- **SSG**: [Eleventy](https://www.11ty.dev/) - static HTML, content is server-rendered
- **Pagination**: [Paged.js](https://pagedjs.org/) - at build time only, on `/print.html`
- **Viewer**: [PDF.js](https://mozilla.github.io/pdf.js/) `PDFViewer` components - toolbar, zoom, selectable text, clickable links
- **Deploy**: GitHub Actions build → `gh-pages` branch → GitHub Pages

## Pipeline

```text
resume.js + cv-document.njk
   → /print.html   paged.js splits it into A4 sheets and stamps page numbers
   → /cv.pdf       puppeteer prints that DOM
   → /             pdf.js renders cv.pdf - this is the site
```

## Structure

| File | Role |
|---|---|
| `src/_data/resume.js` | **All CV data** - edit your info here |
| `src/_includes/cv-document.njk` | The CV markup, shared by both pages |
| `src/print.njk` | `/print.html`: pagination source + page numbers, also the no-JS fallback |
| `src/index.njk`, `src/js/viewer.js` | `/`: the pdf.js viewer |
| `src/css/resume.css` | Document styles following the A4 view-print spec |
| `src/css/viewer.css` | Viewer chrome (screen only) |
| `docs/A4_PRINT_VIEW_SPEC.md` | The single spec: A4 design + build pipeline + traps |

## Updating the CV

1. Edit `src/_data/resume.js` (a section left empty self-hides from the page).
2. Commit + push to `main` → Actions builds and deploys automatically.

## Run locally

```bash
npm install
npm run dev     # http://localhost:8080 - reprints cv.pdf on every change
npm run build   # one-off: _site/ + _site/cv.pdf
```

`build` always produces the PDF, because the homepage renders it - HTML without
a matching `cv.pdf` is a site with nothing to show.

## Checks

```bash
node scripts/check-pdf.mjs                       # does cv.pdf still say everything resume.js says?
python3 -m http.server 4173 --directory _site    # then, in another terminal:
npm run check:view                               # pagination + viewer, Chromium & WebKit
```

`check-pdf.mjs` is the gate the deploy workflow runs: a build that paginated a
section away still produces a valid PDF, and page count alone would not notice.
`check:view` needs `pip install playwright && playwright install chromium webkit`.

## Print / Download PDF

The toolbar has page navigation, zoom, **print** and **download** on the right.
Print sends the real `cv.pdf` to the print dialog (A4, 100% scale, header/footer
off). Printed page numbers match the screen exactly, because the screen is
showing the PDF.

Without JavaScript the homepage still carries the full CV, and `/print.html`
serves it as plain paginated HTML.
