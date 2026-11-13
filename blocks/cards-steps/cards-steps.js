/**
 * Cards steps: the LSA spotlight panel (source #lsa-spotlight .card-container).
 * Rows: first = [logo][heading + lead]; middle = one step card each ([icon][title + text]);
 * a last row holding only a link becomes the full-width notice button.
 * @param {Element} block
 */
function unwrapPictures(el) {
  el.querySelectorAll('picture').forEach((pic) => {
    const img = pic.querySelector('img');
    if (img) pic.replaceWith(img);
  });
}

function textOf(cells) {
  return cells.find((c) => c.textContent.trim());
}

function mediaOf(cells) {
  return cells.find((c) => !c.textContent.trim() && c.querySelector('img, picture'));
}

export default function decorate(block) {
  const rows = [...block.children];
  const parts = [];
  const steps = document.createElement('div');
  steps.className = 'cards-steps-list';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    unwrapPictures(row);
    const media = mediaOf(cells);
    const text = textOf(cells);
    const links = row.querySelectorAll('a');
    const linkOnly = links.length === 1 && text?.textContent.trim() === links[0].textContent.trim();
    if (!media && linkOnly) {
      const notice = document.createElement('div');
      notice.className = 'cards-steps-notice';
      const a = links[0];
      a.className = '';
      notice.append(a);
      parts.push(['notice', notice]);
      return;
    }
    if (i === 0) {
      const head = document.createElement('div');
      head.className = 'cards-steps-head';
      if (media) {
        const m = document.createElement('div');
        m.className = 'cards-steps-logo';
        m.append(...media.childNodes);
        head.append(m);
      }
      if (text) {
        const t = document.createElement('div');
        t.className = 'cards-steps-title';
        t.append(...text.childNodes);
        head.append(t);
      }
      parts.push(['head', head]);
      return;
    }
    const card = document.createElement('div');
    card.className = 'cards-steps-card';
    if (media) card.append(...media.querySelectorAll('img'));
    if (text) card.append(...text.childNodes);
    steps.append(card);
  });

  const out = [];
  const head = parts.find(([k]) => k === 'head');
  const notice = parts.find(([k]) => k === 'notice');
  if (head) out.push(head[1]);
  if (steps.children.length) out.push(steps);
  if (notice) out.push(notice[1]);
  block.replaceChildren(...out);
}
