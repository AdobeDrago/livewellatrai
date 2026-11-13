/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-steps.
 * Source: '#lsa-spotlight > div.card-wrapper' with three div.card (img icon, h3, p).
 * Block shape (blocks/cards-steps/README.md): one row per step, [icon image] | [heading + paragraph].
 */
export default function parse(element, { document }) {
  const cells = [];

  let items = [...element.querySelectorAll(':scope > div.card')];
  if (!items.length) items = [...element.querySelectorAll('.card')];

  items.forEach((card) => {
    const iconCell = [];
    const textCell = [];

    const src = card.querySelector('img');
    if (src) {
      const img = document.createElement('img');
      // importer converts <img src="*.svg"> into :name: icon tokens; block expects a picture
      const url = src.getAttribute('src') || '';
      img.src = /\.svg$/i.test(url) ? `${url}?svg` : url;
      img.alt = src.getAttribute('alt') || '';
      iconCell.push(img);
    }

    card.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'a') {
        if (el.closest('p, h1, h2, h3, h4, h5, h6') || !el.textContent.trim()) return;
        const a = document.createElement('a');
        a.href = el.getAttribute('href') || '';
        a.textContent = el.textContent.trim();
        const p = document.createElement('p');
        p.append(a);
        textCell.push(p);
        return;
      }
      if (!el.textContent.trim()) return;
      const node = document.createElement(tag);
      node.innerHTML = el.innerHTML.trim();
      textCell.push(node);
    });

    if (iconCell.length || textCell.length) cells.push([iconCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-steps', cells });
  element.replaceWith(block);
}
