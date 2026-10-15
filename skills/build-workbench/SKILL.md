---
name: build-workbench
description: Build or modify the modular browser-based manuscript workbench; use for architecture changes, new panels, module integration and workshop extensions.
---

# Coordinate the workbench

Read ../../docs/model-contract.md and ../../README.md before changing architecture. Locate the project root from this skill file, not from the current working directory.

1. Translate the research requirement into a concrete operation on existing data.
2. Identify the owning modules; use the relevant sibling skill. Preserve the shared JSON schema and stable source references.
3. Keep one HTML interface, small ES modules and local vendor assets. Keep processing in the browser; Flask only serves static files.
4. Keep ALTO source trees authoritative. Build runtime views and indices without flattening or mutating original structures.
5. Add a new module only for a distinct responsibility. Document inputs, outputs, events and invariants; update this coordinator and the affected skills.
   Keep tooltip behavior in js/tooltips.js, viewport geometry in js/viewport.js, regex execution in js/regex.js and js/regex-worker.js. Keep button labels short; make explanations available on hover and keyboard focus. Keep native JavaScript regex syntax and explicit scope/flags discoverable.
6. Run npm test. Use FULL_CORPUS_PATH if a complete archive is available. Validate PAGE exports when conversion code changes.
7. Document the actual verification performed and unresolved limits. Do not claim browser QA, external saves or complete format equivalence without evidence.

Delegate analytical layers to ../manage-analysis-layers/SKILL.md and panel/tooltip/frequency customization to ../customize-layout/SKILL.md.

Delegate XML fidelity to ../transcode-alto/SKILL.md; PAGE mapping to ../transcode-page/SKILL.md; token positions to ../index-occurrences/SKILL.md; reading to ../present-reading/SKILL.md; KWIC to ../present-concordances/SKILL.md; images to ../locate-facsimile/SKILL.md; editing and storage to ../edit-save-project/SKILL.md.

Preserve the user's intended sequence: import, read, interrogate, return to image, edit, export/save. Keep every occurrence linked to a line. Do not require a backend to make the static app work.

Preserve the research role: use HTR outputs for close reading and comparative exploration. Keep the facsimile visible while querying concordances. Apply edits through the source model; do not add recognition, segmentation or layout annotation tools unless requested.

Repository corpus loading is owned by js/importer.js, wired in js/app.js through config.corpusManifest and xml-alto/manifest.json. Keep ZIP/JSON imports available and images separate.
