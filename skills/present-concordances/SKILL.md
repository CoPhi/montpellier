---
name: present-concordances
description: Create or customize concordance contexts, filters, grouping, ordering and pagination; use for KWIC panels and selection of source occurrences.
---

# Present concordances

Read ../../docs/model-contract.md. Own js/concordance.js; use search/context APIs from js/index.js.

Display one row per occurrence, even when multiple occurrences belong to one line. Retain its line key, text offsets and source navigation. Keep a visible total and access to all results through pagination. Keep changing context size, sorting and filtering independent of the original data.

Support manuscript order and left/right context ordering. Sort the left context from the word outward. Use deterministic tie breakers. When adding groups, preserve membership and totals; allow users to reach the underlying occurrences.

Render context fragments from context(). Mark only fragments whose lineKey differs from the hit as other-line (gray); keep same-line text dark and matches distinct. Preserve punctuation. Support phrase matches and show zero-length matches as a labeled position rather than inventing text. Expose native captures/groups/indices through a tooltip when available.

Render source and match activation so they select the precise line and page in the sticky facsimile. Preserve concordance scroll, pagination and keyboard focus on activation. Scroll only the reader container when selecting its line. Do not scroll the document to the reader or imply word coordinates. Keep an optional image row per occurrence using viewer.thumbnail(); share source image URLs and draw only the line crop. Let long strips scroll horizontally at readable height; allow activation to reach the zoomable source image. Show unavailable images without hiding text results.

Test boundaries, duplicate occurrences, pagination, filters and correspondence after editing. Run npm test; add meaningful regression checks for new grouping or sorting behavior. Check the UI when a browser environment is available.

For analytical hits, preserve one entry per annotation and every target fragment/source/image. Signal outdated analysis explicitly. Use attribute metadata rather than fixed semantic categories; retain separate analytical and textual tabs. Read ../manage-analysis-layers/SKILL.md.
