/**
 * Fetches the footer fragment. Fixed paths only (metadata-independent):
 * /content first (local preview), then the site root (DA / EDS).
 * @returns {Promise<HTMLElement|null>} wrapper holding the fragment sections
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  // resolve relative media against the fragment location, not the page
  const base = new URL(resp.url, window.location.href);
  wrapper.querySelectorAll('img[src], source[srcset]').forEach((el) => {
    const attr = el.tagName === 'IMG' ? 'src' : 'srcset';
    const value = el.getAttribute(attr);
    if (value && !/^([a-z]+:|\/)/i.test(value)) el.setAttribute(attr, new URL(value, base).href);
  });
  return wrapper;
}

/**
 * Opens PDFs and links to other sites in a new tab, like the source site.
 * @param {HTMLAnchorElement} a link
 */
function decorateLinkTarget(a) {
  const href = a.getAttribute('href') || '';
  if (!href || href.startsWith('#')) return;
  try {
    const url = new URL(href, window.location.href);
    if (url.pathname.toLowerCase().endsWith('.pdf') || url.host !== window.location.host) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  } catch { /* leave as is */ }
}

/**
 * @param {Element} el element
 * @returns {boolean} true when the element holds media but no text and no links
 */
function isMediaOnly(el) {
  return !!el.querySelector('img, picture, svg')
    && !el.querySelector('a')
    && el.textContent.trim() === '';
}

/**
 * A section holding only decorative media (e.g. a colour strip) becomes a figure.
 * @param {Element} section fragment section
 * @returns {HTMLElement} figure
 */
function buildDecoration(section) {
  const figure = document.createElement('figure');
  figure.className = 'footer-decoration';
  section.querySelectorAll('img').forEach((img) => {
    if (!img.getAttribute('alt')) img.setAttribute('role', 'presentation');
    img.loading = 'lazy';
    figure.append(img.closest('picture') || img);
  });
  return figure;
}

/**
 * Tags the children of a content section by role so CSS can lay them out.
 * @param {Element} section fragment section
 * @returns {HTMLElement} decorated section
 */
function buildContentSection(section) {
  const div = document.createElement('div');
  div.className = 'footer-section';
  [...section.children].forEach((child) => {
    const links = child.querySelectorAll('a');
    if (child.matches('p') && links.length === 1 && links[0].querySelector('img, picture')
      && child.textContent.trim() === '') {
      child.className = 'footer-brand';
    } else if (child.matches('ul, ol')) {
      child.className = 'footer-links';
    } else {
      child.classList.add('footer-text');
    }
    div.append(child);
  });
  return div;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  [...fragment.children].forEach((section) => {
    block.append(isMediaOnly(section) ? buildDecoration(section) : buildContentSection(section));
  });
  block.querySelectorAll('a[href]').forEach(decorateLinkTarget);
  // the copyright year is a separate element, as in the source (dynamic there)
  block.querySelectorAll('.footer-text').forEach((p) => {
    const node = [...p.childNodes].find((n) => n.nodeType === 3 && /©\s*\d{4}/.test(n.textContent));
    if (!node) return;
    const m = node.textContent.match(/^(.*©\s*)(\d{4})(.*)$/s);
    const year = document.createElement('span');
    year.className = 'footer-year';
    const [, before, digits, after] = m;
    year.textContent = digits;
    node.replaceWith(before, year, after);
  });
}
