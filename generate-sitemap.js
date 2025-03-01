const fs = require('fs');
const terms = require('./data/terms.json');

// !!! ZMĚŇTE NA SVOJE URL !!!
const BASE_URL = 'https://ylohnitram.github.io/crypto-slang/';

const generateSlug = (term) => {
  return term.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // odstraní diakritiku
    .replace(/\s+/g, '-') // mezery na pomlčky
    .replace(/[^a-z0-9-]/g, ''); // odstraní speciální znaky
};

const urls = terms.map(term => {
  const slug = generateSlug(term.term);
  return `
  <url>
    <loc>${BASE_URL}#/term/${slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
  </url>`;
}).join('');

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
