/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for livewellatrai.com (template: homepage).
 *
 * beforeTransform: inserts <hr> section breaks before every non-first section
 * (marked with data-excat-section-id) while parser targets still exist.
 * afterTransform: inserts a Section Metadata block for each styled section at
 * the end of the section (just before the next section's break), then removes
 * the temporary markers.
 *
 * Note: #lsa-spotlight is a sibling of #oe > div.oe-box inside #oe, so section
 * breaks are not always direct children of <main>.
 */

const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector, try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || element;
  const template = (payload && payload.template) || {};
  const sections = Array.isArray(template.sections) ? template.sections : [];
  if (sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section);
      if (!el || !el.parentNode) continue;
      // First section gets a temporary break only when styled.
      if (i === 0 && !section.style) continue;
      const hr = document.createElement('hr');
      hr.setAttribute(MARKER, section.id);
      if (i === 0) hr.setAttribute('data-excat-section-temp', 'true');
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    const markers = () => Array.from(element.querySelectorAll(`hr[${MARKER}]`));
    const all = markers();
    const byId = {};
    all.forEach((hr) => { byId[hr.getAttribute(MARKER)] = hr; });

    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      // Place before the next section's break, if any.
      let nextHr = null;
      for (let j = i + 1; j < sections.length && !nextHr; j += 1) {
        nextHr = byId[sections[j].id] || null;
      }
      if (nextHr && nextHr.parentNode) {
        nextHr.parentNode.insertBefore(metadata, nextHr);
        continue;
      }

      // Last section: after the surviving section element, else end of the
      // container holding this section's marker, else end of main/root.
      const el = findSectionElement(element, section);
      if (el && el.parentNode) {
        el.parentNode.insertBefore(metadata, el.nextSibling);
      } else if (byId[section.id] && byId[section.id].parentNode) {
        byId[section.id].parentNode.appendChild(metadata);
      } else {
        (element.querySelector('main') || element).appendChild(metadata);
      }
    }

    markers().forEach((hr) => {
      if (hr.hasAttribute('data-excat-section-temp')) {
        hr.remove();
      } else {
        hr.removeAttribute(MARKER);
      }
    });
  }
}
