---
name: edit-save-project
description: Edit source line text, refresh indices, export projects, save local drafts and commit JSON to GitHub; use for editor, storage or GitHub changes.
---

# Edit and save the project

Read ../../docs/model-contract.md. Own js/editor.js, js/storage.js, js/github.js and relevant app.js events.

Edit the authoritative String CONTENT through updateLine. Allow line editing only when there is exactly one String. Preserve original WC and geometry; append an edit record. Cancel pending textual and analytical regex work. Propagate the edit through analysis.js, preserving original annotations and invalidating overlapping spans or declared dependencies; refresh both indices and visible views after the mutation. Read ../manage-analysis-layers/SKILL.md. Keep analysisLayers and their states/history in JSON, IndexedDB and GitHub saves.

Keep JSON export, local IndexedDB draft and GitHub commit distinct. Keep uploaded image bytes out of project JSON unless deliberately extending the schema. Make replacement of unsaved work explicit and keep export available after failures.

Keep tokens in session memory only. Never serialize them, write them to localStorage/IndexedDB or bundle them into the app. Use explicit user operations for remote saves. Bind a GitHub write to the exact owner/repository/branch/path and loaded immutable blob SHA. Read the blob by its SHA. For an existing file, require a loaded baseline; never silently fetch a fresh SHA and overwrite on conflict.

Serialize UTF-8 data safely as Base64 for GitHub. Queue writes and show errors while preserving local edits. Do not claim saving implies Pages publication. Test GitHub operations with mocks until the user requests a real repository test.

Run npm test and local server checks. Verify reload, Unicode serialization, duplicate-save prevention, conflict retention and token forgetting. Document any unavailable browser IndexedDB or live GitHub verification.
