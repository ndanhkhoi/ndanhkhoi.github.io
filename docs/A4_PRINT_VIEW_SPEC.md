# A4 PRINT VIEW SPEC - HTML CV

> The project's source of truth: the A4 CV layout design standard + the A4 sheet
> preview mechanism with page numbers + PDF printing. Goal: **the web view = the
> actual printout**. This is the only spec - every layout/print change must
> follow it.

---

# PART A - A4 LAYOUT DESIGN

## A1. Core principles

| # | Principle | Details |
|---|---|---|
| 1 | **View = Print** | What you see on screen must exactly match the printout (A4 portrait). No "screen-only" states - the only exception: the Download PDF button (hidden when printing). |
| 2 | **Data integrity** | No truncating, no hiding, no `text-overflow: ellipsis`. Long content → more pages, never squeezed into one page. |
| 3 | **Natural document flow** | Grid/Flex/flow. Never `position: absolute` for dynamic data. |
| 4 | **Consistency** | Share CSS variables (`--sp-*`, `--fs-*`, `--lh-*`). No local overrides with arbitrary numbers. |
| 5 | **Standard print units** | mm for layout/spacing, pt for fonts. Avoid px (the preview-decoration boot script may use px). |
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

# PART B - A4 PREVIEW & PAGE NUMBERS (PAGED.JS)

## B1. How it works & wiring into the project

Paged.js (`paged.polyfill.js`) reads the page's own `@page` rule (size, margin)
and splits the content into `.pagedjs_page` boxes at the exact physical sheet
size. Each box maps 1:1 to one sheet of paper when printing. Page numbers are
**real DOM**, so they print along - preview and printout never drift apart.

**Self-hosted, no CDN**: `pagedjs` is a dependency in `package.json`.
The build hook in `eleventy.config.js` (`eleventy.after` event) copies
`node_modules/pagedjs/dist/paged.polyfill.js` → `_site/vendor/`.
The template loads `/vendor/paged.polyfill.js` plus the inline boot script (end
of `src/index.njk`), preceded by `<script>window.PagedConfig = { auto: false };
</script>` - that tag must stay **before** the polyfill, otherwise paged.js
starts paginating on its own before the fonts are ready (trap B4.8).

**Build-time PDF**: `npm run build:pdf` (`scripts/build-pdf.mjs`) opens
`_site/index.html` in headless Chromium (puppeteer), waits for pagination +
page-number stamping to stabilize, then prints to `_site/cv.pdf` (A4, the exact
paginated DOM). The "Download PDF" button is a direct download link to this file.

Upgrading pagedjs: `npm install pagedjs@<version>` → re-test pagination + page
numbers + PDF build.

## B2. What the boot script does

