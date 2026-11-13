/* eslint-disable */
/* global WebImporter */

import heroSplitParser from "./parsers/hero-split.js";
import columnsPromoParser from "./parsers/columns-promo.js";
import cardsStepsParser from "./parsers/cards-steps.js";
import noticeBarParser from "./parsers/notice-bar.js";
import heroCtaParser from "./parsers/hero-cta.js";
import cardsParser from "./parsers/cards.js";
import cleanupTransformer from "./transformers/livewellatrai-cleanup.js";
import sectionsTransformer from "./transformers/livewellatrai-sections.js";

const PAGE_TEMPLATE = {
  "name": "homepage",
  "urls": [
    "https://www.livewellatrai.com/"
  ],
  "description": "Single long-scroll landing page: split hero with image, stacked full-width sections with in-page anchor navigation, step cards, promo banner and call-to-action sections",
  "blocks": [
    {
      "name": "hero-split",
      "instances": [
        "main > section.hero",
        "main > section.new-hires"
      ],
      "pageInstances": {
        "https://www.livewellatrai.com/": [
          "#main > section.hero",
          "#main > section.new-hires"
        ]
      }
    },
    {
      "name": "columns-promo",
      "instances": [
        "#oe ol.oe-box__steps",
        "#lsa-spotlight > div.image-title-wrapper"
      ],
      "pageInstances": {
        "https://www.livewellatrai.com/": [
          "#oe > div.oe-box > div > ol",
          "#lsa-spotlight > div.image-title-wrapper"
        ]
      }
    },
    {
      "name": "cards-steps",
      "instances": [
        "#lsa-spotlight > div.card-wrapper"
      ],
      "pageInstances": {
        "https://www.livewellatrai.com/": [
          "#lsa-spotlight > div.card-wrapper"
        ]
      }
    },
    {
      "name": "notice-bar",
      "instances": [
        "#lsa-spotlight > div.full-width-button"
      ],
      "pageInstances": {
        "https://www.livewellatrai.com/": [
          "#lsa-spotlight > div.full-width-button"
        ]
      }
    },
    {
      "name": "hero-cta",
      "instances": [
        "main > section.rai-benefits"
      ],
      "pageInstances": {
        "https://www.livewellatrai.com/": [
          "#main > section.rai-benefits"
        ]
      }
    },
    {
      "name": "cards",
      "instances": [
        "section.contacts div.contact-tiles"
      ]
    }
  ],
  "sections": [
    {
      "id": "hero",
      "name": "hero",
      "selector": [
        "main > section.hero"
      ],
      "style": null,
      "blocks": [
        "hero-split"
      ],
      "defaultContent": []
    },
    {
      "id": "enrolling",
      "name": "enrolling-in-benefits",
      "selector": [
        "#oe > div.oe-box",
        "#oe"
      ],
      "style": "light-grey",
      "blocks": [
        "columns-promo"
      ],
      "defaultContent": [
        "#oe > div.oe-box > div > h2",
        "#oe > div.oe-box > div > p"
      ]
    },
    {
      "id": "lsa-spotlight",
      "name": "lsa-spotlight",
      "selector": [
        "#lsa-spotlight"
      ],
      "style": "green",
      "blocks": [
        "columns-promo",
        "cards-steps",
        "notice-bar"
      ],
      "defaultContent": []
    },
    {
      "id": "new-hires",
      "name": "new-hires",
      "selector": [
        "main > section.new-hires"
      ],
      "style": null,
      "blocks": [
        "hero-split"
      ],
      "defaultContent": []
    },
    {
      "id": "contacts",
      "name": "contacts",
      "selector": [
        "main > section.contacts"
      ],
      "style": "navy",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        "#contacts",
        "#main > section.contacts > p",
        "section.contacts div.callout"
      ]
    },
    {
      "id": "rai-benefits",
      "name": "rai-benefits",
      "selector": [
        "main > section.rai-benefits"
      ],
      "style": null,
      "blocks": [
        "hero-cta"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  "hero-split": heroSplitParser,
  "columns-promo": columnsPromoParser,
  "cards-steps": cardsStepsParser,
  "notice-bar": noticeBarParser,
  "hero-cta": heroCtaParser,
  "cards": cardsParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
const transformers = [cleanupTransformer, ...lateTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, "")}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute("data-excat-block", String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute("data-excat-section", String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers("beforeTransform", main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers("afterTransform", main, payload);

    main.appendChild(document.createElement("hr"));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment nodes left main before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers("afterTransform", element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, "")
      .replace(/\.html?$/, "");
    const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
