# I/O module

`SvgParser` converts SVG XML to the domain model, `SvgSerializer` writes the model back as browser-readable SVG, and `SvgFileService` handles local file access.

The parser supports nested `svg` / `g`, `rect`, `circle`, `ellipse`, `line`, and plain-text `text` elements; canvas width/height and viewBox fallback; `id`, `fill`, `stroke`, and `stroke-width`; and nested `translate` plus uniform `scale` transforms. Missing IDs are generated and returned as warnings. Unsupported SVG elements are skipped, and unsupported transform forms are rejected.

The CLI replaces the active document only after a successful read, remembers the last successful read/save path, and treats successful read/save operations as undo-history boundaries.
