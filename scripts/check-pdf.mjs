import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readPdfFacts, DEFAULT_PDF } from "./pdf-facts.mjs";

/* Does _site/cv.pdf still say everything src/data/resume.js says?
 *
 * cv.pdf IS the site - the homepage renders this exact file - so a build that
 * paginated a section away produces a perfectly valid PDF that is simply
 * missing part of the CV (spec Part B, traps B4.7/B4.9). Page count alone does
 * not catch that, which is why the deploy workflow gates on this script.
 *
 *   node scripts/check-pdf.mjs [file]   human-readable, exit 1 on any failure
 *   node scripts/check-pdf.mjs --json   the same results as JSON
 *   node scripts/check-pdf.mjs --expect what resume.js says to expect
 *
 * scripts/check_view.py reads the last two: single source of truth for
 * "what the CV contains", asserted the same way in CI and in the full check.
 */
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
/* The very file the site renders - plain ESM so this script needs no build step */
const resume = (await import(pathToFileURL(path.join(ROOT, "src/data/resume.js")).href)).default;

/* Awards and labels are matched against PDF text, where a line wrap joins two
   words with no space ("Can ThoUniversity"). Comparing a 30-char prefix keeps
   the assertion inside one rendered line. */
const MATCH_LEN = 30;

export function expectedFromResume(r = resume) {
  const keys = ["summary", "education", "experience", "projects", "writing", "awards", "skills"];
  const has = (k) => (k === "summary" ? !!r.summary : r[k].length);

  const urls = new Set();
  r.meta.contacts.forEach((c) => c.href && urls.add(c.href));
  r.projects.forEach((p) => p.link && urls.add(p.link));
  /* plus every URL written inside the content - the autolink filter turns each
     one into a real PDF link annotation. `web` is skipped: it is the web
     resume's own framing (profile links, stats) and never reaches the paper. */
  const { web, ...paper } = r;
  JSON.stringify(paper).replace(/https?:\/\/[^\s"'<>\\]+/g, (u) => urls.add(u));

  return {
    awards: r.awards.length,
    skillGroups: r.skills.length,
    entries: r.education.length + r.experience.length + r.projects.length + r.writing.length,
    titles: keys.filter(has).length + (r.languages.length || r.interests.length ? 1 : 0),
    awardNames: r.awards.map((a) => a.name.slice(0, MATCH_LEN)),
    labels: keys.filter(has).map((k) => r.labels[k]),
    urls: [...urls],
    /* Not used by the PDF assertions - scripts/check_view.py reads these to
       check the web resume rendered one block per record, section by section
       (the PDF is one continuous document, so it only needs the totals above). */
    sections: {
      experience: r.experience.length,
      projects: r.projects.length,
      skills: r.skills.length,
      writing: r.writing.length,
      awards: r.awards.length,
      education: r.education.length
    },
    webLinks: r.web.links.map((l) => l.href)
  };
}

export function assertPdf(pdf, expected = expectedFromResume()) {
  const results = [];
  const check = (label, ok, detail = "") => results.push({ label, ok: !!ok, detail });
  const text = pdf.text.join("").toLowerCase();

  check("pdf has pages", pdf.pages >= 1, `pages=${pdf.pages}`);
  for (const name of expected.awardNames) {
    check(`pdf contains award '${name.slice(0, 24)}'`, text.includes(name.toLowerCase()));
  }
  for (const label of expected.labels) {
    check(`pdf contains section label '${label}'`, text.includes(label.toLowerCase()));
  }

  const missingNumbers = pdf.text
    .map((t, i) => (t.trimEnd().endsWith(`${i + 1} / ${pdf.pages}`) ? null : i + 1))
    .filter(Boolean);
  check("every page is numbered 'i / N'", !missingNumbers.length, `pages=${missingNumbers}`);

  const found = new Set(pdf.links.flat().map((u) => u.replace(/\/$/, "")));
  const missing = expected.urls.filter((u) => !found.has(u.replace(/\/$/, "")));
  check("every CV url is a clickable pdf link", !missing.length, String(missing));

  return results;
}

const [flag, ...rest] = process.argv.slice(2);

if (flag === "--expect") {
  console.log(JSON.stringify(expectedFromResume()));
} else {
  const file = (flag && !flag.startsWith("--") ? flag : rest[0]) || DEFAULT_PDF;
  let pdf;
  try {
    pdf = await readPdfFacts(file);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  const results = assertPdf(pdf);
  const failed = results.filter((r) => !r.ok);

  if (flag === "--json") {
    console.log(JSON.stringify(results));
  } else {
    for (const r of results) {
      console.log(`  [${r.ok ? "PASS" : "FAIL"}] ${r.label}${r.detail ? ` - ${r.detail}` : ""}`);
    }
    console.log(
      failed.length
        ? `cv.pdf: ${failed.length} check(s) failed - the PDF does not match src/data/resume.js`
        : `cv.pdf: ${pdf.pages} pages, ${pdf.links.flat().length} links, all checks passed`
    );
  }
  if (failed.length) process.exit(1);
}
