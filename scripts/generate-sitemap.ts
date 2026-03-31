import fs from "node:fs";
import path from "node:path";
import results from "../src/data/results.json";

const SITE_URL = "https://shirosato-tt-2026.teraren.com";
const TODAY = new Date().toISOString().split("T")[0];

interface Result {
  no: number;
}

const athletes = results as Result[];

const urls = [
  `  <url>\n    <loc>${SITE_URL}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>1.0</priority>\n  </url>`,
  ...athletes.map(
    (a) =>
      `  <url>\n    <loc>${SITE_URL}/athletes/${a.no}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>0.5</priority>\n  </url>`,
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

const outDir = path.join(__dirname, "../out");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(path.join(outDir, "sitemap.xml"), xml);
console.log(`Sitemap generated: ${athletes.length + 1} URLs`);
