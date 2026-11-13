# Parity rebuild ledger: livewellatrai.com (home)

Baseline at plan approval: context 105.9k tokens; account extra-usage spend $341.91 (from `get_usage`).
The spend meter is account-wide, so other sessions running at the same time may be included in the deltas.
Gate: ≥99% pixel and 0 computed-style mismatches per section at 1440 and 1280 (default bar, not lowered).
Source: https://www.livewellatrai.com/ (preflight `ok`, Imperva marker present; live capture, 2026-11-13).
Rebuild (local): `aem up` on http://localhost:3021/ with the section files in `pages/` built by `build.py`.

| Phase / iteration | Block / variant | Change | Mismatches before→after | Pixel before→after (1440 / 1280) | Context Δ | Spend Δ |
|---|---|---|---|---|---|---|
| Intake / capture | — | preflight 1/1 `ok`; 7 sections captured live at both widths | n/a | n/a | — | not metered |
| Baseline | — | existing `main` preview gated against the source: 0/14 pass; enroll split over 2 sections, contacts list expanded (3068px vs 582px) | see `work/gate/home-main` | header 65.5 / 64.1, hero 99.1 / 52.1, footer 100 / 100 | — | — |
| Content | section files | content taken from the `main` DA page (text and links verbatim), images re-pointed to the source files (source names, so the gate pairs them); enroll = 1 section (`Style: enroll`); contacts = `Style: navy, contacts` with a toggle-label row | n/a | n/a | | |
| Global | `brand.css` | font family `Aeroport` with its original case (stylelint `value-keyword-case` disabled per line) | header/footer font-family mismatches → 0 | — | | |
| Footer 1 | `footer` | figure/img display, logo inline + 32px margin, year wrapped in `.footer-year` (dynamic on the source; `invisible` in site.json, footer re-captured) | 10 → 0 | 100 → 98.8 / 98.7 → 98.9 | | |
| Header 1 | `header` | fixed bar, `li > p` unwrapped (DA wrap), 17.6px items, CTA arrow drawn as a background instead of an `<img>`; gate selector `body > header` | 51 → 3 | 65.5 → 100 / 64.1 → 100 | | |
| Header 2 | `header` | brand colour inherits, toggle `text-align: start`; `main` padding = nav height + 84px | 3 → 0 | 100 / 100 | | |
| Hero + new hires | `hero-split` | fixed 608/496px media, 128px padding, no vw scaling; content column flex/align start; image ±1px offset; h2 anchor offset (−112/+112px) | 7/12 → 0 | 99.1 → 100 / 52.0 → 100; 99.4 → 100 / 60.6 → 100 | | |
| RAI benefits 1 | `hero-cta` | photo as CSS background (source has no `<img>`); text max-width 667.383px | 6 → 0 | 99.0 → 45 (wrong bg size) | | |
| RAI benefits 2 | `hero-cta` | background `cover`, centred | 0 → 0 | 45 → 100 / 47 → 99.99 | | |
| Enroll 1 | `columns-promo`, `cards-steps`, `styles.css` | blocks rewritten for the source structure: the white OE box (intro + 2-item step list) and the green LSA panel (head, 3 cards, notice); old `light-grey`/`green` section styles replaced by `enroll` | 134 → 15 | 56.9 → 99.4 / 54.8 → 99.3 | | |
| Enroll 2 | same | panel text colour, cards text-align start, step link `align-self: end` | 15 → 0 | 99.4 → 100 / 99.3 → 100 | | |
| Contacts 1 | `cards` (`contacts`), `styles.css` | toggle button from the first row's label; list + callout collapsed until pressed; wrappers `display: contents` | 127 → 0 | 18.7 → 100 / 18.7 → 100 | | |
| Footer 2–4 | `footer` | 1px text raster offset tried with ±0.3/0.6px nudges; no gain, reverted (stop rule) | 0 → 0 | 98.79 / 98.9 (unchanged) | | |
| Lint | all | max-len, destructuring, selector order, duplicate selector | 0 → 0 | unchanged | | |
| **Total since plan** | | | | | **+118.8k** (105.9k → 224.7k) | **+$4.39** ($341.91 → $346.30) |

## Results (local, http://localhost:3021/)
- Gate: **12/14 PASS**. All sections are at 0 computed-style mismatches. The footer fails the pixel bar at both widths: 98.79% (1440) and 98.9% (1280).
- Offsets: 14/14 sections at the source's page position.
- `npm run lint`: clean.

## Residuals / not verified
- Footer pixels: the text paragraphs render 1px lower than the source's, although their layout boxes match (4181.72 vs 4181.73 page Y at 1280). Within the footer, the shift covers only the text. The result depended on the footer's page position (it passed at 1280 when the page was taller). Not fixed; stop rule.
- The contacts list's open state is not gated (per intake). It was checked by clicking once at 1440: 19 vendor tiles and the callout appear.
- Only 1440 and 1280 were measured. Mobile/tablet widths, hover states and the "Benefit Guides" dropdown are not verified.
- The source ships no Aeroport webfont, so both sides render the fallback `sans-serif`.
- The empty "Learn more on Employee Central." link has an empty `href` on the source too; it is kept as authored.
