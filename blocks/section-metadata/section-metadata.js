import { readBlockConfig, toCamelCase, toClassName } from '../../scripts/aem.js';

/**
 * Applies an authored Section Metadata table to its parent section.
 * `style` values become section classes; other keys become data attributes.
 * The block (and its wrapper) is removed afterwards.
 * @param {Element} block The section-metadata block element
 */
export default function decorate(block) {
  const section = block.closest('.section');
  if (section) {
    const config = readBlockConfig(block);
    Object.entries(config).forEach(([key, value]) => {
      if (!value) return;
      if (key === 'style') {
        String(value).split(',')
          .map((style) => toClassName(style.trim()))
          .filter(Boolean)
          .forEach((style) => section.classList.add(style));
      } else {
        section.dataset[toCamelCase(key)] = value;
      }
    });
    section.classList.remove('section-metadata-container');
  }
  const wrapper = block.parentElement;
  if (wrapper && wrapper.classList.contains('section-metadata-wrapper')) wrapper.remove();
  else block.remove();
}
