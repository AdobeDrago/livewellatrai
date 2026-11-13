/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-split.
 * Source instances:
 *   - section.hero:      span.hero__text (h1, p.intro-text, a.button) then img.hero__image
 *   - section.new-hires: img.new-hires__image then span.new-hires__text (h2#new-hires, h3, p, a.button)
 * Block shape (blocks/hero-split/README.md): one row, two cells [text] | [image],
 * either order. Source order is preserved so the block adds `media-first` when needed.
 */
export default function parse(element, { document }) {
  const main = element.querySelector(':scope > div[class$="__main"]')
    || element.querySelector('div[class*="__main"]')
    || element;

  const img = main.querySelector('img[class$="__image"]') || main.querySelector('img');
  const textWrap = main.querySelector('[class$="__text"]') || main;

  // text cell: headings (levels preserved), paragraphs, CTA links in their own paragraph
  const textCell = [];
  [...textWrap.children].forEach((child) => {
    if (child === img || child.contains(img)) return;
    const tag = child.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const h = document.createElement(tag);
      h.innerHTML = child.innerHTML;
      if (child.id) h.id = child.id;
      textCell.push(h);
    } else if (tag === 'p') {
      const p = document.createElement('p');
      p.innerHTML = child.innerHTML.trim();
      if (p.textContent.trim()) textCell.push(p);
    } else if (tag === 'a') {
      const a = document.createElement('a');
      a.href = child.getAttribute('href') || '';
      a.textContent = child.textContent.trim();
      const p = document.createElement('p');
      p.append(a);
      textCell.push(p);
    } else if (child.textContent.trim()) {
      textCell.push(child);
    }
  });

  const imageCell = [];
  if (img) {
    const pic = document.createElement('img');
    pic.src = img.getAttribute('src');
    pic.alt = img.getAttribute('alt') || '';
    imageCell.push(pic);
  }

  // preserve source order: image first when it precedes the text wrapper
  const imageFirst = img && textWrap !== main
    && (img.compareDocumentPosition(textWrap) & 4); // DOCUMENT_POSITION_FOLLOWING

  const row = imageFirst ? [imageCell, textCell] : [textCell, imageCell];
  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-split', cells });
  element.replaceWith(block);
}
