import fs from "node:fs/promises";
import path from "node:path";
import {
  buildAbsoluteUrl,
  getSitemapRoutes,
} from "../src/seo/seoConfig.js";

const today = new Date().toISOString().slice(0, 10);
const routes = getSitemapRoutes();

const urlEntries = routes
  .map((route) => {
    const loc = buildAbsoluteUrl(route.path);
    const changefreq = route.changefreq || "weekly";
    const priority = route.priority || "0.5";
    const lastmod = route.lastmod || today;

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

const outputPath = path.resolve(process.cwd(), "public", "sitemap.xml");
await fs.writeFile(outputPath, sitemap, "utf8");

console.log(`Generated sitemap: ${outputPath}`);
