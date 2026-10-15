---
name: locate-facsimile
description: Display manuscript images and locate ALTO lines, including polygon overlays and mismatched display resolutions; use for image association, zoom and facsimile selection.
---

# Locate source lines

Read ../../docs/model-contract.md. Own js/facsimile.js and js/viewport.js.

Associate images by the recorded source image filename; support ZIP images, separate local files and a configured image path. Keep the ALTO coordinate space defined by Page WIDTH/HEIGHT. Scale image display into that space; do not assume display pixels match source coordinates.

Show a line polygon when available, otherwise its rectangle. Keep full-page and selected-line views accessible. Never estimate a word box from the number of characters. Preserve association when moving from reading, vocabulary or any concordance row.

Keep the facsimile visible beside the concordance. Implement zoom in/out, pointer drag pan, wheel and touch pinch zoom, keyboard controls and page reset in ALTO space. Transform client coordinates through the SVG screen matrix so pointer-centered zoom respects aspect ratio and letterboxing. Keep the line overlay attached to image coordinates through all transformations. Keep bounds and zoom limits explicit in Viewport.

Expose lineCrop() and thumbnail() for concordance strips. Clip the original image using the ALTO line rectangle; do not resample images or invent word boxes. Use the same image URL registry as the primary viewer. Draw only the current result page; use a horizontal strip at readable height. Refresh strips after adding images or changing the base path. Label absent images.

Handle unavailable images as a visible state while retaining text and search access. Release session object URLs when replacing images or corpora. Do not upload local images during import.

Verify image dimensions, selected source key and polygon/rectangle mapping. Use the supplied 062 image for visual checks when a browser environment is available. Test all other pages without fabricated images. Record any unperformed visual verification.
