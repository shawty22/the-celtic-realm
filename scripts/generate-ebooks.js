#!/usr/bin/env node
/**
 * Generate illustrated ebook PDFs of Lady Gregory's "Gods and Fighting Men".
 *   node scripts/generate-ebooks.js
 * Outputs:
 *   exports/celtic-realm-lady-gregory.pdf  (original text)
 *   exports/celtic-realm-modern.pdf        (modern retelling)
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'exports');
const CACHE_DIR = path.join(OUT_DIR, '.image-cache');
const ART_DIR = path.join(ROOT, 'public/assets/characters');

const sections = require(path.join(ROOT, 'src/source/gods-and-fighting-men-sections.json'));
const modern = require(path.join(ROOT, 'src/source/gods-and-fighting-men-modern.json'));
const { characters } = require(path.join(ROOT, 'src/data/characters.json'));
const chapterEntities = require(path.join(ROOT, 'src/data/chapter-entities.json'));

const modernById = Object.fromEntries(modern.map((m) => [m.id, m.body_modern]));
const charById = Object.fromEntries(characters.map((c) => [c.id, c]));

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const titleCase = (s) =>
  s.toLowerCase().replace(/\.$/, '').replace(/(^|[\s:(—-])([a-z])/g, (m, p, c) => p + c.toUpperCase());

// ---------- Images ----------
// Source PNGs are ~4MB @1024px; shrink to 450px JPEG so the PDF stays a sane size.
const imageCache = new Map();
function imageDataUri(file, size = 450) {
  if (!file) return null;
  const cacheKey = `${file}:${size}`;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);
  const src = path.join(ART_DIR, path.basename(file));
  if (!fs.existsSync(src)) {
    imageCache.set(cacheKey, null);
    return null;
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const dst = path.join(CACHE_DIR, path.basename(src).replace(/\.\w+$/, `.${size}.jpg`));
  let uri;
  try {
    if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs) {
      execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', '-Z', String(size), src, '--out', dst], { stdio: 'ignore' });
    }
    uri = 'data:image/jpeg;base64,' + fs.readFileSync(dst).toString('base64');
  } catch {
    uri = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64'); // fallback: raw PNG
  }
  imageCache.set(cacheKey, uri);
  return uri;
}

// ---------- HTML pieces ----------
function bodyToHtml(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('\n');
}

// For modern retelling: build body HTML with inline full-width character plates
// inserted after the first paragraph in which each character is first mentioned.
function bodyToHtmlWithPlates(text, chapterId) {
  const entry = chapterEntities[chapterId];
  if (!entry || !Array.isArray(entry.chars) || entry.chars.length === 0) {
    return bodyToHtml(text);
  }

  // Build list of characters that have images, preserving order from chapter-entities
  const charsWithImages = entry.chars
    .map((id) => charById[id])
    .filter((c) => c && c.imageFile);

  if (charsWithImages.length === 0) return bodyToHtml(text);

  const paras = String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);

  // For each character, find the first paragraph index where their name appears.
  // Fall back to paragraph 0 if none found.
  const insertAfter = new Map(); // paragraphIndex -> [char, ...]
  const placed = new Set();

  for (const c of charsWithImages) {
    // Build regex from name + alternates
    const names = [c.name, ...(c.nameAlternate || [])].filter(Boolean);
    const pattern = new RegExp('\\b(' + names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'i');
    let found = -1;
    for (let i = 0; i < paras.length; i++) {
      if (pattern.test(paras[i])) { found = i; break; }
    }
    const idx = found >= 0 ? found : 0;
    if (!insertAfter.has(idx)) insertAfter.set(idx, []);
    insertAfter.get(idx).push(c);
    placed.add(c.id);
  }

  // Build output
  const parts = [];
  for (let i = 0; i < paras.length; i++) {
    parts.push(`<p>${esc(paras[i])}</p>`);
    if (insertAfter.has(i)) {
      for (const c of insertAfter.get(i)) {
        const uri = imageDataUri(c.imageFile, 900);
        if (!uri) continue;
        const caption = c.title ? `${esc(c.name)} — ${esc(c.title)}` : esc(c.name);
        parts.push(`<figure class="plate"><img src="${uri}" alt="${esc(c.name)}"><figcaption>${caption}</figcaption></figure>`);
      }
    }
  }
  return parts.join('\n');
}

function portraitsHtml(chapterId) {
  const entry = chapterEntities[chapterId];
  if (!entry || !Array.isArray(entry.chars)) return '';
  const cards = entry.chars
    .map((id) => charById[id])
    .filter((c) => c && c.imageFile)
    .map((c) => {
      const uri = imageDataUri(c.imageFile);
      if (!uri) return '';
      return `<figure class="card"><img src="${uri}" alt="${esc(c.name)}"><figcaption><span class="cname">${esc(c.name)}</span>${c.title ? `<span class="ctitle">${esc(c.title)}</span>` : ''}</figcaption></figure>`;
    })
    .filter(Boolean);
  return cards.length ? `<div class="portraits">${cards.join('')}</div>` : '';
}

function knotBorderSvg() {
  // Interlaced cord border: two phase-shifted sine strands with over/under breaks, framed by double rules.
  const W = 170, H = 257, m = 8; // mm-ish viewBox units
  const strand = (x0, y0, x1, y1, phase) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.round(len / 6);
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy, ny = ux;
    let d = '';
    for (let i = 0; i <= n * 8; i++) {
      const t = i / (n * 8), s = Math.sin(t * n * Math.PI + phase) * 2.2;
      const x = x0 + ux * len * t + nx * s, y = y0 + uy * len * t + ny * s;
      d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    return d;
  };
  const edges = [[m, m, W - m, m], [W - m, m, W - m, H - m], [W - m, H - m, m, H - m], [m, H - m, m, m]];
  let paths = '';
  for (const [a, b, c, d] of edges) {
    for (const ph of [0, Math.PI]) {
      const p = strand(a, b, c, d, ph);
      paths += `<path d="${p}" stroke="#fff" stroke-width="2.6" fill="none"/><path d="${p}" stroke="#2f5d3a" stroke-width="1.2" fill="none"/>`;
    }
  }
  const corner = (x, y) =>
    `<g transform="translate(${x} ${y})"><circle r="6" fill="#fff" stroke="#2f5d3a" stroke-width="1.2"/><path d="M-4 0 A4 4 0 0 1 4 0 A4 4 0 0 1 -4 0 M0 -4 A4 4 0 0 1 0 4 A4 4 0 0 1 0 -4" fill="none" stroke="#8a6d2f" stroke-width="0.9"/></g>`;
  return `<svg class="knot" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="${m - 4}" y="${m - 4}" width="${W - 2 * m + 8}" height="${H - 2 * m + 8}" fill="none" stroke="#2f5d3a" stroke-width="0.5"/>
    <rect x="${m + 4}" y="${m + 4}" width="${W - 2 * m - 8}" height="${H - 2 * m - 8}" fill="none" stroke="#2f5d3a" stroke-width="0.5"/>
    ${paths}${corner(m, m)}${corner(W - m, m)}${corner(W - m, H - m)}${corner(m, H - m)}</svg>`;
}

const CSS = `
@page { size: A4; margin: 2.5cm 2cm; }
@page cover { margin: 0; }
* { box-sizing: border-box; }
html, body { background: #fff; color: #1a1a1a; }
body { font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.8; margin: 0; }
p { margin: 0 0 0.9em; text-align: justify; hyphens: auto; orphans: 2; widows: 2; }
.cover { page: cover; height: 297mm; width: 210mm; position: relative; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; page-break-after: always; }
.cover .knot { position: absolute; left: 20mm; top: 20mm; width: 170mm; height: 257mm; }
.cover h1 { font-size: 46px; line-height: 1.2; font-weight: normal; letter-spacing: 0.04em; margin: 0 30mm 18px; color: #1f3d27; }
.cover .sub { font-size: 22px; font-style: italic; color: #6b5423; margin-bottom: 8px; }
.cover .by { font-size: 15px; letter-spacing: 0.2em; text-transform: uppercase; color: #444; margin-top: 30px; }
.cover .orn { font-size: 26px; color: #8a6d2f; margin: 10px 0; }
.toc { page-break-after: always; }
.toc h2 { font-size: 30px; font-weight: normal; text-align: center; margin: 0 0 1em; color: #1f3d27; }
.toc .tpart { font-size: 17px; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; margin: 1.2em 0 0.2em; color: #1f3d27; }
.toc .tbook { font-size: 15px; font-style: italic; margin: 0.6em 0 0.1em 1em; color: #6b5423; }
.toc .tch { font-size: 14px; line-height: 1.55; margin-left: 2.2em; }
.toc a { color: inherit; text-decoration: none; }
.divider { page-break-before: always; page-break-after: always; height: 22cm; display: flex; flex-direction: column;
  justify-content: center; align-items: center; text-align: center; }
.divider .part { font-size: 34px; letter-spacing: 0.12em; text-transform: uppercase; color: #1f3d27; margin: 0.3em 0; }
.divider .book { font-size: 24px; font-style: italic; color: #6b5423; margin: 0.4em 1cm; line-height: 1.4; }
.divider .orn { font-size: 28px; color: #8a6d2f; }
.chapter { page-break-before: always; }
.chapter h3 { font-size: 26px; font-weight: normal; line-height: 1.3; text-align: center; margin: 0 0 0.2em; color: #1f3d27; }
.chapter .chnum { font-size: 13px; letter-spacing: 0.25em; text-transform: uppercase; text-align: center; color: #8a6d2f; margin-bottom: 0.4em; }
.chapter .rule { text-align: center; color: #8a6d2f; margin: 0.3em 0 1em; }
.portraits { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin: 0 0 1.4em; page-break-inside: avoid; }
.card { margin: 0; width: 150px; text-align: center; page-break-inside: avoid; }
.card img { width: 150px; height: 150px; object-fit: cover; border-radius: 4px; border: 1px solid #c9b88a; display: block; }
.card figcaption { line-height: 1.3; margin-top: 5px; }
.card .cname { display: block; font-size: 14px; font-weight: bold; color: #1f3d27; }
.card .ctitle { display: block; font-size: 11.5px; font-style: italic; color: #555; }
.plate { margin: 1.6em 0; page-break-inside: avoid; text-align: center; }
.plate img { width: 100%; max-width: 100%; display: block; border: 2px solid #c8a96e; border-radius: 3px; }
.plate figcaption { font-size: 12.5px; font-style: italic; color: #6b5423; margin-top: 6px; letter-spacing: 0.04em; }
`;

function buildHtml(mode) {
  const isModern = mode === 'modern';
  const subtitle = isModern ? 'A Modern Retelling' : 'Lady Gregory';
  let toc = '', content = '', lastPart = null, lastBook = null, n = 0;
  let missingModern = 0, portraitChapters = 0;

  for (const s of sections) {
    n++;
    const partChanged = s.part && s.part !== lastPart;
    const bookChanged = s.book && s.book !== lastBook;
    if (partChanged || bookChanged) {
      content += `<section class="divider"><div class="orn">&#10087;</div>${partChanged ? `<div class="part">${esc(titleCase(s.part))}</div>` : ''}${s.book ? `<div class="book">${esc(titleCase(s.book))}</div>` : ''}<div class="orn">&#10087;</div></section>`;
      if (partChanged) toc += `<div class="tpart">${esc(titleCase(s.part))}</div>`;
      if (s.book && (bookChanged || partChanged)) toc += `<div class="tbook">${esc(titleCase(s.book))}</div>`;
      lastPart = s.part; lastBook = s.book;
    }
    const m = /^CHAPTER\s+([IVXLC]+)\.?\s*(.*)$/i.exec((s.chapter || '').trim());
    const chNum = m ? `Chapter ${m[1]}` : '';
    const chTitle = titleCase(m ? m[2] || s.chapter : s.chapter || s.id);
    toc += `<div class="tch"><a href="#${s.id}">${chNum ? chNum + ' — ' : ''}${esc(chTitle)}</a></div>`;

    let body = s.body;
    if (isModern) {
      if (modernById[s.id]) body = modernById[s.id];
      else missingModern++;
    }
    let chapterBody;
    if (isModern) {
      chapterBody = bodyToHtmlWithPlates(body, s.id);
      const entry = chapterEntities[s.id];
      if (entry && Array.isArray(entry.chars) && entry.chars.some((id) => charById[id]?.imageFile)) portraitChapters++;
    } else {
      const portraits = portraitsHtml(s.id);
      if (portraits) portraitChapters++;
      chapterBody = portraits + bodyToHtml(body);
    }
    content += `<section class="chapter" id="${s.id}">${chNum ? `<div class="chnum">${chNum}</div>` : ''}<h3>${esc(chTitle)}</h3><div class="rule">&#8226; &#10022; &#8226;</div>${chapterBody}</section>`;
    if (n % 10 === 0 || n === sections.length) console.log(`  [${mode}] built ${n}/${sections.length} chapters`);
  }
  if (missingModern) console.warn(`  [${mode}] WARNING: ${missingModern} chapters had no modern text; used original`);
  console.log(`  [${mode}] ${portraitChapters} chapters carry portrait artwork`);

  const cover = `<section class="cover">${knotBorderSvg()}<div class="orn">&#10087;</div><h1>Gods and Fighting Men</h1><div class="sub">${subtitle}</div><div class="orn">&#9753; &#10022; &#10087;</div><div class="by">${isModern ? 'After Lady Gregory' : 'The Celtic Realm'}</div></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Gods and Fighting Men — ${subtitle}</title><style>${CSS}</style></head><body>${cover}<section class="toc"><h2>Contents</h2>${toc}</section>${content}</body></html>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Loaded ${sections.length} chapters, ${modern.length} modern chapters, ${characters.length} characters`);
  const books = [
    { mode: 'original', file: 'celtic-realm-lady-gregory.pdf' },
    { mode: 'modern', file: 'celtic-realm-modern.pdf' },
  ];
  const browser = await puppeteer.launch({ headless: true });
  try {
    for (const b of books) {
      console.log(`\nBuilding HTML for ${b.file}...`);
      const html = buildHtml(b.mode);
      const htmlPath = path.join(CACHE_DIR, b.file.replace('.pdf', '.html'));
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(htmlPath, html);
      console.log(`  HTML size: ${(html.length / 1048576).toFixed(1)} MB — rendering PDF...`);
      const page = await browser.newPage();
      await page.goto('file://' + htmlPath, { waitUntil: 'load', timeout: 0 });
      await page.pdf({
        path: path.join(OUT_DIR, b.file),
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: '<div style="width:100%;text-align:center;font-family:Georgia,serif;font-size:9px;color:#777;"><span class="pageNumber"></span></div>',
        timeout: 0,
      });
      await page.close();
      console.log(`  Wrote ${b.file}`);
      // Mirror modern PDF to public/downloads/
      if (b.mode === 'modern') {
        const dlDir = path.join(ROOT, 'public/downloads');
        fs.mkdirSync(dlDir, { recursive: true });
        fs.copyFileSync(path.join(OUT_DIR, b.file), path.join(dlDir, b.file));
        console.log(`  Copied to public/downloads/${b.file}`);
      }
    }
  } finally {
    await browser.close();
  }
  console.log('\nOutput:');
  for (const b of books) {
    const p = path.join(OUT_DIR, b.file);
    console.log(`  ${p}  ${(fs.statSync(p).size / 1048576).toFixed(2)} MB`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
