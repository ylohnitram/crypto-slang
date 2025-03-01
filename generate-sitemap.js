const fs = require('fs');
const terms = require('./data/terms.json');

// !!! ZMĚŇTE NA SVOJI URL !!!
const BASE_URL = 'https://ylohnitram.github.io/crypto-slang/'; 

const urls = terms.map(term => `
  <url>
    <loc>${BASE_URL}#/term/${term.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
  </url>
`).join('');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${urls}
</urlset>`;

fs.writeFileSync('./sitemap.xml', sitemap);
console.log('✅ Sitemap generated!');
