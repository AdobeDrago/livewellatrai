import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero CTA: full-width background photo with centered heading, text and a CTA button.
 * Authored as a background image (row or cell) plus a content cell.
 * Missing image falls back to a plain hero (no-image).
 * @param {Element} block
 */
export default function decorate(block) {
  const bg = document.createElement('div');
  bg.className = 'hero-cta-background';
  const content = document.createElement('div');
  content.className = 'hero-cta-content';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const hasText = cell.textContent.trim() !== '';
      if (!hasText) {
        const pic = cell.querySelector('picture');
        if (pic && !bg.children.length) bg.append(pic);
        return;
      }
      content.append(...cell.childNodes);
    });
  });

  // picture authored inline with the text becomes the background if none was found
  if (!bg.children.length) {
    const pic = content.querySelector('picture');
    if (pic) {
      const parent = pic.parentElement;
      bg.append(pic);
      const isEmpty = !parent.textContent.trim() && !parent.children.length;
      if (parent !== content && isEmpty) parent.remove();
    }
  }

  content.querySelectorAll('a').forEach((a) => {
    const p = a.closest('p');
    if (p && p.textContent.trim() === a.textContent.trim()) {
      a.classList.add('button');
      // source pill with arrow ("Check it out"); authored primary/secondary is kept
      if (!['primary', 'secondary', 'accent'].some((c) => a.classList.contains(c))) {
        a.classList.add('accent');
      }
      p.classList.add('button-container');
    }
  });

  bg.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, true, [{ media: '(min-width: 900px)', width: '2000' }, { width: '750' }]));
  });

  const children = [];
  if (bg.children.length) children.push(bg);
  else block.classList.add('no-image');
  children.push(content);
  block.replaceChildren(...children);
}
