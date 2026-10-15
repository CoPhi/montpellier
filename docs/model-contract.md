# Model contract, version 1

`manuscript.json` is the authoritative editable project. Do not flatten its XML trees or add word-image coordinates.

```json
{"format":"manuscript-workbench","version":1,"sourceName":"archive.zip","documents":[{"name":"scan.xml","tree":{"declaration":{"attributes":{"version":"1.0"}},"elements":[]}}],"manifests":[{"name":"METS.xml","tree":{}}],"edits":[]}
```

The example only illustrates the envelope: actual trees contain the full noncompact XML node graph. Each document has exactly one ALTO Page. The 0.3 app retains JSON schema v1 and accepts 0.1/0.2 projects. Preserve element names including prefixes, namespace declarations, every attribute as its original string, element order, text, comments and CDATA retained by the parser. The parser does not preserve purely formatting whitespace between elements. ALTO export promises semantic preservation of source data, not byte identity. Initial source ALTO bytes in the sample ZIP remain untouched.

Runtime models contain derived references to the same tree nodes; do not serialize these runtime objects. `line.key` is `document.name#TextLine.ID` or a deterministic source path if an ID is absent. Runtime views present classified left and right blocks in that order; source trees retain their original order. Unclassified lines retain source sequence. No inference of columns or chronology is permitted.

The text of a line comes from child String/SP/HYP elements. The current editor only updates a line with exactly one String. Set that String's CONTENT; preserve its original WC and append a project edit entry. Never replace WC with certainty about the human edit. Empty lines and absent scores are distinct from zero scores.

Occurrence records retain original token text, UTF-16 string start/end offsets, line key and references, and position in a page/region token stream. These offsets locate characters in JavaScript text, not pixels. Every word occurrence belongs to an ALTO line and can reach its source polygon/baseline/bounding rectangle. Context windows stay within one page/region; do not cross gaps in the selected sample.

Keep literal normalized postings and raw-form postings separate. Native regex vocabulary search returns all token occurrences of matched raw forms; line search returns exact source spans with capture/group/index metadata, including empty matches. Keep pattern, flags and source text unchanged. Read `regex-search.md` for Worker and flag contracts. Keep contexts as text fragments with lineKey/sameLine flags; use gray only for fragments from other lines. Preserve source punctuation.

Render optional concordance line images by clipping the same source image in ALTO coordinate space. Use the line rectangle, not a guessed word location. Keep the primary facsimile visible with concordances. Pan/zoom changes only the viewport, never source geometry. On occurrence activation, preserve the concordance's scroll and pagination; scroll the reader container alone if needed. Keep image registry shared and revoke old object URLs on corpus/image replacement.

METS controls document sequence if present. Match exact paths first, then a unique basename. Append unreferenced documents by physical image number and natural filename. Surface unresolved METS links.

PAGE export uses schema 2019-07-15 and exports lines with text, geometry and original single-String WC at TextEquiv level. It does not fabricate Word elements. It rounds noninteger coordinates and reports this; additional unmapped ALTO attributes remain in the project JSON. PAGE export is not a lossless inverse of ALTO. Keep a conversion report. Do not claim compatibility with specific editors without testing them.

UI modules must consume the model or index APIs; they must not reparse source XML. Editing triggers index replacement and visible result refresh. GitHub saving is explicit, uses a session-only token and the immutable loaded blob SHA, and must not retry a conflict with a freshly fetched SHA. Separate local saving, repository saving and Pages deployment.

For extension checks: run `npm test`; with the whole corpus, run `FULL_CORPUS_PATH=/absolute/archive.zip npm test`. Run `python tests/validate_exports.py` after the integration test. See `README.md` for prerequisites and current boundaries.

The optional analysisLayers array serializes analytical metadata, immutable imported records, separate current states/history and per-tab settings. See analysis-layers.md. Rebinding verifies exact line hashes. Never treat absent scans as deleted annotations or ambiguous source anchors as valid concordance hits.
