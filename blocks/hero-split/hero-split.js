import { createOptimizedPicture } from '../../scripts/aem.js';

function isMediaCell(cell) {
  const pic = cell.querySelector('picture');
  if (!pic) return false;
  // media-only cell: no text beyond the picture
  return cell.textContent.trim() === '';
}

function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, true, [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }]));
  });
}

/**
 * Hero split: text (heading, body, CTA) beside an image.
 * Authored as one row with a text cell and an image cell (either order);
 * extra rows or cells are folded into the matching side.
 * @param {Element} block
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'hero-split-content';
  const media = document.createElement('div');
  media.className = 'hero-split-media';

  let mediaFirst = null;
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (isMediaCell(cell)) {
        if (mediaFirst === null) mediaFirst = content.children.length === 0;
        media.append(...cell.querySelectorAll('picture'));
      } else if (cell.textContent.trim() || cell.querySelector('picture')) {
        content.append(...cell.childNodes);
      }
    });
  });

  // a picture authored inside the text cell (no dedicated image cell) becomes the media
  if (!media.children.length) {
    const pic = content.querySelector('picture');
    if (pic) {
      const parent = pic.parentElement;
      media.append(pic);
      const isEmpty = !parent.textContent.trim() && !parent.children.length;
      if (parent !== content && isEmpty) parent.remove();
    }
  }

  // standalone links become source pills: in-page anchors are plain outlined pills
  // ("Let's get started"), links that leave the page carry the arrow ("Enroll today!").
  // Authored formatting (EDS primary/secondary/accent) is kept as is.
  content.querySelectorAll('a[href]').forEach((a) => {
    const p = a.closest('p');
    if (!p || p.textContent.trim() !== a.textContent.trim()) return;
    p.classList.add('button-wrapper');
    a.classList.add('button');
    if (['primary', 'secondary', 'accent'].some((c) => a.classList.contains(c))) return;
    const url = new URL(a.href, window.location.href);
    const samePage = url.origin === window.location.origin
      && url.pathname === window.location.pathname && url.hash;
    a.classList.add(samePage ? 'secondary' : 'accent');
  });

  const children = [content];
  if (media.children.length) {
    if (mediaFirst) block.classList.add('media-first');
    children.push(media);
  } else {
    block.classList.add('no-image');
  }
  optimizeImages(media);
  block.replaceChildren(...children);
}
