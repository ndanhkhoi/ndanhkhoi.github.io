/* The CV homepage: pdf.js's own viewer, pointed at the PDF the build printed.
 *
 * The site does not typeset the CV in the browser. The build paginates it once
 * (/print.html) and prints it to /cv.pdf; this module renders that exact file.
 * See docs/A4_PRINT_VIEW_SPEC.md Part B.
 *
 * Wiring follows pdf.js's own examples/components/simpleviewer.mjs: PDFViewer
 * owns page management, scrolling, zoom, the text layer and the annotation
 * layer, so none of that is reimplemented here. What this file adds is the
 * toolbar around it - pdfjs-dist ships the viewer *components*, not the
 * complete viewer UI from the online demo (that one lives only in the GitHub
 * release zip, unminified).
 *
 * IMPORT ORDER IS LOAD-BEARING: pdf_viewer.mjs has no imports of its own - it
 * reads globalThis.pdfjsLib, which pdf.min.mjs sets as a side effect. Static
 * imports evaluate in source order, so the core must be listed first.
 */

import * as pdfjsLib from "/vendor/pdfjs/pdf.min.mjs";
import {
  EventBus,
  LinkTarget,
  PDFLinkService,
  PDFViewer,
} from "/vendor/pdfjs/pdf_viewer.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";

const PDF_URL = "/cv.pdf";
const FALLBACK_URL = "/print.html";
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

const $ = (id) => document.getElementById(id);
const container = $("viewerContainer");
const status = $("pv-status");

/* -------------------------------------------------------------------- boot */

const eventBus = new EventBus();
/* Every link in the CV must open in a new tab (project rule) - the annotation
   layer honours this, so it applies to the PDF's links too. */
const linkService = new PDFLinkService({
  eventBus,
  externalLinkTarget: LinkTarget.BLANK,
  externalLinkRel: "noopener",
});
/* No PDFFindController: it only drives a find bar, and this page has none.
   Native Ctrl/Cmd+F still works on the text layer of the rendered pages. */
const pdfViewer = new PDFViewer({
  container,
  viewer: $("viewer"),
  eventBus,
  linkService,
});
linkService.setViewer(pdfViewer);

function showError(message) {
  if (!status) return;
  status.replaceChildren();
  const p = document.createElement("p");
  p.textContent = message;
  const a = document.createElement("a");
  a.href = FALLBACK_URL;
  a.textContent = "Open the HTML version instead";
  status.append(p, a);
  status.hidden = false;
}

/* ----------------------------------------------------------------- toolbar */

const pageInput = $("pageNumber");
const pageTotal = $("numPages");
const zoomSelect = $("zoomSelect");

function syncPage(n) {
  if (document.activeElement !== pageInput) pageInput.value = String(n);
  $("previous").disabled = n <= 1;
  $("next").disabled = n >= pdfViewer.pagesCount;
}

function syncZoom() {
  const value = pdfViewer.currentScaleValue;
  /* A named zoom ("auto", "page-width") stays selected as itself; a numeric one
     only matches an entry if the user picked it, so show the real percentage. */
  const named = [...zoomSelect.options].some((o) => o.value === value);
  zoomSelect.value = named ? value : "custom";
  const custom = zoomSelect.options[zoomSelect.options.length - 1];
  custom.textContent = `${Math.round(pdfViewer.currentScale * 100)}%`;
  $("zoomOut").disabled = pdfViewer.currentScale <= MIN_SCALE;
  $("zoomIn").disabled = pdfViewer.currentScale >= MAX_SCALE;
}

function stepZoom(direction) {
  const current = pdfViewer.currentScale;
  const next = direction > 0
    ? ZOOM_STEPS.find((s) => s > current + 0.001)
    : [...ZOOM_STEPS].reverse().find((s) => s < current - 0.001);
  if (next) pdfViewer.currentScaleValue = String(next);
}

