import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* Fill public/ with the third-party files the site self-hosts.
 *
 * Everything here comes from node_modules - never a CDN - and public/ is
 * generated, so this script runs before `astro dev` and before `astro build`
 * (see the npm scripts). Astro copies public/ into _site verbatim.
 *
 *   lib/paged.polyfill.js  paginates /print.html, the page cv.pdf is printed from
 *   fonts/*                the two typefaces, below
 *
 * A PDF renderer is deliberately NOT here: the site links cv.pdf and lets the
 * browser open it in a tab of its own. pdfjs-dist stays a devDependency only
 * because scripts/pdf-facts.mjs reads the built PDF back with it.
 */
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC = path.join(ROOT, "public");
const nm = (...p) => path.join(ROOT, "node_modules", ...p);

/* Inter sets everything on both renderings; 400/700 are what the A4 document
   needs, 500/600 exist for the web resume's UI type.

   Instrument Serif sets the two display moments on the web resume - the name
   and the section titles - and nothing else. It is a display face with a single
   weight, which is the point: it is never asked to carry body text, so it never
   needs a bold. It ships latin + latin-ext only (no vietnamese subset), which
   covers the English section labels and the romanised name; anything outside
   that falls back to Inter, which does carry vietnamese. */
const FACES = [
  { pkg: "inter", family: "Inter", weights: ["400", "500", "600", "700"], subsets: ["vietnamese", "latin"] },
  { pkg: "instrument-serif", family: "Instrument Serif", weights: ["400"], subsets: ["latin-ext", "latin"] },
];

/* The exact files a face ships, named the way @fontsource names them. Both the
   copy step and the CSS filter work off this one list: a subset whose rule
   survives into fonts.css but whose file was never copied is a 404 the moment a
   reader types a character in its unicode-range. ("latin" is a prefix of
   "latin-ext", so matching on the subset name alone is not enough.) */
const filesFor = ({ pkg, subsets, weights }) =>
  subsets.flatMap((sub) => weights.map((w) => `${pkg}-${sub}-${w}-normal.woff2`));

/* Merge the @fontsource @font-face rules for the files we ship: drop the .woff
   fallback (woff2 only) and rewrite the urls to absolute paths so the paged.js
   polisher doesn't rebase them when it inlines CSS. */
function buildFontCss() {
  return FACES.flatMap((face) => {
    const wanted = filesFor(face);
    return face.weights
      .flatMap((w) => fs.readFileSync(nm("@fontsource", face.pkg, `${w}.css`), "utf8").match(/@font-face\s*{[^}]*}/g) || [])
      .filter((block) => wanted.some((file) => block.includes(file)))
      .map((block) =>
        block
          .replace(/,?\s*url\([^)]*\.woff\)\s*format\('woff'\)/g, "")
          .replace(/url\(\.\/files\//g, "url(/fonts/files/")
      );
  }).join("\n");
}

function copyFontFiles() {
  const destFiles = path.join(PUBLIC, "fonts", "files");
  fs.mkdirSync(destFiles, { recursive: true });
  let copied = 0;
  for (const face of FACES) {
    const srcFiles = nm("@fontsource", face.pkg, "files");
    for (const file of filesFor(face)) {
      const src = path.join(srcFiles, file);
      if (!fs.existsSync(src)) {
        throw new Error(`@fontsource/${face.pkg} is missing ${file} - the site would fall back mid-page.`);
      }
      fs.copyFileSync(src, path.join(destFiles, file));
      copied++;
    }
  }
  fs.writeFileSync(path.join(PUBLIC, "fonts", "fonts.css"), buildFontCss());
  return copied;
}

function copyPagedJs() {
  const out = path.join(PUBLIC, "lib");
  fs.mkdirSync(out, { recursive: true });
  const src = nm("pagedjs", "dist", "paged.polyfill.js");
  if (!fs.existsSync(src)) {
    throw new Error("pagedjs is missing dist/paged.polyfill.js - /print.html cannot paginate.");
  }
  fs.copyFileSync(src, path.join(out, "paged.polyfill.js"));
}

copyPagedJs();
console.log(`public/: paged.js + ${copyFontFiles()} font files ready`);
