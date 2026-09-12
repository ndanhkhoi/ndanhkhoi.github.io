# CV - ndanhkhoi.github.io

Personal CV as **print-first A4 HTML**: the web preview shows exact A4 sheets
with page numbers, and printing produces a PDF 1:1 with the preview.

- **SSG**: [Eleventy](https://www.11ty.dev/) - builds static HTML, no client-side JS rendering content
- **A4 preview + page numbers**: [Paged.js](https://pagedjs.org/) (injected in the template)
- **Deploy**: GitHub Actions build → `gh-pages` branch → GitHub Pages

## Structure

| File | Role |
|---|---|
| `src/_data/resume.js` | **All CV data** - edit your info here |
| `src/index.njk` | CV template + A4 preview boot script (page numbers, PDF dropdown Download/Print button) |
| `src/css/resume.css` | Document styles following the A4 view-print spec |
| `docs/A4_PRINT_VIEW_SPEC.md` | The single spec: A4 design + Paged.js preview + traps |

## Updating the CV

1. Edit `src/_data/resume.js` (a section left empty self-hides from the page).
2. Commit + push to `main` → Actions builds and deploys automatically.

## Run locally

```bash
npm install
npm run dev   # http://localhost:8080
```

## Print / Download PDF

Click the **PDF** button at the bottom-right: **Download PDF** downloads the
`cv.pdf` file (auto-generated on every deploy) directly, **Print PDF** opens the
print dialog. Or Ctrl/Cmd+P → A4, **100%** scale, browser header/footer off.
Printed page numbers match the preview exactly.
