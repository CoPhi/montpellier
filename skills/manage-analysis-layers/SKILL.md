---
name: manage-analysis-layers
description: Import, index and query arbitrary JSONL analysis levels and preserve their anchors across text revisions. Use for analytical tabs, multi-span annotations, edit invalidation, analysis exports or source compatibility.
---

# Maintain analytical levels

Read ../../docs/analysis-layers.md and ../../docs/model-contract.md. Own ../../js/analysis.js, ../../js/anchors.js and ../../js/analysis-ui.js; integrate with app.js and the sibling editing/concordance skills.

1. Require a metadata-first JSONL; obtain the tab name and attribute fields from it. Keep only Texte before imports. Keep independent tabs and independent queries; do not combine analytical and textual concordances in 0.3.
2. Preserve every original record and target. Keep current anchors, analysis validity and edit history in separate serializable layer state. Keep runtime model references and Maps out of project JSON.
3. Index by stable document#line ID and declared attribute values. Support arbitrary payloads, nested fields, arrays, booleans and multiple targets. Count one annotation once; render every target's source navigation and line image.
4. Check exact source-line hashes and UTF-16 half-open offsets. Distinguish absent scans from missing lines in loaded scans. Retain outside-subset records, including partially available multi-target records; exclude incomplete concordances.
5. Map edits conservatively with anchors.js. Distinguish resolved location from current interpretation. Invalidate overlapping changes and all declared context dependencies. Use target-line dependencies when none are specified, explicit [] for fragment-only semantics. Never regenerate an analysis or silently carry an identity across a substitution.
6. Keep stale analyses excluded by default. Export original records, current anchors, dependent-line context and history for external regeneration. Keep unresolved and deleted records exportable. Reimport new hashes/targets as a separate level; do not overwrite history silently.
7. Rebind loaded layers after editing and on JSON restore. Replay old layers against the project edit chain when exact hashes match; mark unknown or ambiguous revisions unresolved. Cancel analytical regex work when switching tabs, editing or replacing the corpus.
8. Use the native cancellable regex Worker on attribute values, never on a normalized analysis string. Preserve surface text and source offsets; label captures as attribute captures. Deduplicate array matches to one record.
9. Run npm test; use FULL_CORPUS_PATH when available. Cover subset/full binding, arrays, booleans, discontinuous targets, boundary inserts, Unicode, multiple changes, deletion, ambiguity, context dependency, original-record preservation and JSON/JSONL reload. Report browser and remote-save limits honestly.
