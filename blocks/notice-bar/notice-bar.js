/**
 * Notice bar: a slim strip with one short line of text containing an inline link.
 * Authored as one row, one cell; extra rows/cells are joined into the same strip.
 * Links are kept inline (never turned into buttons).
 * @param {Element} block
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'notice-bar-content';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (cell.textContent.trim() || cell.querySelector('a, picture')) {
        content.append(...cell.childNodes);
      }
    });
  });

  // keep authored links inline: undo auto button decoration
  content.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
  content.querySelectorAll('.button-container').forEach((p) => p.classList.remove('button-container'));

  if (!content.textContent.trim()) {
    block.closest('.notice-bar-wrapper')?.remove();
    block.remove();
    return;
  }

  block.setAttribute('role', 'note');
  block.replaceChildren(content);
}
