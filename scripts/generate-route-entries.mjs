import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';

const distDir = path.resolve('dist');
const template = await readFile(path.join(distDir, 'index.html'), 'utf8');
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { publicPages, applyPageMetadata, siteUrl } = await server.ssrLoadModule('/src/seo/metadata.ts');
  const { renderPage } = await server.ssrLoadModule('/src/seo/prerender.tsx');
  for (const route of [...Object.keys(publicPages), '/login', '/dashboard', '/404']) {
    const dom = new JSDOM(template);
    const { document } = dom.window;
    applyPageMetadata(document, route);
    if (publicPages[route] || route === '/404') {
      document.getElementById('root').innerHTML = renderPage(route);
      // Make animation entry states readable before JS mounts the live app.
      document.querySelectorAll('#root [style]').forEach((element) => {
        if (element.style.opacity === '0') {
          element.style.opacity = '1';
          element.style.removeProperty('transform');
          element.style.removeProperty('filter');
        }
      });
    }
    if (!publicPages[route]) document.querySelector('script[type="application/ld+json"]')?.remove();
    const output = route === '/404' ? path.join(distDir, '404.html') : path.join(distDir, route.slice(1), 'index.html');
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, dom.serialize());
    dom.window.close();
  }
  const urls = Object.keys(publicPages).map((route) => `${siteUrl}${route === '/' ? '/' : `${route}/`}`);
  await writeFile(path.join(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`);
  await writeFile(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Prerendered ${urls.length} public pages; generated sitemap, robots.txt and account metadata.`);
} finally {
  await server.close();
}
