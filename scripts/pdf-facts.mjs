import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

/* Read _site/cv.pdf and print what it actually contains as JSON:
   { pages, text: [...], links: [[url, ...], ...] }.
   cv.pdf is the artifact the site serves, so scripts/check_view.py asserts
   against this rather than against any DOM that produced it. */
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FILE = process.argv[2] || path.join(ROOT, "_site", "cv.pdf");

if (!fs.existsSync(FILE)) {
  console.error(`${FILE} not found - run \`npm run build\` first.`);
  process.exit(1);
}

const pdf = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(FILE)) }).promise;
const text = [];
const links = [];

for (let n = 1; n <= pdf.numPages; n++) {
  const page = await pdf.getPage(n);
  const content = await page.getTextContent();
  text.push(content.items.map((i) => i.str).join(""));
  const annotations = await page.getAnnotations({ intent: "display" });
  links.push(annotations.filter((a) => a.subtype === "Link" && a.url).map((a) => a.url));
}

console.log(JSON.stringify({ pages: pdf.numPages, text, links }));
