import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards steps: ordered process steps, each with an icon, a title and short text.
 * One row per step; cells are [icon][title + text], or a single cell with all three.
 * @param {Element} block
 */
export default function decorate(block) {
  const ol = document.createElement('ol');
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.some((c) => c.textContent.trim() || c.querySelector('picture'))) return;

    const li = document.createElement('li');
    const icon = document.createElement('div');
    icon.className = 'cards-steps-icon';
    const body = document.createElement('div');
    body.className = 'cards-steps-body';

    cells.forEach((cell) => {
      if (!cell.textContent.trim() && cell.querySelector('picture')) {
        icon.append(...cell.querySelectorAll('picture'));
      } else {
        body.append(...cell.childNodes);
      }
    });

    // icon authored inside the text cell: lift the first leading picture out
    if (!icon.children.length) {
      const pic = body.querySelector('picture');
      if (pic) {
        const parent = pic.parentElement;
        icon.append(pic);
        const isEmpty = !parent.textContent.trim() && !parent.children.length;
        if (parent !== body && isEmpty) parent.remove();
      }
    }

    if (icon.children.length) li.append(icon);
    if (body.childNodes.length) li.append(body);
    ol.append(li);
  });

  ol.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]));
  });

  block.replaceChildren(ol);
}
