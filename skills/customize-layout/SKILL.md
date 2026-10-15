---
name: customize-layout
description: Modify panel splitters, two-axis resize corners, optional tooltips or frequency-range browsing. Use for independent manuscript workspace layout preferences and learnable UI controls.
---

# Customize the workspace

Read ../../README.md and ../../docs/model-contract.md. Own ../../js/layout.js, ../../js/tooltips.js, ../../js/vocabulary.js, and affected HTML/CSS/app wiring.

Keep explanations in a shared tooltip controller; make Infobulles switch hover, focus and touch explanations off together. Preserve accessible labels and focus states. Avoid native instructional title attributes that bypass the switch. Store only display preferences locally, never tokens or data credentials.

Keep panel junctions draggable in their relevant directions, keyboard separators with visible focus, and corners for simultaneous width/height changes. Clamp dimensions; support responsive stacking. Resize the existing SVG without replacing its source geometry or resetting the image viewport. Do not scroll the document when selecting an occurrence. Reset only presentation sizes in place; preserve the corpus, images, edits and search state.

Use Formes ordonnées par fréquence. Apply integer inclusive min./max. only when Appliquer is activated. Treat an empty maximum as unbounded. Reject inverted or invalid ranges and keep the prior applied filter. Paginate every matching form; never retain a hidden top-24 ceiling. Word activation selects the textual tab.

Keep visual settings separate from project analysis data. Test meaningful frequency bounds and app wiring with a DOM test double; distinguish those checks from actual browser layout, pointer/touch and accessibility verification. Run npm test and record unavailable checks.
