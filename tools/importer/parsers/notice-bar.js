/* eslint-disable */
/* global WebImporter */

/**
 * Parser for notice-bar.
 * Source: '#lsa-spotlight > div.full-width-button' containing a single
 * <a>Learn more on <strong>Employee Central</strong>.</a>.
 * Block shape (blocks/notice-bar/README.md): one row, one cell with a single paragraph
 * holding the inline link (inline formatting such as <strong> preserved).
 */
export default function parse(element, { document }) {
  const p = document.createElement('p');

  const links = [...element.querySelectorAll('a')];
  if (links.length) {
    links.forEach((src, i) => {
      const a = document.createElement('a');
      // source href is empty on the live page; keep the attribute as authored
      a.setAttribute('href', src.getAttribute('href') || '');
      a.innerHTML = src.innerHTML.trim();
      if (i > 0) p.append(document.createTextNode(' '));
      p.append(a);
    });
  } else {
    p.innerHTML = element.innerHTML.trim();
  }

  const cells = [[[p]]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'notice-bar', cells });
  element.replaceWith(block);
}
