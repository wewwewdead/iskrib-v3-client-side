import fs from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_OG_IMAGE,
  ORGANIZATION_SCHEMA,
  buildAbsoluteUrl,
  buildWebsiteSchema,
  getPrerenderRoutes,
  getSeoForPath,
} from "../src/seo/seoConfig.js";

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const replaceOrInsert = (html, pattern, replacement) => {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace("</head>", `  ${replacement}\n  </head>`);
};

const replaceSeo = (html, pathname) => {
  const seo = getSeoForPath(pathname);
  const canonicalUrl = buildAbsoluteUrl(seo.canonicalPath || pathname);
  const ogTitle = seo.ogTitle || seo.title;
  const ogDescription = seo.ogDescription || seo.description;
  const ogImage = seo.ogImage || DEFAULT_OG_IMAGE;

  let updated = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);

  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-description["'][^>]*>/i,
    `<meta id="seo-description" name="description" content="${escapeHtml(seo.description)}" />`
  );
  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-robots["'][^>]*>/i,
    `<meta id="seo-robots" name="robots" content="${escapeHtml(seo.robots || "index,follow")}" />`
  );
  updated = replaceOrInsert(
    updated,
    /<link[^>]*id=["']seo-canonical["'][^>]*>/i,
    `<link id="seo-canonical" rel="canonical" href="${canonicalUrl}" />`
  );
  updated = replaceOrInsert(
    updated,
    /<link[^>]*id=["']seo-hreflang-en["'][^>]*>/i,
    `<link id="seo-hreflang-en" rel="alternate" hreflang="en-US" href="${canonicalUrl}" />`
  );
  updated = replaceOrInsert(
    updated,
    /<link[^>]*id=["']seo-hreflang-default["'][^>]*>/i,
    `<link id="seo-hreflang-default" rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`
  );

  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-og-type["'][^>]*>/i,
    `<meta id="seo-og-type" property="og:type" content="website" />`
  );
  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-og-url["'][^>]*>/i,
    `<meta id="seo-og-url" property="og:url" content="${canonicalUrl}" />`
  );
  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-og-title["'][^>]*>/i,
    `<meta id="seo-og-title" property="og:title" content="${escapeHtml(ogTitle)}" />`
  );
  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-og-description["'][^>]*>/i,
    `<meta id="seo-og-description" property="og:description" content="${escapeHtml(ogDescription)}" />`
  );
  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-og-image["'][^>]*>/i,
    `<meta id="seo-og-image" property="og:image" content="${ogImage}" />`
  );
  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-twitter-card["'][^>]*>/i,
    `<meta id="seo-twitter-card" name="twitter:card" content="summary_large_image" />`
  );
  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-twitter-title["'][^>]*>/i,
    `<meta id="seo-twitter-title" name="twitter:title" content="${escapeHtml(ogTitle)}" />`
  );
  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-twitter-description["'][^>]*>/i,
    `<meta id="seo-twitter-description" name="twitter:description" content="${escapeHtml(ogDescription)}" />`
  );
  updated = replaceOrInsert(
    updated,
    /<meta[^>]*id=["']seo-twitter-image["'][^>]*>/i,
    `<meta id="seo-twitter-image" name="twitter:image" content="${ogImage}" />`
  );

  const websiteSchema = JSON.stringify(buildWebsiteSchema(canonicalUrl));
  const organizationSchema = JSON.stringify(ORGANIZATION_SCHEMA);
  updated = replaceOrInsert(
    updated,
    /<script[^>]*id=["']seo-ld-website["'][^>]*>[\s\S]*?<\/script>/i,
    `<script id="seo-ld-website" type="application/ld+json">${websiteSchema}</script>`
  );
  updated = replaceOrInsert(
    updated,
    /<script[^>]*id=["']seo-ld-organization["'][^>]*>[\s\S]*?<\/script>/i,
    `<script id="seo-ld-organization" type="application/ld+json">${organizationSchema}</script>`
  );

  return updated;
};

const distRoot = path.resolve(process.cwd(), "dist");
const distIndexPath = path.join(distRoot, "index.html");
const baseHtml = await fs.readFile(distIndexPath, "utf8");

const prerenderRoutes = getPrerenderRoutes();

for (const route of prerenderRoutes) {
  const routeHtml = replaceSeo(baseHtml, route);
  const routePath = route === "/" ? "index.html" : `${route.replace(/^\//, "")}/index.html`;
  const outputPath = path.join(distRoot, routePath);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, routeHtml, "utf8");
  console.log(`Prerendered ${route} -> ${outputPath}`);
}
