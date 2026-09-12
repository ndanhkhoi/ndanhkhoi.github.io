#!/usr/bin/env python3
"""Layout/visual check for the CV page across mobile, desktop and print.

Verifies the "mobile view must look like an A4 PDF viewer" requirement
(docs/A4_PRINT_VIEW_SPEC.md Part B, mechanism 6): the A4 sheet fits the
screen width, pages are centered with a gray gutter, page numbers exist,
no horizontal scroll, PDF menu works, landscape refits, print resets zoom.

Usage:
    npm run build && npm run build:pdf
    python3 -m http.server 4173 --directory _site   # in another terminal
    python3 scripts/check_view.py [base_url]        # default http://localhost:4173

Artifacts (screenshots) land in test-artifacts/. Exit code 0 = all checks pass.
"""

import json
import pathlib
import subprocess
import sys

from playwright.sync_api import sync_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
ART = pathlib.Path(__file__).resolve().parent.parent / "test-artifacts"


def expected_from_resume_js():
    """Expected rendered-item counts, straight from src/_data/resume.js.

    Guards against paged.js silently DROPPING trailing sections at a page
    boundary (the "Honors & Awards cut off" class of bug)."""
    root = pathlib.Path(__file__).resolve().parent.parent
    out = subprocess.check_output(
        ["node", "-e",
         "const r=require(process.argv[1]);"
         "const titles=['summary','education','experience','projects','writing',"
         "'awards','skills','additional'].filter(k=>"
         "k==='additional'?(r.languages.length||r.interests.length):"
         "(k==='summary'?!!r.summary:r[k].length)).length;"
         "console.log(JSON.stringify({"
         "awards:r.awards.length,"
         "skillGroups:r.skills.length,"
         "entries:r.education.length+r.experience.length+r.projects.length+r.writing.length,"
         "titles}))",
         str(root / "src/_data/resume.js")],
        text=True)
    return json.loads(out)

METRICS_JS = """
() => {
  const de = document.documentElement;
  const pages = [...document.querySelectorAll('.pagedjs_page')];
  const rects = pages.map(el => {
    const r = el.getBoundingClientRect();
    return { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1),
             left: +r.left.toFixed(1), right: +r.right.toFixed(1),
             width: +r.width.toFixed(1), height: +r.height.toFixed(1) };
  });
  const wrap = document.querySelector('.pagedjs_pages');
  const nums = [...document.querySelectorAll('.preview-page-number')];
  const menu = document.querySelector('.pdf-menu__toggle');
  const mr = menu ? menu.getBoundingClientRect() : null;
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    clientWidth: de.clientWidth,
    scrollWidth: de.scrollWidth,
    horizOverflow: de.scrollWidth > de.clientWidth + 1,
    zoomInline: wrap ? wrap.style.zoom : null,
    zoomComputed: wrap ? getComputedStyle(wrap).zoom : null,
    pageCount: pages.length,
    pageRects: rects,
    fallbackSheetRect: (() => {
      if (pages.length) return null;
      const el = document.querySelector('.page');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: +r.left.toFixed(1), right: +r.right.toFixed(1), width: +r.width.toFixed(1) };
    })(),
    gapBetweenPages: rects.length > 1 ? +(rects[1].top - rects[0].bottom).toFixed(1) : null,
    firstPageLeft: rects.length ? rects[0].left : null,
    firstPageRightMargin: rects.length ? +(window.innerWidth - rects[0].right).toFixed(1) : null,
    pageNumbers: nums.map(n => n.textContent),
    pageNumberFontSize: nums.length ? getComputedStyle(nums[0]).fontSize : null,
    menuRect: mr ? { bottom: +mr.bottom.toFixed(1), right: +mr.right.toFixed(1) } : null,
    docHeight: de.scrollHeight,
    wrapOpacity: wrap ? getComputedStyle(wrap).opacity : null,
    pageOpacities: pages.map(el => getComputedStyle(el).opacity),
    spinnerContent: getComputedStyle(document.body, '::after').content,
    renderedCounts: {
      awards: document.querySelectorAll('.cert-list li').length,
      skillGroups: document.querySelectorAll('.skill-group').length,
      entries: document.querySelectorAll('.entry').length,
      titles: document.querySelectorAll('.cv-section-title').length,
    },
    contentVisible: (() => {
      const el = document.querySelector('.cv-name, .cv-summary, .entry');
      if (!el) return false;
      const cs = getComputedStyle(el);
      return cs.visibility === 'visible' && cs.display !== 'none';
    })(),
  };
}
"""

