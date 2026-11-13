import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Columns promo: two looks, picked by the section style.
 * - light-grey: text columns (heading + text + arrow link) split by a divider.
 * - green: a circular logo badge beside a heading and text.
 * Authored as rows of cells; image-only cells become the badge, others are content.
 * @param {Element} block
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const cols = firstRow ? firstRow.children.length : 0;
  if (cols) block.classList.add(`columns-promo-${cols}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-promo-row');
    [...row.children].forEach((col) => {
      if (!col.textContent.trim() && col.querySelector('picture')) {
        col.classList.add('columns-promo-media');
      } else {
        col.classList.add('columns-promo-content');
      }
    });
  });

  // a paragraph holding only a plain link is the underlined arrow CTA (source .inline-link--arrow)
  block.querySelectorAll('.columns-promo-content p').forEach((p) => {
    const links = p.querySelectorAll('a[href]');
    if (links.length !== 1) return;
    const [a] = links;
    if (a.classList.contains('button') || p.textContent.trim() !== a.textContent.trim()) return;
    p.classList.add('columns-promo-cta');
    a.classList.add('link-arrow');
  });

  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });
}