| # | Task | Details |
|---|---|---|
| 1 | Poll `.pagedjs_page` every 150ms | Wait for pagination to **stabilize** (page count unchanged 3 consecutive polls) before stamping - re-stamps automatically if content changes |
| 2 | Inject preview CSS **AFTER** pagination finishes | Gray backdrop, white sheets + shadow, margins between sheets. Must be injected after (trap B4.1), and must stay **decoration only** - anything that changes the box model here silently breaks the page fills paged.js just measured (trap B4.9) |
| 3 | Stamp **right-aligned** page numbers | `.preview-page-number` on each sheet, label `1 / n`, right margin = `PAGE_PADDING_MM` - change the label in the `pageLabel` function |
| 4 | Gate pagination on the fonts | `window.PagedConfig = { auto: false }` before the polyfill; the boot script calls `PagedPolyfill.preview()` after `document.fonts.ready` (3s cap). Paginating on fallback metrics breaks differently every run (trap B4.8) |
| 4b | *(not here)* padding at split points | Compensated from `resume.css`, not from this script - it is layout and paged.js must see it before it paginates (A2, traps B4.2 / B4.9) |
| 5 | **PDF** button (dropdown: Download PDF / Print PDF) | Fixed bottom-right, stroke SVG icons, chevron rotates when open, closes on outside click/Esc, hidden when printing. Download = link to `/cv.pdf` (direct download, **auto-hides when the file isn't built yet** - avoids confusion with print behavior); Print = `window.print()`. Must be appended **after** pagination finishes - an element outside body before that gets pulled into the content by paged.js |
| 6 | Mobile fit-width | Shrinks the A4 sheet to screen width via CSS `zoom` (like a real PDF viewer). Width source = `documentElement.clientWidth` (NOT `window.innerWidth`, which tracks overflowing content on mobile - trap B4.5). Re-runs on resize/orientationchange, resets to `zoom: 1` when printing |
| 6b | Loading state | From first paint: gray backdrop + spinner (`body::after`), the whole document at `opacity: 0` (raw `.page` inline, `.pagedjs_pages` via the early style tag) until pagination is stable - never zoom or unhide while pagination runs (traps B4.5/B4.6). At reveal: zoom the sheets, fade them in staggered (~0.35s each, 80ms apart), spinner off, then the PDF button fades in last (~0.55s delay). `prefers-reduced-motion` skips all of it |
| 7 | Broken-vendor fallback (missing file) | After 4s with no `.pagedjs_page` and no `window.Paged` → attach fake-A4-sheet CSS for `.page` + keep the button; the page stays viewable |

## B3. Print / Download PDF

- **Download PDF**: downloads the `/cv.pdf` file directly (generated at build time - see B1).
- **Print PDF**: opens the browser print dialog → A4, **100%** scale, header/footer off.
- Each `.pagedjs_page` = 1 sheet; printed page numbers match the screen exactly.

## B4. Traps we've hit (important)

1. **Paged.js "flattens" `@media print`**: the polisher flattens `@media` blocks
   into global rules if the CSS is present while it runs → **never put
   `@media screen/print` in `resume.css`**. All preview-decoration CSS lives in
   the boot script, injected after pagination finishes.
2. **Padding stripped at split points**: paged.js strips the padding of a
   fragment it split - contrary to `box-decoration-break: clone`. Compensate
   with `.pagedjs_area .page { padding: 12mm !important }` in **`resume.css`**,
   never from the boot script: padding is layout, and paged.js must measure the
   real box while it fills the pages (trap B4.9).
3. **Script order**: dynamically inserted scripts are async by default. When
   adding a script that must run before/after paged.js → set `async = false`.
4. **Page number position `bottom: 4mm`**: safe because the 12mm bottom margin
   band is always empty. If `.page` padding changes, adjust accordingly.
5. **`window.innerWidth` lies on mobile**: while content overflows (the raw
   794px A4 sheet), mobile browsers report `innerWidth` as the overflowing
   document width, not the screen - fit-width must read
   `documentElement.clientWidth`, which always reports the real viewport.
6. **Never scale content while paged.js is measuring**: a `zoom` on `.page`
   (or on `.pagedjs_pages` mid-pagination) makes `getBoundingClientRect()`
   return scaled sizes, so paged.js computes the wrong page count (e.g. 3 pages
   on desktop but 2 on a phone). Zoom is applied only after the page count is
   stable. Likewise any pre-pagination hide must be **inline** on `.page` (or
   overridable later): paged.js clones stylesheet rules into its own blob, so
   a rule-based `.page { visibility: hidden }` survives a tag removal and
   leaves a blank site. Rules that must stop applying at reveal
   (`.pagedjs_pages { opacity: 0 }`, the spinner) are safe as rules ONLY
   because the reveal overrides them with inline styles / a late-injected
   `!important` rule. Inline styles also keep the no-JS print-pure fallback
   visible.
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
   preview).
9. **Nothing may change the layout after pagination**: `.pagedjs_page_content`
   is a multicol box one page wide (`column-width: 794px; column-fill: auto`)
   and `.pagedjs_sheet` is `overflow: hidden`. Paged.js fills each sheet right
   up to that height, so CSS injected afterwards that grows the box by even a
   few px pushes the last block into the **next column**, where the sheet clips
   it: the content disappears from the preview AND from the PDF while staying
   in the DOM, so any DOM-counting test still passes. It is also position- and
   timing-dependent, so it looks random. This is what the late
   `[data-split-from/to]` padding did to Honors & Awards. `check_view.py`
   guards it from both ends - "no content clipped outside the sheets" (any
   `.page` descendant rendered outside its sheet rect) and "no overfilled
   pages" (computed `.page` height taller than its `.pagedjs_area`; read the
   COMPUTED height, `getBoundingClientRect()` only covers the first column
   fragment).

---

# TEST CHECKLIST

- [ ] Empty section → fully hidden, no orphaned title.
- [ ] Very long data (multi-line bullets, long names) → wraps naturally, no broken columns.
- [ ] Entry landing at page bottom → moves whole to the next page.
- [ ] Page split mid-section → 12mm margins repeat correctly (padding compensation).
- [ ] Preview (paged.js) and Print to PDF identical, page numbers exact.
- [ ] Print: A4, 100% scale, header/footer off.
- [ ] PDF button (Download/Print dropdown): visible on screen, fully hidden when printing; mobile fit-width A4 sheet + button 12px from the edge.
- [ ] `python3 scripts/check_view.py` all green (served `_site`): mobile sheet fits width, centered, no horizontal scroll, **page count identical across viewports**, **no content dropped vs `resume.js`** (awards/skills/entries/section titles all present - guards the "section cut off at page bottom" bug), **no content clipped outside the sheets / no overfilled pages** (trap B4.9 - the DOM-count check alone cannot see this), CV content visible, menu tappable, print resets zoom. Screenshots land in `test-artifacts/`.
- [ ] No `@media` block in `resume.css` (trap B4.1).
- [ ] No px in `resume.css` (px only in the preview boot script), no inline styles, no spacer `<br>`.
