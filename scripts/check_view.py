#!/usr/bin/env python3
"""Layout/visual check for the CV site.

The site is built in two stages and this script checks both, in the order the
build produces them (docs/A4_PRINT_VIEW_SPEC.md):

1. cv.pdf       - the artifact that ships. Printed from /print.html, it is what
                  visitors read and download, so its own content is asserted
                  directly: page count, section labels, awards, stamped page
                  numbers, link annotations. Those assertions live in
                  scripts/check-pdf.mjs, which the deploy workflow also runs.
2. /print.html  - the page paged.js paginates. Pagination is the only place
                  content can still be silently dropped or clipped, so the
                  trap checks live here (spec Part B). Chromium only: it is the
                  engine that prints cv.pdf.
3. /            - the pdf.js viewer. It renders cv.pdf, so it cannot disagree
                  with the PDF about layout; what it can get wrong is fitting
                  the sheet to the screen, the text layer and the links. Run on
                  Chromium and WebKit, since this part is the visitor's browser.

Usage:
    npm run build                                   # html + cv.pdf
    python3 -m http.server 4173 --directory _site   # in another terminal
    python3 scripts/check_view.py [base_url]        # default http://localhost:4173

Needs `pip install playwright && playwright install chromium webkit`.
Artifacts (screenshots) land in test-artifacts/. Exit code 0 = all checks pass.
"""

import json
import pathlib
import subprocess
import sys

from playwright.sync_api import sync_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
ROOT = pathlib.Path(__file__).resolve().parent.parent
ART = ROOT / "test-artifacts"
A4_RATIO = 297 / 210

failures = []


def check(label, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}" + (f" - {detail}" if detail else ""))
    if not ok:
        failures.append(f"{label}: {detail}")


def expected_from_resume_js():
    """Expected rendered counts, labels and URLs, straight from the CV data.

    Guards against pagination silently DROPPING trailing sections at a page
    boundary (the "Honors & Awards cut off" class of bug)."""
    return json.loads(subprocess.check_output(
        ["node", str(ROOT / "scripts/check-pdf.mjs"), "--expect"], text=True))


def pdf_facts():
    """What cv.pdf actually contains, read back with pdf.js (scripts/pdf-facts.mjs)."""
    return json.loads(subprocess.check_output(
        ["node", str(ROOT / "scripts/pdf-facts.mjs")], text=True))


EXPECTED = expected_from_resume_js()
EXPECTED_COUNTS = {k: EXPECTED[k] for k in ("awards", "skillGroups", "entries", "titles")}


# --------------------------------------------------------------- 1. the PDF

def check_pdf():
    """Delegated to scripts/check-pdf.mjs - the same assertions the deploy
    workflow gates on, so CI and this suite can never disagree about what
    cv.pdf is supposed to contain."""
    print("\n=== cv.pdf (the file the site serves) ===")
    out = subprocess.run(["node", str(ROOT / "scripts/check-pdf.mjs"), "--json"],
                         capture_output=True, text=True)
    if not out.stdout.strip():
        check("cv.pdf readable", False, out.stderr.strip() or "no output")
        return
    for r in json.loads(out.stdout):
        check(r["label"], r["ok"], r["detail"])


# --------------------------------------------------------- 2. the print page

