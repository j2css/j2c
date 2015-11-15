# Change log

## v0.8.0

- classes and animations/@keyframes names are now local by default in `j2c.sheet()`.
- introduced `@global{}` and `:global()` to reach global names
- dropped `j2c.scoped()` which is obsoleted by the above.
- add a `namespace` option to share local names between sheets. Useful for nesting, say, grid elements.
- add a post-process `plugins` option as groundwork for autoprefix/prefixfree.

## v0.7.3

- Identical to `v0.7.2`. Somehow a bad commit ended up on NPM for that version.

## v0.7.2

- Fix regression: Vendor names were not in the corrrect order.

## pre-v0.7.2

Uncharted territory.