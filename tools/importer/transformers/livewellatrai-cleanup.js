/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for livewellatrai.com (template: homepage).
 *
 * beforeTransform: only replays catalog-captured removals
 *   1. payload.template.pageCleanup for the current page (selectors in order,
 *      each removed only when it matches exactly one element).
 *   2. catalog-template.json cleanup.rules[] applied outside <main>, only when
 *      the current page is not listed in cleanup.pages.
 * afterTransform: removes site chrome and non-authorable elements.
 */

// Snapshot of migration-work/catalog-template.json "cleanup" (no rules for this site).
const CATALOG_CLEANUP = {
  rules: [],
  pages: {},
};

function normalizeUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url, 'https://www.livewellatrai.com');
    let path = u.pathname.replace(/\/index\.html?$/, '').replace(/\.html?$/, '');
    if (path.length > 1) path = path.replace(/\/+$/, '');
    return `${u.hostname.replace(/^www\./, '')}${path || '/'}`;
  } catch (e) {
    return String(url).replace(/\/+$/, '');
  }
}

function getCurrentUrl(document, payload) {
  const p = payload || {};
  return (p.params && p.params.originalURL)
    || p.originalURL
    || p.url
    || (document && document.documentURI && !document.documentURI.startsWith('about:') ? document.documentURI : '')
    || '';
}

function toSelectorList(entry) {
  if (!entry) return [];
  if (typeof entry === 'string') return [entry];
  if (Array.isArray(entry)) {
    return entry.flatMap((e) => (typeof e === 'string' ? [e] : toSelectorList(e)));
  }
  if (typeof entry === 'object') {
    return toSelectorList(entry.selectors || entry.selector || entry.cleanup || entry.remove);
  }
  return [];
}

/**
 * Resolve pageCleanup for the current page, matching by URL like pageInstances:
 * - array of strings: applies to every page of the template
 * - object keyed by URL: { "<url>": [selectors] }
 * - array of { url, selectors } objects
 */
function resolvePageCleanup(pageCleanup, currentUrl) {
  if (!pageCleanup) return [];
  const cur = normalizeUrl(currentUrl);
  if (Array.isArray(pageCleanup)) {
    if (pageCleanup.every((e) => typeof e === 'string')) return pageCleanup;
    const objs = pageCleanup.filter((e) => e && typeof e === 'object');
    const match = objs.find((e) => e.url && normalizeUrl(e.url) === cur)
      || (objs.length === 1 && !cur ? objs[0] : null);
    return match ? toSelectorList(match) : [];
  }
  if (typeof pageCleanup === 'object') {
    const keys = Object.keys(pageCleanup);
    const key = keys.find((k) => normalizeUrl(k) === cur)
      || (keys.length === 1 && !cur ? keys[0] : null);
    return key ? toSelectorList(pageCleanup[key]) : [];
  }
  return [];
}

function safeQueryAll(root, selector) {
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch (e) {
    return [];
  }
}

function isPageListed(pages, currentUrl) {
  if (!pages || !currentUrl) return false;
  const cur = normalizeUrl(currentUrl);
  if (Array.isArray(pages)) {
    return pages.some((p) => normalizeUrl(typeof p === 'string' ? p : p && p.url) === cur);
  }
  return Object.keys(pages).some((k) => normalizeUrl(k) === cur);
}

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || element;
  const root = element;

  if (hookName === 'beforeTransform') {
    const currentUrl = getCurrentUrl(document, payload);
    const template = (payload && payload.template) || {};

    // 1. Replay per-page cleanup captured by the catalog.
    resolvePageCleanup(template.pageCleanup, currentUrl).forEach((selector) => {
      const matches = safeQueryAll(root, selector);
      if (matches.length === 1) matches[0].remove();
    });

    // 2. Catalog cleanup rules, outside <main>, only for pages not listed.
    if (!isPageListed(CATALOG_CLEANUP.pages, currentUrl)) {
      const main = root.querySelector('main');
      CATALOG_CLEANUP.rules.forEach((rule) => {
        toSelectorList(rule).forEach((selector) => {
          safeQueryAll(root, selector).forEach((el) => {
            if (main && (main === el || main.contains(el) || el.contains(main))) return;
            if (el.isConnected !== false) el.remove();
          });
        });
      });
    }
  }

  if (hookName === 'afterTransform') {
    // Site chrome.
    WebImporter.DOMUtils.remove(root, [
      'div#header',
      '#page > hr',
      'header.header',
      'div#benefits-guides-nav',
      'footer.footer',
      'button#toggle-button',
      // Decorative background shape of the contacts band (styled via the "navy" section style).
      'span.contacts__background',
    ]);

    // In-page anchors: source ids live on wrappers that do not survive import; EDS derives
    // heading ids from their text, so point the links at the matching heading ids.
    const ANCHORS = {
      '#oe': '#enrolling-in-benefits',
      '#lsa-spotlight': '#get-your-500',
      '#contacts': '#your-contacts',
    };
    root.querySelectorAll('a[href^="#"]').forEach((a) => {
      const target = ANCHORS[a.getAttribute('href')];
      if (target) a.setAttribute('href', target);
    });

    // Non-authorable / tracking elements.
    WebImporter.DOMUtils.remove(root, [
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
    ]);

    // Tracking / framework attributes.
    root.querySelectorAll('[onclick], [data-gtm], [data-ga], [data-track]').forEach((el) => {
      ['onclick', 'data-gtm', 'data-ga', 'data-track'].forEach((a) => el.removeAttribute(a));
    });
  }
}
