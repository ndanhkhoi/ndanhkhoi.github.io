#!/usr/bin/env python3
"""Layout/behaviour check for the CV site.

One data file (src/data/resume.js) is rendered three ways, and this script
checks all three in the order the build produces them
(docs/A4_PRINT_VIEW_SPEC.md):

1. cv.pdf       - the downloadable artifact. Printed from /print.html, so its
                  own content is asserted directly: page count, section labels,
                  awards, stamped page numbers, link annotations. Those
                  assertions live in scripts/check-pdf.mjs, which the deploy
                  workflow also runs.
2. /print.html  - the page paged.js paginates. Pagination is the only place
                  content can still be silently dropped or clipped, so the trap
                  checks live here (spec Part B). Chromium only: it is the
                  engine that prints cv.pdf.
3. /            - the web resume. Server-rendered HTML plus one progressive
                  enhancement script. What can break here is a section going
                  missing, the page overflowing sideways on a phone, a link
                  losing target="_blank", or the reveal animation leaving
                  content invisible. Run on Chromium and WebKit, since this
                  part is the visitor's browser - and once more with JavaScript
                  off, because the CV must be readable without it.

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

failures = []


def check(label, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}" + (f" - {detail}" if detail else ""))
    if not ok:
        failures.append(f"{label}: {detail}")


def expected_from_resume_js():
    """Expected rendered counts, labels and URLs, straight from the CV data.

    Guards against pagination silently DROPPING trailing sections at a page
    boundary (the "Honors & Awards cut off" class of bug), and against the web
    resume quietly rendering fewer entries than the data holds."""
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
    print("\n=== cv.pdf (the file the site links) ===")
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
    /* An entry is allowed to run over a page boundary, and paged.js renders
       the remainder as a second .entry carrying data-split-from. Counting raw
       elements would read that continuation as an extra entry; counting the
       ones that are NOT continuations still counts each entry exactly once,
       which is what makes a dropped entry visible. */
    entries: document.querySelectorAll('.entry:not([data-split-from])').length,
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


# --------------------------------------------------------- 3. the web resume

# One selector per section, so a section that silently rendered nothing is a
# failure with a name rather than a smaller total.
SECTION_SELECTORS = {
    "experience": "#experience .entry",
    "projects": "#projects .entry",
    "skills": "#skills .skills > div",
    "writing": "#writing .entry",
    "awards": "#awards .awards > li",
    "education": "#education .entry",
}

WEB_METRICS_JS = """
(selectors) => {
  const de = document.documentElement;
  const counts = {};
  for (const [key, sel] of Object.entries(selectors)) counts[key] = document.querySelectorAll(sel).length;

  const navLinks = [...document.querySelectorAll('[data-nav-for]')];

  return {
    counts,
    clientWidth: de.clientWidth,
    scrollWidth: de.scrollWidth,
    /* A page that scrolls sideways on a phone reads as broken before a word of
       it is read. */
    horizOverflow: de.scrollWidth > de.clientWidth + 1,
    /* Which elements actually stick out, so a failure is debuggable. */
    overflowing: [...document.querySelectorAll('body *')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1);
    }).slice(0, 6).map(el => el.className + ' @' + Math.round(el.getBoundingClientRect().right)),
    theme: de.dataset.theme || null,
    animOwned: de.dataset.animReady === '1',
    /* Nothing may be left in the reveal start state once it has been scrolled
       past: that is the one failure mode of the animation that hides the CV. */
    hiddenReveals: [...document.querySelectorAll('.reveal')]
      .filter(el => parseFloat(getComputedStyle(el).opacity) < 0.99)
      .map(el => el.className.replace('reveal', '').trim().slice(0, 40)),
    revealCount: document.querySelectorAll('.reveal').length,
    navTargets: navLinks.map(a => a.dataset.navFor),
    navResolves: navLinks.every(a => document.getElementById(a.dataset.navFor)),
    /* A nav that lists the sections in a different order than the page shows
       them reads as wrong, and the scrollspy's "last one above the line" scan
       depends on knowing which order is real.

       Checked one list at a time: the header nav and the narrow-screen menu
       are two presentations of the same sections, so the flat set of
       [data-nav-for] links runs through the page order twice by design. */
    navInDocumentOrder: [...document.querySelectorAll('.site-nav, .mobile-nav')].every(nav => {
      const tops = [...nav.querySelectorAll('[data-nav-for]')]
        .map(a => document.getElementById(a.dataset.navFor))
        .filter(Boolean)
        .map(el => el.getBoundingClientRect().top + scrollY);
      return tops.every((t, i) => i === 0 || t >= tops[i - 1]);
    }),
    activeNav: (document.querySelector('[data-nav-for][aria-current="true"]') || {}).dataset,
    /* Every off-site link opens in a new tab - a project-wide rule that also
       holds inside cv.pdf (checked there as link annotations). */
    externalLinks: [...document.querySelectorAll('a[href^="http"]')].map(a => a.href),
    linksNotBlank: [...document.querySelectorAll('a[href^="http"]')]
      .filter(a => a.target !== '_blank' || !/noopener/.test(a.rel))
      .map(a => a.href),
    pdfLinks: [...document.querySelectorAll('a[href$="cv.pdf"]')].map(a => ({
      href: a.getAttribute('href'), target: a.target,
    })),
    printLink: !!document.querySelector('a[href="/print.html"]'),
    headerStuck: (document.getElementById('site-header') || {}).dataset,
    progress: (() => {
      const el = document.getElementById('progress');
      return el ? getComputedStyle(el).getPropertyValue('--progress').trim() : null;
    })(),
    /* The header is fixed; if the first heading sits under it the page opens
       on a cropped title. */
    heroClearsHeader: (() => {
      const h = document.querySelector('.hero__name');
      const bar = document.getElementById('site-header');
      return h && bar ? h.getBoundingClientRect().top >= bar.getBoundingClientRect().bottom : false;
    })(),
    text: document.body.innerText,
  };
}
"""


# The page sets scroll-behavior: smooth, so a plain scrollTo() animates and
# every measurement taken straight after it reads a position in transit. Tests
# always scroll instantly.
SCROLL_TO_JS = "(y) => scrollTo({ top: y, behavior: 'instant' })"


def scroll_through(page):
    """Walk the page to the bottom so every reveal observer has fired, and wait
    out the staggered transitions before anything is measured."""
    page.evaluate("""async () => {
      const step = innerHeight * 0.8;
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo({ top: y, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 140));
      }
      scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 1500));
    }""")


def web_metrics(page):
    return page.evaluate(WEB_METRICS_JS, SECTION_SELECTORS)


def check_web(browser, name, *, device=None, viewport=None):
    print(f"\n=== / {name} ===")
    ctx = browser.new_context(**(dict(device) if device else {"viewport": viewport}))
    errors = []
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
    page.wait_for_function("() => document.documentElement.dataset.animReady === '1'", timeout=15000)

    m = web_metrics(page)
    tag = name.lower().replace(" ", "_").replace("/", "")
    page.screenshot(path=str(ART / f"web_{tag}_hero.png"))

    check("every section rendered one block per record",
          m["counts"] == EXPECTED["sections"],
          f"rendered={m['counts']} expected={EXPECTED['sections']}")
    for award in EXPECTED["awardNames"]:
        check(f"page shows award '{award[:24]}'", award in m["text"])
    for label in EXPECTED["labels"]:
        check(f"page shows section '{label}'", label in m["text"])
    check("hero clears the fixed header", m["heroClearsHeader"] is True)
    check("no horizontal overflow", not m["horizOverflow"],
          f"scrollWidth={m['scrollWidth']} clientWidth={m['clientWidth']} {m['overflowing']}")
    check("script owns the animations", m["animOwned"] is True)
    check("nav links all resolve to a section", m["navResolves"] is True, str(m["navTargets"]))
    check("nav lists the sections in page order", m["navInDocumentOrder"] is True,
          str(m["navTargets"]))
    check("every external link opens in a new tab", not m["linksNotBlank"], str(m["linksNotBlank"]))
    check("the CV pdf is linked and opens in a new tab",
          len(m["pdfLinks"]) >= 1 and all(l["target"] == "_blank" for l in m["pdfLinks"]),
          str(m["pdfLinks"]))
    check("the plain-HTML version is linked", m["printLink"] is True)

    # Every URL the CV carries must be reachable from the page too, otherwise
    # the web rendering quietly drops a link the PDF has.
    found = {u.rstrip("/") for u in m["externalLinks"]}
    missing = [u for u in EXPECTED["urls"]
               if u.startswith("http") and u.rstrip("/") not in found]
    check("every CV url is on the page", not missing, str(missing))

    scroll_through(page)
    after = web_metrics(page)
    page.screenshot(path=str(ART / f"web_{tag}_end.png"))
    check("nothing left invisible by the reveal animation",
          not after["hiddenReveals"], str(after["hiddenReveals"]))
    check("the page has reveal targets at all", after["revealCount"] > 0)
    check("header switches to its scrolled state", after["headerStuck"].get("stuck") == "true",
          str(after["headerStuck"]))
    check("reading progress reaches the end", float(after["progress"] or 0) > 0.99,
          str(after["progress"]))
    check("no horizontal overflow after scrolling", not after["horizOverflow"],
          f"scrollWidth={after['scrollWidth']} {after['overflowing']}")
    check("no JS errors", not errors, "; ".join(errors[:3]))
    ctx.close()


def check_nav_and_theme(browser):
    """The two pieces of behaviour this project owns on the web page."""
    print("\n=== / nav + theme (desktop) ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    errors = []
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
    page.wait_for_function("() => document.documentElement.dataset.animReady === '1'", timeout=15000)

    # Clicking a nav link must land in that section AND mark it current: the
    # anchor offset and the scrollspy line are two numbers that have to agree.
    for section in ("skills", "awards"):
        page.click(f'.site-nav [data-nav-for="{section}"]')
        page.wait_for_timeout(1200)
        current = page.evaluate(
            "() => (document.querySelector('[data-nav-for][aria-current=\"true\"]') || {dataset:{}}).dataset.navFor")
        check(f"clicking '{section}' marks it as the current section", current == section,
              f"aria-current={current}")
        top = page.evaluate(f"() => document.getElementById('{section}').getBoundingClientRect().top")
        header_h = page.evaluate("() => document.getElementById('site-header').offsetHeight")
        # Parked under the header, OR the page gave everything it had: the last
        # sections sit near the end of the document, and there is no page left
        # underneath them to scroll, so the browser stops at the bottom with the
        # section still lower down the screen. Either way it must clear the
        # header and be on screen.
        at_end = page.evaluate(
            "() => scrollY >= document.documentElement.scrollHeight - innerHeight - 2")
        parked = header_h - 2 <= top <= header_h + 40
        check(f"clicking '{section}' scrolls it below the header",
              parked or (at_end and header_h - 2 <= top < page.evaluate("() => innerHeight")),
              f"top={round(top)} header={header_h} at_end={at_end}")

    page.evaluate(SCROLL_TO_JS, 0)
    page.wait_for_timeout(600)
    check("nothing is current above the first section",
          page.evaluate("() => !document.querySelector('[data-nav-for][aria-current=\"true\"]')"))

    before = page.evaluate("() => getComputedStyle(document.body).backgroundColor")
    page.click("#theme-toggle")
    page.wait_for_timeout(400)
    after = page.evaluate("() => getComputedStyle(document.body).backgroundColor")
    theme = page.evaluate("() => document.documentElement.dataset.theme")
    check("theme toggle repaints the page", before != after, f"{before} -> {after}")
    check("theme toggle records the choice",
          page.evaluate("() => localStorage.getItem('theme')") == theme, str(theme))
    page.screenshot(path=str(ART / "web_theme_toggled.png"))

    page.reload(wait_until="networkidle")
    check("the theme choice survives a reload",
          page.evaluate("() => document.documentElement.dataset.theme") == theme)
    check("nav/theme: no JS errors", not errors, "; ".join(errors[:3]))
    ctx.close()


def check_mobile_nav(browser):
    """The section list at a width too narrow to show it inline.

    The header drops .site-nav below 940px, so without the menu a phone has no
    way to jump between sections at all. The button is also rendered `hidden`
    and unhidden by site.ts - if that handshake breaks, the control is either
    missing or dead, and both fail here."""
    print("\n=== / section menu (narrow) ===")
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    errors = []
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
    page.wait_for_function("() => document.documentElement.dataset.animReady === '1'", timeout=15000)

    check("the inline nav is gone at this width", not page.is_visible(".site-nav"))
    check("the menu button took its place", page.is_visible("#nav-toggle"))
    check("the menu starts closed", not page.is_visible("#mobile-nav"))

    # The two header controls and the menu button all sit against the right
    # edge - the whole point of the button being in .site-header__actions.
    gap = page.evaluate("""() => {
      const inner = document.querySelector('.site-header__inner');
      const actions = document.querySelector('.site-header__actions');
      return Math.round(inner.getBoundingClientRect().right - actions.getBoundingClientRect().right);
    }""")
    check("the header controls sit at the right edge", abs(gap) <= 1, f"gap={gap}px")

    page.click("#nav-toggle")
    page.wait_for_timeout(300)
    check("the button opens the menu", page.is_visible("#mobile-nav"))
    check("the menu is marked expanded",
          page.get_attribute("#nav-toggle", "aria-expanded") == "true")
    # The menu and the header nav are two renderings of src/lib/sections.ts;
    # comparing them to each other is what keeps them from drifting apart.
    listed = page.eval_on_selector_all("#mobile-nav [data-nav-for]", "els => els.map(e => e.dataset.navFor)")
    inline = page.eval_on_selector_all(".site-nav [data-nav-for]", "els => els.map(e => e.dataset.navFor)")
    check("the menu lists the same sections as the header nav",
          listed == inline and len(listed) > 0, str(listed))
    page.screenshot(path=str(ART / "web_mobile_nav_open.png"))

    page.click('#mobile-nav [data-nav-for="skills"]')
    page.wait_for_timeout(1200)
    check("choosing a section closes the menu", not page.is_visible("#mobile-nav"))
    top = page.evaluate("() => document.getElementById('skills').getBoundingClientRect().top")
    header_h = page.evaluate("() => document.getElementById('site-header').offsetHeight")
    at_end = page.evaluate(
        "() => scrollY >= document.documentElement.scrollHeight - innerHeight - 2")
    check("choosing a section scrolls it below the header",
          header_h - 2 <= top <= header_h + 40
          or (at_end and header_h - 2 <= top < page.evaluate("() => innerHeight")),
          f"top={round(top)} header={header_h} at_end={at_end}")

    page.click("#nav-toggle")
    page.wait_for_timeout(200)
    page.keyboard.press("Escape")
    page.wait_for_timeout(200)
    check("escape closes the menu", not page.is_visible("#mobile-nav"))

    check("section menu: no JS errors", not errors, "; ".join(errors[:3]))
    ctx.close()


def check_reduced_motion(browser):
    """With reduced motion the page must be complete and static, not animated
    fast."""
    print("\n=== / prefers-reduced-motion ===")
    ctx = browser.new_context(viewport={"width": 1280, "height": 900},
                              reduced_motion="reduce")
    page = ctx.new_page()
    page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(500)
    m = web_metrics(page)
    check("reduced motion: every section still rendered", m["counts"] == EXPECTED["sections"],
          str(m["counts"]))
    check("reduced motion: nothing hidden by the reveal start state",
          not m["hiddenReveals"], str(m["hiddenReveals"]))
    ctx.close()


def check_no_js(browser):
    """No JavaScript at all: the CV must still be complete, visible and
    scrollable. The reveal animation's start state is opt-in from the document
    for exactly this reason - see src/styles/site.css."""
    print("\n=== / with JavaScript disabled ===")
    html = browser.new_context().request.get(BASE_URL).text()
    for award in EXPECTED["awardNames"]:
        check(f"server-rendered html contains award '{award[:24]}'", award in html)
    check("server-rendered html links cv.pdf", "/cv.pdf" in html)
    check("server-rendered html links the print page", "/print.html" in html)

    ctx = browser.new_context(java_script_enabled=False, **BROWSER_DEVICES["iPhone 14"])
    page = ctx.new_page()
    page.goto(BASE_URL, wait_until="domcontentloaded", timeout=60000)
    m = web_metrics(page)
    check("no-JS: every section rendered", m["counts"] == EXPECTED["sections"], str(m["counts"]))
    check("no-JS: nothing hidden by the reveal start state",
          not m["hiddenReveals"], str(m["hiddenReveals"]))
    check("no-JS: no horizontal overflow", not m["horizOverflow"],
          f"scrollWidth={m['scrollWidth']} {m['overflowing']}")
    scroll = page.evaluate(
        """() => {
          const de = document.documentElement;
          window.scrollTo({ top: 1e6, behavior: 'instant' });
          return {reach: de.scrollHeight - de.clientHeight, y: window.scrollY};
        }""")
    check("no-JS: the whole CV is reachable by scrolling",
          scroll["reach"] > 0 and scroll["y"] > 0, str(scroll))
    page.screenshot(path=str(ART / "web_nojs_full.png"), full_page=True)
    ctx.close()


BROWSER_DEVICES = {}


def main():
    ART.mkdir(exist_ok=True)
    pdf = pdf_facts()
    check_pdf()

    with sync_playwright() as p:
        BROWSER_DEVICES.update({k: p.devices[k] for k in
                                ("iPhone 14 Pro Max", "iPhone 14", "Pixel 7", "iPhone SE")})

        # Chromium prints cv.pdf, so it is the engine whose pagination matters.
        chromium = p.chromium.launch()
        check_print_page(chromium, pdf)
        chromium.close()

        # The web resume runs in the visitor's browser: check both engines.
        for engine in ("chromium", "webkit"):
            browser = getattr(p, engine).launch()
            for name in ("iPhone 14 Pro Max", "iPhone 14", "Pixel 7", "iPhone SE"):
                check_web(browser, f"{engine} {name}", device=BROWSER_DEVICES[name])
            check_web(browser, f"{engine} Desktop", viewport={"width": 1280, "height": 900})
            check_web(browser, f"{engine} Tablet", viewport={"width": 834, "height": 1112})
            browser.close()

        chromium = p.chromium.launch()
        check_nav_and_theme(chromium)
        check_mobile_nav(chromium)
        check_reduced_motion(chromium)
        check_no_js(chromium)
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
