const fs = require("node:fs");
const path = require("node:path");

/* Gộp @font-face của @fontsource/inter: chỉ subset vietnamese + latin (không
   latin-ext), bỏ fallback .woff (chỉ giữ woff2), url tuyệt đối để paged.js
   polisher inline CSS không rebase sai đường dẫn. */
function buildInterCss() {
  const pkg = path.join("node_modules", "@fontsource", "inter");
  return ["400.css", "700.css"]
    .flatMap((f) => fs.readFileSync(path.join(pkg, f), "utf8").match(/@font-face\s*{[^}]*}/g) || [])
    .filter((block) => /inter-(vietnamese|latin)-\d+-normal\.woff2/.test(block))
    .map((block) =>
      block
        .replace(/,?\s*url\([^)]*\.woff\)\s*format\('woff'\)/g, "")
        .replace(/url\(\.\/files\//g, "url(/fonts/files/")
    )
    .join("\n");
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });

  /* File PDF sinh bởi scripts/build-pdf.mjs — passthrough để không mất khi rebuild */
  eleventyConfig.addPassthroughCopy({ "src/cv.pdf": "cv.pdf" });

  eleventyConfig.on("eleventy.after", () => {
    /* Self-host paged.js (npm dependency) → _site/vendor */
    fs.mkdirSync(path.join("_site", "vendor"), { recursive: true });
    fs.copyFileSync(
      path.join("node_modules", "pagedjs", "dist", "paged.polyfill.js"),
      path.join("_site", "vendor", "paged.polyfill.js")
    );

    /* Self-host Inter (npm @fontsource) → _site/fonts, chỉ subset vietnamese + latin, weight 400/700 */
    const srcFiles = path.join("node_modules", "@fontsource", "inter", "files");
    const destFiles = path.join("_site", "fonts", "files");
    fs.mkdirSync(destFiles, { recursive: true });
    fs.readdirSync(srcFiles)
      .filter((f) => /^inter-(vietnamese|latin)-(400|700)-normal\.woff2$/.test(f))
      .forEach((f) => fs.copyFileSync(path.join(srcFiles, f), path.join(destFiles, f)));
    fs.writeFileSync(path.join("_site", "fonts", "inter.css"), buildInterCss());
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
