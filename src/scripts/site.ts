/* Behaviour for the web resume (/).
 *
 * Everything here is an enhancement: the page is complete, readable and
 * navigable as server-rendered HTML, and this script only adds the theme
 * toggle, the reading progress bar, the nav's active state, the narrow-screen
 * section menu and the reveal-on-scroll animation.
 *
 * The one thing that would NOT degrade safely is the animation start state, so
 * it is opt-in from the document itself: the inline script in index.astro sets
 * html[data-anim="on"] before first paint and arms a timer that tears it back
 * off if this module never arrives. Claiming it is this module's first job.
 */

const html = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Tell the failsafe in index.astro that the animations have an owner. */
html.dataset.animReady = "1";

/* ------------------------------------------------------------------ theme */

const THEME_KEY = "theme";
type Theme = "light" | "dark";

const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

function currentTheme(): Theme {
  const set = html.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  html.dataset.theme = theme;
  /* Keep the browser chrome (mobile address bar) in step with the page */
  if (themeColor) themeColor.content = theme === "dark" ? "#0d0d0f" : "#fbfaf8";
}

document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* private mode: the choice just does not survive the tab */
  }
});

/* Follow the OS while the visitor has not expressed a preference of their own */
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch {
    /* ignore */
  }
  if (!stored) html.removeAttribute("data-theme");
});

/* --------------------------------------------------------- mobile nav */

/* The section list behind a button, for the widths the header cannot fit it.
   The button ships `hidden`, so this block is also what makes it exist: a
   visitor with no JS keeps a header of two working links and no dead control.

   The links are plain anchors and stay plain anchors - closing the panel is
   all that happens here, the jump is the browser's. */
const navToggle = document.getElementById("nav-toggle");
const mobileNav = document.getElementById("mobile-nav");

if (navToggle && mobileNav) {
  navToggle.hidden = false;

  const setNavOpen = (open: boolean) => {
    navToggle.setAttribute("aria-expanded", String(open));
    mobileNav.hidden = !open;
  };

  const navIsOpen = () => navToggle.getAttribute("aria-expanded") === "true";

  navToggle.addEventListener("click", () => setNavOpen(!navIsOpen()));

  mobileNav.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) setNavOpen(false);
  });

  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !navIsOpen()) return;
    setNavOpen(false);
    navToggle.focus();
  });

  /* Anywhere else on the page dismisses it, the way any other menu behaves */
  addEventListener("pointerdown", (e) => {
    const target = e.target as Node;
    if (!navIsOpen() || mobileNav.contains(target) || navToggle.contains(target)) return;
    setNavOpen(false);
  });

  /* Widen past the breakpoint and the inline nav is back; leaving the panel
     open would hide it behind a button that CSS has already taken away. */
  matchMedia("(min-width: 941px)").addEventListener("change", (e) => {
    if (e.matches) setNavOpen(false);
  });
}

/* ----------------------------------------------- progress + nav + header */

const header = document.getElementById("site-header");
const progress = document.getElementById("progress");
const navLinks = [...document.querySelectorAll<HTMLAnchorElement>("[data-nav-for]")];
const targets = navLinks
  .map((link) => ({ link, section: document.getElementById(link.dataset.navFor as string) }))
  .filter((t): t is { link: HTMLAnchorElement; section: HTMLElement } => !!t.section)
  /* Sorted by where the sections actually are, not by the order the nav lists
     them: the "last one above the line" scan below is only correct on a list in
     document order, and a nav that ever disagrees would otherwise highlight a
     neighbouring section instead of failing visibly. */
  .sort((a, b) =>
    a.section.compareDocumentPosition(b.section) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  );

let activeId = "";

function setActive(id: string) {
  if (id === activeId) return;
  activeId = id;
  for (const { link } of targets) {
    const on = link.dataset.navFor === id;
    /* aria-current carries the state; the styling hangs off the same attribute
       so there is no second source of truth. */
    if (on) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  }
}

function onScroll() {
  const y = window.scrollY;

  if (header) header.dataset.stuck = String(y > 8);

  if (progress) {
    const reach = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty("--progress", String(reach > 0 ? Math.min(y / reach, 1) : 0));
  }

  if (targets.length) {
    /* The section under the header line is the one being read. Scanning from
       the bottom means the last section still counts when the page cannot
       scroll far enough to put it at the top.

       The line sits below where an anchor jump parks a section (html's
       scroll-padding-top, header + 12px), so clicking a nav link always lands
       inside the section it just highlighted. */
    const line = (header?.offsetHeight ?? 0) + 56;
    let current = targets[0].link.dataset.navFor as string;
    for (const { link, section } of targets) {
      if (section.getBoundingClientRect().top <= line) current = link.dataset.navFor as string;
    }
    /* Above the first section (the hero) nothing is current */
    setActive(targets[0].section.getBoundingClientRect().top > line ? "" : current);
  }
}

let ticking = false;
function requestScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    onScroll();
  });
}

addEventListener("scroll", requestScroll, { passive: true });
addEventListener("resize", requestScroll, { passive: true });
onScroll();

/* ----------------------------------------------------------------- reveal */

const revealables = [...document.querySelectorAll<HTMLElement>(".reveal")];

function revealAll() {
  for (const el of revealables) el.classList.add("is-in", "is-done");
}

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealAll();
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add("is-in");
        observer.unobserve(el);
        /* Drop the compositor hint once the transition has actually finished */
        el.addEventListener("transitionend", () => el.classList.add("is-done"), { once: true });
      }
    },
    /* Start a little before the element reaches the fold, so the motion reads
       as the page settling rather than as content popping in late. */
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );

  for (const el of revealables) observer.observe(el);

  /* Anything already on screen at load animates immediately - the observer
     fires for those on its first pass, so nothing extra is needed here. */
}
