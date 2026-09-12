const fs = require("node:fs");
const path = require("node:path");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });

  /* Self-host paged.js (npm dependency) → copy sang _site/vendor sau khi build */
  eleventyConfig.on("eleventy.after", () => {
    const src = "node_modules/pagedjs/dist/paged.polyfill.js";
    const destDir = path.join("_site", "vendor");
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, path.join(destDir, "paged.polyfill.js"));
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
