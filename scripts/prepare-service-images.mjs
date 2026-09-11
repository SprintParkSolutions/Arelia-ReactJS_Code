import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Manifest entries: { name, source, prompt }. Originals are kept outside public/.
const manifestPath = process.argv[2];
if (!manifestPath) throw new Error('Pass a JSON image manifest path.');
const entries = JSON.parse(await readFile(manifestPath, 'utf8'));
const outputDir = path.resolve('public/images/ServiceConcepts');
await mkdir(outputDir, { recursive: true });
const report = [];
for (const entry of entries) {
  if (!/^(residential|commercial|hospitality)-[a-z]+$/.test(entry.name)) throw new Error('Invalid image name');
  let buffer;
  let quality = 84;
  do {
    buffer = await sharp(entry.source).resize(960, 640, { fit: 'cover' }).webp({ quality, effort: 6 }).toBuffer();
    if (buffer.length < 100_000) break;
    quality -= 4;
  } while (quality >= 40);
  if (buffer.length >= 100_000) throw new Error(`${entry.name} exceeds 100 KB`);
  const filename = `${entry.name}-v1.webp`;
  await writeFile(path.join(outputDir, filename), buffer);
  report.push({ file: `/images/ServiceConcepts/${filename}`, bytes: buffer.length, width: 960, height: 640, quality, prompt: entry.prompt });
}
await mkdir('docs', { recursive: true });
await writeFile('docs/service-concept-images.json', JSON.stringify({ generator: 'Built-in image_gen tool', purpose: 'Illustrative interior design concepts for service pages', images: report }, null, 2) + '\n');
console.log(JSON.stringify(report.map(({file, bytes}) => ({file, bytes})), null, 2));