PAGED_METRICS_JS = """
() => ({
  pageCount: document.querySelectorAll('.pagedjs_page').length,
  pageNumbers: [...document.querySelectorAll('.preview-page-number')].map(n => n.textContent),
  renderedCounts: {
    awards: document.querySelectorAll('.cert-list li').length,
    skillGroups: document.querySelectorAll('.skill-group').length,
    entries: document.querySelectorAll('.entry').length,
    titles: document.querySelectorAll('.cv-section-title').length,
  },
  /* Content present in the DOM but rendered OUTSIDE its sheet: when a page is
     overfilled, the multicol of .pagedjs_page_content pushes the overflowing
     block into the next column and .pagedjs_sheet (overflow: hidden) clips it
     away - invisible on screen AND absent from the PDF, while every DOM count
     above still matches (spec Part B, trap B4.9). */
  clippedContent: (() => {
    const out = [];
    [...document.querySelectorAll('.pagedjs_page')].forEach((pg, i) => {
      const sb = (pg.querySelector('.pagedjs_sheet') || pg).getBoundingClientRect();
      pg.querySelectorAll('.page *').forEach(el => {
        if (!el.textContent.trim()) return;
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) return;
        if (r.right > sb.right + 1 || r.left < sb.left - 1
            || r.bottom > sb.bottom + 1 || r.top < sb.top - 1)
          out.push((i + 1) + ': ' + el.textContent.replace(/\\s+/g, ' ').trim().slice(0, 40));
      });
    });
    return out.slice(0, 8);
  })(),
  /* Same failure seen from its cause: the .page box paged.js filled no longer
     fits the page area it was measured against. Read the COMPUTED height -
     getBoundingClientRect() only covers the first column fragment, so an
     overfilled page still measures exactly one sheet tall there.
     Tolerance = the page's own bottom padding: the last fragment of a split
     page carries the 12mm bottom margin band (A2) even when its content runs
     to the very bottom of the area, and that band is empty by definition. */
  overfilledPages: [...document.querySelectorAll('.pagedjs_page')].map((pg, i) => {
    const inner = pg.querySelector('.page');
    const area = pg.querySelector('.pagedjs_area');
    if (!inner || !area) return null;
    const cs = getComputedStyle(inner);
    const over = parseFloat(cs.height) - parseFloat(getComputedStyle(area).height);
    return over > parseFloat(cs.paddingBottom) + 1 ? `${i + 1}: +${Math.round(over)}px` : null;
  }).filter(Boolean),
  orphanedTitles: [...document.querySelectorAll('.cv-section-title')].filter(t => {
    const group = t.closest('.section-start');
    if (!group) return true; /* every title must live in a section-start group */
    const content = group.querySelectorAll('.entry, .cv-summary, .cert-list, .skills-grid, .meta-grid');
    if (!content.length) return true;
    const page = t.closest('.pagedjs_page');
    return ![...content].some(el => el.closest('.pagedjs_page') === page);
  }).map(t => t.textContent.trim()),
})
"""


