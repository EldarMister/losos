# Product sheet and map controls

- Removed the mobile product sheet handle. Swiping the image upward still expands the sheet; swiping downward from the top still closes it.
- Replaced the map back and location text glyphs with MDI SVG icons, centered using grid without button rotation or default padding.
- Encoded the Cyrillic smile image URL to avoid an invalid React preload header on a fresh page load.
- Allowed the loopback development origin so local browser checks receive current styles.

Validation: lint and production build passed. Mobile touch gestures were checked in the browser. On a 390 × 844 viewport, both map SVG centers matched their button centers (less than 0.001 px difference). The map SDK was stubbed for the layout check; no real location request was made. Screenshots are in `docs/screenshots/product-sheet-without-handle.png` and `docs/screenshots/map-centered-arrows-mobile.png`.
