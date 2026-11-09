// Gera os PNGs do app a partir de public/icon.svg (usa o Chromium do Playwright).
// Uso: npm run icones
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
const saidas = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0 },
  // maskable: desenho reduzido para caber na zona segura (80%)
  { file: 'icon-maskable-512.png', size: 512, pad: 0.12 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, pad } of saidas) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  await page.setContent(`<html><body style="margin:0;background:#0E1014;display:grid;place-items:center;height:${size}px">
    <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname });
  console.log('gerado', file);
}
await browser.close();
