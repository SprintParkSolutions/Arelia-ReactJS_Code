import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const sitemap = new JSDOM(await readFile('dist/sitemap.xml', 'utf8'), { contentType: 'text/xml' });
const urls = [...sitemap.window.document.querySelectorAll('loc')].map((node) => node.textContent);
assert.equal(urls.length, 9);
const titles = new Set();
for (const url of urls) {
  const pathname = new URL(url).pathname;
  const dom = new JSDOM(await readFile(`dist${pathname}index.html`, 'utf8'));
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1, url);
  assert.equal(doc.querySelector('link[rel="canonical"]').href, url);
  assert.equal(doc.querySelector('meta[name="robots"]').content, 'index, follow');
  assert.ok(doc.querySelector('meta[name="description"]').content.length > 40);
  assert.ok(!titles.has(doc.title), `Duplicate title: ${doc.title}`);
  titles.add(doc.title);
  assert.ok(doc.querySelector('#root h1'), `Missing prerendered heading: ${url}`);
  assert.ok(doc.querySelector('#root').textContent.length > 300, `Missing content: ${url}`);
  assert.ok(doc.querySelector('a[href="/contact-us"]'), `Missing crawlable contact link: ${url}`);
  const business = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
  assert.equal(business['@type'], 'LocalBusiness');
  assert.equal(business.url, 'https://areliaspace.com/');
  assert.ok(!doc.querySelector('#root [style*="opacity: 0;"]'), `Hidden entry state: ${url}`);
  for (const image of doc.querySelectorAll('img[src^="/"]')) {
    await readFile(`dist${decodeURIComponent(image.getAttribute('src'))}`);
  }
  dom.window.close();
}
for (const file of ['login/index.html', 'dashboard/index.html', '404.html']) {
  const dom = new JSDOM(await readFile(`dist/${file}`, 'utf8'));
  assert.equal(dom.window.document.querySelector('meta[name="robots"]').content, 'noindex, follow');
  assert.equal(dom.window.document.querySelector('link[rel="canonical"]'), null);
  dom.window.close();
}
assert.ok(!urls.some((url) => /login|dashboard|payment/.test(url)));
assert.ok((await readFile('dist/robots.txt', 'utf8')).includes('Sitemap: https://areliaspace.com/sitemap.xml'));
sitemap.window.close();
console.log('SEO checks passed: 9 public pages, unique metadata, content, images, sitemap and noindex account/404 pages.');
