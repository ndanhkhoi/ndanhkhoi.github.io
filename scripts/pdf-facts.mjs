import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

/* Read _site/cv.pdf and print what it actually contains as JSON:
   { pages, text: [...], links: [[url, ...], ...] }.
   cv.pdf is the artifact the site serves, so scripts/check_view.py asserts
   against this rather than against any DOM that produced it. */
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const DEFAULT_PDF = path.join(ROOT, "_site", "cv.pdf");

/* Also imported by scripts/check-pdf.mjs, which asserts against these facts. */
export async function readPdfFacts(file = DEFAULT_PDF) {
  if (!fs.existsSync(file)) {
    throw new Error(`${file} not found - run \`npm run build\` first.`);
  }
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)) }).promise;
  const text = [];
  const links = [];

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    text.push(content.items.map((i) => i.str).join(""));
    const annotations = await page.getAnnotations({ intent: "display" });
    links.push(annotations.filter((a) => a.subtype === "Link" && a.url).map((a) => a.url));
  }

  return { pages: pdf.numPages, text, links };
}

/* CLI: print the facts as JSON. Skipped when another module imports this file. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await readPdfFacts(process.argv[2] || DEFAULT_PDF)));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