/* Print the real file rather than the rendered canvases: an off-screen iframe
   hands cv.pdf to the browser's own PDF print path. Engines that refuse to
   print a framed PDF fall back to opening it, where their viewer takes over. */
function printPdf() {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;";
  frame.src = PDF_URL;
  frame.onload = () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch {
      window.open(PDF_URL, "_blank", "noopener");
    }
  };
  frame.onerror = () => window.open(PDF_URL, "_blank", "noopener");
  document.body.append(frame);
}

function wireToolbar() {
  $("previous").addEventListener("click", () => pdfViewer.previousPage());
  $("next").addEventListener("click", () => pdfViewer.nextPage());
  $("zoomIn").addEventListener("click", () => stepZoom(1));
  $("zoomOut").addEventListener("click", () => stepZoom(-1));
  $("print").addEventListener("click", printPdf);

  zoomSelect.addEventListener("change", () => {
    if (zoomSelect.value !== "custom") pdfViewer.currentScaleValue = zoomSelect.value;
  });

  const goToPage = () => {
    const n = Number(pageInput.value);
    if (Number.isInteger(n) && n >= 1 && n <= pdfViewer.pagesCount) pdfViewer.currentPageNumber = n;
    else syncPage(pdfViewer.currentPageNumber);
  };
  pageInput.addEventListener("change", goToPage);
  pageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { goToPage(); pageInput.blur(); }
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { pdfViewer.nextPage(); e.preventDefault(); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { pdfViewer.previousPage(); e.preventDefault(); }
  });
}

/* ------------------------------------------------------------------- events */

eventBus.on("pagesinit", () => {
  /* "auto" is what the pdf.js viewer itself defaults to: page-width on a phone,
     capped around 125% on a wide screen so an A4 sheet never fills a desktop. */
  pdfViewer.currentScaleValue = "auto";
  syncZoom();
  /* Only now does pagesCount exist. Syncing the toolbar any earlier compares
     against 0 and leaves "next page" disabled until the reader scrolls. */
  syncPage(pdfViewer.currentPageNumber);
});

eventBus.on("pagechanging", (e) => syncPage(e.pageNumber));
eventBus.on("scalechanging", syncZoom);

/* Readiness = every page laid out, NOT every page painted. PDFViewer renders
   lazily: on a desktop viewport only the pages near the viewport get a canvas,
   so waiting for pagesCount canvases would hang forever there (it only passed
   on a phone, where the whole document happens to fit). "pagesloaded" is the
   viewer's own "document is up" event - what scripts/check_view.py waits on. */
eventBus.on("pagesloaded", (e) => {
  document.documentElement.dataset.pvReady = String(e.pagesCount);
});

/* The viewer only lays pages out when its container has a size; a resize
   changes what "auto"/"page-width" mean, so recompute rather than stretch. */
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!pdfViewer.pdfDocument) return;
    const value = pdfViewer.currentScaleValue;
    if (["auto", "page-width", "page-fit", "page-actual"].includes(value)) {
      pdfViewer.currentScaleValue = value; /* re-evaluates against the new width */
    }
    pdfViewer.update();
  }, 150);
});

/* -------------------------------------------------------------------- main */

async function main() {
  let doc;
  try {
    /* No cMapUrl/standardFontDataUrl: cv.pdf comes out of Chrome's own printer,
       which embeds every font it draws with (eleventy.config.js). */
    doc = await pdfjsLib.getDocument({ url: PDF_URL }).promise;
  } catch (err) {
    console.error(err);
    showError("The CV file could not be loaded.");
    return;
  }

  pdfViewer.setDocument(doc);
  linkService.setDocument(doc, null);

  pageTotal.textContent = `of ${doc.numPages}`;
  pageInput.max = String(doc.numPages);
  $("download").setAttribute("download", document.body.dataset.pdfName || "cv.pdf");
  wireToolbar();

  status?.remove();
  document.body.classList.add("pv-loaded");
}

main();
