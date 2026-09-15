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

/* -------------------------------------------------------------- CV menu */

/* The header button is a plain link to /cv.pdf, so with no JS it behaves
   exactly as it always did. Here it grows a second option (the HTML copy)
   behind a menu; clicking the button itself is intercepted so it opens that
   menu instead of navigating. */
const cvToggle = document.getElementById("cv-menu-toggle");
const cvMenu = document.getElementById("cv-menu");

if (cvToggle && cvMenu) {
  cvMenu.dataset.ready = "1";

  const cvIsOpen = () => cvToggle.getAttribute("aria-expanded") === "true";

  const setCvOpen = (open: boolean) => {
    cvToggle.setAttribute("aria-expanded", String(open));
    cvMenu.classList.toggle("is-open", open);
  };

  cvToggle.addEventListener("click", (e) => {
    e.preventDefault();
    setCvOpen(!cvIsOpen());
  });

  cvMenu.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) setCvOpen(false);
  });

  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !cvIsOpen()) return;
    setCvOpen(false);
    cvToggle.focus();
  });

  addEventListener("pointerdown", (e) => {
    const target = e.target as Node;
    if (!cvIsOpen() || cvMenu.contains(target) || cvToggle.contains(target)) return;
    setCvOpen(false);
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

/* The section the reader picked from the nav, held until they scroll.
   `pinArrived` marks the jump as finished: until the page actually gets there,
   the position still reads as wherever the click started from - usually the
   hero - and the rules below must not mistake that for the reader being back
   at the top. */
let pinned = "";
let pinArrived = false;

function onScroll() {
  const y = window.scrollY;
  const reach = document.documentElement.scrollHeight - window.innerHeight;

  if (header) header.dataset.stuck = String(y > 8);

  if (progress) {
    progress.style.setProperty("--progress", String(reach > 0 ? Math.min(y / reach, 1) : 0));
  }

  if (targets.length) {
    /* The section under the reading line is the one being read.

       The line normally sits just below where an anchor jump parks a section
       (html's scroll-padding-top, header + 12px), so clicking a nav link lands
       inside the section it highlights. But the document ends: the last
       sections can never be scrolled up to a line near the top of the screen,
       because there is no page left underneath them to scroll. On this CV the
       awards heading stops 3px short of it and the whole tail of the nav could
       never light up at all.

       So as the scroll runs out, the line falls the rest of the way down the
       screen. With the page fully scrolled it rests at the foot of the
       viewport, where "the last section that has begun" is the honest answer
       to what is being read. Above that stretch it does not move. */
    const baseline = (header?.offsetHeight ?? 0) + 56;

    if (pinned && !pinArrived) {
      /* Still travelling to the section that was clicked. Landed once it
         reaches the top of the screen, or once the page runs out of scroll
         trying - the tail sections never make it all the way up. */
      const target = targets.find((t) => t.link.dataset.navFor === pinned);
      if (!target || target.section.getBoundingClientRect().top <= baseline + 2 || y >= reach - 2)
        pinArrived = true;
    }

    if (targets[0].section.getBoundingClientRect().top > baseline && (!pinned || pinArrived)) {
      /* Above the first section - the hero - nothing is being read, whichever
         link was clicked to get here. That outranks a pin that has landed: a
         reader who is back at the top has left the section they chose. */
      pinned = "";
      setActive("");
    } else if (!pinned) {
      /* A nav link the reader just chose outranks anything the geometry says,
         until they scroll for themselves - see the pin below. */
      const runway = window.innerHeight - baseline;
      const left = Math.max(reach - y, 0);
      const line = left < runway ? baseline + (runway - left) : baseline;

      let current = targets[0].link.dataset.navFor as string;
      for (const { link, section } of targets) {
        if (section.getBoundingClientRect().top <= line) current = link.dataset.navFor as string;
      }
      setActive(current);
    }
  }
}

/* Choosing a section from the nav says which one you mean more plainly than any
   measurement can, and it is the case the geometry handles worst: every link in
   the tail of the nav scrolls to the very bottom of the page, landing on the
   same screen, so without this they would all report the same section. The pin
   holds the reader's choice until they scroll themselves - wheel, touch and the
   scrolling keys are user input; the smooth scroll the click starts is not. */
for (const { link } of targets) {
  link.addEventListener("click", () => {
    pinned = link.dataset.navFor as string;
    pinArrived = false;
    setActive(pinned);
  });
}

const SCROLL_KEYS = new Set([
  "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ",
]);

function unpin() {
  pinned = "";
}

addEventListener("wheel", unpin, { passive: true });
addEventListener("touchmove", unpin, { passive: true });
addEventListener("keydown", (e) => {
  if (SCROLL_KEYS.has(e.key)) unpin();
}, { passive: true });

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
