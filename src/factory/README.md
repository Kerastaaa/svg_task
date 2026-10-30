# Factory module

`ShapeFactory` is the single shape-type-name dispatch module. Both CLI `create` and SVG parsing delegate object construction here, preventing duplicate tag switches in application and I/O code.

The current built-in mapping is intentionally explicit for the six required types. A later plugin phase can replace it with registered providers without changing callers.
