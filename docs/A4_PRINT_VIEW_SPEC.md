# A4 PRINT VIEW SPEC - HTML CV

> The project's source of truth: Part A is the A4 CV layout design standard,
> Part B is the build pipeline that paginates it, prints it to `cv.pdf` and
> renders that file as the site. Goal: **the web view = the actual printout** -
> literally the same file. This is the only spec; every layout/print change must
> follow it.

---

# PART A - A4 LAYOUT DESIGN

## A1. Core principles

| # | Principle | Details |
|---|---|---|
| 1 | **View = Print** | Structural, not a discipline: the site renders `cv.pdf` itself (Part B), so the screen shows the printout. The only screen-only element is the viewer toolbar. |
| 2 | **Data integrity** | No truncating, no hiding, no `text-overflow: ellipsis`. Long content → more pages, never squeezed into one page. |
| 3 | **Natural document flow** | Grid/Flex/flow. Never `position: absolute` for dynamic data. |
| 4 | **Consistency** | Share CSS variables (`--sp-*`, `--fs-*`, `--lh-*`). No local overrides with arbitrary numbers. |
| 5 | **Standard print units** | mm for layout/spacing, pt for fonts. Avoid px in `resume.css`; px belongs to the screen-only files (`viewer.css`, the boot script's decoration CSS). |
| 6 | **Print target** | Chrome print to PDF: A4 portrait, 100% scale, browser header/footer off. |

## A2. Page setup & printable area

```css
@page {
    size: A4 portrait;
    margin: 0;
}

.page {
    width: 210mm;
    padding: 12mm;          /* margin on all 4 sides */
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
}

/* paged.js strips the padding of a fragment it splits - put it back HERE, in
   the document stylesheet, so paged.js measures the real box while it fills
   the pages. Never from the boot script (trap B4.9). */
.pagedjs_area .page {
    padding: 12mm !important;
}
```

| Setting | Value |
|---|---|
| Paper size | A4 (210mm × 297mm) portrait |
| Page margin | **12mm** (all 4 sides) |
| Content area | **186mm × 273mm** |

Why `@page margin: 0` + padding on `.page`:
- Paged.js reads `@page` to split pages; margin 0 lets `.page` fill the whole sheet and handle margins itself via padding.
- `box-decoration-break: clone` keeps the padding on every fragment, and
  `.pagedjs_area .page` puts back what paged.js strips at a split, so a
  continuation sheet gets the same 12mm as the first one.
- That compensation is **layout**, so it belongs in `resume.css`, never in the
  boot script: CSS injected after pagination grows a page paged.js already
  filled, and the overflow gets clipped away silently (trap B4.9).

## A3. Typography

```css
:root {
    --fs-name: 20pt;      /* name */
    --fs-section: 11pt;   /* section title (uppercase + accent) */
    --fs-entry: 10.5pt;   /* entry title (position, project name) */
    --fs-base: 10pt;      /* body, bullets */
    --fs-meta: 8.5pt;     /* dates, footnotes, page numbers */
    --lh-tight: 1.15;     /* name */
    --lh-normal: 1.3;     /* titles */
    --lh-body: 1.4;       /* body */
}
```

- **Font: Inter** - self-hosted via npm `@fontsource/inter` (build hook copies the
  vietnamese + latin subsets, weights 400/700 → `_site/fonts/`), do NOT use the
  Google Fonts CDN. Reason: identical rendering on every machine (no system-font
  dependency) - including the PDF build step on CI - and solid Vietnamese
  diacritics support.
- Never go below **9pt** for content, **8pt** for meta text.
- If content overflows: follow the order in A8 (below) before even thinking about
  reducing font size.

## A4. Spacing

```css
:root {
    --sp-1: 0.5mm;   /* between lines in the same group */
    --sp-2: 1mm;     /* label → value */
    --sp-3: 2mm;     /* between small items */
    --sp-4: 3mm;     /* section title → body */
    --sp-6: 4.5mm;   /* between entries */
    --sp-8: 6mm;     /* between sections */
}
```

1. **`margin-bottom` only** (with a `:last-child` reset when needed). No `margin-top` - avoids accumulation at page-break points.
2. **No arbitrary numbers**: no `margin: 7px`, no spacer `<br>`, no spacer padding.

## A5. Layout

| Layout | When to use |
|---|---|
| **Grid** | Structural columns (2-column skills, meta-grid): `repeat(2, minmax(0, 1fr))` |
| **Flex** | Same-row groups: entry-head (title + period), contact line. `align-items: flex-start` |
| **Normal flow** | Paragraphs, bullet lists |

Forbidden: negative margins, space-aligned columns, spacer `<br>`, `position: absolute` for dynamic blocks.
Long text: `overflow-wrap: anywhere; min-width: 0` on flex children.

## A6. Pagination (fragmentation)

| Purpose | Class | CSS |
|---|---|---|
| Block that must not split (entry, header) | `.section--atomic` | `break-inside: avoid-page` |
| Long content allowed to split | `.section--flow` | `break-inside: auto; orphans: 3; widows: 3` |
| Title must not be orphaned at page bottom | `.section-opening` | `break-after: avoid-page` |
| Title + the section's first content block travel together | `.section-start` (wraps both) | `break-inside: avoid-page` |
| Grid that must move whole to the next page | `.cert-list` `.skills-grid` `.meta-grid` | `break-inside: avoid-page` |
| Force a new page | `.break-page` (empty div) | `break-before: page` |

Rules:
1. **Never put `.section--atomic` on a block larger than one page** - the engine ignores `avoid` and you lose control.
2. An entry (1 company / 1 project) is the atomic unit. A section with many entries may split **between** entries.
3. Paged.js strips padding at split points → `resume.css` compensates with
   `.pagedjs_area .page { padding: 12mm !important }` (see A2, trap B4.9).
4. **Grids never split**: paged.js cannot fragment a `display: grid` container -
   one straddling a page boundary loses its overflowing rows. Every grid here is
   far smaller than a page, so `break-inside: avoid-page` is always safe on them
   (trap B4.7).
5. `.section-opening` marks the intent, but what actually keeps a title with its
   content is `.section-start` wrapping the title plus the first entry/grid: the
   pair is one atomic block, so it moves to the next page together. Keep that
   group small (title + one entry / one grid) so it never breaks rule 1.

## A7. Data

- All CV content lives in `src/_data/resume.js` - edit that file, don't touch the template.
- **Empty sections self-hide**: empty data (`[]` / `""`) → the template renders nothing for that section.
- Never render `null`, `undefined`, `NaN`. No `overflow: hidden` to mask data.

## A8. Overflow handling order

1. Check for abnormal data (too long, wrong format).
2. Remove extra `margin-top` → convert to `margin-bottom`.
3. Bring `line-height` back to the standard token.
4. Drop `.section--atomic` from oversized blocks.
5. Allow natural splits between entries.
6. Split sections deliberately with `.break-page`.
7. Reduce font size - only when currently above standard.
8. **Never truncate/hide data.**

## A9. Naming convention

Required semantic classes:

```text
.cv-header  .cv-name  .cv-job-title  .cv-contact
.cv-section  .cv-section-title
.entry  .entry-head  .entry-title  .entry-sub  .entry-period  .entry-highlights
.skills-grid  .skill-group  .meta-grid  .cert-list
.section--atomic  .section--flow  .section-opening  .section-start
.break-page  .text-meta
```

Forbidden classes: coordinate/value-based names (`.ml-10`, `.left-20`, `.block-1`...).

---

# PART B - BUILD PIPELINE: PAGINATION → PDF → VIEWER

## B1. The three stages

The browser does not typeset the CV. The build paginates it once, prints it to a
PDF, and the site renders that PDF - so "view = print" is a property of the
architecture, not something the CSS has to keep re-earning.

| # | Stage | Produces | Engine |
|---|---|---|---|
| 1 | `src/print.njk` → `/print.html` | the CV split into `.pagedjs_page` sheets, page numbers stamped | paged.js, in the build's Chromium |
| 2 | `scripts/build-pdf.mjs` | `_site/cv.pdf` | puppeteer `page.pdf()` |
| 3 | `src/index.njk` + `src/js/viewer.js` → `/` | the visible site | pdf.js, in the visitor's browser |

Both page templates include the same document body,
`src/_includes/cv-document.njk`, so there is exactly one copy of the CV markup.

**Why the PDF is the source of truth.** When the browser re-paginated the CV on
every visit, two layout engines had to agree: paged.js in the visitor's browser
and paged.js under puppeteer. They disagreed on mobile - different fonts,
different viewport, different text metrics - and the failure mode was silent
content loss (trap B4.9). Pagination now happens once, on one machine, and every
visitor receives its output byte for byte.

**Self-hosted, no CDN.** `pagedjs` and `pdfjs-dist` are npm dependencies. The
`eleventy.after` hook in `eleventy.config.js` copies into `_site/vendor/`:

```text
vendor/paged.polyfill.js          pagination for /print.html
vendor/pdfjs/pdf.min.mjs          pdf.js core API (ES module)
vendor/pdfjs/pdf.worker.min.mjs   its worker
vendor/pdfjs/pdf_viewer.mjs       the viewer components: PDFViewer, PDFLinkService, ...
vendor/pdfjs/pdf_viewer.css       their stylesheet - version-matched, never hand-copied
vendor/pdfjs/images/              icons pdf_viewer.css resolves relative to itself
```

The hook throws if a pdf.js file is missing, so an upgrade that moves a path
fails the build instead of shipping a blank page.

**What npm does and does not give you.** `pdfjs-dist` ships the API plus the
viewer *components* - it has no `web/viewer.html`. The complete viewer from
pdf.js's online demo exists only in the GitHub release zip, unminified
(`pdf.mjs` 840KB vs npm's minified 448KB, worker 2176KB vs 1236KB) and about
20MB unpacked. Vendoring that would mean a build-time download from GitHub or
~15MB of committed third-party code, and a version tracked separately from npm -
so the homepage uses the components, wired the way pdf.js's own
`examples/components/simpleviewer.mjs` does, with this project's toolbar around
them. One consequence: `PDFThumbnailViewer` is **not** among the exports, so the
demo's thumbnail sidebar is not reusable - it would have to be hand-built.

pdf.js's `standard_fonts/` and `cmaps/` are deliberately **not** copied (~2MB).
`cv.pdf` comes out of Chrome's own printer, which embeds and subsets every font
it draws with - including whatever it falls back to for a glyph Inter lacks - so
the viewer never requests them. Confirmed by watching the homepage's network
traffic, not assumed. If a future PDF ever needs them, copy the directories and
pass `standardFontDataUrl` / `cMapUrl` to `getDocument`.

The homepage also loads **no webfont**: it renders a PDF, and the only text it
sets itself is the toolbar, so `viewer.css` uses a system stack. Inter is loaded
inside the `<noscript>` branch, where the browser really is typesetting the CV.

Homepage weight: ~2.27MB uncompressed over 9 requests, of which 2.16MB is pdf.js
itself. That is the price of the architecture; it gzips to roughly a quarter.

Upgrading either library: `npm install pagedjs@<v>` / `npm install
pdfjs-dist@<v>` → rebuild → `scripts/check_view.py`. pdf.js in particular drops
APIs between majors (trap B4.10).

## B2. Stage 1 - `/print.html`, where pagination happens

Paged.js reads the page's own `@page` rule (size, margin) and splits the content
into `.pagedjs_page` boxes at the exact physical sheet size. Each box maps 1:1 to
one sheet of paper. Page numbers are **real DOM**, so they land in the PDF.

`window.PagedConfig = { auto: false }` must stay **before** the polyfill tag,
otherwise paged.js starts paginating before the fonts are ready (trap B4.8).

What the boot script at the end of `src/print.njk` does:

| # | Task | Details |
|---|---|---|
| 1 | Gate pagination on the fonts | Calls `PagedPolyfill.preview()` after `document.fonts.ready` (3s cap). Paginating on fallback metrics breaks differently every run (trap B4.8) |
| 2 | Poll `.pagedjs_page` every 150ms | Waits for the page count to hold steady for 3 consecutive polls before stamping |
| 3 | Stamp right-aligned page numbers | `.preview-page-number` per sheet, label `1 / n` (change it in `pageLabel`), right margin = `PAGE_PADDING_MM`, which must match the `.page` padding in `resume.css` |
| 4 | Set `data-paged-ready="<count>"` on `<html>` | The single "pagination finished" signal. `build-pdf.mjs` and `check_view.py` both wait on it instead of guessing with a sleep |
| 5 | Inject decoration CSS **after** pagination | Gray backdrop, white sheets, shadows, and the `@media print` reset. Must be injected after (trap B4.1) and must stay **decoration only** (trap B4.9) |
| 6 | Broken-vendor fallback | 4s with no `.pagedjs_page` and no `window.Paged` → fake-A4-sheet CSS, so the page stays readable |
| - | *(not here)* padding at split points | Compensated from `resume.css`: it is layout, and paged.js must see it before it paginates (A2, trap B4.9) |

This page is also the site's HTML fallback - `<link rel="canonical" href="/">`
keeps the two URLs from competing as duplicate content.

## B3. Stage 2 - `cv.pdf`

`npm run build:pdf` (`scripts/build-pdf.mjs`) serves `_site` over HTTP (paged.js
cannot load CSS over `file://`), opens `/print.html` in headless Chromium at a
1200px viewport, waits for `data-paged-ready` to match both the sheet count and
the stamped-number count, then prints with `preferCSSPageSize` +
`printBackground`.

The result is written straight into `_site/cv.pdf` and nowhere else. **It is not
an Eleventy input**: Eleventy only writes the files it owns and leaves the rest
of the output directory alone, so the PDF survives every rebuild on its own. An
earlier version kept a copy at `src/cv.pdf` and passthrough-copied it back,
which was not only unnecessary but actively harmful - it preserved a stale PDF
for an HTML-only build to restore.

**The PDF step is never optional, so it is never a step you can forget:**

| Command | Runs |
|---|---|
| `npm run build` | `build:html` then `build:pdf` - the only build the deploy uses |
| `npm run build:html` | Eleventy alone; for the rare case where Chromium isn't available |
| `npm run dev` | Eleventy watch; the `eleventy.after` hook reprints the PDF on **every** rebuild (`ELEVENTY_RUN_MODE` is `serve`/`watch`) - a data, template, CSS or JS edit all trigger it, ~1.6s |

The homepage renders `cv.pdf`, so HTML without a matching PDF is a site with
nothing to show. The deploy workflow re-reads the built file with
`scripts/pdf-facts.mjs` and fails if it has no pages, rather than publishing it.

## B4. Stage 3 - `/`, the pdf.js viewer

`src/js/viewer.js` is pdf.js's own viewer, wired the way
`examples/components/simpleviewer.mjs` does it:

```js
const eventBus    = new EventBus();
const linkService = new PDFLinkService({ eventBus, externalLinkTarget: LinkTarget.BLANK });
const pdfViewer   = new PDFViewer({ container, viewer, eventBus, linkService });
linkService.setViewer(pdfViewer);
pdfViewer.setDocument(await pdfjsLib.getDocument({ url: "/cv.pdf" }).promise);
```

`PDFViewer` owns the page views, scrolling, zoom, the text layer and the
annotation layer. **None of that is reimplemented here** - the only thing this
project writes is the toolbar and its state.

| Element | Notes |
|---|---|
| Markup | `#viewerContainer > #viewer.pdfViewer`, the structure `pdf_viewer.css` expects; the container must be positioned and scrollable |
| Zoom | `pdfViewer.currentScaleValue`, default `"auto"` - page-width on a phone, capped near 125% on a desktop, the same default the pdf.js viewer ships |
| Links | `externalLinkTarget: LinkTarget.BLANK` + `externalLinkRel: "noopener"`, so the PDF's annotations follow the project's new-tab rule |
| Find | No `PDFFindController` - it only drives a find bar, and there is none. Native Ctrl/Cmd+F works on the text layer of the rendered pages |
| Toolbar | page prev/next + page box, zoom -/+ and a zoom menu, print, download. Its state syncs on `pagesinit`, `pagechanging` and `scalechanging` (trap B4.13) |
| Ready signal | `<html data-pv-ready="<pages>">`, set on `pagesloaded` (trap B4.12) |
| Print | Hands the real `cv.pdf` to the browser through an off-screen iframe, falling back to opening it in a new tab. Download links straight at the file |
| Resize | 150ms debounce, then re-resolve a named zoom against the new width and `pdfViewer.update()` |

**Degradation**: a document that fails to load shows a link to `/print.html`. A
viewer that never boots at all is caught by a 12s inline timer that shows the
same link. With JS off, the homepage's `<noscript>` carries the full CV markup,
so the page is never an empty canvas to a crawler or a reader.

`src/css/viewer.css` styles this page only. It never runs paged.js, so unlike
`resume.css` it is free to use `@media` (trap B4.1 is a paged.js behaviour).

## B5. Print / Download PDF

- **Download PDF**: downloads `/cv.pdf` directly.
- **Print PDF**: prints that same file through the browser's own PDF path.
- **Ctrl/Cmd+P on the homepage**: prints the rendered canvases - a raster copy of
  the same pages, chrome hidden, one sheet per page. The vector file is one click
  away in the menu.

## B6. Traps we've hit (important)

Numbering is stable: code comments reference these by number.

1. **Paged.js "flattens" `@media print`**: the polisher flattens `@media` blocks
   into global rules if the CSS is present while it runs → **never put
   `@media screen/print` in `resume.css`**. Decoration CSS lives in the
   `print.njk` boot script, injected after pagination finishes. `viewer.css` is
   exempt - that page never loads paged.js.
2. **Padding stripped at split points**: paged.js strips the padding of a
   fragment it split - contrary to `box-decoration-break: clone`. Compensate
   with `.pagedjs_area .page { padding: 12mm !important }` in **`resume.css`**,
   never from the boot script: padding is layout, and paged.js must measure the
   real box while it fills the pages (trap B4.9).
3. **Script order**: dynamically inserted scripts are async by default. When
   adding a script that must run before/after paged.js → set `async = false`.
4. **Page number position `bottom: 4mm`**: safe because the 12mm bottom margin
   band is always empty. If `.page` padding changes, adjust `PAGE_PADDING_MM`
   too - the two are a pair.
5. **`window.innerWidth` lies on mobile**: while content overflows, mobile
   browsers report `innerWidth` as the overflowing document width, not the
   screen. Anything sizing to the viewport must read
   `documentElement.clientWidth`. Still live in `viewer.js`.
6. **Never scale content while paged.js is measuring** *(retired mechanism, live
   lesson)*: a `zoom`/`transform` on `.page` mid-pagination made
   `getBoundingClientRect()` return scaled sizes, so paged.js computed the wrong
   page count - 3 pages on desktop, 2 on a phone. The browser no longer
   paginates, so nothing scales any more; the successor rule is B4.4 in the
   viewer, re-render instead of scale.
7. **Grids are atomic**: paged.js cannot split a `display: grid` container
   across pages - one straddling a page boundary loses its overflowing rows
   instead of moving them. Every grid here (`.cert-list`, `.skills-grid`,
   `.meta-grid`) is far smaller than a page, so `break-inside: avoid-page`
   safely pushes it whole to the next page.
8. **Fallback font metrics make pagination nondeterministic**: paginating
   before Inter has loaded measures the fallback font, so the same content
   breaks differently run to run. `window.PagedConfig = { auto: false }` holds
   paged.js back and the boot script calls `PagedPolyfill.preview()` after
   `document.fonts.ready` (3s cap, so a stuck font request can't hang the
   build).
9. **Nothing may change the layout after pagination**: `.pagedjs_page_content`
   is a multicol box one page wide (`column-width: 794px; column-fill: auto`)
   and `.pagedjs_sheet` is `overflow: hidden`. Paged.js fills each sheet right
   up to that height, so CSS injected afterwards that grows the box by even a
   few px pushes the last block into the **next column**, where the sheet clips
   it: the content disappears from the sheet AND from the PDF while staying in
   the DOM, so any DOM-counting test still passes. It is also position- and
   timing-dependent, so it looks random. This is what the late
   `[data-split-from/to]` padding did to Honors & Awards. `check_view.py`
   guards it from both ends - "no content clipped outside the sheets" (any
   `.page` descendant rendered outside its sheet rect) and "no overfilled
   pages" (computed `.page` height taller than its `.pagedjs_area`; read the
   COMPUTED height, `getBoundingClientRect()` only covers the first column
   fragment).
10. **pdf.js drops APIs between majors**: v6 removed
    `viewport.convertToViewportRectangle`, which an earlier hand-rolled link
    layer here was built on - it failed silently and the CV lost every clickable
    link. Using `PDFViewer` instead of reimplementing its layers is the real fix,
    since the components move with the API. Re-run `check_view.py` after every
    `pdfjs-dist` upgrade regardless.
11. **`pdf_viewer.mjs` has no imports - it reads `globalThis.pdfjsLib`**, which
    `pdf.min.mjs` sets as a side effect. So import order is load-bearing: the
    core must be imported before the components (static imports evaluate in
    source order), exactly as pdf.js's own example loads the two script tags in
    that order. Reverse them and the viewer dies at module-evaluation time,
    before any error handler of ours exists.
12. **`PDFViewer` renders lazily, so "all canvases painted" is not readiness**:
    it only paints pages near the viewport. A ready flag that waited for
    `pagesCount` canvases passed on a phone - where the whole document happens to
    fit on screen - and hung forever on a desktop. Use the viewer's own
    `pagesloaded` event. For the same reason `check_view.py` scrolls the
    container to the end before counting canvases, text spans or links.
13. **Toolbar state must sync after `pagesinit`, not after `setDocument`**:
    `pdfViewer.pagesCount` is still 0 while the document is being set up, so
    syncing there computes `1 >= 0` and ships a permanently disabled "next page"
    button. Any toolbar state derived from the page count belongs in the
    `pagesinit` handler.

---

# TEST CHECKLIST

- [ ] Empty section → fully hidden, no orphaned title.
- [ ] Very long data (multi-line bullets, long names) → wraps naturally, no broken columns.
- [ ] Entry landing at page bottom → moves whole to the next page.
- [ ] Page split mid-section → 12mm margins repeat correctly (padding compensation).
- [ ] `/print.html` sheet count == `cv.pdf` page count, page numbers exact.
- [ ] Print: A4, 100% scale, header/footer off.
- [ ] Toolbar: page prev/next + page box, zoom -/+ and menu, print, download - all working, nothing disabled on first paint.
- [ ] `python3 scripts/check_view.py` all green (served `_site`). It covers the three stages: **cv.pdf** (section labels, awards and every CV url present as a real link annotation, `i / N` on every page), **/print.html** (no content dropped vs `resume.js`, nothing clipped outside the sheets, no overfilled pages, no orphaned titles - trap B4.9 is invisible to DOM counting alone), **/** on Chromium + WebKit (every PDF page gets a page view and renders once scrolled to, sheet fits width and keeps A4 proportions, no horizontal scroll, canvas never upscaled, text layer selectable, link count matches the PDF and every link is target=_blank, toolbar controls work, no-JS fallback readable). Screenshots land in `test-artifacts/`.
- [ ] No `@media` block in `resume.css` (trap B4.1) - `viewer.css` is exempt.
- [ ] No px in `resume.css` (px belongs to `viewer.css` and the boot script), no inline styles, no spacer `<br>`.
- [ ] After a `pdfjs-dist` upgrade: viewer boots, links clickable, toolbar intact (traps B4.10-B4.13).
