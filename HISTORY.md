# Change log

## v0.8.0

- classes and animations/@keyframes names are now localized by default in `j2c.sheet()`.
- introduced `@global{}` and `:global()` to reach global names
- dropped `j2c.scoped()` which is obsoleted by the above.
- dropped bulk auto-prefixing.
- better at-rules handling.
- support for autoDeCamelization of property-names.
- New signature for `j2c.sheet([namespace1, namespace2, ] source)` where `namespace` is an object
with plain -> localized names for classes and animations.
- allow to create custom j2c instances that can be extended with plugins *[needs docs]*.
- Hardened the test suite.
- Bug fix: the source order is now respected in the output, with the caveat that, for nested selector, the children appear in source before the parent.

## v0.7.3

- Identical to `v0.7.2`. Somehow a bad commit ended up on NPM for that version.

## v0.7.2

- Fix regression: Vendor names were not in the corrrect order.

## pre-v0.7.2

Uncharted territory.