failures = []
page_counts = {}
EXPECTED = expected_from_resume_js()


def check(label, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}" + (f" - {detail}" if detail else ""))
    if not ok:
        failures.append(f"{label}: {detail}")


def wait_ready(page):
    """Wait until the boot script finished: page numbers stamped + menu added,
    then let the reveal animations settle (sheets fade ≤0.51s, menu ≤0.85s)."""
    page.wait_for_selector(".pdf-menu", timeout=45000, state="attached")
    page.wait_for_timeout(1100)


def run_device(browser, name, *, device=None, viewport=None, landscape=False):
    print(f"\n=== {name} ===")
    ctx_kwargs = {}
    if device:
        ctx_kwargs = dict(device)
        if landscape:
            vp = ctx_kwargs["viewport"]
            ctx_kwargs["viewport"] = {"width": vp["height"], "height": vp["width"]}
    else:
        ctx_kwargs = {"viewport": viewport}
    ctx = browser.new_context(**ctx_kwargs)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
    wait_ready(page)

    m = page.evaluate(METRICS_JS)
    page_counts[name] = m["pageCount"]
    print("  " + json.dumps({k: v for k, v in m.items() if k != "pageRects"}, indent=2)[:1200])

    tag = name.lower().replace(" ", "_")
    page.screenshot(path=str(ART / f"{tag}_viewport.png"))
    page.screenshot(path=str(ART / f"{tag}_full.png"), full_page=True)
    page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight / 3)")
    page.wait_for_timeout(200)
    page.screenshot(path=str(ART / f"{tag}_scrolled.png"))

    pad = 16 if m["clientWidth"] <= 640 else 24
    target = min(m["clientWidth"] - pad, 793.7)  # zoom caps at 1 (no upscaling)
    w = m["pageRects"][0]["width"] if m["pageRects"] else 0

    check("no horizontal overflow", not m["horizOverflow"],
          f"scrollWidth={m['scrollWidth']} clientWidth={m['clientWidth']}")
    check("A4 sheet fits width", abs(w - target) <= 2, f"width={w} target≈{target}")
    check("sheet centered", m["firstPageLeft"] is not None
          and abs(m["firstPageLeft"] - m["firstPageRightMargin"]) <= 2,
          f"left={m['firstPageLeft']} right={m['firstPageRightMargin']}")
    check("gray gutter between sheets", m["gapBetweenPages"] is None or m["gapBetweenPages"] > 0,
          f"gap={m['gapBetweenPages']}")
    check("PDF button inside the visible viewport", m["menuRect"] is not None
          and m["menuRect"]["right"] <= m["clientWidth"] + 1
          and m["menuRect"]["bottom"] <= m["innerHeight"] + 1,
          f"menuRect={m['menuRect']} clientWidth={m['clientWidth']} innerHeight={m['innerHeight']}")
    check("page numbers stamped", m["pageNumbers"] == [f"{i+1} / {m['pageCount']}"
          for i in range(m["pageCount"])], str(m["pageNumbers"]))
    check("CV content visible", m["contentVisible"] is True,
          f"contentVisible={m['contentVisible']}")
    check("sheets fully faded in", all(o == "1" for o in m["pageOpacities"])
          and m["wrapOpacity"] == "1",
          f"wrap={m['wrapOpacity']} pages={m['pageOpacities']}")
    check("loading spinner removed", m["spinnerContent"] == "none",
          f"spinner={m['spinnerContent']}")
    check("no content dropped by pagination",
          m["renderedCounts"] == EXPECTED,
          f"rendered={m['renderedCounts']} expected={EXPECTED}")
    check("no JS errors", not errors, "; ".join(errors[:3]))
    ctx.close()
    return page, m


