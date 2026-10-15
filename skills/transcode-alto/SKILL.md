---
name: transcode-alto
description: Import zipped ALTO and METS, preserve all XML data in JSON, and export ALTO from the editable project; use for importer, serializer or model changes.
---

# Preserve and transcode ALTO

Read ../../docs/model-contract.md. Own js/xml.js, js/xmlalto.js, js/importer.js and the XML-facing parts of js/model.js.

Preserve namespace declarations, attributes as strings, element order, tags including unused declarations, polygons, baselines, rectangles, empty String CONTENT, missing WC and source filenames. Keep the METS manifest tree and its ordering. Maintain the same importer for any number of documents.

Use noncompact XML node trees. Build derived views through model.js; do not replace trees with line records. Serialize attributes with ampersand, angle-bracket, quote and whitespace escaping. Reject malformed input visibly. Treat XML equivalence as information/structure preservation; byte-for-byte source serialization is a separate promise.

Maintain one Page per ALTO file in v0.1 unless the shared contract and all consumers are deliberately extended. Keep original block order in the tree. Apply classified left/right ordering only to runtime views. Preserve unclassified source order.

Verify an unedited ALTO → JSON → ALTO cycle for every input document, not one sample. Verify JSON reload and reimported ZIP order. Include ampersands, quotes, combining Unicode, empty lines and absent attributes in checks. Run npm test and the complete corpus when provided. Do not modify the original sample ZIP's ALTO bytes.

Support both zipped input and repository XML listed in a JSON manifest (config.corpusManifest). Share parsing, validation and METS ordering; keep relative source filenames stable and load the entire corpus before replacing the active project. The manifest lists files, not reading order. Preserve original XML bytes when seeding xml-alto/ from the sample ZIP.

After adding or removing repository XML, run npm run update-corpus-manifest. npm test checks manifest coverage independently of the ten-view ZIP fixture; keep full-repository tests separate from sample tests.
