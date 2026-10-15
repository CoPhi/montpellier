---
name: present-reading
description: Create or alter the manuscript reading panel with word-triggered concordances and line selection; use for reader.js and reading navigation.
---

# Present reading

Read ../../docs/model-contract.md. Own js/reader.js; coordinate navigation with js/app.js.

Render the exact line text, including punctuation and combining characters. Use token offsets only to split interactive words from surrounding text. Assign every word activation to both its original line and the query term. Assign line-number activation to facsimile selection.

Use model.pages and page.lines; do not parse XML or hard-code file names, page counts or selection sizes. Keep blank-export pages navigable. Label absence of transcription without asserting that the manuscript page is blank.

Render user/source strings as text nodes, never executable HTML. Keep stable source identifiers visible or discoverable. Support keyboard activation and preserve focus when refreshing.

Use occurrence ranges to highlight results, including regex phrases and prefixes. Word activation always requests the exact word concordance, even when the previous query was a regex. Preserve the reader's scroll/focus when rendering, and scroll only its own container during source selection so concordance and sticky image remain visible.

Verify that the reading flow works after importing, editing and changing query options. Run npm test for shared contracts. Perform browser interaction checks when an authorized browser environment is available; otherwise record the limitation.
