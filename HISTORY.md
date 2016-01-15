# Change log

## v0.11.0

- Refactor the innards so that the source order is completely respected in the output, including conditional at-rules.
- Speed ++
- Autoprefix all animation-* and transition.
- Some error messages are now inserted in the result as -error-prefixed at-rules and :pseudo-classes.

## v0.10.0

- At long last allow element selectors without a prepended space at the top level
- Autoprefix animation and animation-name with -webkit- too like we do for `@keyframes`.
- Tweaks and cleanup

## v0.9.0

- Added @extend
- Internal change: switched to rollup for build.
- Dropped the inline-only version for now.

## v0.8.3

- Cosmetic release that fixed typos in the docs

## v0.8.2

- cleanup
- improve test suite
- update docs to reflect move to the `j2css` Github organization.

## v0.8.0

- docs cleanup (version bump for npmjs.com dislpay).

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