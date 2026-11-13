# columns-promo

Custom **columns** block with two looks, picked by the section style (section metadata `style`).

- `light-grey` section: text columns side by side (stacked on mobile) with a 1px divider. Each cell: h4 + paragraph + a standalone link, which the block turns into the underlined arrow link (`a.link-arrow`).
- `green` section: a circular logo badge (the LSA logo SVG draws the white circle) beside a white heading and lead text, centred in the card.

## Authoring (Document Authoring)

Model: `standalone`

Single block table, one row:
- light-grey: [heading + text + link] | [heading + text + link]
- green: [logo image] | [heading + paragraph]

An image-only cell becomes the badge; any other cell is content.

## Supported variations

No variations; the look follows the section style.

## Universal Editor fields

N/A (Document Authoring project)
