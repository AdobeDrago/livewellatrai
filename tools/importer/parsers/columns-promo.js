/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-promo.
 * Source instances (repeating unit differs per instance):
 *   - '#oe ol.oe-box__steps': two <li> steps (div.step-wrapper > h4, p, a.inline-link)
 *     -> one row, one column per step.
 *   - '#lsa-spotlight > div.image-title-wrapper': div.image > img | div.title (h2, p.lead)
 *     -> one row: [logo image] | [heading + lead paragraph].
 */

function cloneHeading(document, src) {
  const h = document.createElement(src.tagName.toLowerCase());
  h.innerHTML = src.innerHTML.trim();
  if (src.id) h.id = src.id;
  return h;
}

function cloneParagraph(document, src) {
  const p = document.createElement('p');
  p.innerHTML = src.innerHTML.trim();
  return p;
}

function linkParagraph(document, src) {
  const a = document.createElement('a');
  a.href = src.getAttribute('href') || '';
  a.textContent = src.textContent.trim();
  const p = document.createElement('p');
  p.append(a);
  return p;
}

function imageEl(document, src) {
  const img = document.createElement('img');
  // The importer turns <img src="*.svg"> into a :name: icon token; the block expects a
  // real picture in the media cell, so keep SVG logos as images with a no-op query.
  const url = src.getAttribute('src') || '';
  img.src = /\.svg$/i.test(url) ? `${url}?svg` : url;
  img.alt = src.getAttribute('alt') || '';
  return img;
}

/** Build a content cell from an element's headings, paragraphs and links in document order. */
function contentCell(document, root) {
  const cell = [];
  root.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, img').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      cell.push(cloneHeading(document, el));
    } else if (tag === 'p') {
      if (el.textContent.trim() || el.querySelector('img')) cell.push(cloneParagraph(document, el));
    } else if (tag === 'a') {
      // skip links already captured inside a paragraph or heading
      if (el.closest('p, h1, h2, h3, h4, h5, h6')) return;
      if (el.textContent.trim()) cell.push(linkParagraph(document, el));
    } else if (tag === 'img') {
      if (el.closest('p')) return;
      cell.push(imageEl(document, el));
    }
  });
  return cell;
}

export default function parse(element, { document }) {
  const cells = [];

  const steps = element.matches('ol, ul')
    ? [...element.querySelectorAll(':scope > li')]
    : [];

  if (steps.length) {
    // steps shape: one row, one column per <li>
    cells.push(steps.map((li) => contentCell(document, li)));
  } else {
    // logo + title shape: [image] | [text]
    const imgWrap = element.querySelector(':scope > div.image');
    const titleWrap = element.querySelector(':scope > div.title');
    const img = (imgWrap || element).querySelector('img');
    const imageCell = img ? [imageEl(document, img)] : [];
    const textCell = titleWrap
      ? contentCell(document, titleWrap)
      : [...element.querySelectorAll('h1, h2, h3, h4, h5, h6, p')].map((el) => (
        /^H/.test(el.tagName) ? cloneHeading(document, el) : cloneParagraph(document, el)));
    cells.push([imageCell, textCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo', cells });
  element.replaceWith(block);
}
