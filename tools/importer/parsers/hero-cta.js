/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-cta.
 * Source: 'main > section.rai-benefits' (h2, p, <a><button>Check it out</button></a>).
 * The photo is a CSS background (not in the markup): read it from inline style or the
 * computed style when available, otherwise fall back to the image captured by the catalog
 * for this section (man-smiling-desk-computer.jpg).
 * Block shape (blocks/hero-cta/README.md): row 1 background image, row 2 heading + text + CTA link.
 */

const BG_FALLBACK = {
  'rai-benefits': 'https://www.livewellatrai.com/wp-content/uploads/man-smiling-desk-computer.jpg',
};

function extractUrl(value) {
  if (!value || value === 'none') return null;
  const m = value.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m ? m[1] : null;
}

function backgroundUrl(element, document) {
  const nodes = [element, ...element.querySelectorAll('[style*="background"]')];
  for (const node of nodes) {
    const inline = extractUrl(node.getAttribute && node.getAttribute('style'));
    if (inline) return inline;
  }
  try {
    const view = document.defaultView;
    if (view && view.getComputedStyle) {
      const computed = extractUrl(view.getComputedStyle(element).backgroundImage);
      if (computed) return computed;
      for (const pseudo of ['::before', '::after']) {
        const p = extractUrl(view.getComputedStyle(element, pseudo).backgroundImage);
        if (p) return p;
      }
    }
  } catch (e) {
    // computed style not available in this DOM
  }
  const key = Object.keys(BG_FALLBACK).find((cls) => element.classList.contains(cls));
  return key ? BG_FALLBACK[key] : null;
}

export default function parse(element, { document }) {
  const cells = [];

  // row 1: background image (optional)
  const existingImg = element.querySelector('img');
  const bgSrc = existingImg ? existingImg.getAttribute('src') : backgroundUrl(element, document);
  if (bgSrc) {
    const img = document.createElement('img');
    img.src = bgSrc;
    img.alt = existingImg ? (existingImg.getAttribute('alt') || '') : '';
    cells.push([[img]]);
  }

  // row 2: heading, text, CTA
  const content = [];
  element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag) || tag === 'p') {
      if (!el.textContent.trim()) return;
      const node = document.createElement(tag);
      node.innerHTML = el.innerHTML.trim();
      content.push(node);
      return;
    }
    if (el.closest('p, h1, h2, h3, h4, h5, h6')) return;
    let href = null;
    let text = '';
    if (tag === 'a') {
      href = el.getAttribute('href');
      text = el.textContent.trim();
    } else {
      // <button> inside <a>: invalid nesting may be flattened, so pair with the nearest link
      const a = el.closest('a') || (el.previousElementSibling && el.previousElementSibling.tagName === 'A' ? el.previousElementSibling : null);
      if (a && a.textContent.trim()) return; // already handled via the <a>
      href = a ? a.getAttribute('href') : null;
      text = el.textContent.trim();
    }
    if (!text || href === null) return;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    const p = document.createElement('p');
    p.append(link);
    content.push(p);
  });
  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-cta', cells });
  element.replaceWith(block);
}
