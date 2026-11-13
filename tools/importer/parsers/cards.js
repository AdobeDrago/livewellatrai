/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards (boilerplate blocks/cards, no-image usage).
 * Source: 'section.contacts div.contact-tiles' with 19 div.contact-tiles__item
 * (h3, description p, <hr>, p.contact-tiles__links with '|' separated links).
 * Block shape: one row per tile, single text cell (heading, description, links paragraph).
 * The <hr> is dropped; '|' separators stay as text between the links.
 */
export default function parse(element, { document }) {
  const cells = [];

  let items = [...element.querySelectorAll(':scope > div.contact-tiles__item')];
  if (!items.length) items = [...element.querySelectorAll('.contact-tiles__item')];

  items.forEach((item) => {
    const cell = [];
    [...item.children].forEach((child) => {
      const tag = child.tagName.toLowerCase();
      if (tag === 'hr') return;
      if (/^h[1-6]$/.test(tag) || tag === 'p') {
        if (!child.textContent.trim()) return;
        const node = document.createElement(tag);
        node.innerHTML = child.innerHTML.trim();
        cell.push(node);
      } else if (tag === 'a') {
        if (!child.textContent.trim()) return;
        const a = document.createElement('a');
        a.href = child.getAttribute('href') || '';
        a.textContent = child.textContent.trim();
        const p = document.createElement('p');
        p.append(a);
        cell.push(p);
      } else if (child.textContent.trim()) {
        cell.push(child);
      }
    });
    if (cell.length) cells.push([cell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
