const fs = require('fs');
const terms = require('./data/terms.json');

const baseUrl = 'https://coin-exchange.cz/#/term/';

const termUrls = terms.map(term => `
  <url>
    <loc>${baseUrl}${term.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
  </url>
`).join('');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://coin-exchange.cz/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${termUrls}
</urlset>`;

fs.writeFileSync('./public/sitemap.xml', sitemap);
console.log('Sitemap generated!');