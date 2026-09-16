import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const sitemap = new JSDOM(await readFile('dist/sitemap.xml', 'utf8'), { contentType: 'text/xml' });
const urls = [...sitemap.window.document.querySelectorAll('loc')].map((node) => node.textContent);
assert.equal(urls.length, 12);
for (const category of ['residential', 'commercial', 'hospitality']) {
  assert.ok(urls.includes(`https://areliaspace.com/services/${category}/`), `Missing service category: ${category}`);
}
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
  if (/^\/services\/(residential|commercial|hospitality)\/$/.test(pathname)) {
    const category = pathname.split('/')[2];
    assert.equal(doc.querySelectorAll(`a[href="/about-us?work=${category}#our-finest-work"]`).length, 0, `Removed return link remains: ${url}`);
    assert.ok(!doc.querySelector('.service-detail__related'), `Old category navigation remains: ${url}`);
    const cards = [...doc.querySelectorAll('.service-detail__card')];
    assert.equal(cards.length, 6, `Missing service cards: ${url}`);
    for (const card of cards) {
      const image = card.querySelector('img');
      assert.ok(image?.getAttribute('alt'), `Missing service image: ${url}`);
      const bytes = await readFile(`dist${image.getAttribute('src')}`);
      assert.ok(bytes.length < 100_000, `Service image exceeds 100 KB: ${image.getAttribute('src')}`);
    }
  }
  if (pathname === '/about-us/') {
    assert.ok(doc.querySelector('#our-finest-work'), 'Missing showcase return anchor');
  }
  if (pathname === '/services/') {
    for (const category of ['residential', 'commercial', 'hospitality']) {
      assert.ok(doc.querySelector(`a[href="/services/${category}"]`), `Missing View more link: ${category}`);
    }
  }
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
console.log('SEO checks passed: 12 public pages, unique metadata, content, images, sitemap and noindex account/404 pages.');
