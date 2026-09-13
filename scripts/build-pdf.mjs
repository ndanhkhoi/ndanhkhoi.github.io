import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

/* Build _site/cv.pdf from _site/print.html - the DOM paged.js split into A4
   sheets. That PDF is the site: the homepage renders it with pdf.js, so this
   file is what every visitor sees and downloads. */
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = path.join(ROOT, "_site");
const SOURCE = "/print.html";
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf"
};

if (!fs.existsSync(path.join(SITE, "print.html"))) {
  console.error("_site/print.html not found - run `npm run build:html` first.");
  process.exit(1);
}

/* Tiny static server for _site (paged.js must load CSS over http; file:// is blocked) */
const server = http.createServer((req, res) => {
  let p;
  try {
    p = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (p === "/") p = "/index.html";
  const file = path.join(SITE, p);
  if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 }); /* wide viewport → sheets at 100% */
  await page.goto(`http://127.0.0.1:${port}${SOURCE}`, { waitUntil: "networkidle0" });

  /* Paged.js advances its chunker one animation frame at a time. A browser that
     produces none - which a loaded machine's compositor can do, transiently -
     leaves it set up and idle: no sheets, no error, and the wait below simply
     times out with nothing to read. Name that failure instead of letting it
     look like a problem with the document (spec Part B, trap B4.20). */
  const frames = await page.evaluate(async () => {
    let n = 0;
    const tick = () => { n++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return n;
  });
  if (frames === 0) {
    throw new Error(
      "the browser produced no animation frames - paged.js cannot paginate.\n" +
        "This is the machine, not the CV: retry, or free it up and retry.\n" +
        "Do NOT reach for headless: 'shell' - it paginates but splits the PDF's\n" +
        "text runs, so the CV stops extracting cleanly (spec trap B4.20)."
    );
  }

  /* The boot script stamps data-paged-ready only after the page count has been
     stable for three polls and every sheet carries its number - printing before
     that bakes a half-finished pagination into the PDF. */
  await page.waitForFunction(
    () => {
      const ready = document.documentElement.getAttribute("data-paged-ready");
      const pages = document.querySelectorAll(".pagedjs_page");
      return (
        ready !== null &&
        Number(ready) === pages.length &&
        pages.length > 0 &&
        document.querySelectorAll(".preview-page-number").length === pages.length
      );
    },
    { timeout: 60000 }
  );

  const out = path.join(SITE, "cv.pdf");
  await page.pdf({
    path: out,
    printBackground: true,
    preferCSSPageSize: true,
    timeout: 60000
  });

  /* `astro dev` serves public/, not _site, so mirror the file there too -
     otherwise every "Download CV" link 404s during development. public/ is
     generated and gitignored; the build always overwrites this copy. */
  fs.mkdirSync(path.join(ROOT, "public"), { recursive: true });
  fs.copyFileSync(out, path.join(ROOT, "public", "cv.pdf"));

  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`cv.pdf written (${kb} KB)`);
} finally {
  await browser.close();
  server.close();
}