def check_print_page(browser, pdf):
    print("\n=== /print.html (pagination source) ===")
    ctx = browser.new_context(viewport={"width": 1200, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"{BASE_URL}/print.html", wait_until="networkidle", timeout=60000)
    page.wait_for_selector("html[data-paged-ready]", timeout=60000, state="attached")
    m = page.evaluate(PAGED_METRICS_JS)
    page.screenshot(path=str(ART / "print_source_full.png"), full_page=True)

    check("paginates into the same page count as cv.pdf",
          m["pageCount"] == pdf["pages"],
          f"print.html={m['pageCount']} cv.pdf={pdf['pages']}")
    check("page numbers stamped",
          m["pageNumbers"] == [f"{i + 1} / {m['pageCount']}" for i in range(m["pageCount"])],
          str(m["pageNumbers"]))
    check("no content dropped by pagination", m["renderedCounts"] == EXPECTED_COUNTS,
          f"rendered={m['renderedCounts']} expected={EXPECTED_COUNTS}")
    check("no content clipped outside the sheets", not m["clippedContent"],
          str(m["clippedContent"]))
    check("no overfilled pages", not m["overfilledPages"], str(m["overfilledPages"]))
    check("no orphaned section titles", not m["orphanedTitles"], str(m["orphanedTitles"]))
    check("no JS errors on the print page", not errors, "; ".join(errors[:3]))
    ctx.close()


# ------------------------------------------------------------- 3. the viewer

VIEWER_METRICS_JS = """
() => {
  const c = document.getElementById('viewerContainer');
  const pages = [...document.querySelectorAll('.pdfViewer .page')];
  const rects = pages.map(el => {
    const r = el.getBoundingClientRect();
    return { left: +r.left.toFixed(1), right: +r.right.toFixed(1),
             width: +r.width.toFixed(1), height: +r.height.toFixed(1) };
  });
  const canvases = [...document.querySelectorAll('.pdfViewer .page canvas')];
  return {
    ready: document.documentElement.dataset.pvReady,
    clientWidth: document.documentElement.clientWidth,
    containerWidth: c ? c.clientWidth : null,
    containerScrollWidth: c ? c.scrollWidth : null,
    horizOverflow: c ? c.scrollWidth > c.clientWidth + 1 : true,
    pageCount: pages.length,
    canvasCount: canvases.length,
    pageRects: rects,
    /* pdf.js sizes the backing store itself; if it ever renders one smaller
       than its CSS box the page is an upscaled blur - the whole document on a
       phone. */
    canvasUnderSampled: canvases
      .map((cv, i) => cv.width < Math.floor(cv.getBoundingClientRect().width) - 1
        ? `${i + 1}: ${cv.width}px backing for ${Math.round(cv.getBoundingClientRect().width)}px box` : null)
      .filter(Boolean),
    textSpans: document.querySelectorAll('.textLayer span').length,
    textSample: [...document.querySelectorAll('.textLayer span')].slice(0, 3).map(s => s.textContent),
    /* The annotation layer is pdf.js's own; these are the CV's URLs, and the
       project requires every one of them to open in a new tab. */
    linkCount: document.querySelectorAll('.annotationLayer a').length,
    linksNotBlank: [...document.querySelectorAll('.annotationLayer a')]
      .filter(a => a.target !== '_blank' || !/noopener/.test(a.rel)).map(a => a.href),
    toolbar: {
      page: document.getElementById('pageNumber') ? document.getElementById('pageNumber').value : null,
      total: document.getElementById('numPages') ? document.getElementById('numPages').textContent : null,
      zoom: document.getElementById('zoomSelect') ? document.getElementById('zoomSelect').value : null,
      downloadHref: document.getElementById('download')
        ? document.getElementById('download').getAttribute('href') : null,
      downloadName: document.getElementById('download')
        ? document.getElementById('download').getAttribute('download') : null,
      hasPrint: !!document.getElementById('print'),
      visible: (() => {
        const t = document.querySelector('.pv-toolbar');
        if (!t) return false;
        const r = t.getBoundingClientRect();
        return r.top >= -1 && r.width > 0 && r.height > 0;
      })(),
    },
    statusGone: !document.getElementById('pv-status'),
  };
}
"""


def viewer_page(ctx, errors):
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
    page.wait_for_selector("html[data-pv-ready]", timeout=45000, state="attached")
    return page


def render_every_page(page, pdf):
    """PDFViewer paints lazily - only pages near the viewport get a canvas.
    Scroll the container to the end so the whole document is really rendered
    before counting canvases, text and links."""
    page.evaluate(
        """async (total) => {
          const c = document.getElementById('viewerContainer');
          for (let i = 0; i < 60; i++) {
            if (document.querySelectorAll('.pdfViewer .page canvas').length >= total) break;
            c.scrollTop = Math.min(c.scrollTop + c.clientHeight * 0.85, c.scrollHeight);
            await new Promise(r => setTimeout(r, 200));
          }
          await new Promise(r => setTimeout(r, 400));
        }""",
        pdf["pages"])


def check_viewer_fit(m, label=""):
    prefix = f"{label} " if label else ""
    w = m["pageRects"][0]["width"] if m["pageRects"] else 0
    check(f"{prefix}no horizontal overflow", not m["horizOverflow"],
          f"scrollWidth={m['containerScrollWidth']} clientWidth={m['containerWidth']}")
    check(f"{prefix}sheet never wider than the viewport", w <= m["containerWidth"] + 1,
          f"page={w} container={m['containerWidth']}")
    if m["clientWidth"] <= 640:
        # "auto" resolves to page-width on a narrow screen: the sheet should
        # claim nearly the whole container, not sit tiny in the middle.
        check(f"{prefix}sheet fills the width on mobile", w >= m["containerWidth"] * 0.9,
              f"page={w} container={m['containerWidth']}")


def run_viewer(browser, name, pdf, *, device=None, viewport=None):
    print(f"\n=== {name} ===")
    ctx = browser.new_context(**(dict(device) if device else {"viewport": viewport}))
    errors = []
    page = viewer_page(ctx, errors)
    render_every_page(page, pdf)
    m = page.evaluate(VIEWER_METRICS_JS)
    print("  " + json.dumps({k: v for k, v in m.items() if k != "pageRects"}, indent=2)[:900])

    tag = name.lower().replace(" ", "_")
    page.screenshot(path=str(ART / f"{tag}_viewport.png"))

    rect = m["pageRects"][0] if m["pageRects"] else None
    check("viewer reports the pdf's page count", m["ready"] == str(pdf["pages"]),
          f"ready={m['ready']} pdf={pdf['pages']}")
    check("every pdf page has a page view", m["pageCount"] == pdf["pages"],
          f"pages={m['pageCount']} pdf={pdf['pages']}")
    check("every page renders when scrolled to", m["canvasCount"] == pdf["pages"],
          f"canvases={m['canvasCount']} pdf={pdf['pages']}")
    check_viewer_fit(m)
    check("sheet keeps A4 proportions",
          rect is not None and abs(rect["height"] / rect["width"] - A4_RATIO) < 0.03,
          f"ratio={rect and round(rect['height'] / rect['width'], 4)} want≈{round(A4_RATIO, 4)}")
    check("pages render at full resolution", not m["canvasUnderSampled"],
          str(m["canvasUnderSampled"]))
    check("text layer is selectable text", m["textSpans"] > 0, str(m["textSample"]))
    check("every pdf link is clickable in the viewer",
          m["linkCount"] == sum(len(p) for p in pdf["links"]),
          f"viewer={m['linkCount']} pdf={sum(len(p) for p in pdf['links'])}")
    check("every link opens in a new tab", not m["linksNotBlank"], str(m["linksNotBlank"]))
    check("toolbar visible", m["toolbar"]["visible"] is True)
    check("toolbar shows the page count", m["toolbar"]["total"] == f"of {pdf['pages']}",
          str(m["toolbar"]["total"]))
    check("toolbar download points at cv.pdf", m["toolbar"]["downloadHref"] == "/cv.pdf"
          and (m["toolbar"]["downloadName"] or "").endswith("-cv.pdf"),
          f"href={m['toolbar']['downloadHref']} name={m['toolbar']['downloadName']}")
    check("toolbar has a print control", m["toolbar"]["hasPrint"] is True)
    check("loading state removed", m["statusGone"] is True)
    check("no JS errors", not errors, "; ".join(errors[:3]))
    ctx.close()
    return m


def check_landscape(browser, engine, pdf):
    print(f"\n=== {engine} iPhone 14 landscape (rotate after load) ===")
    ctx = browser.new_context(**browser_devices["iPhone 14"])
    errors = []
    page = viewer_page(ctx, errors)
    vp = page.viewport_size
    page.set_viewport_size({"width": vp["height"], "height": vp["width"]})
    page.wait_for_timeout(900)  # resize debounce is 150ms + relayout
    m = page.evaluate(VIEWER_METRICS_JS)
    check_viewer_fit(m, f"{engine} landscape")
    check(f"{engine} landscape keeps every page", m["pageCount"] == pdf["pages"],
          f"pages={m['pageCount']} pdf={pdf['pages']}")
    check(f"{engine} landscape re-renders sharp", not m["canvasUnderSampled"],
          str(m["canvasUnderSampled"]))
    check(f"{engine} landscape: no JS errors", not errors, "; ".join(errors[:3]))
    page.screenshot(path=str(ART / f"{engine}_iphone14_landscape.png"))
    ctx.close()


def check_toolbar_controls(browser, pdf):
    """The toolbar is the part of the viewer this project owns - pdf.js owns
    everything below it - so its controls are what can actually regress."""
    print("\n=== toolbar controls (desktop) ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    errors = []
    page = viewer_page(ctx, errors)

    page.click("#next")
    page.wait_for_timeout(500)
    check("next page advances the page box", page.input_value("#pageNumber") == "2",
          page.input_value("#pageNumber"))
    page.click("#previous")
    page.wait_for_timeout(500)
    check("previous page goes back", page.input_value("#pageNumber") == "1",
          page.input_value("#pageNumber"))

    page.fill("#pageNumber", str(pdf["pages"]))
    page.press("#pageNumber", "Enter")
    page.wait_for_timeout(600)
    check("typing a page number jumps to it",
          page.evaluate("document.querySelector('.pdfViewer').parentElement.scrollTop > 0"))

    scale_before = page.evaluate("parseFloat(getComputedStyle(document.querySelector('.pdfViewer .page')).width)")
    page.click("#zoomIn")
    page.wait_for_timeout(600)
    scale_after = page.evaluate("parseFloat(getComputedStyle(document.querySelector('.pdfViewer .page')).width)")
    check("zoom in enlarges the page", scale_after > scale_before,
          f"{scale_before} -> {scale_after}")
    page.click("#zoomOut")
    page.wait_for_timeout(600)
    scale_back = page.evaluate("parseFloat(getComputedStyle(document.querySelector('.pdfViewer .page')).width)")
    check("zoom out shrinks it again", scale_back < scale_after,
          f"{scale_after} -> {scale_back}")

    page.select_option("#zoomSelect", "page-width")
    page.wait_for_timeout(600)
    m = page.evaluate(VIEWER_METRICS_JS)
    check("page-width fills the container",
          m["pageRects"] and m["pageRects"][0]["width"] >= m["containerWidth"] * 0.9,
          f"page={m['pageRects'] and m['pageRects'][0]['width']} container={m['containerWidth']}")
    check("page-width introduces no horizontal scroll", not m["horizOverflow"],
          f"scrollWidth={m['containerScrollWidth']} clientWidth={m['containerWidth']}")

    check("cv.pdf reachable", page.request.head(BASE_URL + "/cv.pdf").ok)
    check("toolbar: no JS errors", not errors, "; ".join(errors[:3]))
    page.screenshot(path=str(ART / "toolbar_desktop.png"))
    ctx.close()


def check_no_js_fallback(browser):
    """No pdf.js (blocked module, no JS at all): the CV must still be readable.
    The homepage carries the same document in <noscript> and links /print.html."""
    print("\n=== no-JS fallback ===")
    html = browser.new_context().request.get(BASE_URL).text()
    for name in EXPECTED["awardNames"]:
        check(f"homepage html contains award '{name[:24]}'", name in html)
    check("homepage html links the print page", "/print.html" in html)

    ctx = browser.new_context(java_script_enabled=False, **browser_devices["iPhone 14"])
    page = ctx.new_page()
    page.goto(BASE_URL, wait_until="domcontentloaded", timeout=60000)
    check("no-JS: CV document rendered", page.locator(".cv-name").count() >= 1)
    check("no-JS: spinner hidden", not page.is_visible("#pv-status"))
    check("no-JS: viewer chrome hidden", not page.is_visible(".pv-toolbar"))
    # viewer.css pins html/body to the viewport (height:100%, overflow:hidden) so
    # the sheets scroll inside #viewerContainer. With no JS the CV itself is the
    # document: if that lock survives, the reader gets one screenful and no way
    # to reach the rest of the CV.
    scroll = page.evaluate(
        """() => {
          const de = document.documentElement;
          window.scrollTo(0, 1e6);
          return {reach: de.scrollHeight - de.clientHeight, y: window.scrollY};
        }""")
    check("no-JS: the whole CV is reachable by scrolling",
          scroll["reach"] > 0 and scroll["y"] > 0, str(scroll))
    page.screenshot(path=str(ART / "iphone14_nojs.png"), full_page=True)
    ctx.close()


browser_devices = {}


def main():
    ART.mkdir(exist_ok=True)
    pdf = pdf_facts()
    check_pdf()

    with sync_playwright() as p:
        browser_devices.update({k: p.devices[k] for k in
                                ("iPhone 14 Pro Max", "iPhone 14", "Pixel 7", "iPhone SE")})

        # Chromium prints cv.pdf, so it is the engine whose pagination matters.
        chromium = p.chromium.launch()
        check_print_page(chromium, pdf)
        chromium.close()

        # The viewer runs in the visitor's browser: check both engines.
        for engine in ("chromium", "webkit"):
            browser = getattr(p, engine).launch()
            for name in ("iPhone 14 Pro Max", "iPhone 14", "Pixel 7", "iPhone SE"):
                run_viewer(browser, f"{engine} {name}", pdf, device=browser_devices[name])
            run_viewer(browser, f"{engine} Desktop", pdf,
                       viewport={"width": 1280, "height": 900})
            check_landscape(browser, engine, pdf)
            browser.close()

        chromium = p.chromium.launch()
        check_toolbar_controls(chromium, pdf)
        check_no_js_fallback(chromium)
        chromium.close()

    print("\n" + "=" * 60)
    if failures:
        print(f"RESULT: {len(failures)} FAILURE(S)")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print("RESULT: all checks passed")
    print(f"Screenshots: {ART}")


if __name__ == "__main__":
    main()
