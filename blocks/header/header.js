// breakpoint between the mobile menu and the desktop header row
const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the nav fragment. Fixed paths only (metadata-independent):
 * /content first (local preview), then the site root (DA / EDS).
 * @returns {Promise<HTMLElement|null>} wrapper holding the fragment sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
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
 * Returns the text of an element's own leading text nodes / inline nodes,
 * ignoring nested lists.
 * @param {Element} li list item
 * @returns {Node[]} label nodes
 */
function labelNodes(li) {
  return [...li.childNodes].filter((n) => !(n.nodeType === Node.ELEMENT_NODE && n.matches('ul, ol')));
}

/**
 * @param {Element} nav nav element
 * @param {boolean} expanded open or close every dropdown
 */
function setAllDropdowns(nav, expanded = false) {
  nav.querySelectorAll('.nav-drop-toggle').forEach((btn) => {
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });
}

/**
 * @param {Element} nav nav element
 * @param {boolean|null} force force open (true) / closed (false)
 */
function toggleMenu(nav, force = null) {
  const open = force !== null ? force : nav.getAttribute('aria-expanded') !== 'true';
  const button = nav.querySelector('.nav-hamburger button');
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (button) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
  // opening or closing the menu always resets the sub-panel (source behavior)
  setAllDropdowns(nav, false);
}

/**
 * Builds a dropdown (button + panel) from a list item with a nested list.
 * @param {Element} li list item
 * @param {number} index dropdown index (for ids)
 * @param {Element} nav nav element
 */
function buildDropdown(li, index, nav) {
  const subList = li.querySelector(':scope > ul, :scope > ol');
  const label = labelNodes(li)
    .map((n) => n.textContent)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  li.classList.add('nav-drop');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-drop-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  const panelId = `nav-dropdown-${index}`;
  toggle.setAttribute('aria-controls', panelId);
  toggle.textContent = label;

  const panel = document.createElement('div');
  panel.className = 'nav-dropdown';
  panel.id = panelId;

  // mobile-only return control, labelled from the trigger text
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'nav-back';
  back.setAttribute('aria-label', `Back from ${label}`);
  // keep the last two words together so the arrow wraps alone (as on source)
  back.textContent = `← ${label.replace(/ (?=\S+$)/, '\u00a0')}`;
  back.addEventListener('click', () => setAllDropdowns(nav, false));
  panel.append(back);

  subList.classList.add('nav-dropdown-list');
  [...subList.children].forEach((item) => {
    item.classList.add('nav-dropdown-item');
    const link = item.querySelector('a');
    const pic = item.querySelector('picture') || item.querySelector('img');
    if (link && pic && !link.contains(pic)) {
      // whole card is one link: thumbnail above the label
      const text = document.createElement('span');
      text.className = 'nav-dropdown-label';
      text.append(...link.childNodes);
      link.append(pic, text);
      // drop now-empty wrappers left behind by the authored image
      item.querySelectorAll('p').forEach((p) => { if (!p.textContent.trim() && !p.querySelector('img')) p.remove(); });
    }
    if (link) {
      link.addEventListener('click', () => {
        setAllDropdowns(nav, false);
        if (!isDesktop.matches) toggleMenu(nav, false);
      });
    }
  });
  panel.append(subList);

  labelNodes(li).forEach((n) => n.remove());
  li.prepend(toggle, panel);

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    setAllDropdowns(nav, false);
    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const listSection = sections.find((s) => s.querySelector('ul, ol'));
  const brandSection = sections.find((s) => s !== listSection) || null;
  const toolsSection = sections.find((s) => s !== listSection && s !== brandSection) || null;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  nav.setAttribute('aria-expanded', 'false');

  // brand
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) {
    const brandLink = brandSection.querySelector('a');
    const brandImg = brandSection.querySelector('picture') || brandSection.querySelector('img');
    if (brandLink) {
      if (brandImg && !brandLink.contains(brandImg)) brandLink.append(brandImg);
      brandLink.removeAttribute('class');
      brand.append(brandLink);
    } else if (brandImg) {
      const a = document.createElement('a');
      a.href = '/';
      a.append(brandImg);
      brand.append(a);
    } else {
      brand.append(...brandSection.childNodes);
    }
    const link = brand.querySelector('a');
    const img = brand.querySelector('img');
    if (link && img && !link.getAttribute('aria-label')) link.setAttribute('aria-label', img.alt || 'Home');
  }

  // hamburger (mobile)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav-menu');
  hamburgerButton.setAttribute('aria-expanded', 'false');
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  hamburgerButton.innerHTML = '<span class="nav-hamburger-bar"></span><span class="nav-hamburger-bar"></span><span class="nav-hamburger-bar"></span>';
  hamburgerButton.addEventListener('click', () => toggleMenu(nav));
  hamburger.append(hamburgerButton);

  // menu: links + tools
  const menu = document.createElement('div');
  menu.className = 'nav-menu';
  menu.id = 'nav-menu';

  const sectionsEl = document.createElement('div');
  sectionsEl.className = 'nav-sections';
  const list = listSection ? listSection.querySelector('ul, ol') : null;
  if (list) {
    list.classList.add('nav-list');
    let dropIndex = 0;
    [...list.children].forEach((li) => {
      li.classList.add('nav-item');
      // DA wraps list item content in <p>: unwrap so the link is the item's direct child
      li.querySelectorAll(':scope > p').forEach((p) => p.replaceWith(...p.childNodes));
      if (li.querySelector(':scope > ul, :scope > ol')) {
        buildDropdown(li, dropIndex, nav);
        dropIndex += 1;
      } else {
        li.querySelector('a')?.addEventListener('click', () => {
          if (!isDesktop.matches) toggleMenu(nav, false);
        });
      }
    });
    sectionsEl.append(list);
  }
  menu.append(sectionsEl);

  if (toolsSection) {
    const tools = document.createElement('div');
    tools.className = 'nav-tools';
    toolsSection.querySelectorAll('p').forEach((p) => {
      const a = p.querySelector('a');
      if (!a) return;
      a.className = 'nav-cta';
      // an icon authored next to the CTA becomes its trailing arrow
      const icon = p.querySelector('img');
      if (icon && !a.contains(icon)) {
        // drawn as a background (the source arrow is not an <img>)
        const arrow = document.createElement('span');
        arrow.className = 'nav-cta-icon';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.style.backgroundImage = `url("${icon.currentSrc || icon.src}")`;
        icon.closest('picture')?.remove();
        icon.remove();
        a.append(arrow);
      }
      a.addEventListener('click', () => {
        if (!isDesktop.matches) toggleMenu(nav, false);
      });
      tools.append(a);
    });
    if (tools.children.length) menu.append(tools);
  }

  nav.append(brand, hamburger, menu);
  nav.querySelectorAll('a').forEach(decorateLinkTarget);

  // close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const openToggle = nav.querySelector('.nav-drop-toggle[aria-expanded="true"]');
    if (openToggle) {
      setAllDropdowns(nav, false);
      openToggle.focus();
    } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      hamburgerButton.focus();
    }
  });

  // reset everything when crossing the breakpoint
  isDesktop.addEventListener('change', () => toggleMenu(nav, false));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
