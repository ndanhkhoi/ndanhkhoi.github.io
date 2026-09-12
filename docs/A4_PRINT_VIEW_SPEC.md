# A4 PRINT VIEW SPEC - HTML CV

> The project's source of truth: Part A is the A4 CV layout design standard,
> Part B is the build pipeline that paginates it and prints it to `cv.pdf`.
> The site has two renderings of one data file - a web resume at `/` and the A4
> document at `/cv.pdf` - and Part A governs the second one. This is the only
> spec; every layout/print change must follow it.

---

# PART A - A4 LAYOUT DESIGN

## A1. Core principles

| # | Principle | Details |
|---|---|---|
| 1 | **The PDF is the document** | `cv.pdf` is printed from `/print.html` at build time (Part B) and shipped as a file. Nothing re-typesets it later, so what a reader downloads is what the build produced. The web resume at `/` is a separate rendering of the same data and is governed by nothing in Part A. |
| 2 | **Data integrity** | No truncating, no hiding, no `text-overflow: ellipsis`. Long content → more pages, never squeezed into one page. |
| 3 | **Natural document flow** | Grid/Flex/flow. Never `position: absolute` for dynamic data. |
| 4 | **Consistency** | Share CSS variables (`--sp-*`, `--fs-*`, `--lh-*`). No local overrides with arbitrary numbers. |
| 5 | **Standard print units** | mm for layout/spacing, pt for fonts. Avoid px in `resume.css`; px belongs to the screen-only files (`site.css`, the boot script's decoration CSS). |
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
.entry  .entry-head  .entry-title  .entry-sub  .entry-period  .entry-highlights  .entry-link
.skills-grid  .skill-group  .meta-grid  .cert-list  .cert-item  .cert-name  .cert-extra
.section--atomic  .section--flow  .section-opening  .section-start
.break-page  .text-meta
```

Forbidden classes: coordinate/value-based names (`.ml-10`, `.left-20`, `.block-1`...).

---

# PART B - BUILD PIPELINE: DATA → PAGINATION → PDF, AND THE WEB RESUME

## B1. What is built

`src/data/resume.js` is rendered twice, by two independent sets of components:

| # | Stage | Produces | Engine |
|---|---|---|---|
| 1 | `src/pages/print.astro` → `/print.html` | the CV split into `.pagedjs_page` sheets, page numbers stamped | paged.js, in the build's Chromium |
| 2 | `scripts/build-pdf.mjs` | `_site/cv.pdf` | puppeteer `page.pdf()` |
| - | `src/pages/index.astro` → `/` | the web resume | plain static HTML + CSS, one enhancement script |

Stages 1 and 2 are a chain: the PDF *is* the print page, printed. `/` is not in
that chain - it renders the same data its own way and links the finished file.

**Why pagination happens once, in the build.** When the browser re-paginated the
CV on every visit, two layout engines had to agree: paged.js in the visitor's
browser and paged.js under puppeteer. They disagreed on mobile - different
fonts, different viewport, different text metrics - and the failure mode was
silent content loss (trap B4.9). Pagination now happens once, on one machine,
and every reader receives its output byte for byte.

**No PDF renderer in the page.** An earlier version rendered `cv.pdf` on the
homepage with pdf.js. That shipped ~2.2MB of library to every visitor, needed a
hand-maintained toolbar, and pinned the project to an API that drops methods
between majors (retired traps B4.10-B4.13). The site now links the file and lets
the browser's own PDF viewer open it - which is also where readers already know
how to print, zoom and save.

**Self-hosted, no CDN.** `pagedjs` and `@fontsource/inter` are npm dependencies;
`scripts/prepare-assets.mjs` copies them into the generated `public/` before
every dev and build run, and Astro copies `public/` into `_site` verbatim:

```text
lib/paged.polyfill.js   pagination for /print.html
fonts/fonts.css         @font-face rules for both faces, one file for both pages
fonts/files/*.woff2     Inter 400/500/600/700 (400/700 for the A4 document, 500/600 for web UI type)
                        Instrument Serif 400 (the web resume's display face only)
```

`prepare-assets.mjs` builds that stylesheet from the same list it copies the
files from: a `@font-face` rule whose file was never copied is a 404 the moment
a reader types a character in its unicode-range, and "latin" being a prefix of
"latin-ext" makes that an easy mistake to write.

`public/` is generated and gitignored - nothing is committed into it by hand.
`scripts/build-pdf.mjs` also mirrors the finished `cv.pdf` there so `astro dev`
can serve it.

`pdfjs-dist` remains a **devDependency**: `scripts/pdf-facts.mjs` reads the built
PDF back with it to assert what it contains. Nothing ships it to a visitor.

Upgrading paged.js: `npm install pagedjs@<v>` → rebuild → `scripts/check_view.py`.

## B2. Stage 1 - `/print.html`, where pagination happens

Paged.js reads the page's own `@page` rule (size, margin) and splits the content
into `.pagedjs_page` boxes at the exact physical sheet size. Each box maps 1:1 to
one sheet of paper. Page numbers are **real DOM**, so they land in the PDF.

`window.PagedConfig = { auto: false }` must stay **before** the polyfill tag,
otherwise paged.js starts paginating before the fonts are ready (trap B4.8).

All three script tags are `is:inline` so Astro leaves them exactly where they are
written, in that order - bundling would break both the ordering and the global
`PagedConfig` assignment.

What the boot script at the end of `src/pages/print.astro` does:

| # | Task | Details |
|---|---|---|
| 1 | Gate pagination on the fonts | Calls `PagedPolyfill.preview()` after `document.fonts.ready` (3s cap). Paginating on fallback metrics breaks differently every run (trap B4.8) |
| 2 | Poll `.pagedjs_page` every 150ms | Waits for the page count to hold steady for 3 consecutive polls before stamping |
| 3 | Stamp right-aligned page numbers | `.preview-page-number` per sheet, label `1 / n` (change it in `pageLabel`), right margin = `PAGE_PADDING_MM`, which must match the `.page` padding in `resume.css` |
| 4 | Set `data-paged-ready="<count>"` on `<html>` | The single "pagination finished" signal. `build-pdf.mjs` and `check_view.py` both wait on it instead of guessing with a sleep |
| 5 | Inject decoration CSS **after** pagination | Gray backdrop, white sheets, shadows, and the `@media print` reset. Must be injected after (trap B4.1) and must stay **decoration only** (trap B4.9) |
| 6 | Broken-vendor fallback | 4s with no `.pagedjs_page` and no `window.Paged` → fake-A4-sheet CSS, so the page stays readable |
| - | *(not here)* padding at split points | Compensated from `resume.css`: it is layout, and paged.js must see it before it paginates (A2, trap B4.9) |

`build.inlineStylesheets: "never"` in `astro.config.mjs` keeps `resume.css` a
`<link>` rather than an inlined `<style>`, so paged.js reads the document
stylesheet the same way on every build regardless of its size.

This page is also the site's plain-HTML copy of the CV - the web resume links it
in the footer. `<link rel="canonical" href="/">` keeps the two URLs from
competing as duplicate content.

## B3. Stage 2 - `cv.pdf`

`npm run build:pdf` (`scripts/build-pdf.mjs`) serves `_site` over HTTP (paged.js
cannot load CSS over `file://`), opens `/print.html` in `chrome-headless-shell`
at a 1200px viewport, waits for `data-paged-ready` to match both the sheet count
and the stamped-number count, then prints with `preferCSSPageSize` +
`printBackground`.

The shell, not Chrome's newer built-in headless mode: paged.js advances its
chunker one animation frame at a time and the new mode can produce none at all,
which hangs the build with no error to read (trap B4.20).

The result is written into `_site/cv.pdf` (and mirrored to `public/cv.pdf` for
the dev server). It is **not** an Astro input: Astro clears `_site` at the start
of a build and the PDF is written after, so the order in `npm run build` is what
guarantees the PDF matches the HTML beside it.

| Command | Runs |
|---|---|
| `npm run build` | `build:html` then `build:pdf` - the only build the deploy uses |
| `npm run build:html` | assets + `astro build`; for the rare case where Chromium isn't available |
| `npm run dev` | assets + `astro dev`; serves the `cv.pdf` from the last full build |

The deploy workflow re-reads the built file with `scripts/check-pdf.mjs` and
fails rather than publishing a PDF that no longer says what `resume.js` says.

## B4. The web resume - `/`

Static HTML from `src/pages/index.astro` and its components in
`src/components/web/`, styled by `src/styles/site.css`. The only JavaScript is
`src/scripts/site.ts` (~3KB, inlined by Astro), and it adds four things: the
theme toggle, the scrollspy, the reading-progress bar, and reveal-on-scroll.

It is set like a document, not like a dashboard: hairline rules instead of
cards, a near-monochrome warm palette with one accent (the CV's own ink), and a
display serif used for exactly two things - the name and the section titles.
The full brief is at the top of `src/styles/site.css`.

| Concern | How it is handled |
|---|---|
| Content | Every word comes from `resume.js`, which holds the CV and nothing else. No tagline, no headline numbers, no copy written for the web |
| Completeness | Every section is server-rendered. `check_view.py` asserts one rendered block per record, section by section, against `resume.js` |
| No-JS | The page is finished before any script runs. The reveal animation's start state is behind `html[data-anim="on"]`, set by an inline script and claimed by `site.ts`; a 2.5s timer removes it if the module never arrives (trap B4.14) |
| Reduced motion | `prefers-reduced-motion: reduce` makes the page static and skips the animation flag entirely |
| Themes | Light and dark; light reuses the CV's own ink (`#16437e`). The choice is stored, and the page follows the OS until the visitor overrides it. Applied before first paint, so there is no flash |
| Links | Every off-site link is `target="_blank" rel="noopener"`, the same rule the PDF's link annotations follow |
| The PDF | Linked from the header, the hero and the footer; it opens in a new tab and the browser's viewer takes over |
| Sections | `src/lib/sections.ts` is the one list feeding the nav and the scrollspy, and it must stay in the order `index.astro` renders them (trap B4.19). An empty section drops out of both at once |

`site.css` styles this page only. It never runs paged.js, so unlike `resume.css`
it is free to use `@media` (trap B4.1 is a paged.js behaviour). The two
stylesheets are never loaded together.

## B5. Print / Download PDF

- **Download CV / CV (PDF)**: opens `/cv.pdf` in a new tab. Printing, zooming
  and saving are then the browser's own PDF viewer's job.
- **`/print.html`**: the same document as paginated HTML, for readers and
  crawlers that want selectable text without the PDF.
- **Ctrl/Cmd+P on `/`**: prints the web resume, with the navigation and the
  backdrop dropped (`@media print` in `site.css`). It is a fallback, not the
  artifact - the A4 file is one click away.

## B6. Traps we've hit (important)

Numbering is stable: code comments reference these by number.

1. **Paged.js "flattens" `@media print`**: the polisher flattens `@media` blocks
   into global rules if the CSS is present while it runs → **never put
   `@media screen/print` in `resume.css`**. Decoration CSS lives in the
   `print.astro` boot script, injected after pagination finishes. `site.css`
   is exempt - that page never loads paged.js.
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
   `documentElement.clientWidth` - which is what `check_view.py` measures
   overflow against.
6. **Never scale content while paged.js is measuring** *(retired mechanism, live
   lesson)*: a `zoom`/`transform` on `.page` mid-pagination made
   `getBoundingClientRect()` return scaled sizes, so paged.js computed the wrong
   page count - 3 pages on desktop, 2 on a phone. The browser no longer
   paginates, so nothing scales any more.
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
Traps 10-13 belong to the retired pdf.js viewer. They are kept, and kept at
their numbers, because the numbering is referenced from code and because they
are the reasons the viewer is gone - read them before anyone proposes rendering
the PDF in the page again.

10. *(retired)* **pdf.js drops APIs between majors**: v6 removed
    `viewport.convertToViewportRectangle`, which an earlier hand-rolled link
    layer here was built on - it failed silently and the CV lost every clickable
    link. Using `PDFViewer` instead of reimplementing its layers is the real fix,
    since the components move with the API. Re-run `check_view.py` after every
    `pdfjs-dist` upgrade regardless.
11. *(retired)* **`pdf_viewer.mjs` has no imports - it reads `globalThis.pdfjsLib`**, which
    `pdf.min.mjs` sets as a side effect. So import order is load-bearing: the
    core must be imported before the components (static imports evaluate in
    source order), exactly as pdf.js's own example loads the two script tags in
    that order. Reverse them and the viewer dies at module-evaluation time,
    before any error handler of ours exists.
12. *(retired)* **`PDFViewer` renders lazily, so "all canvases painted" is not readiness**:
    it only paints pages near the viewport. A ready flag that waited for
    `pagesCount` canvases passed on a phone - where the whole document happens to
    fit on screen - and hung forever on a desktop. Use the viewer's own
    `pagesloaded` event. For the same reason `check_view.py` scrolls the
    container to the end before counting canvases, text spans or links.
13. *(retired)* **Toolbar state must sync after `pagesinit`, not after `setDocument`**:
    `pdfViewer.pagesCount` is still 0 while the document is being set up, so
    syncing there computes `1 >= 0` and ships a permanently disabled "next page"
    button. Any toolbar state derived from the page count belongs in the
    `pagesinit` handler.

Traps 14-18 are the web resume's, all found by `check_view.py` on the first run
of the new page.

14. **An animation start state in plain CSS can hide the whole CV.**
    Reveal-on-scroll works by starting at `opacity: 0` and letting a script add
    the class that ends the transition. Written as an unconditional rule, a
    blocked, 404'd or throwing script leaves the entire page invisible - to
    readers and to crawlers. The start state must therefore be **opt-in from the
    document**: `html[data-anim="on"]`, set by an inline script before first
    paint, claimed by the module (`data-anim-ready`), and torn back off by a
    2.5s timer if the module never arrives. `check_view.py` asserts, with JS
    disabled and with reduced motion, that no `.reveal` element is left below
    full opacity.
15. **`repeat(auto-fit, minmax(310px, 1fr))` overflows below 310px.** The
    minimum is a hard floor, so on a 320px phone the track is wider than its
    container and the whole page scrolls sideways - with the fixed header and
    the backdrop dragged along with it. Always
    `minmax(min(310px, 100%), 1fr)`.
16. **`scroll-padding-top` and `scroll-margin-top` stack.** Setting both (on
    `html` and on `.section`) parked every anchor jump two header-heights down
    the page, far enough that the scrollspy's "what am I reading" line no longer
    covered the section it had just scrolled to - so the nav highlighted the
    *previous* section after every click. Keep exactly one anchor offset, and
    keep the scrollspy line below it.
17. **One pseudo-element, one job.** The timeline dot was `.timeline__item::before`
    and the cursor-tracked card border was `.card--glow::before`; the same
    elements carry both classes, so the dot silently disappeared on exactly
    those entries. When two independent decorations can land on one element,
    give them `::before` and `::after`.
18. **`scroll-behavior: smooth` makes scripted scrolling asynchronous.** Any
    measurement taken straight after `scrollTo()` reads a position in transit -
    which is why `check_view.py` scrolls with `behavior: 'instant'` everywhere.
    Mind this in any future automation against `/`.
19. **A scrollspy that scans "the last section above the line" needs its list in
    document order.** Reordering two sections in `index.astro` without
    reordering `sections.ts` did not break the nav links - every one still
    scrolled to the right place - it just quietly highlighted the neighbouring
    section instead. `site.ts` now sorts its targets with
    `compareDocumentPosition`, so the scan cannot be fed a wrong order, and
    `check_view.py` asserts the nav lists the sections in page order so the
    reading order stays deliberate rather than accidental.
20. **Paged.js needs animation frames, and Chrome's new headless mode may never
    produce one.** `build-pdf.mjs` started timing out on every run: paged.js
    moved the content into its template, created `.pagedjs_pages`, emitted zero
    sheets and raised nothing. The chunker advances one frame at a time, and
    measured on this machine the default puppeteer headless ran **0
    requestAnimationFrame callbacks in two seconds**, against 157 in
    `chrome-headless-shell`. Nothing about the page was wrong - Playwright
    paginated the same file fine, which is what made it look like a server or a
    CSS problem for a while. `puppeteer.launch({ headless: "shell" })` is the
    fix. If the PDF build ever hangs again with no error, check whether frames
    are being produced before looking at the document.

---

# TEST CHECKLIST

- [ ] Empty section → fully hidden, no orphaned title.
- [ ] Very long data (multi-line bullets, long names) → wraps naturally, no broken columns.
- [ ] Entry landing at page bottom → moves whole to the next page.
- [ ] Page split mid-section → 12mm margins repeat correctly (padding compensation).
- [ ] `/print.html` sheet count == `cv.pdf` page count, page numbers exact.
- [ ] Print: A4, 100% scale, header/footer off.
- [ ] Web resume: nav, theme toggle and the PDF link all work; the nav lists the sections in page order; the page is complete with JavaScript disabled.
- [ ] `python3 scripts/check_view.py` all green (served `_site`). It covers: **cv.pdf** (section labels, awards and every CV url present as a real link annotation, `i / N` on every page), **/print.html** (no content dropped vs `resume.js`, nothing clipped outside the sheets, no overfilled pages, no orphaned titles - trap B4.9 is invisible to DOM counting alone), and **/** on Chromium + WebKit across six viewports (one rendered block per record in every section, no horizontal overflow, hero clears the fixed header, every external link target=_blank, the PDF and the HTML copy both linked, nothing left invisible by the reveal animation, nav click marks the right section and lands below the header, nav order matches page order, theme toggle repaints and persists) plus reduced-motion and JavaScript-disabled runs. Screenshots land in `test-artifacts/`.
- [ ] No `@media` block in `resume.css` (trap B4.1) - `site.css` is exempt.
- [ ] No px in `resume.css` (px belongs to `site.css` and the boot script), no inline styles, no spacer `<br>`.
- [ ] After a `pagedjs` upgrade: sheet count unchanged, page numbers stamped, `check-pdf.mjs` green.