def main():
    ART.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()

        for name, device in [
            ("iPhone 14", p.devices["iPhone 14"]),
            ("Pixel 7", p.devices["Pixel 7"]),
            ("iPhone SE", p.devices["iPhone SE"]),
        ]:
            run_device(browser, name, device=device)

        # Landscape: rotate after load, boot script must refit on resize.
        print("\n=== iPhone 14 landscape (rotate after load) ===")
        ctx = browser.new_context(**p.devices["iPhone 14"])
        page = ctx.new_page()
        page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        wait_ready(page)
        vp = page.viewport_size
        page.set_viewport_size({"width": vp["height"], "height": vp["width"]})
        page.wait_for_timeout(600)  # resize debounce 150ms
        m = page.evaluate(METRICS_JS)
        pad = 16 if m["clientWidth"] <= 640 else 24  # same pad rule as the boot script
        target = min(m["clientWidth"] - pad, 793.7)
        w = m["pageRects"][0]["width"] if m["pageRects"] else 0
        check("landscape refits width", abs(w - target) <= 2, f"width={w} target≈{target}")
        check("landscape no overflow", not m["horizOverflow"],
              f"scrollWidth={m['scrollWidth']} clientWidth={m['clientWidth']}")
        page.screenshot(path=str(ART / "iphone14_landscape.png"))
        ctx.close()

        # Desktop.
        run_device(browser, "Desktop", viewport={"width": 1280, "height": 900})

        # PDF menu interaction on mobile.
        print("\n=== PDF menu interaction (iPhone 14) ===")
        ctx = browser.new_context(**p.devices["iPhone 14"])
        page = ctx.new_page()
        page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        wait_ready(page)
        page.tap(".pdf-menu__toggle")
        page.wait_for_selector(".pdf-menu--open", timeout=3000)
        check("menu opens on tap", page.is_visible(".pdf-menu__list"))
        dl = page.get_by_role("menuitem").filter(has_text="Download PDF")
        check("Download PDF item present", dl.count() == 1)
        href = dl.get_attribute("href") if dl.count() else None
        check("cv.pdf reachable", href == "/cv.pdf" and page.request.head(BASE_URL + href).ok)
        page.screenshot(path=str(ART / "iphone14_menu_open.png"))
        page.keyboard.press("Escape")
        ctx.close()

        # Broken/missing paged.js vendor → after 4s the fallback must keep the
        # CV viewable: raw .page revealed, fit-width, button present.
        print("\n=== No paged.js (vendor blocked) - fallback ===")
        ctx = browser.new_context(**p.devices["iPhone 14"])
        page = ctx.new_page()
        page.route("**/vendor/**", lambda route: route.abort())
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_selector(".pdf-menu", timeout=15000)
        page.wait_for_timeout(400)
        m = page.evaluate(METRICS_JS)
        pad = 16 if m["clientWidth"] <= 640 else 24
        target = min(m["clientWidth"] - pad, 793.7)
        check("fallback: no pagination", m["pageCount"] == 0, f"pages={m['pageCount']}")
        check("fallback: CV content visible", m["contentVisible"] is True,
              f"contentVisible={m['contentVisible']}")
        check("fallback: sheet fits width",
              m["fallbackSheetRect"] and abs(m["fallbackSheetRect"]["width"] - target) <= 2,
              f"rect={m['fallbackSheetRect']} target≈{target}")
        check("fallback: no horizontal overflow", not m["horizOverflow"],
              f"scrollWidth={m['scrollWidth']} clientWidth={m['clientWidth']}")
        page.screenshot(path=str(ART / "iphone14_fallback.png"))
        ctx.close()

        # Print media: zoom must reset, menu must hide, A4 boxes intact.
        print("\n=== Print emulation ===")
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        wait_ready(page)
        page.emulate_media(media="print")
        m = page.evaluate(METRICS_JS)
        check("print resets zoom", m["zoomComputed"] in ("1", "normal"),
              f"zoom={m['zoomComputed']}")
        check("print hides PDF menu", not page.is_visible(".pdf-menu__toggle"))
        check("print keeps all pages", m["pageCount"] >= 1, f"pages={m['pageCount']}")
        page.pdf(path=str(ART / "print_emulated.pdf"), format="A4",
                 print_background=True, margin={"top": "0", "right": "0",
                                                "bottom": "0", "left": "0"})
        ctx.close()
        browser.close()

    print("\n" + "=" * 60)
    counts = sorted(set(page_counts.values()))
    check("page count identical across viewports", len(counts) == 1,
          str(page_counts))
    if failures:
        print(f"RESULT: {len(failures)} FAILURE(S)")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print("RESULT: all checks passed")
    print(f"Screenshots: {ART}")


if __name__ == "__main__":
    main()
