---
name: transcode-page
description: Export PAGE XML from the workbench JSON with versioned mappings and loss reporting; use for PAGE geometry, text, confidence and schema validation.
---

# Export PAGE with declared mappings

Read ../../docs/model-contract.md. Own js/xmlpage.js and tests/validate_exports.py.

Pin the schema version and declare its namespace. Export Page image references and dimensions; TextRegion and TextLine geometry; Baseline when present; line text in TextEquiv/Unicode; original single-String WC at the line text-equivalent level. Do not invent word coordinates or Word elements.

Preserve source identifiers or an explicit identifier mapping. Keep region classifications accessible. Declare ALTO metadata that lacks a PAGE mapping. Retain it in the authoritative JSON. Emit a conversion report, including coordinate rounding and uncertainty about unclassified reading order.

Distinguish unchanged-source round trips from cross-format transformations. Do not present PAGE as a lossless inverse of all ALTO data. Make omitted or changed information explicit.

Run npm test, then python tests/validate_exports.py against tests/pagecontent.xsd. Check empty pages and the entire corpus when available. If a requested schema changes, obtain its official XSD and adjust the mappings before claiming validation.
