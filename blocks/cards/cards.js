import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * contacts variant: a first row holding only plain text is the toggle label. The list (and
 * the rest of the section after it) stays collapsed until the button is pressed, as on the source.
 * @param {Element} block cards block
 * @returns {HTMLButtonElement|null} the toggle
 */
function buildToggle(block) {
  const first = block.firstElementChild;
  if (!first || first.children.length !== 1) return null;
  const cell = first.firstElementChild;
  if (cell.querySelector('h1, h2, h3, h4, h5, h6, picture, a')) return null;
  const label = cell.textContent.trim();
  if (!label) return null;
  first.remove();

  const section = block.closest('.section');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button cards-toggle';
  button.textContent = label;
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    section?.classList.toggle('cards-expanded', open);
  });
  return button;
}

export default function decorate(block) {
  const toggle = block.classList.contains('contacts') ? buildToggle(block) : null;

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);

  if (toggle) {
    const wrapper = block.parentElement;
    ul.id = ul.id || 'contacts-list';
    toggle.setAttribute('aria-controls', ul.id);
    wrapper.before(toggle);
  }
}
