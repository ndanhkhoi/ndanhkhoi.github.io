/* Turn the bare URLs written inside CV content into real links.
 *
 * Used with `set:html` from both renderings, so a URL in a bullet is clickable
 * on the web page, in /print.html, and - via Chrome's printer - as a real link
 * annotation inside cv.pdf. scripts/check-pdf.mjs asserts that last part.
 *
 * The input is escaped first: the output is injected as raw HTML, so content is
 * never allowed to carry markup of its own.
 *
 * target="_blank" rel="noopener" is a project-wide rule - every link on this
 * site opens in a new tab.
 */

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

export function autolink(value: string): string {
  if (!value) return "";
  return escapeHtml(value).replace(
    /(https?:\/\/[^\s"'<>]+)/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
  );
}
