import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

/* Build the PDF from _site/index.html - prints the exact DOM paginated by paged.js */
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = path.join(ROOT, "_site");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf"
};

if (!fs.existsSync(path.join(SITE, "index.html"))) {
  console.error("_site/index.html not found - run `npm run build` first.");
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
  await page.setViewport({ width: 1200, height: 900 }); /* wide viewport → zoom = 1 */
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle0" });

  /* Wait for paged.js pagination to stabilize + page numbers stamped (boot script done) */
  await page.waitForFunction(
    () => {
      const pages = document.querySelectorAll(".pagedjs_page");
      return (
        pages.length > 0 &&
        document.querySelectorAll(".preview-page-number").length === pages.length
      );
    },
    { timeout: 60000 }
  );
  await new Promise((r) => setTimeout(r, 500));

  const out = path.join(SITE, "cv.pdf");
  await page.pdf({
    path: out,
    printBackground: true,
    preferCSSPageSize: true,
    timeout: 60000
  });

  /* Also copy into src/cv.pdf so the passthrough copy runs on every eleventy
     rebuild (eleventy wipes _site on build → the file survives during dev) */
  fs.copyFileSync(out, path.join(ROOT, "src", "cv.pdf"));

  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`cv.pdf written (${kb} KB)`);
} finally {
  await browser.close();
  server.close();
}
