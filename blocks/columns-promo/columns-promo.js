/**
 * Columns promo: the Open Enrollment box (source #oe .oe-box).
 * Rows with one cell are the intro (heading + lead); a row with several cells becomes the
 * step list, one item per cell: heading, text and an underlined arrow link.
 * @param {Element} block
 */
export default function decorate(block) {
  const body = document.createElement('div');
  body.className = 'columns-promo-body';
  const steps = document.createElement('ol');
  steps.className = 'columns-promo-steps';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 1) {
      body.append(...cells[0].childNodes);
      return;
    }
    cells.forEach((cell) => {
      if (!cell.textContent.trim()) return;
      const li = document.createElement('li');
      [...cell.children].forEach((el) => {
        if (/^H[1-6]$/.test(el.tagName)) {
          const title = document.createElement('div');
          title.className = 'columns-promo-title';
          title.append(el);
          li.append(title);
          return;
        }
        const a = el.matches('p') ? el.querySelector('a[href]') : null;
        if (a && el.textContent.trim() === a.textContent.trim()) {
          a.className = 'link-arrow';
          li.append(a);
          return;
        }
        li.append(el);
      });
      steps.append(li);
    });
  });

  if (steps.children.length) body.append(steps);
  block.replaceChildren(body);
}
