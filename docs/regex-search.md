# Native JavaScript regex search

Pass the pattern string and flags directly to `new RegExp(pattern, flags)`. Do not trim, lowercase, escape, anchor, normalize or rewrite either pattern or source text. Enter the pattern without `/.../` delimiters. Literal exact/prefix searches retain their separate NFC/case/diacritic options; those controls are disabled during regex search.

| Scope | Subject | Result |
|---|---|---|
| Formes | Each distinct original token form | Every occurrence of a form for which native `exec` finds a match; highlight the complete token. |
| Texte des lignes | Each original ALTO line string | Exact matched spans, including spaces, punctuation and partial words. No implicit crossing of ALTO lines. |

Reset `lastIndex` to zero for each subject. In line scope, `g` enumerates all matches; without it, return the first match per line. Preserve `y` sticky behavior from position zero, `i`, `m`, `s`, `d`, and native `u`/`v` semantics. Availability is defined by the browser's own engine; unsupported flags or syntax produce an error. Keep flags explicit, with `gu` as the initial value. Native syntax is described in [MDN RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) and [exec](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec).

Retain match text, original UTF-16 start/end, capture array, named groups and native indices (when d is chosen). Expose metadata in the match tooltip. Show an empty match as ∅ with its source position. Advance one Unicode code point after an empty global match in u/v mode, otherwise one UTF-16 unit; this prevents an endless loop without skipping valid empty matches.

Run regex jobs in a dedicated module Worker. `regexTimeoutMs` controls elapsed execution time (default 4000 ms). Terminate on timeout or superseding query; leave the text editable and exportable. Use request IDs to prevent stale results after imports/edits. The syntax is unrestricted; a configurable time budget is an execution limit, not a regex rewrite. No result-count truncation is applied. Only display is paginated.

Examples to try:

| Pattern | Flags | Scope | Meaning |
|---|---|---|---|
| `^selar` | `iu` | Formes | Original forms beginning with selar, ignoring case. |
| `\p{Script=Latin}+` | `gu` | Texte des lignes | Latin-script letter sequences. |
| `(?<forme>selari)\s+` | `giu` | Texte des lignes | A form followed by whitespace, retaining the named group. |
| `(\p{L}+)\s+\1` | `giu` | Texte des lignes | Repeated adjacent letter sequences within one line. |

Patterns containing words are illustrative search requests; the manuscript need not contain a match. Exact-match offsets locate text, never individual word pixels. All image navigation uses the associated ALTO line geometry.
