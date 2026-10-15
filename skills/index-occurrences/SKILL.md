---
name: index-occurrences
description: Create or change exact, prefix and native JavaScript regex searches on vocabulary or source lines, normalization and positional indices; use for concordance search and reindexing after edits.
---

# Index occurrences

Read ../../docs/model-contract.md and ../../docs/regex-search.md. Own js/index.js, js/regex.js and js/regex-worker.js.

Preserve original token text and offsets into the original JavaScript string. Keep normalization separate: NFC, optional lowercasing and optional removal of combining marks. Keep historical abbreviations and private-use characters searchable. Never treat character offsets as image coordinates.

Build a posting list for every normalized term. Count repeated occurrences in the same line individually. Link each posting to line.key and source geometry via the model. Build context streams within a page/region to prevent crossing omitted scans in a sample.

For exact search, access postings directly. For prefix search, enumerate matching vocabulary entries. Document the cost of new matching strategies; avoid scanning the corpus for each exact query. Rebuild or update indices after editing and after normalization changes.

For regex, keep pattern and flags unchanged and use native RegExp. Search raw forms or original line strings, never the normalized index. Reset lastIndex for each subject. In vocabulary mode return all token occurrences of each matching form. In line mode retain exact match offsets, captures, named groups and indices; use g to enumerate matches, otherwise keep the first per line. Advance safely after zero-length matches, respecting u/v Unicode mode. Keep native y and other flag semantics. Execute in a cancellable Worker with configurable timeout; cancel stale work after another query, an edit or a corpus replacement. Surface invalid patterns and unsupported flags without silently changing them.

Return context fragments with their source line keys. Preserve punctuation and partial-word fragments; distinguish current-line text from adjacent-line text. Keep contexts within a page/region. Never infer word-image coordinates from regex character offsets.

Verify repeated words, lookarounds, backreferences, named captures, Unicode, native flags, zero-length matches, worker cancellation/timeout, context line ownership, filters, missing scores and source offsets. Run npm test with sample and full corpus. Report timing environment; do not claim browser performance from Node measurements.

For frequency browsing use js/vocabulary.js: apply inclusive integer minimum/maximum, with empty maximum unbounded, and paginate all matching forms. Do not cap the vocabulary silently.
